import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dine3D — See It. Experience It. Dine It.',
  description: 'Turn your restaurant menu into an interactive 3D dining experience. Scan a QR code, explore dishes in 3D, and understand your meal before ordering.',
  keywords: 'restaurant 3D menu, AR food menu, interactive dining, QR code menu, 3D food visualization, restaurant technology',
  openGraph: {
    title: 'Dine3D — Premium 3D Restaurant Menu Platform',
    description: 'Turn your restaurant menu into an interactive 3D dining experience.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex flex-col min-h-screen antialiased" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        {children}
      </body>
    </html>
  );
}
