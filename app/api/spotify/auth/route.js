// app/api/spotify/auth/route.js - Spotify認証状態管理
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'

// 認証状態確認
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        error: 'セッションが見つかりません'
      })
    }

    if (!session.accessToken) {
      return NextResponse.json({
        authenticated: false,
        error: 'Spotifyアクセストークンがありません'
      })
    }

    if (session.error === 'RefreshAccessTokenError') {
      return NextResponse.json({
        authenticated: false,
        error: 'トークンの更新に失敗しました'
      })
    }

    // Spotifyユーザー情報を取得して認証確認
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`
      }
    })

    if (!userResponse.ok) {
      return NextResponse.json({
        authenticated: false,
        error: 'Spotify APIアクセスに失敗しました'
      })
    }

    const user = await userResponse.json()

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        display_name: user.display_name,
        email: user.email,
        images: user.images,
        country: user.country,
        product: user.product
      },
      scopes: session.accessToken ? ['playlist-modify-public', 'playlist-modify-private'] : []
    })

  } catch (error) {
    console.error('Spotify auth check error:', error)
    return NextResponse.json({
      authenticated: false,
      error: '認証確認中にエラーが発生しました'
    })
  }
}