// components/LocalPlaylist.jsx - Part 1: インポート文と状態管理
'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Music, Heart, Star, Play, Plus, X, Trash2, Search, RefreshCw, ExternalLink, User, AlertCircle, Edit, Save, Copy, Share, Upload, CheckCircle, Download } from 'lucide-react'
import { supabase } from '../app/page'

export default function LocalPlaylist({ session, profile }) {
  const { data: spotifySession, status } = useSession()
  const [playlists, setPlaylists] = useState([])
  const [currentPlaylist, setCurrentPlaylist] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState('')
  
  // プレイリスト詳細表示用
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  
  // 新規プレイリスト作成用
  const [newPlaylist, setNewPlaylist] = useState({
    name: '',
    description: '',
    isPublic: true
  })

  // 編集モード
  const [editingPlaylist, setEditingPlaylist] = useState(null)

  // インポート機能用の状態
  const [importUrl, setImportUrl] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importResults, setImportResults] = useState(null)

  // エクスポート機能用の状態
  const [exportPlaylist, setExportPlaylist] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [spotifyAuth, setSpotifyAuth] = useState(null)
  const [exportMakePublic, setExportMakePublic] = useState(false)

  // useEffect hooks
  useEffect(() => {
    if (session?.user?.id) {
      loadLocalPlaylists()
    }
  }, [session])

  // Spotify認証状態の監視
  useEffect(() => {
    if (spotifySession) {
      checkSpotifyAuth()
    }
  }, [spotifySession])

  // Spotify認証状態を確認
  const checkSpotifyAuth = async () => {
    try {
      const response = await fetch('/api/spotify/auth')
      const data = await response.json()
      setSpotifyAuth(data)
    } catch (error) {
      console.error('Spotify auth check error:', error)
      setSpotifyAuth({ authenticated: false, error: '認証確認に失敗しました' })
    }
  }

  // ローカルプレイリスト一覧を取得
  const loadLocalPlaylists = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('📂 Loading local playlists...')
      
      const { data, error } = await supabase
        .from('local_playlists')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('✅ Local playlists loaded:', data?.length || 0)
      setPlaylists(data || [])
      
    } catch (error) {
      console.error('❌ Load playlists error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Spotify Web API（認証不要）で楽曲検索
  const searchTracks = async (query) => {
    if (!query.trim()) return

    setSearchLoading(true)
    try {
      setError('')
      
      console.log('🔍 Searching tracks:', query)
      
      // Client Credentials Flowを使用してアクセストークンを取得
      const tokenResponse = await fetch('/api/spotify/token', {
        method: 'POST'
      })
      
      if (!tokenResponse.ok) {
        throw new Error('Spotifyアクセストークンの取得に失敗しました')
      }
      
      const { access_token } = await tokenResponse.json()
      
      // プリキュア関連キーワードを組み合わせて検索
      const precureKeywords = ['プリキュア', 'PreCure', 'Pretty Cure']
      const enhancedQuery = `${query} ${precureKeywords.join(' OR ')}`
      
      const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(enhancedQuery)}&type=track&limit=50&market=JP`
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      })
      
      if (!searchResponse.ok) {
        throw new Error('楽曲検索に失敗しました')
      }
      
      const data = await searchResponse.json()
      
      // プリキュア関連楽曲をフィルタリング
      const precureFilterKeywords = [
        'プリキュア', 'precure', 'pretty cure',
        'ふたりはプリキュア', 'スプラッシュスター', 'yes!プリキュア5',
        'フレッシュプリキュア', 'ハートキャッチプリキュア', 'スイートプリキュア',
        'スマイルプリキュア', 'ドキドキプリキュア', 'ハピネスチャージプリキュア',
        'プリンセスプリキュア', '魔法つかいプリキュア', 'アラモード',
        'hugっとプリキュア', 'スタートゥインクルプリキュア',
        'ヒーリングっどプリキュア', 'トロピカルージュプリキュア',
        'デリシャスパーティプリキュア', 'ひろがるスカイプリキュア',
        'わんだふるぷりきゅあ', 'キュア', 'cure'
      ]
      
      const filteredTracks = data.tracks.items.filter(track => {
        const trackName = track.name.toLowerCase()
        const artistNames = track.artists.map(artist => artist.name.toLowerCase()).join(' ')
        const albumName = track.album.name.toLowerCase()
        
        return precureFilterKeywords.some(keyword => 
          trackName.includes(keyword.toLowerCase()) ||
          artistNames.includes(keyword.toLowerCase()) ||
          albumName.includes(keyword.toLowerCase())
        )
      })

      console.log('✅ Search results filtered:', filteredTracks.length)
      setSearchResults(filteredTracks)
    } catch (error) {
      console.error('❌ Search error:', error)
      setError(error.message)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  // ローカルプレイリスト作成
  const createPlaylist = async () => {
    try {
      if (!newPlaylist.name.trim()) {
        alert('プレイリスト名を入力してください')
        return
      }

      setLoading(true)
      setError('')
      
      const playlistData = {
        user_id: session.user.id,
        name: newPlaylist.name.trim(),
        description: newPlaylist.description.trim(),
        is_public: newPlaylist.isPublic,
        tracks: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('🎵 Creating local playlist:', playlistData)
      
      const { data, error } = await supabase
        .from('local_playlists')
        .insert([playlistData])
        .select()
        .single()

      if (error) throw error

      console.log('✅ Local playlist created:', data)
      
      // プレイリストリストに追加
      setPlaylists(prev => [data, ...prev])
      
      // モーダルを閉じてフォームをリセット
      setShowCreateModal(false)
      setNewPlaylist({ name: '', description: '', isPublic: true })
      
      alert('プレイリストを作成しました！✨')
      
    } catch (error) {
      console.error('❌ Create playlist error:', error)
      setError(error.message)
      alert('プレイリストの作成に失敗しました: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 楽曲をプレイリストに追加
  const addTrackToPlaylist = async (track) => {
    if (!currentPlaylist) {
      alert('プレイリストを選択してください')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      // 楽曲データを整形
      const trackData = {
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
      }
      
      // 既存の楽曲リストに追加（重複チェック）
      const currentTracks = currentPlaylist.tracks || []
      const isDuplicate = currentTracks.some(existingTrack => existingTrack.id === track.id)
      
      if (isDuplicate) {
        alert('この楽曲は既にプレイリストに追加されています')
        return
      }
      
      const updatedTracks = [...currentTracks, trackData]
      
      const { error } = await supabase
        .from('local_playlists')
        .update({ 
          tracks: updatedTracks,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentPlaylist.id)

      if (error) throw error

      console.log('✅ Track added to local playlist')
      
      // 状態を更新
      const updatedPlaylist = { ...currentPlaylist, tracks: updatedTracks }
      setCurrentPlaylist(updatedPlaylist)
      setPlaylists(prev => prev.map(p => 
        p.id === currentPlaylist.id ? updatedPlaylist : p
      ))
      
      // 選択中のプレイリストも更新
      if (selectedPlaylist?.id === currentPlaylist.id) {
        setSelectedPlaylist(updatedPlaylist)
      }
      
      alert('楽曲を追加しました！✨')
    } catch (error) {
      console.error('❌ Add track error:', error)
      setError(error.message)
      alert(`楽曲の追加に失敗しました: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Spotifyプレイリストをインポート
  const importSpotifyPlaylist = async () => {
    if (!importUrl.trim()) {
      alert('Spotify プレイリストURLを入力してください')
      return
    }

    try {
      setImportLoading(true)
      setError('')
      
      console.log('📥 Importing Spotify playlist:', importUrl)
      
      const response = await fetch('/api/spotify/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ spotifyUrl: importUrl })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'インポートに失敗しました')
      }

      console.log('✅ Import successful:', data)
      setImportResults(data)
      
      if (data.filteredCount === 0) {
        alert('プリキュア関連楽曲が見つかりませんでした。\n別のプレイリストをお試しください。')
      }
      
    } catch (error) {
      console.error('❌ Import error:', error)
      setError(error.message)
      alert(`インポートに失敗しました: ${error.message}`)
    } finally {
      setImportLoading(false)
    }
  }

  // ローカルプレイリストをSpotifyにエクスポート
  const exportToSpotify = async () => {
    if (!exportPlaylist) {
      alert('エクスポートするプレイリストを選択してください')
      return
    }

    if (!spotifyAuth?.authenticated) {
      alert('Spotifyへのエクスポートには認証が必要です。\nまずSpotifyと連携してください。')
      return
    }

    try {
      setExportLoading(true)
      setError('')
      
      console.log('📤 Exporting to Spotify:', exportPlaylist.name)
      
      const response = await fetch('/api/spotify/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          localPlaylist: exportPlaylist,
          makePublic: exportMakePublic
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'エクスポートに失敗しました')
      }

      console.log('✅ Export successful:', data)
      
      // 成功メッセージ
      const message = [
        `プレイリスト「${exportPlaylist.name}」をSpotifyにエクスポートしました！`,
        '',
        `✅ 追加された楽曲: ${data.addedTracks}曲`,
        data.skippedTracks > 0 ? `⚠️ スキップされた楽曲: ${data.skippedTracks}曲` : '',
        '',
        'Spotifyアプリで確認できます ✨'
      ].filter(line => line !== '').join('\n')
      
      alert(message)
      
      // モーダルを閉じる
      setShowExportModal(false)
      setExportPlaylist(null)
      setExportMakePublic(false)
      
    } catch (error) {
      console.error('❌ Export error:', error)
      setError(error.message)
      alert(`エクスポートに失敗しました: ${error.message}`)
    } finally {
      setExportLoading(false)
    }
  }

  // Spotify認証を開始
  const connectSpotify = () => {
    console.log('🔐 Starting Spotify authentication...')
    signIn('spotify')
  }

  // Spotify認証を解除
  const disconnectSpotify = () => {
    console.log('🔓 Disconnecting Spotify...')
    signOut()
    setSpotifyAuth(null)
  }

  // インポート結果から新しいプレイリストを作成
  const createPlaylistFromImport = async (importData, newPlaylistName) => {
    if (!importData || !importData.tracks || importData.tracks.length === 0) {
      alert('インポートする楽曲がありません')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const playlistData = {
        user_id: session.user.id,
        name: newPlaylistName || `${importData.playlist.name} (インポート)`,
        description: `Spotifyプレイリスト「${importData.playlist.name}」からインポート\n\n${importData.playlist.description || ''}`.trim(),
        is_public: false, // デフォルトは非公開
        tracks: importData.tracks,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('🎵 Creating playlist from import:', playlistData)
      
      const { data, error } = await supabase
        .from('local_playlists')
        .insert([playlistData])
        .select()
        .single()

      if (error) throw error

      console.log('✅ Imported playlist created:', data)
      
      // プレイリストリストに追加
      setPlaylists(prev => [data, ...prev])
      
      // モーダルを閉じる
      setShowImportModal(false)
      setImportUrl('')
      setImportResults(null)
      
      alert(`プレイリスト「${data.name}」を作成しました！\n${importData.tracks.length}曲のプリキュア楽曲をインポートしました。✨`)
      
    } catch (error) {
      console.error('❌ Create imported playlist error:', error)
      setError(error.message)
      alert('プレイリストの作成に失敗しました: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // インポート結果を既存プレイリストに追加
  const addImportToExistingPlaylist = async (importData, targetPlaylist) => {
    if (!importData || !importData.tracks || importData.tracks.length === 0) {
      alert('追加する楽曲がありません')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const currentTracks = targetPlaylist.tracks || []
      
      // 重複を除去しながら追加
      const newTracks = [...currentTracks]
      let addedCount = 0
      
      importData.tracks.forEach(track => {
        const isDuplicate = currentTracks.some(existingTrack => existingTrack.id === track.id)
        if (!isDuplicate) {
          newTracks.push(track)
          addedCount++
        }
      })
      
      if (addedCount === 0) {
        alert('すべての楽曲が既にプレイリストに追加されています')
        return
      }
      
      const { error } = await supabase
        .from('local_playlists')
        .update({ 
          tracks: newTracks,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetPlaylist.id)

      if (error) throw error

      console.log(`✅ Added ${addedCount} tracks to existing playlist`)
      
      // 状態を更新
      const updatedPlaylist = { ...targetPlaylist, tracks: newTracks }
      setPlaylists(prev => prev.map(p => 
        p.id === targetPlaylist.id ? updatedPlaylist : p
      ))
      
      // モーダルを閉じる
      setShowImportModal(false)
      setImportUrl('')
      setImportResults(null)
      
      alert(`プレイリスト「${targetPlaylist.name}」に${addedCount}曲を追加しました！\n（重複: ${importData.tracks.length - addedCount}曲）`)
      
    } catch (error) {
      console.error('❌ Add import to playlist error:', error)
      setError(error.message)
      alert('楽曲の追加に失敗しました: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 楽曲をプレイリストから削除
  const removeTrackFromPlaylist = async (trackId) => {
    if (!selectedPlaylist) return

    if (!confirm('この楽曲をプレイリストから削除しますか？')) {
      return
    }

    try {
      setLoading(true)
      
      const updatedTracks = selectedPlaylist.tracks.filter(track => track.id !== trackId)
      
      const { error } = await supabase
        .from('local_playlists')
        .update({ 
          tracks: updatedTracks,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPlaylist.id)

      if (error) throw error

      const updatedPlaylist = { ...selectedPlaylist, tracks: updatedTracks }
      setSelectedPlaylist(updatedPlaylist)
      setPlaylists(prev => prev.map(p => 
        p.id === selectedPlaylist.id ? updatedPlaylist : p
      ))
      
      alert('楽曲を削除しました')
    } catch (error) {
      console.error('❌ Remove track error:', error)
      alert('楽曲の削除に失敗しました: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // プレイリスト削除
  const deletePlaylist = async (playlistId) => {
    if (!confirm('このプレイリストを削除しますか？この操作は取り消せません。')) {
      return
    }

    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('local_playlists')
        .delete()
        .eq('id', playlistId)
        .eq('user_id', session.user.id)

      if (error) throw error

      setPlaylists(prev => prev.filter(p => p.id !== playlistId))
      
      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(null)
        setShowPlaylistModal(false)
      }
      
      if (currentPlaylist?.id === playlistId) {
        setCurrentPlaylist(null)
      }
      
      alert('プレイリストを削除しました')
    } catch (error) {
      console.error('❌ Delete playlist error:', error)
      alert('プレイリストの削除に失敗しました: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // プレイリスト編集
  const updatePlaylist = async () => {
    if (!editingPlaylist) return

    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('local_playlists')
        .update({
          name: editingPlaylist.name.trim(),
          description: editingPlaylist.description.trim(),
          is_public: editingPlaylist.is_public,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPlaylist.id)
        .eq('user_id', session.user.id)

      if (error) throw error

      // 状態を更新
      setPlaylists(prev => prev.map(p => 
        p.id === editingPlaylist.id ? editingPlaylist : p
      ))
      
      if (selectedPlaylist?.id === editingPlaylist.id) {
        setSelectedPlaylist(editingPlaylist)
      }
      
      setEditingPlaylist(null)
      alert('プレイリストを更新しました！')
    } catch (error) {
      console.error('❌ Update playlist error:', error)
      alert('プレイリストの更新に失敗しました: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // プレイリスト詳細を開く
  const openPlaylistDetail = (playlist) => {
    setSelectedPlaylist(playlist)
    setShowPlaylistModal(true)
  }

  // プレイリスト詳細を閉じる
  const closePlaylistDetail = () => {
    setShowPlaylistModal(false)
    setSelectedPlaylist(null)
    setEditingPlaylist(null)
  }

  // プレイリストをコピー
  const copyPlaylistUrl = async (playlist) => {
    const url = `${window.location.origin}/?playlist=${playlist.id}`
    try {
      await navigator.clipboard.writeText(url)
      alert('プレイリストURLをコピーしました！')
    } catch (error) {
      console.error('Copy error:', error)
      alert('URLのコピーに失敗しました')
    }
  }

  // 時間フォーマット
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 日付フォーマット
  const formatDate = (dateString) => {
    if (!dateString) return '不明'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return '1日前'
    if (diffDays < 7) return `${diffDays}日前`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`
    return `${Math.floor(diffDays / 365)}年前`
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center space-x-2">
              <Music size={28} className="text-indigo-500" />
              <span>プリキュア楽曲プレイリスト</span>
            </h1>
            <p className="text-gray-600">お気に入りのプリキュア楽曲をまとめて管理しましょう 🎵</p>
            <p className="text-sm text-blue-600 mt-1">
              ✨ Spotify連携不要！楽曲情報はSpotifyから自動取得
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-500">{playlists.length}</div>
              <div className="text-sm text-gray-600">個のプレイリスト</div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>新規作成</span>
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-teal-600 transition-colors flex items-center space-x-2"
              >
                <Music size={16} />
                <span>Spotifyから取り込み</span>
              </button>
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

      {/* プレイリスト一覧 */}
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
                  {/* 楽曲アルバムアートのモザイク表示 */}
                  {playlist.tracks && playlist.tracks.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1 h-full p-2">
                      {playlist.tracks.slice(0, 4).map((track, index) => (
                        <div key={index} className="bg-white/10 rounded-lg overflow-hidden">
                          {track.album?.images?.[0] ? (
                            <img
                              src={track.album.images[0].url}
                              alt={track.album.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music size={24} className="text-white/50" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Music size={48} className="text-white/50" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className="bg-white/20 text-white px-2 py-1 rounded-full text-xs font-medium">
                      ローカル
                    </span>
                  </div>
                </div>

                {/* プレイリスト情報 */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-800 truncate flex-1">
                      {playlist.name}
                    </h3>
                    {playlist.is_public && (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full ml-2">
                        公開
                      </span>
                    )}
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
                        <span>{playlist.tracks?.length || 0}曲</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <User size={14} />
                        <span>{profile?.display_name || 'あなた'}</span>
                      </span>
                    </div>
                    <span>{formatDate(playlist.updated_at)}</span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => openPlaylistDetail(playlist)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <Music size={16} />
                      <span>楽曲を見る</span>
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
                  <button
                    onClick={() => {
                      setExportPlaylist(playlist)
                      setShowExportModal(true)
                    }}
                    className="w-full mt-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <Upload size={16} />
                    <span>Spotifyにエクスポート</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <Music size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">プレイリストがありません</h2>
            <p className="text-gray-600 mb-6">
              プリキュア楽曲のプレイリストを作成しましょう！
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-colors"
              >
                プレイリストを作成
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-teal-600 transition-colors"
              >
                Spotifyから取り込み
              </button>
            </div>
          </div>
        )}
      </div>

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
                      onKeyPress={(e) => e.key === 'Enter' && searchTracks(searchQuery)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="楽曲名、アーティスト名で検索..."
                    />
                  </div>
                  <button
                    onClick={() => searchTracks(searchQuery)}
                    disabled={searchLoading || !searchQuery.trim()}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {searchLoading ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
                    <span>{searchLoading ? '検索中...' : '検索'}</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ※ プリキュア関連楽曲のみ表示されます（Spotify連携不要）
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

      {/* プレイリスト詳細モーダル */}
      {showPlaylistModal && selectedPlaylist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* ヘッダー */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4 flex-1">
                  {/* プレイリストカバー */}
                  <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 && selectedPlaylist.tracks[0].album?.images?.[0] ? (
                      <img
                        src={selectedPlaylist.tracks[0].album.images[0].url}
                        alt="プレイリストカバー"
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <Music size={32} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingPlaylist ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingPlaylist.name}
                          onChange={(e) => setEditingPlaylist({...editingPlaylist, name: e.target.value})}
                          className="text-xl font-bold bg-white/20 text-white placeholder-white/70 border border-white/30 rounded px-2 py-1 w-full"
                        />
                        <textarea
                          value={editingPlaylist.description || ''}
                          onChange={(e) => setEditingPlaylist({...editingPlaylist, description: e.target.value})}
                          className="text-sm bg-white/20 text-white placeholder-white/70 border border-white/30 rounded px-2 py-1 w-full resize-none"
                          rows="2"
                          placeholder="説明を入力..."
                        />
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl font-bold truncate">{selectedPlaylist.name}</h2>
                        <p className="text-white/80 text-sm">
                          {selectedPlaylist.tracks?.length || 0}曲 • {profile?.display_name || 'あなた'}
                        </p>
                        {selectedPlaylist.description && (
                          <p className="text-white/80 text-sm mt-1 line-clamp-2">
                            {selectedPlaylist.description}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {editingPlaylist ? (
                    <>
                      <button
                        onClick={updatePlaylist}
                        disabled={loading}
                        className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
                        title="保存"
                      >
                        <Save size={20} />
                      </button>
                      <button
                        onClick={() => setEditingPlaylist(null)}
                        className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
                        title="キャンセル"
                      >
                        <X size={20} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingPlaylist({...selectedPlaylist})}
                        className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
                        title="編集"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => copyPlaylistUrl(selectedPlaylist)}
                        className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
                        title="URLをコピー"
                      >
                        <Copy size={20} />
                      </button>
                      <button
                        onClick={() => {
                          setExportPlaylist(selectedPlaylist)
                          setShowExportModal(true)
                        }}
                        className="bg-green-500/80 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                        title="Spotifyにエクスポート"
                      >
                        <Upload size={20} />
                      </button>
                      <button
                        onClick={() => deletePlaylist(selectedPlaylist.id)}
                        className="bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                        title="削除"
                      >
                        <Trash2 size={20} />
                      </button>
                      <button
                        onClick={closePlaylistDetail}
                        className="text-white/80 hover:text-white transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 楽曲一覧 */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 ? (
                <div className="space-y-3">
                  {selectedPlaylist.tracks.map((track, index) => (
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
                        <p>{formatDate(track.added_at)}</p>
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

                        {/* 削除ボタン */}
                        <button
                          onClick={() => removeTrackFromPlaylist(track.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="プレイリストから削除"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Music size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">楽曲がありません</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    このプレイリストには楽曲が追加されていません
                  </p>
                  <button
                    onClick={() => {
                      setCurrentPlaylist(selectedPlaylist)
                      setShowSearchModal(true)
                      closePlaylistDetail()
                    }}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    楽曲を追加
                  </button>
                </div>
              )}

              {/* プレイリスト統計 */}
              {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">📊 プレイリスト統計</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{selectedPlaylist.tracks.length}</div>
                        <div className="text-gray-600">楽曲数</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {Math.floor(selectedPlaylist.tracks.reduce((total, track) => total + (track.duration_ms || 0), 0) / 60000)}
                        </div>
                        <div className="text-gray-600">分</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {new Set(selectedPlaylist.tracks.map(track => track.artists?.[0]?.name).filter(Boolean)).size}
                        </div>
                        <div className="text-gray-600">アーティスト</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">
                          {new Set(selectedPlaylist.tracks.map(track => track.album?.name).filter(Boolean)).size}
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
                  最後の更新: {formatDate(selectedPlaylist.updated_at)}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setCurrentPlaylist(selectedPlaylist)
                      setShowSearchModal(true)
                      closePlaylistDetail()
                    }}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>楽曲追加</span>
                  </button>
                  <button
                    onClick={() => {
                      setExportPlaylist(selectedPlaylist)
                      setShowExportModal(true)
                      closePlaylistDetail()
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Upload size={16} />
                    <span>Spotifyにエクスポート</span>
                  </button>
                  <button
                    onClick={() => copyPlaylistUrl(selectedPlaylist)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Share size={16} />
                    <span>共有</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spotifyプレイリストインポートモーダル */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* ヘッダー */}
            <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Spotifyプレイリスト取り込み</h2>
                  <p className="text-white/80 text-sm mt-1">
                    SpotifyのプレイリストURLから楽曲を取り込みます
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setImportUrl('')
                    setImportResults(null)
                  }}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {!importResults ? (
                /* URL入力画面 */
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      SpotifyプレイリストURLを入力
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          プレイリストURL <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="url"
                          value={importUrl}
                          onChange={(e) => setImportUrl(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="https://open.spotify.com/playlist/..."
                          disabled={importLoading}
                        />
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">📋 URL取得方法</h4>
                        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                          <li>Spotifyでプレイリストを開く</li>
                          <li>「•••」メニューをクリック</li>
                          <li>「プレイリストリンクをコピー」を選択</li>
                          <li>コピーしたURLを上記に貼り付け</li>
                        </ol>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">⚠️ 重要な注意</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• プリキュア関連楽曲のみが取り込まれます</li>
                          <li>• 公開プレイリストまたは自分のプレイリストが対象です</li>
                          <li>• 楽曲の詳細情報はSpotifyから自動取得されます</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowImportModal(false)
                        setImportUrl('')
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={importSpotifyPlaylist}
                      disabled={importLoading || !importUrl.trim()}
                      className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white py-2 rounded-lg hover:from-green-600 hover:to-teal-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {importLoading ? (
                        <>
                          <RefreshCw className="animate-spin" size={16} />
                          <span>取り込み中...</span>
                        </>
                      ) : (
                        <>
                          <Music size={16} />
                          <span>取り込み開始</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* インポート結果画面 */
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      取り込み結果
                    </h3>
                    
                    {/* プレイリスト情報 */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-4">
                        {importResults.playlist.images?.[0] && (
                          <img
                            src={importResults.playlist.images[0].url}
                            alt="プレイリストカバー"
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800">{importResults.playlist.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            作成者: {importResults.playlist.owner.display_name}
                          </p>
                          {importResults.playlist.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {importResults.playlist.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 統計情報 */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{importResults.originalCount}</div>
                        <div className="text-sm text-gray-600">元の楽曲数</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{importResults.filteredCount}</div>
                        <div className="text-sm text-gray-600">プリキュア楽曲</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round((importResults.filteredCount / importResults.originalCount) * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">一致率</div>
                      </div>
                    </div>

                    {importResults.filteredCount > 0 ? (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-3">取り込み対象楽曲 ({importResults.filteredCount}曲)</h4>
                        <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
                          {importResults.tracks.slice(0, 10).map((track, index) => (
                            <div key={track.id} className="flex items-center space-x-3 p-2 bg-white rounded border">
                              {track.album.images?.[0] && (
                                <img
                                  src={track.album.images[0].url}
                                  alt={track.album.name}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{track.name}</p>
                                <p className="text-xs text-gray-600 truncate">
                                  {track.artists.map(a => a.name).join(', ')}
                                </p>
                              </div>
                            </div>
                          ))}
                          {importResults.tracks.length > 10 && (
                            <div className="text-center text-sm text-gray-500 py-2">
                              他 {importResults.tracks.length - 10} 曲...
                            </div>
                          )}
                        </div>

                        {/* アクション選択 */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              どのように取り込みますか？
                            </label>
                            <div className="space-y-3">
                              {/* 新規プレイリスト作成 */}
                              <div className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-medium text-gray-800">新しいプレイリストを作成</h5>
                                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">推奨</span>
                                </div>
                                <input
                                  type="text"
                                  placeholder={`${importResults.playlist.name} (インポート)`}
                                  className="w-full px-3 py-2 border border-gray-300 rounded mb-3 text-sm"
                                  id="newPlaylistName"
                                />
                                <button
                                  onClick={() => {
                                    const nameInput = document.getElementById('newPlaylistName')
                                    const playlistName = nameInput.value.trim() || `${importResults.playlist.name} (インポート)`
                                    createPlaylistFromImport(importResults, playlistName)
                                  }}
                                  disabled={loading}
                                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition-colors disabled:opacity-50"
                                >
                                  {loading ? '作成中...' : '新規プレイリストを作成'}
                                </button>
                              </div>

                              {/* 既存プレイリストに追加 */}
                              {playlists.length > 0 && (
                                <div className="border border-gray-200 rounded-lg p-4">
                                  <h5 className="font-medium text-gray-800 mb-3">既存のプレイリストに追加</h5>
                                  <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded mb-3 text-sm"
                                    id="existingPlaylistSelect"
                                  >
                                    <option value="">選択してください</option>
                                    {playlists.map(playlist => (
                                      <option key={playlist.id} value={playlist.id}>
                                        {playlist.name} ({playlist.tracks?.length || 0}曲)
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => {
                                      const selectElement = document.getElementById('existingPlaylistSelect')
                                      const selectedId = selectElement.value
                                      if (!selectedId) {
                                        alert('プレイリストを選択してください')
                                        return
                                      }
                                      const targetPlaylist = playlists.find(p => p.id === selectedId)
                                      if (targetPlaylist) {
                                        addImportToExistingPlaylist(importResults, targetPlaylist)
                                      }
                                    }}
                                    disabled={loading}
                                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded transition-colors disabled:opacity-50"
                                  >
                                    {loading ? '追加中...' : '既存プレイリストに追加'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* 楽曲が見つからなかった場合 */
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Music size={32} className="text-gray-400" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-600 mb-2">
                          プリキュア関連楽曲が見つかりませんでした
                        </h4>
                        <p className="text-gray-500 text-sm mb-4">
                          このプレイリストにはプリキュア関連の楽曲が含まれていません
                        </p>
                        <button
                          onClick={() => {
                            setImportResults(null)
                            setImportUrl('')
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                          別のプレイリストを試す
                        </button>
                      </div>
                    )}
                  </div>

                  {importResults.filteredCount > 0 && (
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setImportResults(null)
                          setImportUrl('')
                        }}
                        className="text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        ← 別のプレイリストを取り込み
                      </button>
                      <button
                        onClick={() => {
                          setShowImportModal(false)
                          setImportUrl('')
                          setImportResults(null)
                        }}
                        className="text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        閉じる
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spotifyエクスポートモーダル */}
      {showExportModal && exportPlaylist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* ヘッダー */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Spotifyにエクスポート</h2>
                  <p className="text-white/80 text-sm mt-1">
                    ローカルプレイリストをSpotifyプレイリストとして作成します
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowExportModal(false)
                    setExportPlaylist(null)
                    setExportMakePublic(false)
                  }}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* プレイリスト情報 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-800 mb-2">エクスポート対象プレイリスト</h3>
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    {exportPlaylist.tracks && exportPlaylist.tracks.length > 0 && exportPlaylist.tracks[0].album?.images?.[0] ? (
                      <img
                        src={exportPlaylist.tracks[0].album.images[0].url}
                        alt="プレイリストカバー"
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <Music size={32} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">{exportPlaylist.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {exportPlaylist.tracks?.length || 0}曲 • {profile?.display_name || 'あなた'}
                    </p>
                    {exportPlaylist.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {exportPlaylist.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Spotify認証状態 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-800 mb-3">Spotify認証状態</h3>
                {spotifyAuth?.authenticated ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-green-800">認証済み</p>
                      <p className="text-sm text-green-700">
                        {spotifyAuth.user.display_name} ({spotifyAuth.user.id})
                      </p>
                    </div>
                    <button
                      onClick={disconnectSpotify}
                      className="text-green-600 hover:text-green-800 text-sm underline"
                    >
                      連携解除
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                      <AlertCircle size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-red-800">認証が必要</p>
                      <p className="text-sm text-red-700">
                        エクスポートにはSpotify認証が必要です
                      </p>
                    </div>
                    <button
                      onClick={connectSpotify}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Spotify連携
                    </button>
                  </div>
                )}
              </div>

              {/* エクスポート設定 */}
              {spotifyAuth?.authenticated && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-3">エクスポート設定</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={exportMakePublic}
                          onChange={(e) => setExportMakePublic(e.target.checked)}
                          className="rounded border-gray-300 text-green-500 focus:ring-green-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">プレイリストを公開する</span>
                          <p className="text-xs text-gray-500">チェックを外すと非公開プレイリストとして作成されます</p>
                        </div>
                      </label>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-yellow-800 mb-1">📝 エクスポート内容</h4>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        <li>• プレイリスト名: {exportPlaylist.name}</li>
                        <li>• 楽曲数: {exportPlaylist.tracks?.length || 0}曲</li>
                        <li>• 公開設定: {exportMakePublic ? '公開' : '非公開'}</li>
                        <li>• 説明文に「プリキュアプロフィールメーカーからエクスポート」が追加されます</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 楽曲プレビュー */}
              {exportPlaylist.tracks && exportPlaylist.tracks.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-3">
                    エクスポート対象楽曲 ({exportPlaylist.tracks.length}曲)
                  </h3>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {exportPlaylist.tracks.slice(0, 5).map((track, index) => (
                      <div key={track.id} className="flex items-center space-x-3 p-2 bg-white rounded">
                        {track.album?.images?.[0] && (
                          <img
                            src={track.album.images[0].url}
                            alt={track.album.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{track.name}</p>
                          <p className="text-xs text-gray-600 truncate">
                            {track.artists?.map(a => a.name).join(', ')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {exportPlaylist.tracks.length > 5 && (
                      <div className="text-center text-sm text-gray-500 py-2">
                        他 {exportPlaylist.tracks.length - 5} 曲...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 注意事項 */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-orange-800 mb-2">⚠️ 重要な注意</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• エクスポート後のSpotifyプレイリストは独立して管理されます</li>
                  <li>• ローカルプレイリストの変更は自動的に反映されません</li>
                  <li>• 一部の楽曲がSpotifyで利用できない場合はスキップされます</li>
                  <li>• エクスポート完了後はSpotifyアプリで確認できます</li>
                </ul>
              </div>
            </div>

            {/* フッター */}
            <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    setShowExportModal(false)
                    setExportPlaylist(null)
                    setExportMakePublic(false)
                  }}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={exportToSpotify}
                  disabled={!spotifyAuth?.authenticated || exportLoading || !exportPlaylist.tracks?.length}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {exportLoading ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      <span>エクスポート中...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Spotifyにエクスポート</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 使用方法ガイド */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🎵 ローカルプレイリストの使い方</h3>
        <div className="grid md:grid-cols-4 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-indigo-600 mb-2">✨ 楽曲管理</h4>
            <ul className="space-y-1">
              <li>• Spotify連携不要で楽曲検索・追加</li>
              <li>• プレビュー再生で楽曲確認</li>
              <li>• アルバムアート・詳細情報表示</li>
              <li>• 自動的にプリキュア関連楽曲をフィルタリング</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-600 mb-2">🎶 プレイリスト機能</h4>
            <ul className="space-y-1">
              <li>• 個人用ローカルプレイリスト作成・管理</li>
              <li>• 楽曲の追加・削除をリアルタイム反映</li>
              <li>• プレイリスト編集・削除</li>
              <li>• URL共有で他のユーザーと共有可能</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-green-600 mb-2">📥 インポート機能</h4>
            <ul className="space-y-1">
              <li>• SpotifyプレイリストURLから一括取り込み</li>
              <li>• プリキュア楽曲のみ自動抽出</li>
              <li>• 新規作成または既存追加を選択可能</li>
              <li>• 重複楽曲の自動検出・除外</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-emerald-600 mb-2">📤 エクスポート機能</h4>
            <ul className="space-y-1">
              <li>• ローカルプレイリストをSpotifyに移行</li>
              <li>• 公開・非公開設定を選択可能</li>
              <li>• 楽曲の一括追加処理</li>
              <li>• エクスポート元情報を自動記録</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
              <Music size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">柔軟なプレイリスト管理</p>
              <p className="text-xs text-gray-600">
                Spotify連携なしで楽曲管理、必要に応じてSpotifyにエクスポート可能
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Spotifyエクスポート機能ガイド */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📤 Spotifyエクスポート機能</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-emerald-600 mb-3">🎯 使用方法</h4>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li><strong>Spotify連携</strong>：初回のみ認証が必要</li>
              <li><strong>エクスポート開始</strong>：「Spotifyにエクスポート」ボタンをクリック</li>
              <li><strong>設定確認</strong>：公開・非公開設定を選択</li>
              <li><strong>実行</strong>：Spotifyプレイリストとして作成</li>
              <li><strong>確認</strong>：Spotifyアプリで新しいプレイリストを確認</li>
            </ol>
          </div>
          <div>
            <h4 className="font-medium text-green-600 mb-3">⚡ 特徴</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>OAuth認証</strong>：安全なSpotify連携</li>
              <li>• <strong>一括処理</strong>：最大100曲ずつバッチ処理</li>
              <li>• <strong>エラーハンドリング</strong>：利用不可楽曲の自動スキップ</li>
              <li>• <strong>詳細ログ</strong>：成功・失敗楽曲数の表示</li>
              <li>• <strong>メタデータ保持</strong>：元プレイリスト情報を記録</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-emerald-200">
            <h5 className="font-medium text-gray-800 mb-2">🔐 必要な権限</h5>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• playlist-modify-public (公開プレイリスト作成)</div>
              <div>• playlist-modify-private (非公開プレイリスト作成)</div>
              <div>• 初回のみOAuth認証画面が表示されます</div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h5 className="font-medium text-gray-800 mb-2">📋 エクスポート後</h5>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• Spotifyプレイリストは独立管理</div>
              <div>• ローカル変更は自動反映されません</div>
              <div>• 再エクスポートで新規プレイリスト作成</div>
            </div>
          </div>
        </div>
      </div>

      {/* Spotifyインポート機能ガイド */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 border border-green-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📥 Spotifyプレイリスト取り込み機能</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-green-600 mb-3">🎯 使用方法</h4>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li><strong>「Spotifyから取り込み」</strong>ボタンをクリック</li>
              <li>SpotifyでプレイリストのURLをコピー</li>
              <li>URLを入力して「取り込み開始」</li>
              <li>プリキュア楽曲が自動抽出される</li>
              <li>新規作成または既存追加を選択</li>
            </ol>
          </div>
          <div>
            <h4 className="font-medium text-teal-600 mb-3">⚡ 特徴</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>スマートフィルタリング</strong>: プリキュア関連楽曲のみ抽出</li>
              <li>• <strong>重複防止</strong>: 既存楽曲と重複チェック</li>
              <li>• <strong>一括処理</strong>: 大量の楽曲も一度に処理</li>
              <li>• <strong>詳細プレビュー</strong>: 取り込み前に楽曲確認</li>
              <li>• <strong>柔軟な追加</strong>: 新規・既存どちらでも対応</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h5 className="font-medium text-gray-800 mb-2">📋 対応URL形式</h5>
            <div className="text-xs text-gray-600 space-y-1 font-mono">
              <div>https://open.spotify.com/playlist/...</div>
              <div>https://spotify.com/playlist/...</div>
              <div>spotify:playlist:...</div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-teal-200">
            <h5 className="font-medium text-gray-800 mb-2">🎯 検出キーワード</h5>
            <div className="text-xs text-gray-600">
              プリキュア、キュア、シリーズ名、アーティスト名など
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// コンポーネント終了