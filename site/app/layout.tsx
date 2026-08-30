import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://statement-decoder.dabobo.chatgpt.site'),
  title: '話中話解碼器 Statement Decoder',
  description: '把別人的一句話拆成可驗證事實、個人觀點與真正值得參考的訊號。',
  openGraph: {
    title: '話中話解碼器 Statement Decoder',
    description: '別急著相信，先把這句話拆開。',
    type: 'website',
    locale: 'zh_TW',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: '話中話解碼器' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '話中話解碼器 Statement Decoder',
    description: '別急著相信，先把這句話拆開。',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
