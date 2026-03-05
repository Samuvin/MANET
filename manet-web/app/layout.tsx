import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MANET — Mobile Ad-hoc Network Demo',
  description: 'See how device-to-device messaging works in a Mobile Ad-hoc Network. No fixed infrastructure — nodes relay messages. Interactive demo and optional Morse simulation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
