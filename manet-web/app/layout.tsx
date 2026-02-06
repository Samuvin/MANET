import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MANET Morse Radio',
  description: 'Type a message and send it as radio signals (Morse code)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
