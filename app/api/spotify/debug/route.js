// app/api/spotify/debug/route.js - 修正版（詳細デバッグ対応）
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
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      // 値の一部表示（デバッグ用）
      SPOTIFY_CLIENT_ID_PREVIEW: process.env.SPOTIFY_CLIENT_ID ? 
        process.env.SPOTIFY_CLIENT_ID.substring(0, 8) + '...' : 'Not set',
      NEXTAUTH_URL_VALUE: process.env.NEXTAUTH_URL || 'Not set'
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
      userEmail: session?.user?.email,
      tokenPreview: session?.accessToken ? 
        session.accessToken.substring(0, 20) + '...' : 'No token'
    }
    
    console.log('Session check:', sessionCheck)

    if (!session?.accessToken) {
      return NextResponse.json({
        success: false,
        error: 'セッションまたはアクセストークンがありません',
        envCheck,
        sessionCheck,
        recommendations: [
          '❌ Spotify認証が必要です',
          '1. 「Spotify連携」ボタンをクリック',
          '2. Spotifyでアプリを承認',
          '3. 再度この診断を実行'
        ]
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
          country: userData.country,
          email: userData.email
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

    // 2. プレイリスト作成テスト（実際には作成しない）
    const userId = apiTests.userInfo.data?.id
    if (userId) {
      apiTests.playlistEndpoint = {
        url: `https://api.spotify.com/v1/users/${encodeURIComponent(userId)}/playlists`,
        userId: userId,
        userIdEncoded: encodeURIComponent(userId),
        ready: true
      }
    } else {
      apiTests.playlistEndpoint = {
        ready: false,
        reason: 'User ID not available'
      }
    }

    // 3. トークン権限テスト
    try {
      const playlistsResponse = await fetch('https://api.spotify.com/v1/me/playlists?limit=1', {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      apiTests.playlistAccess = {
        success: playlistsResponse.ok,
        status: playlistsResponse.status,
        statusText: playlistsResponse.statusText
      }
      
      if (playlistsResponse.ok) {
        const playlistData = await playlistsResponse.json()
        apiTests.playlistAccess.hasPlaylists = playlistData.items?.length > 0
        apiTests.playlistAccess.totalPlaylists = playlistData.total
      } else {
        const errorData = await playlistsResponse.json()
        apiTests.playlistAccess.error = errorData
      }
    } catch (error) {
      apiTests.playlistAccess = {
        success: false,
        error: error.message
      }
    }

    // 4. スコープチェック（推定）
    const requiredScopes = [
      'user-read-email',
      'user-read-private',
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private'
    ]

    apiTests.scopes = {
      required: requiredScopes,
      note: 'Spotifyトークンからスコープを直接取得することはできませんが、必要な権限は上記の通りです',
      canReadUser: apiTests.userInfo?.success,
      canReadPlaylists: apiTests.playlistAccess?.success,
      estimatedScopes: []
    }

    // 権限の推定
    if (apiTests.userInfo?.success) {
      apiTests.scopes.estimatedScopes.push('user-read-private', 'user-read-email')
    }
    if (apiTests.playlistAccess?.success) {
      apiTests.scopes.estimatedScopes.push('playlist-read-private')
    }

    // 5. プレイリスト作成権限の詳細テスト
    apiTests.createPlaylistTest = {
      ready: !!userId,
      userId: userId,
      wouldCreateAt: userId ? `https://api.spotify.com/v1/users/${encodeURIComponent(userId)}/playlists` : null,
      note: '実際の作成テストは行いません（テストプレイリストの作成を避けるため）'
    }

    // 総合診断
    const overallHealth = {
      authenticationScore: sessionCheck.hasAccessToken ? 25 : 0,
      userInfoScore: apiTests.userInfo?.success ? 25 : 0,
      playlistReadScore: apiTests.playlistAccess?.success ? 25 : 0,
      readyForExportScore: (userId && apiTests.userInfo?.success && apiTests.playlistAccess?.success) ? 25 : 0
    }

    const totalScore = Object.values(overallHealth).reduce((sum, score) => sum + score, 0)

    return NextResponse.json({
      success: true,
      healthScore: `${totalScore}/100`,
      overallHealth,
      envCheck,
      sessionCheck,
      apiTests,
      recommendations: [
        sessionCheck.sessionExists ? '✅ セッションOK' : '❌ セッションなし - 再ログインが必要',
        sessionCheck.hasAccessToken ? '✅ アクセストークンOK' : '❌ アクセストークンなし',
        apiTests.userInfo?.success ? '✅ Spotify API接続OK' : '❌ Spotify API接続失敗',
        apiTests.playlistAccess?.success ? '✅ プレイリスト読み取りOK' : '❌ プレイリスト権限不足',
        envCheck.SPOTIFY_CLIENT_ID ? '✅ Client ID設定済み' : '❌ Client ID未設定',
        envCheck.SPOTIFY_CLIENT_SECRET ? '✅ Client Secret設定済み' : '❌ Client Secret未設定',
        totalScore >= 75 ? '🎉 エクスポート準備完了！' : '⚠️ 設定に問題があります'
      ],
      troubleshooting: {
        common_issues: [
          {
            issue: 'Bad Request (400) エラー',
            causes: [
              'プレイリスト名に無効な文字が含まれている',
              'ユーザーIDが正しくない',
              'リクエストボディの形式が間違っている'
            ],
            solutions: [
              'プレイリスト名から特殊文字を除去',
              'Spotify認証を再実行',
              'APIリクエスト形式の確認'
            ]
          },
          {
            issue: 'Unauthorized (401) エラー',
            causes: [
              'アクセストークンの期限切れ',
              '権限スコープ不足',
              'トークンリフレッシュ失敗'
            ],
            solutions: [
              'Spotify再認証',
              'アプリケーション権限の確認',
              'トークンリフレッシュ機能の確認'
            ]
          },
          {
            issue: 'Forbidden (403) エラー',
            causes: [
              'Spotifyアカウントの制限',
              'アプリケーション権限不足',
              'プレミアムアカウント要求機能'
            ],
            solutions: [
              'Spotifyアカウント設定確認',
              'Spotify Developer Dashboard確認',
              'アカウントタイプの確認'
            ]
          }
        ]
      },
      nextSteps: totalScore < 100 ? [
        totalScore < 25 ? '1. Spotifyとの連携を最初からやり直してください' : null,
        !apiTests.userInfo?.success ? '2. ユーザー情報取得に失敗 - トークンを確認' : null,
        !apiTests.playlistAccess?.success ? '3. プレイリスト権限不足 - 再認証が必要' : null,
        '4. 問題が解決しない場合はSupport Channelまでお問い合わせください'
      ].filter(Boolean) : [
        '🎉 すべてのテストに合格！',
        '✅ Spotifyエクスポート機能が利用可能です'
      ]
    })

  } catch (error) {
    console.error('❌ Debug API error:', error)
    return NextResponse.json({
      success: false,
      error: 'デバッグチェック中にエラーが発生しました',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
  }
}