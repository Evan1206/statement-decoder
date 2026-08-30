import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '話中話解碼器 Statement Decoder',
  description: '把別人的一句話拆成可驗證事實、個人觀點與真正值得參考的訊號。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
