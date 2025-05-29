import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'プリキュアファンプロフィール',
  description: 'プリキュアファンのためのプロフィール共有サイト',
  keywords: 'プリキュア, ファン, プロフィール, アニメ, 魔法少女',
  openGraph: {
    title: 'プリキュアファンプロフィール',
    description: 'プリキュアファンのためのプロフィール共有サイト',
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'プリキュアファンプロフィール',
    description: 'プリキュアファンのためのプロフィール共有サイト',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className} antialiased bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 min-h-screen`}>
        <div id="root">
          {children}
        </div>
        {/* フローティング装飾要素 */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-8 -right-8 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>
      </body>
    </html>
  )
}