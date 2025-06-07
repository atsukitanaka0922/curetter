// app/api/spotify/playlists/route.js - 修正版
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import SpotifyAPI from '../../../../lib/spotify'

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
    
    const spotify = new SpotifyAPI(session.accessToken)
    const playlists = await spotify.getUserPlaylists()
    
    console.log('✅ Playlists fetched:', playlists.items?.length || 0)
    return NextResponse.json(playlists)
    
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
    
    const spotify = new SpotifyAPI(session.accessToken)
    const user = await spotify.getCurrentUser()
    const playlist = await spotify.createPlaylist(
      user.id,
      name,
      description || '',
      isPublic !== false
    )

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