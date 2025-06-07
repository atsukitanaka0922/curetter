// app/api/spotify/debug/route.js - デバッグ用API
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET() {
  try {
    console.log('🔍 Spotify debug check started...')
    
    // 環境変数チェック
    const envCheck = {
      SPOTIFY_CLIENT_ID: !!process.env.SPOTIFY_CLIENT_ID,
      SPOTIFY_CLIENT_SECRET: !!process.env.SPOTIFY_CLIENT_SECRET,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET
    }
    
    console.log('Environment variables:', envCheck)

    // セッションチェック
    const session = await getServerSession(authOptions)
    
    const sessionCheck = {
      sessionExists: !!session,
      hasAccessToken: !!session?.accessToken,
      hasRefreshToken: !!session?.refreshToken,
      hasSpotifyUserId: !!session?.spotifyUserId,
      provider: session?.provider,
      error: session?.error,
      userEmail: session?.user?.email
    }
    
    console.log('Session check:', sessionCheck)

    if (!session?.accessToken) {
      return NextResponse.json({
        success: false,
        error: 'セッションまたはアクセストークンがありません',
        envCheck,
        sessionCheck
      })
    }

    // Spotify API テスト
    const apiTests = {}

    // 1. ユーザー情報取得テスト
    try {
      const userResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      apiTests.userInfo = {
        success: userResponse.ok,
        status: userResponse.status,
        statusText: userResponse.statusText
      }
      
      if (userResponse.ok) {
        const userData = await userResponse.json()
        apiTests.userInfo.data = {
          id: userData.id,
          display_name: userData.display_name,
          product: userData.product,
          country: userData.country
        }
      } else {
        const errorData = await userResponse.json()
        apiTests.userInfo.error = errorData
      }
    } catch (error) {
      apiTests.userInfo = {
        success: false,
        error: error.message
      }
    }

    // 2. プレイリスト作成権限テスト（実際には作成しない）
    try {
      const testPlaylistData = {
        name: 'Test Playlist (DELETE ME)',
        description: 'Test playlist for debugging - please delete',
        public: false,
        collaborative: false
      }

      const userId = apiTests.userInfo.data?.id
      if (userId) {
        // 実際にはテストプレイリストを作成しない代わりに、APIエンドポイントの形式をチェック
        const testUrl = `https://api.spotify.com/v1/users/${encodeURIComponent(userId)}/playlists`
        apiTests.playlistEndpoint = {
          url: testUrl,
          userId: userId,
          userIdEncoded: encodeURIComponent(userId)
        }
      }
    } catch (error) {
      apiTests.playlistTest = {
        success: false,
        error: error.message
      }
    }

    // 3. スコープチェック
    const requiredScopes = [
      'user-read-email',
      'user-read-private',
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private'
    ]

    // トークンからスコープを取得（可能であれば）
    apiTests.scopes = {
      required: requiredScopes,
      note: 'Spotifyトークンからスコープを直接取得することはできませんが、必要な権限は上記の通りです'
    }

    return NextResponse.json({
      success: true,
      envCheck,
      sessionCheck,
      apiTests,
      recommendations: [
        sessionCheck.sessionExists ? '✅ セッションOK' : '❌ セッションなし - 再ログインが必要',
        sessionCheck.hasAccessToken ? '✅ アクセストークンOK' : '❌ アクセストークンなし',
        apiTests.userInfo?.success ? '✅ Spotify API接続OK' : '❌ Spotify API接続失敗',
        envCheck.SPOTIFY_CLIENT_ID ? '✅ Client ID設定済み' : '❌ Client ID未設定',
        envCheck.SPOTIFY_CLIENT_SECRET ? '✅ Client Secret設定済み' : '❌ Client Secret未設定'
      ]
    })

  } catch (error) {
    console.error('❌ Debug API error:', error)
    return NextResponse.json({
      success: false,
      error: 'デバッグチェック中にエラーが発生しました',
      details: error.message,
      stack: error.stack
    })
  }
}