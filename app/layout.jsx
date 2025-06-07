// app/layout.js
'use client'

import { SessionProvider } from 'next-auth/react'
import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <title>プリキュアファンプロフィール</title>
        <meta name="description" content="プリキュアファンのためのプロフィール共有プラットフォーム" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}