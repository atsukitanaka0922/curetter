// app/layout.js
'use client'

import { SessionProvider } from 'next-auth/react'
import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <title>キュアサークル</title>
        <meta name="description" content="キュアサークル" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-gray-100 text-gray-900" >
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}