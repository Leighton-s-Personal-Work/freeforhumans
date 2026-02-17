import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FreeForHumans - Free things for verified humans',
  description: 'A marketplace where verified humans claim free things. Powered by World ID.',
  keywords: ['World ID', 'airdrop', 'free tokens', 'verified humans', 'proof of personhood'],
  openGraph: {
    title: 'FreeForHumans',
    description: 'A marketplace where verified humans claim free things.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased min-h-screen bg-dark-bg`}>
        <Providers>
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <header className="border-b border-dark-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <a href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-world-blue rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <span className="font-bold text-lg">FreeForHumans</span>
                </a>
                
                <nav className="hidden md:flex items-center gap-6">
                  <a href="/" className="text-gray-400 hover:text-white transition-colors">
                    Campaigns
                  </a>
                  <a href="/get-verified" className="text-gray-400 hover:text-white transition-colors">
                    Get Verified
                  </a>
                  <a href="/offer" className="text-gray-400 hover:text-white transition-colors">
                    Offer
                  </a>
                  <a href="/about" className="text-gray-400 hover:text-white transition-colors">
                    About
                  </a>
                </nav>

                <a href="/create" className="btn-primary text-sm py-2">
                  Create Campaign
                </a>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-dark-border py-8 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <span>Powered by</span>
                  <a 
                    href="https://world.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-world-blue hover:text-world-blue-light transition-colors"
                  >
                    World ID
                  </a>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <a href="/get-verified" className="hover:text-gray-300 transition-colors">
                    Get Verified
                  </a>
                  <a href="/offer" className="hover:text-gray-300 transition-colors">
                    Create a Campaign
                  </a>
                  <a href="/about" className="hover:text-gray-300 transition-colors">
                    About
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
