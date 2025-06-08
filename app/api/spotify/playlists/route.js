// app/api/spotify/playlists/route.js - 修正版
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'

// プレイリスト一覧取得
export async function GET(request) {
  try {
    console.log('=== Spotify Playlists API Called ===')
    
    const session = await getServerSession(authOptions)
    console.log('Session check:', {
      exists: !!session,
      hasAccessToken: !!session?.accessToken,
      provider: session?.provider,
      userEmail: session?.user?.email
    })
    
    if (!session) {
      console.log('❌ No session found')
      return NextResponse.json(
        { 
          error: 'ログインが必要です',
          debug: 'No session in playlists API'
        },
        { status: 401 }
      )
    }

    if (!session.accessToken) {
      console.log('❌ No access token')
      return NextResponse.json(
        { 
          error: 'Spotifyアクセストークンが必要です',
          debug: 'No access token in playlists API'
        },
        { status: 401 }
      )
    }

    console.log('🎵 Fetching playlists with token:', session.accessToken.substring(0, 20) + '...')
    
    const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Spotify API Error:', error)
      return NextResponse.json(
        { 
          error: 'プレイリストの取得に失敗しました', 
          details: error.error?.message || response.statusText,
          debug: 'Spotify API request failed'
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ Playlists fetched:', data.items?.length || 0)
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('❌ Playlists error:', error)
    return NextResponse.json(
      { 
        error: 'プレイリストの取得に失敗しました', 
        details: error.message,
        debug: 'Error in playlists API'
      },
      { status: 500 }
    )
  }
}

// プレイリスト作成
export async function POST(request) {
  try {
    console.log('=== Create Playlist API Called ===')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { 
          error: 'Spotifyアクセストークンが必要です',
          debug: 'No access token for playlist creation'
        },
        { status: 401 }
      )
    }

    const { name, description, isPublic } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'プレイリスト名が必要です' },
        { status: 400 }
      )
    }

    console.log('🎵 Creating playlist:', name)
    
    // まずユーザー情報を取得
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!userResponse.ok) {
      const userError = await userResponse.json()
      console.error('❌ User info error:', userError)
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    const user = await userResponse.json()
    
    // プレイリスト作成
    const playlistResponse = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        description: description || '',
        public: isPublic !== false,
        collaborative: false
      })
    })

    if (!playlistResponse.ok) {
      const error = await playlistResponse.json()
      console.error('❌ Playlist creation error:', error)
      return NextResponse.json(
        { 
          error: 'プレイリストの作成に失敗しました', 
          details: error.error?.message || playlistResponse.statusText
        },
        { status: playlistResponse.status }
      )
    }

    const playlist = await playlistResponse.json()
    console.log('✅ Playlist created:', playlist.id)
    
    return NextResponse.json(playlist)
    
  } catch (error) {
    console.error('❌ Create playlist error:', error)
    return NextResponse.json(
      { 
        error: 'プレイリストの作成に失敗しました', 
        details: error.message,
        debug: 'Error in create playlist API'
      },
      { status: 500 }
    )
  }
}