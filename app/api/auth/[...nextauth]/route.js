// app/api/auth/[...nextauth]/route.js - 修正版（エクスポート対応）
import NextAuth from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'

export const authOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        params: {
          scope: [
            'user-read-email',
            'user-read-private',
            'playlist-read-private',
            'playlist-modify-public', 
            'playlist-modify-private',
            'user-library-read',
            'user-library-modify'
          ].join(' ')
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      console.log('JWT Callback - Account:', !!account, account?.provider)
      
      // 初回ログイン時にアクセストークンを保存
      if (account && account.provider === 'spotify') {
        console.log('✅ Storing Spotify tokens')
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.accessTokenExpires = account.expires_at * 1000
        token.provider = 'spotify'
        
        // ユーザー情報も保存
        if (user) {
          token.spotifyUserId = user.id
        }
        
        console.log('Token expires at:', new Date(token.accessTokenExpires))
        console.log('User ID:', token.spotifyUserId)
      }

      // アクセストークンの期限チェック
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        console.log('✅ Token is still valid')
        return token
      }

      // アクセストークンの更新
      if (token.refreshToken) {
        console.log('🔄 Refreshing expired token')
        return await refreshAccessToken(token)
      }

      console.log('❌ No refresh token available')
      return token
    },
    async session({ session, token }) {
      // セッションにSpotifyトークンを追加
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.error = token.error
      session.provider = token.provider
      session.spotifyUserId = token.spotifyUserId
      
      console.log('Session created:', {
        hasToken: !!session.accessToken,
        userId: session.spotifyUserId,
        error: session.error
      })
      
      return session
    }
  },
  pages: {
    error: '/auth/error'
  },
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: 'jwt'
  }
}

async function refreshAccessToken(token) {
  try {
    const url = 'https://accounts.spotify.com/api/token'
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      },
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken
      })
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      console.error('❌ Token refresh failed:', refreshedTokens)
      throw refreshedTokens
    }

    console.log('✅ Token refreshed successfully')
    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      error: undefined
    }
  } catch (error) {
    console.error('❌ Token refresh error:', error)
    return {
      ...token,
      error: 'RefreshAccessTokenError'
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }