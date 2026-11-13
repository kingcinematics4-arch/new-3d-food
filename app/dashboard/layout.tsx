import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import DashboardLayout from './DashboardLayout';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardRootLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}