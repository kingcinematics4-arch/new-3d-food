'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function OrderStatusPage({ params }: { params: { orderId: string } }) {
  const { orderId } = params;
  const searchParams = useSearchParams();
  const hotelSlug = searchParams?.get('slug') || '';
  const backHref = hotelSlug ? `/menu/${hotelSlug}` : '/';
  const [currentStep, setCurrentStep] = useState<number>(2); // 1: Received, 2: Preparing, 3: Ready, 4: Served

  const steps = [
    { title: 'Order Placed', desc: 'Sent to restaurant kitchen', icon: '📝' },
    { title: 'Preparing Food', desc: 'Chef is crafting your 3D dish', icon: '👨‍🍳' },
    { title: 'Ready to Serve', desc: 'Waiter is bringing to table', icon: '🔔' },
    { title: 'Completed', desc: 'Enjoy your meal!', icon: '✨' },
  ];

  useEffect(() => {
    // Simulate real-time progress update for customer experience
    const timer = setTimeout(() => {
      if (currentStep < 3) setCurrentStep((prev) => prev + 1);
    }, 15000);
    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 flex flex-col justify-between max-w-lg mx-auto">
      <div className="space-y-6 pt-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-2xl mb-1 shadow-lg shadow-amber-500/10">
            ⏳
          </div>
          <h1 className="text-2xl font-bold text-white">Live Order Tracking</h1>
          <p className="text-xs text-gray-400">Order Ref: <span className="font-mono text-amber-400">#{orderId.slice(0, 8).toUpperCase()}</span></p>
        </div>

        {/* Live Status Stepper */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="space-y-6 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-800">
            {steps.map((step, idx) => {
              const isDone = idx + 1 <= currentStep;
              const isCurrent = idx + 1 === currentStep;

              return (
                <div key={step.title} className="flex items-start space-x-4 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition ${
                      isDone
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                        : 'bg-gray-800 text-gray-500 border border-gray-700'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${isCurrent ? 'text-amber-400' : isDone ? 'text-white' : 'text-gray-500'}`}>
                      {step.title}
                      {isCurrent && <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">In Progress</span>}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estimated Time Card */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-5 text-center">
          <p className="text-xs text-amber-300 font-semibold uppercase tracking-wider">Estimated Wait Time</p>
          <p className="text-3xl font-extrabold text-white mt-1">12 – 15 Mins</p>
          <p className="text-xs text-gray-400 mt-1">Sit back and relax at Table #1</p>
        </div>
      </div>

      {/* Back to Menu Link */}
      <div className="pb-6 pt-4 text-center">
        <Link
          href={backHref}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-amber-400 hover:underline"
        >
          <span>← Back to 3D Menu</span>
        </Link>
      </div>
    </div>
  );
}
