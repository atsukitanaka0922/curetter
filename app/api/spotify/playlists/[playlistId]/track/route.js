// app/api/spotify/playlists/[playlistId]/tracks/route.js
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import SpotifyAPI from '../../../../../../lib/spotify'

// プレイリストの楽曲一覧を取得
export async function GET(request, { params }) {
  try {
    const session = await getServerSession()
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Spotifyアクセストークンが必要です' },
        { status: 401 }
      )
    }

    const { playlistId } = params
    const spotify = new SpotifyAPI(session.accessToken)
    const tracks = await spotify.getPlaylistTracks(playlistId)

    return NextResponse.json(tracks)
  } catch (error) {
    console.error('プレイリスト楽曲取得エラー:', error)
    return NextResponse.json(
      { error: 'プレイリスト楽曲の取得に失敗しました', details: error.message },
      { status: 500 }
    )
  }
}

// プレイリストに楽曲を追加
export async function POST(request, { params }) {
  try {
    const session = await getServerSession()
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Spotifyアクセストークンが必要です' },
        { status: 401 }
      )
    }

    const { playlistId } = params
    const { trackUris } = await request.json()

    if (!trackUris || !Array.isArray(trackUris) || trackUris.length === 0) {
      return NextResponse.json(
        { error: '追加する楽曲のURIが必要です' },
        { status: 400 }
      )
    }

    const spotify = new SpotifyAPI(session.accessToken)
    const result = await spotify.addTracksToPlaylist(playlistId, trackUris)

    return NextResponse.json(result)
  } catch (error) {
    console.error('楽曲追加エラー:', error)
    return NextResponse.json(
      { error: '楽曲の追加に失敗しました', details: error.message },
      { status: 500 }
    )
  }
}

// プレイリストから楽曲を削除
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession()
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Spotifyアクセストークンが必要です' },
        { status: 401 }
      )
    }

    const { playlistId } = params
    const { trackUris } = await request.json()

    if (!trackUris || !Array.isArray(trackUris) || trackUris.length === 0) {
      return NextResponse.json(
        { error: '削除する楽曲のURIが必要です' },
        { status: 400 }
      )
    }

    const spotify = new SpotifyAPI(session.accessToken)
    const result = await spotify.removeTracksFromPlaylist(playlistId, trackUris)

    return NextResponse.json(result)
  } catch (error) {
    console.error('楽曲削除エラー:', error)
    return NextResponse.json(
      { error: '楽曲の削除に失敗しました', details: error.message },
      { status: 500 }
    )
  }
}