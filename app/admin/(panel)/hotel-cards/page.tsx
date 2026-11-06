'use client';

// app/admin/(panel)/hotel-cards/page.tsx
// Dedicated Hotel Card Templates editor: upload, preview, save/activate,
// replace/delete, visual field positioning, and live preview with real hotel data.

import React from 'react';
import { AdminPageHeader } from '@/components/admin/ui';
import HotelCardTemplatesPanel from '@/components/admin/HotelCardTemplatesPanel';

export default function AdminHotelCardsPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="HOTEL IDENTITY"
        title="Hotel Card Templates"
        description="Upload a PNG, JPG, JPEG or SVG card design, preview it, position dynamic hotel fields, then save and activate. The active design becomes the background of every hotel identity card, with hotel name, ID, owner, email, plan, registration date and status filled automatically from the database."
      />
      <HotelCardTemplatesPanel />
    </>
  );
}
