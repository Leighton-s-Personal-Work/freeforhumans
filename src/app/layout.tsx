import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FreeForHumans — Free things for real humans',
  description: 'Verified humans claim free things. No bots. No catch. Powered by World ID.',
  keywords: ['World ID', 'free gold', 'verified humans', 'proof of personhood', 'XAUT'],
  openGraph: {
    title: 'FreeForHumans',
    description: 'Free things for real humans. Prove you\'re human. Get free stuff.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased min-h-screen bg-white text-gray-900`}>
        <Providers>
        <div className="flex flex-col min-h-screen">
          {/* Header — minimal */}
          <header className="border-b border-gray-100">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <a href="/" className="flex items-center gap-2">
                  <span className="font-bold text-xl tracking-tight">FreeForHumans</span>
                </a>

                <a
                  href="/get-verified"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Get Verified
                </a>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer — minimal */}
          <footer className="border-t border-gray-100 py-8 mt-auto">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>Built with</span>
                  <a
                    href="https://world.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-world-blue hover:underline"
                  >
                    World ID
                  </a>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <a href="/get-verified" className="hover:text-gray-600 transition-colors">
                    Get Verified
                  </a>
                  <a
                    href="https://x.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-600 transition-colors"
                  >
                    Twitter/X
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
        </Providers>
      </body>
    </html>
  );
}
