import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'NEU Library Visitor Log',
  description: 'Secure Academic Portal - New Era University',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background">
        <FirebaseClientProvider>
          <AuthProvider>
            <div className="page-wrapper">
              {children}
            </div>
            <Toaster />
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}