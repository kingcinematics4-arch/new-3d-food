'use client';

import React, { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/menu';

export interface SplitBillModalProps {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  currency?: string | null;
  items: Array<{
    id: string;
    name: string | null;
    quantity: number;
    price_at_time: number;
    status?: string | null;
  }>;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (res: any) => void;
}

export default function SplitBillModal({
  orderId,
  orderNumber,
  totalAmount,
  currency,
  items,
  isOpen,
  onClose,
  onPaymentSuccess,
}: SplitBillModalProps) {
  const [splitMethod, setSplitMethod] = useState<'equal' | 'items' | 'custom'>('equal');
  const [equalPersons, setEqualPersons] = useState<number>(2);
  const [personIndex, setPersonIndex] = useState<number>(1);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [payerName, setPayerName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cash' | 'pay_at_table'>('upi');

  // Item splitting state: quantity selected per item
  const [itemSelections, setItemSelections] = useState<Record<string, number>>({});

  // Existing payments & balances
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [remainingBalance, setRemainingBalance] = useState<number>(totalAmount);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);

  // Active non-cancelled items
  const activeItems = items.filter((i) => (i.status || 'active').toLowerCase() !== 'cancelled');

  const fetchPayments = async () => {
    try {
      setLoadingPayments(true);
      const res = await fetch(`/api/orders/payments?order_id=${encodeURIComponent(orderId)}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments || []);
        setTotalPaid(data.totalPaid || 0);
        setRemainingBalance(data.remainingBalance ?? Math.max(0, (data.billTotal || totalAmount) - (data.totalPaid || 0)));
      }
    } catch {} finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (isOpen && orderId) {
      fetchPayments();
      setSuccessReceipt(null);
      setError(null);
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  // Calculate allocated item quantities from existing payments with split_type == 'items'
  const alreadyPaidItemQty: Record<string, number> = {};
  payments
    .filter((p) => p.status === 'successful' && p.split_type === 'items' && p.split_details?.items)
    .forEach((p) => {
      p.split_details.items.forEach((it: any) => {
        alreadyPaidItemQty[it.id] = (alreadyPaidItemQty[it.id] || 0) + (Number(it.quantity) || 0);
      });
    });

  // Calculate equal share
  const calculateEqualShare = (idx: number, numPeople: number, balance: number) => {
    if (numPeople <= 1) return balance;
    // Handle rounding differences: e.g. ₹100 split 3 ways is 33.33, 33.33, and 33.34
    const baseShare = Math.floor((balance / numPeople) * 100) / 100;
    const remainder = Math.round((balance - baseShare * numPeople) * 100) / 100;
    if (idx === numPeople) {
      return Math.round((baseShare + remainder) * 100) / 100;
    }
    return baseShare;
  };

  // Calculate items share
  const calculateItemsShare = () => {
    return Object.entries(itemSelections).reduce((sum, [itemId, qty]) => {
      const item = activeItems.find((i) => i.id === itemId);
      if (!item || !qty) return sum;
      return sum + Number(item.price_at_time) * qty;
    }, 0);
  };

  const getAmountToPay = (): number => {
    if (splitMethod === 'equal') {
      return calculateEqualShare(personIndex, equalPersons, remainingBalance);
    }
    if (splitMethod === 'items') {
      return Math.min(remainingBalance, Math.round(calculateItemsShare() * 100) / 100);
    }
    if (splitMethod === 'custom') {
      const parsed = parseFloat(customAmount);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const handlePay = async () => {
    const amount = getAmountToPay();
    if (amount <= 0) {
      setError('Please select or enter an amount to pay.');
      return;
    }
    if (amount > remainingBalance + 0.05) {
      setError(`Amount cannot exceed the remaining balance of ${formatPrice(remainingBalance, currency)}.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    let splitDetails: any = { method: splitMethod };
    if (splitMethod === 'equal') {
      splitDetails = {
        method: 'equal',
        person_index: personIndex,
        total_persons: equalPersons,
        share: amount,
      };
    } else if (splitMethod === 'items') {
      const selectedList = Object.entries(itemSelections)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const item = activeItems.find((i) => i.id === id);
          return {
            id,
            name: item?.name || 'Item',
            quantity: qty,
            price_at_time: item?.price_at_time || 0,
            line_total: (item?.price_at_time || 0) * qty,
          };
        });
      splitDetails = {
        method: 'items',
        items: selectedList,
      };
    } else {
      splitDetails = {
        method: 'custom',
        entered_amount: amount,
      };
    }

    try {
      const res = await fetch('/api/orders/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          amount,
          payment_method: paymentMethod,
          payer_name: payerName.trim() || undefined,
          split_type: splitMethod,
          split_details: splitDetails,
          status: 'successful',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Payment failed');
      }

      setSuccessReceipt(data);
      setTotalPaid(data.totalPaid);
      setRemainingBalance(data.remainingBalance);
      onPaymentSuccess(data);
      await fetchPayments();
    } catch (err: any) {
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto flex flex-col"
        style={{
          background: 'var(--bg-surface, #141413)',
          border: '1px solid var(--border-warm, rgba(201,169,110,0.25))',
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -24px 70px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle, rgba(243,239,231,0.08))' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">💳</span>
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-display, serif)',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--text-primary, #F3EFE7)',
                  margin: 0,
                }}
              >
                Split Bill & Pay
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed, #7A766F)' }}>
                Order #{orderNumber}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--bg-surface-2, #1E1D1A)',
              border: '1px solid var(--border-subtle, rgba(243,239,231,0.08))',
              color: 'var(--text-muted, #9E988D)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          {/* Bill Progress / Summary */}
          <div
            style={{
              background: 'var(--bg-surface-2, #1E1D1A)',
              padding: '1rem',
              borderRadius: 12,
              border: '1px solid var(--border-subtle, rgba(243,239,231,0.08))',
            }}
          >
            <div className="flex justify-between items-baseline mb-2">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed, #7A766F)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Bill Settlement
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: remainingBalance <= 0 ? '#34D399' : totalPaid > 0 ? '#F59E0B' : '#EF4444',
                }}
              >
                {remainingBalance <= 0 ? 'Fully Paid ✓' : totalPaid > 0 ? 'Partially Paid' : 'Unpaid'}
              </span>
            </div>

            <div className="flex justify-between items-baseline mb-3">
              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed, #7A766F)', display: 'block' }}>Total Bill</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary, #F3EFE7)' }}>
                  {formatPrice(totalAmount, currency)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed, #7A766F)', display: 'block' }}>Paid so far</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 600, color: '#34D399' }}>
                  {formatPrice(totalPaid, currency)}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed, #7A766F)', display: 'block' }}>Remaining Balance</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gold, #C9A96E)' }}>
                  {formatPrice(remainingBalance, currency)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ width: '100%', height: 6, background: 'rgba(243,239,231,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, (totalPaid / (totalAmount || 1)) * 100)}%`,
                  height: '100%',
                  background: remainingBalance <= 0 ? '#10B981' : 'var(--gold, #C9A96E)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Success Receipt View */}
          {successReceipt && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid #10B981',
                borderRadius: 12,
                padding: '1rem',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">✅</span>
                <h3 style={{ margin: 0, fontSize: '0.9375rem', color: '#34D399', fontWeight: 600 }}>
                  Payment Successful!
                </h3>
              </div>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#D1FAE5' }}>
                Transaction ID: <strong>{successReceipt.payment?.transaction_id}</strong>
              </p>
              <div className="flex justify-between items-baseline text-sm pt-2" style={{ borderTop: '1px solid rgba(16,185,129,0.2)' }}>
                <span>Amount Paid:</span>
                <span style={{ fontWeight: 700, color: '#34D399' }}>
                  {formatPrice(successReceipt.payment?.amount, currency)}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-sm mt-1">
                <span>Remaining Balance:</span>
                <span style={{ fontWeight: 700, color: 'var(--gold, #C9A96E)' }}>
                  {formatPrice(remainingBalance, currency)}
                </span>
              </div>
              {remainingBalance <= 0 && (
                <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(16,185,129,0.2)', borderRadius: 6, textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, color: '#34D399' }}>
                  🎉 Entire bill has been fully settled! Thank you!
                </div>
              )}
            </div>
          )}

          {remainingBalance > 0 ? (
            <>
              {error && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #EF4444',
                    color: '#FCA5A5',
                    fontSize: '0.8125rem',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Step 1: Select Split Method */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-dimmed, #7A766F)',
                    marginBottom: '0.5rem',
                    fontWeight: 600,
                  }}
                >
                  Choose How to Split
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setSplitMethod('equal'); setError(null); }}
                    style={{
                      padding: '0.625rem',
                      borderRadius: 8,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: splitMethod === 'equal' ? 'rgba(201,169,110,0.15)' : 'var(--bg-surface-2, #1E1D1A)',
                      border: `1px solid ${splitMethod === 'equal' ? 'var(--gold, #C9A96E)' : 'var(--border-subtle, rgba(243,239,231,0.08))'}`,
                      color: splitMethod === 'equal' ? 'var(--gold, #C9A96E)' : 'var(--text-secondary, #B8B3A8)',
                      cursor: 'pointer',
                    }}
                  >
                    🤝 Split Equally
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSplitMethod('items'); setError(null); }}
                    style={{
                      padding: '0.625rem',
                      borderRadius: 8,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: splitMethod === 'items' ? 'rgba(201,169,110,0.15)' : 'var(--bg-surface-2, #1E1D1A)',
                      border: `1px solid ${splitMethod === 'items' ? 'var(--gold, #C9A96E)' : 'var(--border-subtle, rgba(243,239,231,0.08))'}`,
                      color: splitMethod === 'items' ? 'var(--gold, #C9A96E)' : 'var(--text-secondary, #B8B3A8)',
                      cursor: 'pointer',
                    }}
                  >
                    🍕 Split by Items
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSplitMethod('custom'); setError(null); }}
                    style={{
                      padding: '0.625rem',
                      borderRadius: 8,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: splitMethod === 'custom' ? 'rgba(201,169,110,0.15)' : 'var(--bg-surface-2, #1E1D1A)',
                      border: `1px solid ${splitMethod === 'custom' ? 'var(--gold, #C9A96E)' : 'var(--border-subtle, rgba(243,239,231,0.08))'}`,
                      color: splitMethod === 'custom' ? 'var(--gold, #C9A96E)' : 'var(--text-secondary, #B8B3A8)',
                      cursor: 'pointer',
                    }}
                  >
                    ✏️ Custom Amount
                  </button>
                </div>
              </div>

              {/* Split Details Configuration */}
              {splitMethod === 'equal' && (
                <div
                  style={{
                    background: 'var(--bg-surface-2, #1E1D1A)',
                    padding: '1rem',
                    borderRadius: 10,
                    border: '1px solid var(--border-subtle, rgba(243,239,231,0.08))',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary, #F3EFE7)' }}>
                      Number of People:
                    </span>
                    <div className="flex items-center gap-2">
                      {[2, 3, 4, 5, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => { setEqualPersons(num); if (personIndex > num) setPersonIndex(1); }}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 6,
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            background: equalPersons === num ? 'var(--gold, #C9A96E)' : 'rgba(243,239,231,0.08)',
                            color: equalPersons === num ? '#0B0B0A' : 'var(--text-primary, #F3EFE7)',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(243,239,231,0.05)' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-dimmed, #7A766F)' }}>
                      Each Person's Share:
                    </span>
                    <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--gold, #C9A96E)' }}>
                      {formatPrice(calculateEqualShare(personIndex, equalPersons, remainingBalance), currency)}
                    </span>
                  </div>
                </div>
              )}

              {splitMethod === 'items' && (
                <div
                  style={{
                    background: 'var(--bg-surface-2, #1E1D1A)',
                    padding: '1rem',
                    borderRadius: 10,
                    border: '1px solid var(--border-subtle, rgba(243,239,231,0.08))',
                    maxHeight: 220,
                    overflowY: 'auto',
                  }}
                >
                  <span style={{ display: 'block', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dimmed, #7A766F)', marginBottom: '0.5rem' }}>
                    Select items you are paying for
                  </span>
                  <div className="flex flex-col gap-2">
                    {activeItems.map((item) => {
                      const alreadyPaid = alreadyPaidItemQty[item.id] || 0;
                      const maxAvailable = Math.max(0, item.quantity - alreadyPaid);
                      const selected = itemSelections[item.id] || 0;

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-1 px-2 rounded"
                          style={{ background: selected > 0 ? 'rgba(201,169,110,0.1)' : 'transparent' }}
                        >
                          <div>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary, #F3EFE7)', display: 'block' }}>
                              {item.name || 'Dish'}
                            </span>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-dimmed, #7A766F)' }}>
                              {formatPrice(Number(item.price_at_time), currency)} each • {maxAvailable} left
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setItemSelections({ ...itemSelections, [item.id]: Math.max(0, selected - 1) })}
                              disabled={selected <= 0}
                              style={{ width: 26, height: 26, borderRadius: 4, background: 'rgba(243,239,231,0.08)', border: 'none', color: '#fff', cursor: 'pointer' }}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, minWidth: 16, textAlign: 'center', color: '#fff' }}>
                              {selected}
                            </span>
                            <button
                              type="button"
                              onClick={() => setItemSelections({ ...itemSelections, [item.id]: Math.min(maxAvailable, selected + 1) })}
                              disabled={selected >= maxAvailable}
                              style={{ width: 26, height: 26, borderRadius: 4, background: 'rgba(243,239,231,0.08)', border: 'none', color: '#fff', cursor: 'pointer' }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {splitMethod === 'custom' && (
                <div
                  style={{
                    background: 'var(--bg-surface-2, #1E1D1A)',
                    padding: '1rem',
                    borderRadius: 10,
                    border: '1px solid var(--border-subtle, rgba(243,239,231,0.08))',
                  }}
                >
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dimmed, #7A766F)', marginBottom: '0.5rem' }}>
                    Enter payment contribution:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      max={remainingBalance}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder={`Max: ${remainingBalance}`}
                      style={{
                        flex: 1,
                        padding: '0.625rem 0.75rem',
                        borderRadius: 8,
                        background: 'rgba(243,239,231,0.05)',
                        border: '1px solid var(--border-subtle, rgba(243,239,231,0.15))',
                        color: '#F3EFE7',
                        fontSize: '1rem',
                        fontWeight: 600,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setCustomAmount(String(remainingBalance))}
                      style={{
                        padding: '0.625rem 0.75rem',
                        borderRadius: 8,
                        background: 'rgba(201,169,110,0.15)',
                        border: '1px solid var(--gold, #C9A96E)',
                        color: 'var(--gold, #C9A96E)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Pay Full
                    </button>
                  </div>
                </div>
              )}

              {/* Payer Name & Payment Method */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-dimmed, #7A766F)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="e.g. Alex"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 8,
                      background: 'var(--bg-surface-2, #1E1D1A)',
                      border: '1px solid var(--border-subtle, rgba(243,239,231,0.08))',
                      color: 'var(--text-primary, #F3EFE7)',
                      fontSize: '0.8125rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-dimmed, #7A766F)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 8,
                      background: 'var(--bg-surface-2, #1E1D1A)',
                      border: '1px solid var(--border-subtle, rgba(243,239,231,0.08))',
                      color: 'var(--text-primary, #F3EFE7)',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <option value="upi">UPI / QR</option>
                    <option value="card">Card</option>
                    <option value="cash">Cash to Waiter</option>
                    <option value="pay_at_table">Pay at Table</option>
                  </select>
                </div>
              </div>

              {/* Pay Button */}
              <button
                type="button"
                onClick={handlePay}
                disabled={submitting || getAmountToPay() <= 0}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  borderRadius: 8,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  background: 'var(--gold, #C9A96E)',
                  color: '#0B0B0A',
                  border: 'none',
                  cursor: submitting || getAmountToPay() <= 0 ? 'not-allowed' : 'pointer',
                  opacity: submitting || getAmountToPay() <= 0 ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {submitting ? 'Processing Payment...' : `Pay Contribution • ${formatPrice(getAmountToPay(), currency)}`}
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '0.75rem 2rem',
                  borderRadius: 8,
                  background: 'var(--gold, #C9A96E)',
                  color: '#0B0B0A',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          )}

          {/* Past contributions for this order */}
          {payments.length > 0 && (
            <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-subtle, rgba(243,239,231,0.08))', paddingTop: '0.75rem' }}>
              <span style={{ display: 'block', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dimmed, #7A766F)', marginBottom: '0.5rem', fontWeight: 600 }}>
                Payments on this Bill ({payments.length})
              </span>
              <div className="flex flex-col gap-2">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded text-xs"
                    style={{ background: 'var(--bg-surface-2, #1E1D1A)' }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary, #F3EFE7)', display: 'block' }}>
                        {p.payer_name || 'Guest'} • {p.payment_method?.toUpperCase()}
                      </span>
                      <span style={{ color: 'var(--text-dimmed, #7A766F)', fontSize: '0.6875rem' }}>
                        Txn: {p.transaction_id || p.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span style={{ fontWeight: 600, color: '#34D399', display: 'block' }}>
                        +{formatPrice(Number(p.amount), currency)}
                      </span>
                      <span style={{ fontSize: '0.625rem', color: 'var(--text-dimmed, #7A766F)', textTransform: 'capitalize' }}>
                        {p.split_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
