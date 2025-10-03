import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'node-vercel-template',
  description:
    'A modern Next.js template with TypeScript, TailwindCSS, and testing setup',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className="antialiased">
        <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          {children}
        </main>
      </body>
    </html>
  );
}
