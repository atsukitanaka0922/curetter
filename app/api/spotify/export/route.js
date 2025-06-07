// app/api/spotify/export/route.js - デバッグ強化版
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function POST(request) {
  try {
    console.log('📤 Spotify playlist export started...')
    
    // NextAuthセッション確認
    const session = await getServerSession(authOptions)
    console.log('Session check:', {
      exists: !!session,
      hasAccessToken: !!session?.accessToken,
      hasSpotifyUserId: !!session?.spotifyUserId,
      provider: session?.provider,
      error: session?.error
    })
    
    if (!session) {
      console.error('❌ No session found')
      return NextResponse.json(
        { error: 'セッションが見つかりません。再度ログインしてください。' },
        { status: 401 }
      )
    }

    if (!session.accessToken) {
      console.error('❌ No access token in session')
      return NextResponse.json(
        { error: 'Spotify認証が必要です。まずSpotifyと連携してください。' },
        { status: 401 }
      )
    }

    if (session.error === 'RefreshAccessTokenError') {
      console.error('❌ Token refresh error detected')
      return NextResponse.json(
        { error: 'Spotifyトークンの期限が切れています。再度認証してください。' },
        { status: 401 }
      )
    }

    const { localPlaylist, makePublic = false } = await request.json()
    
    if (!localPlaylist) {
      return NextResponse.json(
        { error: 'プレイリストデータが必要です' },
        { status: 400 }
      )
    }

    if (!localPlaylist.tracks || localPlaylist.tracks.length === 0) {
      return NextResponse.json(
        { error: 'エクスポートする楽曲がありません' },
        { status: 400 }
      )
    }

    console.log('🎵 Exporting playlist:', {
      name: localPlaylist.name,
      trackCount: localPlaylist.tracks.length,
      makePublic: makePublic
    })

    // まずSpotifyユーザー情報を取得
    let userId = session.spotifyUserId
    if (!userId) {
      console.log('🔍 Spotify user ID not in session, fetching from API...')
      const userInfo = await getSpotifyUser(session.accessToken)
      if (!userInfo.success) {
        console.error('❌ Failed to get user info:', userInfo.error)
        return NextResponse.json(
          { error: userInfo.error },
          { status: 500 }
        )
      }
      userId = userInfo.user.id
      console.log('✅ Got user ID:', userId)
    }

    // Spotifyプレイリストを作成
    console.log('🎵 Creating Spotify playlist...')
    const playlistCreation = await createSpotifyPlaylist(
      session.accessToken,
      userId,
      localPlaylist,
      makePublic
    )
    
    if (!playlistCreation.success) {
      console.error('❌ Playlist creation failed:', playlistCreation.error)
      return NextResponse.json(
        { error: playlistCreation.error, debug: playlistCreation.debug },
        { status: 500 }
      )
    }

    console.log('✅ Playlist created:', playlistCreation.playlist.id)

    // 楽曲をプレイリストに追加
    console.log('🎵 Adding tracks to playlist...')
    const trackAddition = await addTracksToSpotifyPlaylist(
      session.accessToken,
      playlistCreation.playlist.id,
      localPlaylist.tracks
    )

    if (!trackAddition.success) {
      console.error('❌ Track addition failed:', trackAddition.error)
      return NextResponse.json(
        { error: trackAddition.error },
        { status: 500 }
      )
    }

    console.log('✅ Export completed successfully:', {
      playlistId: playlistCreation.playlist.id,
      addedTracks: trackAddition.addedCount,
      skippedTracks: trackAddition.skippedCount
    })

    return NextResponse.json({
      success: true,
      playlist: playlistCreation.playlist,
      addedTracks: trackAddition.addedCount,
      skippedTracks: trackAddition.skippedCount,
      totalTracks: localPlaylist.tracks.length
    })

  } catch (error) {
    console.error('❌ Spotify export error:', error)
    return NextResponse.json(
      { 
        error: 'プレイリストのエクスポートに失敗しました', 
        details: error.message,
        debug: error.stack 
      },
      { status: 500 }
    )
  }
}

// Spotifyユーザー情報を取得
async function getSpotifyUser(accessToken) {
  try {
    console.log('🔍 Fetching Spotify user info...')
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ User info request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: error
      })
      return { 
        success: false, 
        error: `Spotifyユーザー情報の取得に失敗: ${error.error?.message || response.statusText}` 
      }
    }

    const user = await response.json()
    console.log('✅ User info retrieved:', {
      id: user.id,
      display_name: user.display_name,
      product: user.product
    })
    return { success: true, user }

  } catch (error) {
    console.error('❌ User info fetch error:', error)
    return { success: false, error: `ユーザー情報取得エラー: ${error.message}` }
  }
}

