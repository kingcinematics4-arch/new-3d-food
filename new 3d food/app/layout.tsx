import './globals.css';

export const metadata = {
  title: '3D Digital Food Menu SaaS',
  description: 'Turn your restaurant menu into an interactive 3D experience.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark min-h-screen bg-gray-900 text-white">
      <body className="flex flex-col min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
