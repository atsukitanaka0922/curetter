// app/api/spotify/import/route.js - Spotifyプレイリストインポート機能
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('📥 Spotify playlist import started...')
    
    const { spotifyUrl } = await request.json()
    
    if (!spotifyUrl) {
      return NextResponse.json(
        { error: 'Spotify URLが必要です' },
        { status: 400 }
      )
    }

    // Spotify URLからプレイリストIDを抽出
    const playlistId = extractPlaylistId(spotifyUrl)
    if (!playlistId) {
      return NextResponse.json(
        { error: '有効なSpotify プレイリストURLではありません' },
        { status: 400 }
      )
    }

    console.log('🆔 Extracted playlist ID:', playlistId)

    // Client Credentials Flowでアクセストークンを取得
    const tokenResponse = await getSpotifyToken()
    if (!tokenResponse.success) {
      return NextResponse.json(
        { error: tokenResponse.error },
        { status: 500 }
      )
    }

    const accessToken = tokenResponse.token

    // プレイリスト情報を取得
    const playlistInfo = await getPlaylistInfo(playlistId, accessToken)
    if (!playlistInfo.success) {
      return NextResponse.json(
        { error: playlistInfo.error },
        { status: 404 }
      )
    }

    // プレイリストの楽曲を取得
    const tracksData = await getPlaylistTracks(playlistId, accessToken)
    if (!tracksData.success) {
      return NextResponse.json(
        { error: tracksData.error },
        { status: 500 }
      )
    }

    // プリキュア関連楽曲のフィルタリング
    const filteredTracks = filterPrecureTracks(tracksData.tracks)

    console.log(`✅ Import completed: ${filteredTracks.length}/${tracksData.tracks.length} tracks`)

    return NextResponse.json({
      success: true,
      playlist: playlistInfo.playlist,
      tracks: filteredTracks,
      originalCount: tracksData.tracks.length,
      filteredCount: filteredTracks.length
    })

  } catch (error) {
    console.error('❌ Spotify import error:', error)
    return NextResponse.json(
      { error: 'プレイリストのインポートに失敗しました', details: error.message },
      { status: 500 }
    )
  }
}

// Spotify URLからプレイリストIDを抽出
function extractPlaylistId(url) {
  const patterns = [
    /spotify:playlist:([a-zA-Z0-9]+)/,
    /open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
    /spotify\.com\/playlist\/([a-zA-Z0-9]+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

// Spotifyアクセストークンを取得
async function getSpotifyToken() {
  try {
    const client_id = process.env.SPOTIFY_CLIENT_ID
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET

    if (!client_id || !client_secret) {
      return { success: false, error: 'Spotify認証情報が設定されていません' }
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: `Spotifyトークン取得失敗: ${error.error_description}` }
    }

    const data = await response.json()
    return { success: true, token: data.access_token }

  } catch (error) {
    return { success: false, error: `トークン取得エラー: ${error.message}` }
  }
}

// プレイリスト情報を取得
async function getPlaylistInfo(playlistId, accessToken) {
  try {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}?fields=id,name,description,public,owner,images,tracks.total`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'プレイリストが見つかりません' }
      }
      return { success: false, error: 'プレイリスト情報の取得に失敗しました' }
    }

    const playlist = await response.json()
    return { success: true, playlist }

  } catch (error) {
    return { success: false, error: `プレイリスト情報取得エラー: ${error.message}` }
  }
}

// プレイリストの楽曲を取得
async function getPlaylistTracks(playlistId, accessToken) {
  try {
    const allTracks = []
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=items(track(id,name,artists,album,duration_ms,external_urls,preview_url)),next`

    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        return { success: false, error: 'プレイリスト楽曲の取得に失敗しました' }
      }

      const data = await response.json()
      
      // 有効な楽曲のみを追加（削除された楽曲をスキップ）
      const validTracks = data.items
        .filter(item => item.track && item.track.id)
        .map(item => item.track)
      
      allTracks.push(...validTracks)
      nextUrl = data.next
    }

    return { success: true, tracks: allTracks }

  } catch (error) {
    return { success: false, error: `楽曲取得エラー: ${error.message}` }
  }
}

// プリキュア関連楽曲をフィルタリング
function filterPrecureTracks(tracks) {
  const precureKeywords = [
    'プリキュア', 'precure', 'pretty cure',
    'ふたりはプリキュア', 'スプラッシュスター', 'yes!プリキュア5',
    'フレッシュプリキュア', 'ハートキャッチプリキュア', 'スイートプリキュア',
    'スマイルプリキュア', 'ドキドキプリキュア', 'ハピネスチャージプリキュア',
    'プリンセスプリキュア', '魔法つかいプリキュア', 'アラモード',
    'hugっとプリキュア', 'スタートゥインクルプリキュア',
    'ヒーリングっどプリキュア', 'トロピカルージュプリキュア',
    'デリシャスパーティプリキュア', 'ひろがるスカイプリキュア',
    'わんだふるぷりきゅあ', 'キュア', 'cure',
    // アーティスト名
    '五條真由美', '工藤真由', '池田彩', '吉田仁美',
    'うちやえゆか', '宮本佳那子', '高取ヒデアキ',
    // 楽曲名の一部
    'DANZEN', 'プリキュア音頭', '夢みる乙女', 'HEART GOES ON'
  ]

  return tracks.filter(track => {
    const trackName = track.name.toLowerCase()
    const artistNames = track.artists.map(artist => artist.name.toLowerCase()).join(' ')
    const albumName = track.album.name.toLowerCase()
    
    return precureKeywords.some(keyword => 
      trackName.includes(keyword.toLowerCase()) ||
      artistNames.includes(keyword.toLowerCase()) ||
      albumName.includes(keyword.toLowerCase())
    )
  }).map(track => ({
    id: track.id,
    name: track.name,
    artists: track.artists.map(artist => ({
      id: artist.id,
      name: artist.name
    })),
    album: {
      id: track.album.id,
      name: track.album.name,
      images: track.album.images
    },
    duration_ms: track.duration_ms,
    external_urls: track.external_urls,
    preview_url: track.preview_url,
    added_at: new Date().toISOString()
  }))
}