// Spotifyプレイリストを作成
async function createSpotifyPlaylist(accessToken, userId, localPlaylist, makePublic) {
  try {
    console.log('🎵 Creating playlist for user:', userId)
    
    // プレイリスト名の検証
    if (!localPlaylist.name || localPlaylist.name.trim() === '') {
      return { 
        success: false, 
        error: 'プレイリスト名が空です',
        debug: 'Playlist name is empty or undefined'
      }
    }

    // 説明文の作成
    const description = [
      localPlaylist.description || '',
      '',
      '--- プリキュアプロフィールメーカーからエクスポート ---',
      `元プレイリスト: ${localPlaylist.name}`,
      `エクスポート日時: ${new Date().toLocaleString('ja-JP')}`
    ].filter(line => line.trim()).join('\n')

    const playlistData = {
      name: localPlaylist.name.trim().substring(0, 100), // Spotifyの制限: 100文字
      description: description.substring(0, 300), // Spotifyの制限: 300文字
      public: Boolean(makePublic),
      collaborative: false
    }

    console.log('📋 Playlist data:', {
      name: playlistData.name,
      public: playlistData.public,
      descriptionLength: playlistData.description.length
    })

    const response = await fetch(`https://api.spotify.com/v1/users/${encodeURIComponent(userId)}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(playlistData)
    })

    console.log('📡 Playlist creation response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Playlist creation failed:', {
        status: response.status,
        error: error,
        userId: userId,
        playlistData: playlistData
      })
      
      let errorMessage = 'プレイリスト作成に失敗しました'
      if (response.status === 400) {
        errorMessage = `プレイリスト作成失敗: ${error.error?.message || 'リクエストが無効です'}`
      } else if (response.status === 401) {
        errorMessage = 'Spotify認証の権限が不足しています。再度認証してください。'
      } else if (response.status === 403) {
        errorMessage = 'プレイリスト作成の権限がありません。Spotifyの設定を確認してください。'
      }
      
      return { 
        success: false, 
        error: errorMessage,
        debug: `Status: ${response.status}, Error: ${JSON.stringify(error)}`
      }
    }

    const playlist = await response.json()
    console.log('✅ Spotify playlist created successfully:', {
      id: playlist.id,
      name: playlist.name,
      external_urls: playlist.external_urls
    })
    
    return { success: true, playlist }

  } catch (error) {
    console.error('❌ Playlist creation error:', error)
    return { 
      success: false, 
      error: `プレイリスト作成エラー: ${error.message}`,
      debug: error.stack
    }
  }
}

// 楽曲をSpotifyプレイリストに追加
async function addTracksToSpotifyPlaylist(accessToken, playlistId, tracks) {
  try {
    console.log('🎵 Adding tracks to playlist:', playlistId)
    
    let addedCount = 0
    let skippedCount = 0
    
    // 楽曲URIの配列を作成（最大100曲ずつ処理）
    const batchSize = 100
    
    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize)
      const trackUris = batch
        .filter(track => track.id) // IDが存在する楽曲のみ
        .map(track => `spotify:track:${track.id}`)
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}:`, {
        batchSize: batch.length,
        validTracks: trackUris.length,
        skippedInBatch: batch.length - trackUris.length
      })
      
      if (trackUris.length === 0) {
        skippedCount += batch.length
        continue
      }

      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: trackUris
        })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Failed to add batch:', {
          status: response.status,
          error: error,
          batchNumber: Math.floor(i / batchSize) + 1
        })
        skippedCount += batch.length
        continue
      }

      addedCount += trackUris.length
      skippedCount += batch.length - trackUris.length
      
      console.log(`✅ Added batch ${Math.floor(i / batchSize) + 1}: ${trackUris.length} tracks`)
      
      // レート制限対策として少し待機
      if (i + batchSize < tracks.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log('📊 Track addition summary:', {
      addedCount,
      skippedCount,
      totalProcessed: addedCount + skippedCount
    })

    return {
      success: true,
      addedCount,
      skippedCount
    }

  } catch (error) {
    console.error('❌ Track addition error:', error)
    return { success: false, error: `楽曲追加エラー: ${error.message}` }
  }
}