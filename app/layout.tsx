import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gemini AI Chat',
  description: 'Advanced chat interface for Gemini AI models',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} antialiased`}>
        <div className="relative flex min-h-screen flex-col bg-background">
          <div className="flex-1 flex-col">
            {children}
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}