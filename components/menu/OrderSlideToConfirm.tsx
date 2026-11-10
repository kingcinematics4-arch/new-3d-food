'use client';

import React, { useRef } from 'react';
import SlideToConfirm from '@/components/kokonutui/slide-to-confirm';

interface OrderSlideToConfirmProps {
  onConfirm: () => Promise<void>;
  disabled: boolean;
}

export default function OrderSlideToConfirm({
  onConfirm,
  disabled,
}: OrderSlideToConfirmProps) {
  const confirmRef = useRef(onConfirm);
  confirmRef.current = onConfirm;

  return (
    <SlideToConfirm
      label="Slide to place your order →"
      confirmingLabel="Placing order…"
      doneLabel="Placed"
      onConfirm={confirmRef.current}
      resetAfter={null}
      disabled={disabled}
      className="relative w-full mt-2"
    />
  );
}
