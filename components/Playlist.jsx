// components/Playlist.jsx - 完全修正版
'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Music, Heart, Star, Play, Plus, X, Trash2, Search, RefreshCw, ExternalLink, User, AlertCircle } from 'lucide-react'

export default function Playlist({ session: supabaseSession, profile }) {
  const { data: spotifySession, status } = useSession()
  const [playlists, setPlaylists] = useState([])
  const [allPlaylists, setAllPlaylists] = useState([]) // フィルタリング前の全プレイリスト
  const [currentPlaylist, setCurrentPlaylist] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAllPlaylists, setShowAllPlaylists] = useState(false) // 削除予定（常にfalse）
  
  // プレイリスト楽曲表示用の状態
  const [showPlaylistTracks, setShowPlaylistTracks] = useState(false)
  const [selectedPlaylistForTracks, setSelectedPlaylistForTracks] = useState(null)
  const [playlistTracks, setPlaylistTracks] = useState([])
  const [tracksLoading, setTracksLoading] = useState(false)

  // 新規プレイリスト作成用
  const [newPlaylist, setNewPlaylist] = useState({
    name: '',
    description: '',
    isPublic: true
  })

  // Spotify接続状態の詳細チェック
  const isSpotifyConnected = status === 'authenticated' && 
                           spotifySession?.accessToken && 
                           spotifySession?.provider === 'spotify'

  // デバッグ情報表示
  useEffect(() => {
    console.log('=== Playlist Component Debug ===')
    console.log('NextAuth Status:', status)
    console.log('Spotify Session:', {
      exists: !!spotifySession,
      hasAccessToken: !!spotifySession?.accessToken,
      provider: spotifySession?.provider,
      error: spotifySession?.error,
      user: spotifySession?.user?.email
    })
    console.log('Is Connected:', isSpotifyConnected)
  }, [status, spotifySession, isSpotifyConnected])

  useEffect(() => {
    if (isSpotifyConnected) {
      loadSpotifyPlaylists()
    }
  }, [isSpotifyConnected])

  // フィルタリング関数（厳密版 - プレイキュア専用キーワードのみ）
  const getFilteredPlaylists = (playlistsData) => {
    // 常にプリキュア専用フィルターを適用

    // プリキュア専用キーワード（厳密に絞り込み）
    const precureKeywords = [
      // === 基本キーワード（必須レベル） ===
      'プリキュア', 'precure', 'pretty cure',
      
      // === アプリ識別用 ===
      'プリキュアプロフィールメーカー', 'プリキュアプロフィールメーカーにて作成',
      
      // === 明確なシリーズ名のみ ===
      'ふたりはプリキュア', 'スプラッシュスター', 'yes!プリキュア5',
      'フレッシュプリキュア', 'ハートキャッチプリキュア', 'スイートプリキュア',
      'スマイルプリキュア', 'ドキドキプリキュア', 'ハピネスチャージプリキュア',
      'プリンセスプリキュア', '魔法つかいプリキュア', 'アラモード',
      'hugっとプリキュア', 'スタートゥインクルプリキュア',
      'ヒーリングっどプリキュア', 'トロピカルージュプリキュア',
      'デリシャスパーティプリキュア', 'ひろがるスカイプリキュア',
      'わんだふるぷりきゅあ',
      
      // === プリキュア固有の略称 ===
      'ふたりは', 'スプラッシュ', 'yes!', 'フレッシュ', 'ハートキャッチ',
      'スイート', 'スマイル', 'ドキドキ', 'ハピネス',
      'hugっと', 'スター', 'ヒーリング', 'トロピカル',
      'デリシャス', 'ひろがる', 'わんだふる',
      
      // === プリキュア専用用語 ===
      'キュア', 'cure'
    ]

    // より厳密なフィルタリング
    return playlistsData.filter(playlist => {
      const name = (playlist.name || '').toLowerCase()
      const description = (playlist.description || '').toLowerCase()
      
      // プリキュア関連キーワードのチェック（完全一致または明確な部分一致）
      const isPrecureRelated = precureKeywords.some(keyword => {
        const lowerKeyword = keyword.toLowerCase()
        // より厳密なマッチング
        return name.includes(lowerKeyword) || description.includes(lowerKeyword)
      })
      
      // ユーザーが作成したプレイリストの条件を厳しく
      const currentUserId = spotifySession?.user?.id
      const isUserCreated = playlist.owner?.id === currentUserId
      
      // ユーザー作成プレイリストでもプリキュア関連のもののみ表示
      const isUserPrecurePlaylist = isUserCreated && isPrecureRelated
      
      // 新規作成プレイリストも同様に厳しく
      const isRecentUserPrecurePlaylist = () => {
        if (!isUserCreated || !isPrecureRelated) return false
        
        // プレイリストに created_at がない場合は、tracks.total が少ないものを新規とみなす
        if (!playlist.created_at && playlist.tracks?.total <= 3) {
          return true
        }
        
        if (playlist.created_at) {
          const createdTime = new Date(playlist.created_at).getTime()
          const now = Date.now()
          const hoursDiff = (now - createdTime) / (1000 * 60 * 60)
          return hoursDiff <= 2 // 2時間以内に短縮
        }
        
        return false
      }
      
      // 表示条件：プリキュア関連かつ（一般公開 または ユーザー作成）
      const willShow = isPrecureRelated && (
        !isUserCreated || // 他人が作成したプリキュア関連プレイリスト
        isUserPrecurePlaylist || // 自分が作成したプリキュア関連プレイリスト
        isRecentUserPrecurePlaylist() // 最近作成したプリキュア関連プレイリスト
      )
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Playlist "${playlist.name}":`, {
          name: playlist.name,
          description: playlist.description || '(説明なし)',
          isPrecureRelated,
          isUserCreated,
          isUserPrecurePlaylist,
          isRecentUserPrecurePlaylist: isRecentUserPrecurePlaylist(),
          ownerName: playlist.owner?.display_name,
          currentUserId,
          playlistOwnerId: playlist.owner?.id,
          willShow,
          reason: willShow 
            ? 'プリキュア関連として表示' 
            : isPrecureRelated 
              ? 'プリキュア関連だが条件不一致' 
              : 'プリキュア関連でない'
        })
      }
      
      return willShow
    })
  }

  // 表示切り替え関数（削除予定）
  const toggleShowAllPlaylists = () => {
    // 機能削除済み - 常にプリキュア専用フィルターのみ適用
  }

  // Spotifyプレイリスト一覧を取得（改善版）
  const loadSpotifyPlaylists = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('🎵 Loading Spotify playlists...')
      
      const response = await fetch('/api/spotify/playlists')
      const data = await response.json()
      
      if (!response.ok) {
        console.error('❌ Playlist API Error:', data)
        throw new Error(data.error || 'プレイリスト取得に失敗しました')
      }

      console.log('✅ Playlists loaded:', data.items?.length || 0)
      
      // 全プレイリストを保存
      const sortedPlaylists = data.items.sort((a, b) => 
        new Date(b.created_at || 0) - new Date(a.created_at || 0)
      )
      setAllPlaylists(sortedPlaylists)
      
      // フィルタリング処理
      const filteredPlaylists = getFilteredPlaylists(sortedPlaylists)
      setPlaylists(filteredPlaylists)
      
      console.log('🎵 Filtered playlists:', {
        total: data.items.length,
        filtered: filteredPlaylists.length
      })
      
    } catch (error) {
      console.error('❌ Load playlists error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Spotify認証
  const connectSpotify = () => {
    console.log('🔐 Starting Spotify authentication...')
    signIn('spotify')
  }

  // Spotify認証解除
  const disconnectSpotify = () => {
    console.log('🔓 Disconnecting Spotify...')
    signOut()
  }

  // プリキュア楽曲を検索
  const searchPrecureTracks = async (query) => {
    if (!query.trim()) return

    setSearchLoading(true)
    try {
      setError('')
      
      console.log('🔍 Searching tracks:', query)
      
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}&limit=20`)
      const data = await response.json()
      
      if (!response.ok) {
        console.error('❌ Search API Error:', data)
        throw new Error(data.error || '検索に失敗しました')
      }

      console.log('✅ Search results:', data.tracks.items.length)
      setSearchResults(data.tracks.items)
    } catch (error) {
      console.error('❌ Search error:', error)
      setError(error.message)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  // プレイリスト作成（改善版）
  const createPlaylist = async () => {
    try {
      if (!newPlaylist.name.trim()) {
        alert('プレイリスト名を入力してください')
        return
      }

      setLoading(true)
      setError('')
      
      // 説明文にプリキュアプロフィールメーカーの署名を追加
      const finalDescription = newPlaylist.description.trim() 
        ? `${newPlaylist.description}\n\n--- プリキュアプロフィールメーカーにて作成 ---`
        : 'プリキュアプロフィールメーカーにて作成'
      
      const playlistData = {
        ...newPlaylist,
        description: finalDescription
      }
      
      console.log('🎵 Creating playlist:', playlistData)
      
      const response = await fetch('/api/spotify/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(playlistData)
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ Create playlist error:', data)
        throw new Error(data.error || 'プレイリスト作成に失敗しました')
      }

      console.log('✅ Playlist created:', data)

      // 新しく作成されたプレイリストを既存のリストに追加
      // これにより、再読み込みを待たずに即座に表示される
      setPlaylists(prev => [data, ...prev])
      setAllPlaylists(prev => [data, ...prev])
      
      // モーダルを閉じてフォームをリセット
      setShowCreateModal(false)
      setNewPlaylist({ name: '', description: '', isPublic: true })
      
      alert('プレイリストを作成しました！✨\n\n※説明文に「プリキュアプロフィールメーカーにて作成」を自動追加しました')
      
      // 背景でプレイリスト一覧を再読み込み（データの整合性確保）
      setTimeout(() => {
        loadSpotifyPlaylists()
      }, 1000)
      
    } catch (error) {
      console.error('❌ Create playlist error:', error)
      setError(error.message)
      alert('プレイリストの作成に失敗しました: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 楽曲をプレイリストに追加（デバッグ強化版）
  const addTrackToPlaylist = async (track) => {
    if (!currentPlaylist) {
      alert('プレイリストを選択してください')
      return
    }

    try {
      setLoading(true)
      setError('') // エラーをクリア
      
      console.log('=== Adding Track to Playlist ===')
      console.log('Current Playlist:', currentPlaylist)
      console.log('Track to add:', track)
      console.log('Track URI:', track.uri)
      console.log('Playlist ID:', currentPlaylist.id)
      
      const apiUrl = `/api/spotify/playlists/${currentPlaylist.id}/tracks`
      console.log('API URL:', apiUrl)
      
      const requestBody = {
        trackUris: [track.uri]
      }
      console.log('Request body:', requestBody)
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      // レスポンスのContent-Typeをチェック
      const contentType = response.headers.get('content-type')
      console.log('Response Content-Type:', contentType)
      
      let data
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // HTMLが返ってきた場合の処理
        const textResponse = await response.text()
        console.error('❌ Received HTML instead of JSON:', textResponse.substring(0, 500))
        throw new Error(`APIからHTMLが返されました。エンドポイント（${apiUrl}）が存在しない可能性があります。`)
      }

      console.log('Response data:', data)

      if (!response.ok) {
        console.error('❌ API Error Response:', data)
        throw new Error(data.error || `楽曲追加に失敗しました (${response.status})`)
      }

      console.log('✅ Track added successfully')
      alert('楽曲を追加しました！✨')
      
      // プレイリスト一覧を再読み込み
      await loadSpotifyPlaylists()
    } catch (error) {
      console.error('❌ Add track error:', error)
      setError(error.message)
      
      // より詳細なエラーメッセージ
      if (error.message.includes('<!DOCTYPE')) {
        alert('APIエンドポイントが見つかりません。ファイル構成を確認してください。\n\n必要なファイル:\napp/api/spotify/playlists/[playlistId]/tracks/route.js')
      } else {
        alert(`楽曲の追加に失敗しました: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // プレイリスト内の楽曲を取得
  const loadPlaylistTracks = async (playlist) => {
    try {
      setTracksLoading(true)
      setError('')
      
      console.log('🎵 Loading tracks for playlist:', playlist.id)
      
      const response = await fetch(`/api/spotify/playlists/${playlist.id}/tracks`)
      const data = await response.json()
      
      if (!response.ok) {
        console.error('❌ Playlist tracks API Error:', data)
        throw new Error(data.error || '楽曲の取得に失敗しました')
      }

      console.log('✅ Playlist tracks loaded:', data.items?.length || 0)
      setPlaylistTracks(data.items || [])
      setSelectedPlaylistForTracks(playlist)
      setShowPlaylistTracks(true)
      
    } catch (error) {
      console.error('❌ Load playlist tracks error:', error)
      setError(error.message)
      alert('プレイリストの楽曲取得に失敗しました: ' + error.message)
    } finally {
      setTracksLoading(false)
    }
  }

  // プレイリスト楽曲表示を閉じる
  const closePlaylistTracks = () => {
    setShowPlaylistTracks(false)
    setSelectedPlaylistForTracks(null)
    setPlaylistTracks([])
  }

  // デバッグ情報表示コンポーネント（開発時のみ表示）
  const PlaylistDebugInfo = () => {
    const [showDebug, setShowDebug] = useState(false)
    
    if (process.env.NODE_ENV !== 'development') return null
    
    return (
      <div className="bg-gray-100 rounded-lg p-4 mt-4">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-sm text-gray-600 hover:text-gray-800 mb-2"
        >
          🔧 デバッグ情報 {showDebug ? '▼' : '▶'}
        </button>
        
        {showDebug && (
          <div className="text-xs space-y-2 font-mono">
            <div>
              <strong>セッション状態:</strong>
              <div className="ml-2">
                <div>Status: {status}</div>
                <div>Connected: {isSpotifyConnected ? 'Yes' : 'No'}</div>
                <div>User ID: {spotifySession?.user?.id || 'N/A'}</div>
                <div>Access Token: {spotifySession?.accessToken ? 'EXISTS' : 'MISSING'}</div>
              </div>
            </div>
            
            <div>
              <strong>プレイリスト状態:</strong>
              <div className="ml-2">
                <div>全プレイリスト数: {allPlaylists.length}</div>
                <div>表示プレイリスト数: {playlists.length}</div>
                <div>現在選択中: {currentPlaylist?.name || 'なし'}</div>
              </div>
            </div>
            
            <div>
              <strong>最近の操作:</strong>
              <div className="ml-2">
                <div>最後の読み込み: {new Date().toLocaleTimeString()}</div>
                <div>エラー: {error || 'なし'}</div>
              </div>
            </div>
            
            {allPlaylists.length > 0 && (
              <div>
                <strong>プレイリスト一覧:</strong>
                <div className="ml-2 max-h-32 overflow-y-auto">
                  {allPlaylists.map((playlist, index) => (
                    <div key={playlist.id} className="text-xs">
                      {index + 1}. {playlist.name} ({playlist.owner?.display_name})
                      {playlists.find(p => p.id === playlist.id) ? ' ✅' : ' ❌'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center space-x-2">
              <Music size={28} className="text-indigo-500" />
              <span>プリキュア音楽プレイリスト</span>
            </h1>
            <p className="text-gray-600">Spotifyでお気に入りのプリキュア楽曲を管理・共有しましょう 🎵</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-500">{playlists.length}</div>
              <div className="text-sm text-gray-600">個のプレイリスト</div>
            </div>
            
            {/* 認証・操作ボタン */}
            <div className="flex space-x-2">
              {!isSpotifyConnected ? (
                <button
                  onClick={connectSpotify}
                  disabled={status === 'loading'}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <Music size={16} />
                  <span>{status === 'loading' ? '連携中...' : 'Spotify連携'}</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <div className="flex items-center space-x-3 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Spotify連携済み</span>
                    <button
                      onClick={disconnectSpotify}
                      className="text-green-600 hover:text-green-800 ml-2"
                      title="連携を解除"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>新規作成</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle size={20} className="text-red-500" />
            <div>
              <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-600 ml-auto"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* プレイリスト楽曲表示モーダル */}
      {showPlaylistTracks && selectedPlaylistForTracks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* ヘッダー */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  {selectedPlaylistForTracks.images && selectedPlaylistForTracks.images[0] ? (
                    <img
                      src={selectedPlaylistForTracks.images[0].url}
                      alt={selectedPlaylistForTracks.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                      <Music size={32} className="text-white" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{selectedPlaylistForTracks.name}</h2>
                    <p className="text-white/80 text-sm">
                      {playlistTracks.length}曲 • {selectedPlaylistForTracks.owner?.display_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closePlaylistTracks}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              {selectedPlaylistForTracks.description && (
                <p className="text-white/80 text-sm mt-2 line-clamp-2">
                  {selectedPlaylistForTracks.description}
                </p>
              )}
            </div>

            {/* 楽曲一覧 */}
            <div className="flex-1 overflow-y-auto p-6">
              {tracksLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <RefreshCw className="animate-spin mx-auto mb-4 text-blue-500" size={32} />
                    <p className="text-gray-600">楽曲を読み込み中...</p>
                  </div>
                </div>
              ) : playlistTracks.length > 0 ? (
                <div className="space-y-3">
                  {playlistTracks.map((item, index) => {
                    const track = item.track
                    if (!track) return null // 削除された楽曲などをスキップ
                    
                    return (
                      <div
                        key={`${track.id}-${index}`}
                        className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {/* 順番 */}
                        <div className="w-8 text-center">
                          <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                        </div>

                        {/* アルバムアート */}
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {track.album?.images?.[0] ? (
                            <img
                              src={track.album.images[0].url}
                              alt={track.album.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music size={24} className="text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* 楽曲情報 */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{track.name}</h4>
                          <p className="text-sm text-gray-600 truncate">
                            {track.artists?.map(artist => artist.name).join(', ') || '不明なアーティスト'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {track.album?.name || '不明なアルバム'} • {formatDuration(track.duration_ms)}
                          </p>
                        </div>

                        {/* 追加日時 */}
                        <div className="text-right text-xs text-gray-500 flex-shrink-0">
                          <p>{formatDate(item.added_at)}</p>
                        </div>

                        {/* アクションボタン */}
                        <div className="flex space-x-2 flex-shrink-0">
                          {/* プレビュー再生 */}
                          {track.preview_url && (
                            <button
                              onClick={() => {
                                const audio = new Audio(track.preview_url)
                                audio.play().catch(e => console.log('プレビュー再生エラー:', e))
                              }}
                              className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                              title="プレビュー再生"
                            >
                              <Play size={20} />
                            </button>
                          )}

                          {/* Spotifyで開く */}
                          <a
                            href={track.external_urls?.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                            title="Spotifyで開く"
                          >
                            <ExternalLink size={20} />
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Music size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">楽曲がありません</h3>
                  <p className="text-gray-500 text-sm">
                    このプレイリストには楽曲が追加されていません
                  </p>
                </div>
              )}

              {/* プレイリスト統計 */}
              {playlistTracks.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">📊 プレイリスト統計</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{playlistTracks.length}</div>
                        <div className="text-gray-600">楽曲数</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {Math.floor(playlistTracks.reduce((total, item) => total + (item.track?.duration_ms || 0), 0) / 60000)}
                        </div>
                        <div className="text-gray-600">分</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {new Set(playlistTracks.map(item => item.track?.artists?.[0]?.name).filter(Boolean)).size}
                        </div>
                        <div className="text-gray-600">アーティスト</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">
                          {new Set(playlistTracks.map(item => item.track?.album?.name).filter(Boolean)).size}
                        </div>
                        <div className="text-gray-600">アルバム</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* フッター */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  最後の更新: {formatDate(selectedPlaylistForTracks.snapshot_id)}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setCurrentPlaylist(selectedPlaylistForTracks)
                      setShowSearchModal(true)
                      closePlaylistTracks()
                    }}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>楽曲追加</span>
                  </button>
                  <a
                    href={selectedPlaylistForTracks.external_urls?.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <ExternalLink size={16} />
                    <span>Spotifyで開く</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* セッションエラーの場合の再認証提案 */}
      {spotifySession?.error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle size={20} className="text-yellow-500" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">認証エラー</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Spotifyトークンに問題があります。再度連携を行ってください。
              </p>
            </div>
            <button
              onClick={connectSpotify}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
            >
              再連携
            </button>
          </div>
        </div>
      )}

      {/* Spotify未接続の場合の案内 */}
      {!isSpotifyConnected && (
        <div className="bg-gradient-to-r from-green-50 to-indigo-50 rounded-2xl p-6 border border-green-100">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <Music size={32} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Spotify連携でもっと便利に！</h3>
              <p className="text-gray-600 text-sm mb-4">
                Spotifyと連携することで、プリキュア楽曲の検索・追加・プレイリスト作成が簡単にできます
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• プリキュア楽曲を直接検索</li>
                <li>• Spotifyプレイリストとして保存</li>
                <li>• 楽曲情報の自動取得</li>
                <li>• 他のファンとプレイリスト共有</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* プレイリスト一覧 */}
      {isSpotifyConnected && (
        <div className="space-y-6">
          {loading && playlists.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="animate-spin mx-auto mb-4 text-indigo-500" size={32} />
              <p className="text-gray-600">プレイリストを読み込み中...</p>
            </div>
          ) : playlists.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {playlists.map((playlist) => (
                <div key={playlist.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {/* プレイリストカバー */}
                  <div className="h-48 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 relative">
                    {playlist.images && playlist.images[0] ? (
                      <img
                        src={playlist.images[0].url}
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Music size={48} className="text-white/50" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <a
                        href={playlist.external_urls?.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500/80 hover:bg-green-600 text-white p-2 rounded-full transition-colors"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>

                  {/* プレイリスト情報 */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-800 truncate flex-1">
                        {playlist.name}
                      </h3>
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full ml-2">
                        Spotify
                      </span>
                    </div>
                    
                    {playlist.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {playlist.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <Music size={14} />
                          <span>{playlist.tracks?.total || 0}曲</span>
                        </span>
                        {playlist.public && (
                          <span className="flex items-center space-x-1">
                            <Heart size={14} />
                            <span>公開</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <User size={14} />
                        <span>{playlist.owner?.display_name}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => loadPlaylistTracks(playlist)}
                        disabled={tracksLoading}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        <Music size={16} />
                        <span>{tracksLoading ? '読み込み中...' : '楽曲を見る'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentPlaylist(playlist)
                          setShowSearchModal(true)
                        }}
                        className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <Plus size={16} />
                        <span>楽曲追加</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <Music size={40} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">プリキュア関連プレイリストがありません</h2>
              <p className="text-gray-600 mb-6">
                プリキュア楽曲のプレイリストを作成しましょう！
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-colors"
              >
                プレイリストを作成
              </button>
            </div>
          )}
        </div>
      )}

      {/* デバッグ情報（開発環境のみ） */}
      <PlaylistDebugInfo />

      {/* プレイリスト作成モーダル */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">新しいプレイリスト</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プレイリスト名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPlaylist.name}
                  onChange={(e) => setNewPlaylist({...newPlaylist, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="例：プリキュア お気に入りOP集"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  ヒント: 「プリキュア」「スマイル」「アニソン」などのキーワードを含めると見つけやすくなります
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">説明</label>
                <textarea
                  value={newPlaylist.description}
                  onChange={(e) => setNewPlaylist({...newPlaylist, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="3"
                  placeholder="プリキュアの好きな楽曲をまとめたプレイリストです..."
                />
                <p className="text-xs text-blue-600 mt-1">
                  💡 説明文に「プリキュアプロフィールメーカーにて作成」が自動追加されます
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newPlaylist.isPublic}
                    onChange={(e) => setNewPlaylist({...newPlaylist, isPublic: e.target.checked})}
                    className="rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">他のユーザーに公開する</span>
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={createPlaylist}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors disabled:opacity-50"
                >
                  {loading ? '作成中...' : '作成'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 楽曲検索モーダル */}
      {showSearchModal && currentPlaylist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">プリキュア楽曲検索</h2>
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-white/80 text-sm mt-1">
                「{currentPlaylist.name}」に追加する楽曲を検索
              </p>
            </div>

            <div className="p-6 flex-1 flex flex-col overflow-hidden">
              {/* 検索フィールド */}
              <div className="mb-6">
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchPrecureTracks(searchQuery)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="楽曲名、アーティスト名で検索..."
                    />
                  </div>
                  <button
                    onClick={() => searchPrecureTracks(searchQuery)}
                    disabled={searchLoading || !searchQuery.trim()}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {searchLoading ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
                    <span>{searchLoading ? '検索中...' : '検索'}</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ※ プリキュア関連楽曲のみ表示されます
                </p>
              </div>

              {/* 検索結果 */}
              <div className="flex-1 overflow-y-auto">
                {searchLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <RefreshCw className="animate-spin mx-auto mb-4 text-indigo-500" size={32} />
                      <p className="text-gray-600">プリキュア楽曲を検索中...</p>
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {/* アルバムアート */}
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {track.album.images[0] ? (
                            <img
                              src={track.album.images[0].url}
                              alt={track.album.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music size={24} className="text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* 楽曲情報 */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{track.name}</h4>
                          <p className="text-sm text-gray-600 truncate">
                            {track.artists.map(artist => artist.name).join(', ')}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {track.album.name} • {formatDuration(track.duration_ms)}
                          </p>
                        </div>

                        {/* プレビュー再生ボタン */}
                        {track.preview_url && (
                          <button
                            onClick={() => {
                              const audio = new Audio(track.preview_url)
                              audio.play().catch(e => console.log('プレビュー再生エラー:', e))
                            }}
                            className="p-2 text-gray-400 hover:text-indigo-500 transition-colors"
                            title="プレビュー再生"
                          >
                            <Play size={20} />
                          </button>
                        )}

                        {/* 追加ボタン */}
                        <button
                          onClick={() => addTrackToPlaylist(track)}
                          disabled={loading}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
                        >
                          <Plus size={16} />
                          <span>追加</span>
                        </button>

                        {/* Spotifyで開く */}
                        <a
                          href={track.external_urls.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                          title="Spotifyで開く"
                        >
                          <ExternalLink size={20} />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="text-center py-16">
                    <Music size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">楽曲が見つかりませんでした</h3>
                    <p className="text-gray-500 text-sm">
                      別のキーワードで検索してみてください
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Search size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">プリキュア楽曲を検索</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      楽曲名やアーティスト名を入力して検索してください
                    </p>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>検索例：</p>
                      <p>• "DANZEN"（楽曲名）</p>
                      <p>• "五條真由美"（アーティスト名）</p>
                      <p>• "オープニング"（楽曲タイプ）</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 使用方法ガイド */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🎵 Spotify連携プレイリストの使い方</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-indigo-600 mb-2">✨ 楽曲管理</h4>
            <ul className="space-y-1">
              <li>• Spotifyからプリキュア楽曲を直接検索</li>
              <li>• プレビュー再生で楽曲確認</li>
              <li>• アルバムアート・詳細情報表示</li>
              <li>• 自動的にプリキュア関連楽曲をフィルタリング</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-600 mb-2">🎶 Spotify連携</h4>
            <ul className="space-y-1">
              <li>• 実際のSpotifyプレイリストを作成・管理</li>
              <li>• Spotifyアプリでそのまま再生可能</li>
              <li>• 楽曲の追加・削除をリアルタイム反映</li>
              <li>• 他のファンとプレイリスト共有</li>
            </ul>
          </div>
        </div>
        
        {!isSpotifyConnected && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Music size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">まずはSpotifyと連携しましょう</p>
                <p className="text-xs text-gray-600">無料のSpotifyアカウントでもご利用いただけます</p>
              </div>
              <button
                onClick={connectSpotify}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                連携開始
              </button>
            </div>
          </div>
        )}
      </div>

      {/* プリキュア専用フィルターについて */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 プリキュア専用フィルターについて</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">✅ 表示される条件（厳密）</h4>
            <ul className="space-y-1">
              <li>• プレイリスト名に<strong>プリキュア関連キーワード</strong></li>
              <li>• 説明文に<strong>プリキュア関連キーワード</strong></li>
              <li>• 「プリキュア」「キュア」「シリーズ名」など</li>
            </ul>
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800">
              <strong>厳密フィルター:</strong><br/>
              ・プリキュア関連キーワードが<strong>必須</strong><br/>
              ・一般的なキーワードは除外<br/>
              ・楽曲内容ではなく名前・説明のみ判定
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">🎯 確実に表示される名前</h4>
            <ul className="space-y-1">
              <li>• 「<strong>プリキュア</strong> お気に入り」</li>
              <li>• 「<strong>スマイル</strong>楽曲集」</li>
              <li>• 「<strong>キュア</strong>変身ソング」</li>
              <li>• 「<strong>ハートキャッチ</strong> 名曲」</li>
              <li>• 「<strong>ふたりは</strong>プリキュア」</li>
              <li>• 「<strong>hugっと</strong>メドレー」</li>
            </ul>
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded text-xs text-green-800">
              <strong>自動認識機能:</strong><br/>
              プレイリスト作成時に説明文へ<br/>
              「プリキュアプロフィールメーカーにて作成」<br/>
              が自動追加され、確実に表示されます
            </div>
          </div>
        </div>
        
        <div className="mt-4 space-y-3">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">🔍 使用されるキーワード一覧</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>基本:</strong> プリキュア、precure、pretty cure</p>
              <p><strong>シリーズ:</strong> ふたりは、スプラッシュ、スマイル、ハートキャッチ、hugっと、トロピカル、etc.</p>
              <p><strong>専用語:</strong> キュア、cure</p>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ 表示されない場合</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>1. <strong>プレイリスト名を変更</strong>: 上記キーワードを必ず含める</p>
              <p>2. <strong>説明文にキーワード追加</strong>: 「プリキュア楽曲まとめ」など</p>
              <p>3. <strong>Spotifyで直接確認</strong>: Spotifyアプリで全プレイリストを確認可能</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}