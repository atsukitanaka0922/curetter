// app/api/auth/[...nextauth]/route.js - Google・X対応版
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import TwitterProvider from 'next-auth/providers/twitter'
import SpotifyProvider from 'next-auth/providers/spotify'

export const authOptions = {
  providers: [
    // Google認証
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile'
        }
      }
    }),
    
    // X(Twitter)認証
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      version: "2.0",
      authorization: {
        params: {
          scope: 'users.read tweet.read'
        }
      }
    }),
    
    // Spotify認証（既存）
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        params: {
          scope: [
            'user-read-email',
            'user-read-private',
            'playlist-read-private',
            'playlist-read-collaborative',
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
    async jwt({ token, account, user, profile }) {
      console.log('🔑 JWT Callback:', {
        provider: account?.provider,
        hasAccount: !!account,
        tokenType: account?.token_type,
        userId: user?.id
      })
      
      // 初回ログイン時
      if (account && user) {
        token.provider = account.provider
        token.providerId = user.id
        
        // プロバイダー別のデータ処理
        switch (account.provider) {
          case 'google':
            token.googleId = user.id
            token.displayName = user.name
            token.avatarUrl = user.image
            token.email = user.email
            break
            
          case 'twitter':
            token.twitterId = user.id
            token.displayName = user.name
            token.avatarUrl = user.image
            token.username = profile?.username || user.username
            break
            
          case 'spotify':
            // Spotify用のトークン管理（既存機能）
            token.accessToken = account.access_token
            token.refreshToken = account.refresh_token
            token.accessTokenExpires = account.expires_at * 1000
            token.spotifyUserId = user.id
            token.displayName = user.name
            token.avatarUrl = user.image
            break
        }
        
        console.log('✅ Provider data stored:', {
          provider: token.provider,
          displayName: token.displayName,
          email: token.email
        })
      }

      // Spotifyトークンの更新処理（既存）
      if (token.provider === 'spotify' && token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token
      }

      if (token.provider === 'spotify' && token.refreshToken) {
        return await refreshSpotifyToken(token)
      }

      return token
    },
    
    async session({ session, token }) {
      // セッションにプロバイダー情報を追加
      session.provider = token.provider
      session.providerId = token.providerId
      session.displayName = token.displayName
      session.avatarUrl = token.avatarUrl
      
      // プロバイダー別の情報
      if (token.provider === 'google') {
        session.googleId = token.googleId
      } else if (token.provider === 'twitter') {
        session.twitterId = token.twitterId
        session.username = token.username
      } else if (token.provider === 'spotify') {
        // Spotify用の情報（既存）
        session.accessToken = token.accessToken
        session.refreshToken = token.refreshToken
        session.error = token.error
        session.spotifyUserId = token.spotifyUserId
      }
      
      console.log('📋 Session created:', {
        provider: session.provider,
        email: session.user?.email,
        displayName: session.displayName
      })
      
      return session
    },
    
    async signIn({ user, account, profile }) {
      console.log('🚪 Sign in attempt:', {
        provider: account?.provider,
        email: user?.email,
        name: user?.name
      })
      
      // すべてのプロバイダーを許可
      return true
    }
  },
  
  events: {
    async signIn({ user, account, profile }) {
      console.log('📝 Sign in event:', {
        provider: account?.provider,
        userId: user?.id,
        email: user?.email
      })
      
      // Supabaseプロフィール作成・更新
      try {
        await createOrUpdateSupabaseProfile(user, account, profile)
      } catch (error) {
        console.error('❌ Profile creation error:', error)
        // エラーでもログインは継続
      }
    }
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 30, // 30日
  },
  
  // セキュリティ設定
  secret: process.env.NEXTAUTH_SECRET,
}

// Spotifyトークンリフレッシュ（既存機能）
async function refreshSpotifyToken(token) {
  try {
    console.log('🔄 Refreshing Spotify token...')
    
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
      console.error('❌ Spotify token refresh failed:', refreshedTokens)
      throw refreshedTokens
    }

    console.log('✅ Spotify token refreshed successfully')
    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      error: undefined
    }
  } catch (error) {
    console.error('❌ Spotify token refresh error:', error)
    return {
      ...token,
      error: 'RefreshAccessTokenError'
    }
  }
}

// Supabaseプロフィール作成・更新
async function createOrUpdateSupabaseProfile(user, account, profile) {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    console.log('👤 Creating/updating Supabase profile for:', user.email)
    
    // プロフィールデータの準備
    let displayName = user.name
    let avatarUrl = user.image
    
    // プロバイダー別の追加情報
    const additionalData = {}
    
    switch (account.provider) {
      case 'google':
        additionalData.google_id = user.id
        displayName = profile?.name || user.name
        break
        
      case 'twitter':
        additionalData.twitter_id = user.id
        additionalData.twitter_username = profile?.username
        displayName = profile?.name || user.name
        break
        
      case 'spotify':
        additionalData.spotify_id = user.id
        displayName = profile?.display_name || user.name
        break
    }
    
    // ユーザーIDとしてはNextAuth.jsのユーザーIDではなく、メールベースのハッシュを使用
    const userId = user.email // または適切なユニークID生成
    
    const profileData = {
      id: userId,
      email: user.email,
      display_name: displayName,
      avatar_url: avatarUrl,
      auth_provider: account.provider,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...additionalData
    }
    
    // プロフィールの作成または更新
    const { error } = await supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'email'
      })
    
    if (error) {
      console.error('❌ Supabase profile upsert error:', error)
      throw error
    }
    
    console.log('✅ Supabase profile created/updated successfully')
    
  } catch (error) {
    console.error('❌ Supabase profile operation failed:', error)
    throw error
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }