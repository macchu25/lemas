import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Lemas.AI — Next-Gen AI Gateway & Token Hub for Agents',
  description:
    'Access DeepSeek, Claude 3.7, GPT-4o, Gemini 2.0 and 200+ models with one unified API key. High concurrency, smart fallbacks, and 50–70% cost savings.',
  keywords: [
    'Lemas.AI',
    'AI API gateway',
    'OpenAI compatible API',
    'Anthropic compatible API',
    'Claude API proxy',
    'DeepSeek R1 free API',
    'LLM router',
    'cheap AI tokens',
  ],
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="icon" type="image/png" href="/logo.png?v=2" />
        <link rel="shortcut icon" type="image/png" href="/logo.png?v=2" />
        <link rel="apple-touch-icon" href="/logo.png?v=2" />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className="min-h-screen flex flex-col antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
