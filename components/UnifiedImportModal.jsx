// components/UnifiedImportModal.jsx - 修正版（前半部分）
'use client'

import { useState, useRef } from 'react'
import { Upload, Music, FileText, X, RefreshCw, AlertCircle, ExternalLink, Plus, CheckCircle } from 'lucide-react'

export default function UnifiedImportModal({ 
  isOpen, 
  onClose, 
  onCreatePlaylist, 
  session, 
  profile 
}) {
  const [activeTab, setActiveTab] = useState('spotify') // 'spotify' | 'json'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Spotify URL インポート用の状態
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [spotifyResults, setSpotifyResults] = useState(null)
  
  // JSON インポート用の状態
  const [jsonData, setJsonData] = useState('')
  const [jsonResults, setJsonResults] = useState(null)
  
  const fileInputRef = useRef(null)

  // モーダルを閉じる
  const handleClose = () => {
    setSpotifyUrl('')
    setJsonData('')
    setSpotifyResults(null)
    setJsonResults(null)
    setError('')
    setLoading(false)
    onClose()
  }

  // Spotify URLからプレイリストIDを抽出
  const extractPlaylistId = (url) => {
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

  // Spotify URLから取り込み
  const importFromSpotifyUrl = async () => {
    if (!spotifyUrl.trim()) {
      setError('Spotify プレイリストURLを入力してください')
      return
    }

    const playlistId = extractPlaylistId(spotifyUrl)
    if (!playlistId) {
      setError('有効なSpotify プレイリストURLを入力してください')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      console.log('📥 Importing Spotify playlist:', spotifyUrl)
      
      const response = await fetch('/api/spotify/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ spotifyUrl })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'インポートに失敗しました')
      }

      console.log('✅ Spotify import successful:', data)
      
      if (data.filteredCount === 0) {
        setError('プリキュア関連楽曲が見つかりませんでした。別のプレイリストをお試しください。')
        return
      }

      setSpotifyResults(data)
      
    } catch (error) {
      console.error('❌ Spotify import error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // JSONデータの解析
  const parseJsonData = (jsonString) => {
    try {
      const data = JSON.parse(jsonString)
      
      // データ構造の検証
      if (!data.playlist && !data.tracks && !Array.isArray(data.tracks || data.items)) {
        throw new Error('無効なプレイリストデータ形式です')
      }

      // プリキュアプロフィールメーカー形式の場合
      if (data.playlist && data.tracks) {
        return {
          playlist: data.playlist,
          tracks: filterPrecureTracks(data.tracks),
          metadata: data.metadata || {},
          originalCount: data.tracks.length,
          source: 'precure_profile_maker'
        }
      }

      // Spotify API形式の場合
      if (data.tracks && data.tracks.items) {
        return {
          playlist: {
            name: data.name || 'インポートプレイリスト',
            description: data.description || '',
            external_urls: data.external_urls || {}
          },
          tracks: filterPrecureTracks(data.tracks.items.map(item => item.track).filter(Boolean)),
          metadata: { source: 'spotify_api' },
          originalCount: data.tracks.items.length,
          source: 'spotify_api'
        }
      }

      // その他の形式
      if (Array.isArray(data)) {
        return {
          playlist: {
            name: 'インポートプレイリスト',
            description: 'JSONファイルからインポート'
          },
          tracks: filterPrecureTracks(data),
          metadata: { source: 'generic' },
          originalCount: data.length,
          source: 'generic'
        }
      }

      throw new Error('サポートされていないデータ形式です')

    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('無効なJSON形式です')
      }
      throw error
    }
  }

  // プリキュア関連楽曲をフィルタリング
  const filterPrecureTracks = (tracks) => {
    if (!Array.isArray(tracks)) return []

    const precureKeywords = [
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

    return tracks.filter(track => {
      if (!track) return false
      
      const trackName = (track.name || '').toLowerCase()
      const artistNames = (track.artists || [])
        .map(artist => (typeof artist === 'string' ? artist : artist.name || '').toLowerCase())
        .join(' ')
      const albumName = (track.album?.name || track.album_name || '').toLowerCase()
      
      return precureKeywords.some(keyword => 
        trackName.includes(keyword.toLowerCase()) ||
        artistNames.includes(keyword.toLowerCase()) ||
        albumName.includes(keyword.toLowerCase())
      )
    }).map(track => ({
      id: track.id || track.spotify_id || `temp_${Date.now()}_${Math.random()}`,
      name: track.name,
      artists: track.artists || [],
      album: track.album || { name: track.album_name || '', images: [] },
      duration_ms: track.duration_ms || 0,
      external_urls: track.external_urls || {},
      preview_url: track.preview_url || null,
      added_at: track.added_at || new Date().toISOString()
    }))
  }

  // JSONファイルアップロード
  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setError('JSONファイルを選択してください')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = parseJsonData(e.target.result)
        if (result.tracks.length === 0) {
          setError('プリキュア関連楽曲が見つかりませんでした')
          return
        }
        setJsonResults({
          ...result,
          filteredCount: result.tracks.length
        })
        setError('')
      } catch (error) {
        setError(`ファイル読み込みエラー: ${error.message}`)
      }
    }
    reader.readAsText(file)
  }

  // JSONテキストから解析
  const parseJsonText = () => {
    if (!jsonData.trim()) {
      setError('JSONデータを入力してください')
      return
    }

    try {
      const result = parseJsonData(jsonData)
      if (result.tracks.length === 0) {
        setError('プリキュア関連楽曲が見つかりませんでした')
        return
      }
      setJsonResults({
        ...result,
        filteredCount: result.tracks.length
      })
      setError('')
    } catch (error) {
      setError(`JSON解析エラー: ${error.message}`)
    }
  }

  // プレイリスト作成
  const createNewPlaylist = async (importData, customName = '') => {
    if (!importData || !importData.tracks || importData.tracks.length === 0) {
      setError('インポートする楽曲がありません')
      return
    }

    try {
      setLoading(true)
      
      const playlistName = customName.trim() || `${importData.playlist.name} (インポート)`
      
      const playlistData = {
        name: playlistName,
        description: [
          importData.playlist.description || '',
          '',
          '--- プリキュアプロフィールメーカーでインポート ---',
          `元プレイリスト: ${importData.playlist.name}`,
          `インポート元: ${importData.source === 'spotify_api' ? 'Spotify' : 'JSON'}`,
          `インポート日時: ${new Date().toLocaleString('ja-JP')}`
        ].filter(line => line.trim()).join('\n'),
        tracks: importData.tracks,
        is_public: false
      }

      await onCreatePlaylist(playlistData)
      
      alert(`プレイリスト「${playlistName}」を作成しました！\n${importData.tracks.length}曲のプリキュア楽曲をインポートしました。✨`)
      handleClose()
      
    } catch (error) {
      console.error('❌ Create playlist error:', error)
      setError(`プレイリスト作成エラー: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 時間フォーマット
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">プレイリストインポート</h2>
              <p className="text-white/80 text-sm mt-1">
                SpotifyプレイリストまたはJSONファイルからプリキュア楽曲をインポート
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('spotify')}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 border-b-2 transition-colors ${
                activeTab === 'spotify'
                  ? 'border-green-500 text-green-600 bg-green-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Music size={18} />
              <span className="font-medium">Spotify URL</span>
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 border-b-2 transition-colors ${
                activeTab === 'json'
                  ? 'border-purple-500 text-purple-600 bg-purple-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <FileText size={18} />
              <span className="font-medium">JSONファイル</span>
            </button>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'spotify' ? (
            /* Spotify URL インポート */
            <div className="space-y-6">
              {!spotifyResults ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Spotify プレイリストURLを入力
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        プレイリストURL
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="url"
                          value={spotifyUrl}
                          onChange={(e) => setSpotifyUrl(e.target.value)}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="https://open.spotify.com/playlist/..."
                          disabled={loading}
                        />
                        <button
                          onClick={importFromSpotifyUrl}
                          disabled={loading || !spotifyUrl.trim()}
                          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          {loading ? <RefreshCw className="animate-spin" size={20} /> : <Music size={20} />}
                          <span>{loading ? '取り込み中...' : '取り込み'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">💡 URLの取得方法</h4>
                      <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                        <li>Spotifyアプリまたはウェブ版でプレイリストを開く</li>
                        <li>「共有」ボタンをクリック</li>
                        <li>「プレイリストリンクをコピー」を選択</li>
                        <li>コピーしたURLをここに貼り付け</li>
                      </ol>
                    </div>
                  </div>
                </div>
              ) : (
                /* Spotify インポート結果 */
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      インポート結果
                    </h3>
                    
                    {/* プレイリスト情報 */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-400 via-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                          <Music size={32} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800">{spotifyResults.playlist.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            作成者: {spotifyResults.playlist.owner?.display_name || '不明'}
                          </p>
                          {spotifyResults.playlist.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {spotifyResults.playlist.description}
                            </p>
                          )}
                          {spotifyResults.playlist.external_urls?.spotify && (
                            <a
                              href={spotifyResults.playlist.external_urls.spotify}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-sm text-green-600 hover:text-green-800 mt-2"
                            >
                              <ExternalLink size={14} />
                              <span>Spotifyで開く</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 統計情報 */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{spotifyResults.originalCount}</div>
                        <div className="text-sm text-gray-600">元の楽曲数</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{spotifyResults.filteredCount}</div>
                        <div className="text-sm text-gray-600">プリキュア楽曲</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {spotifyResults.originalCount > 0 ? 
                            Math.round((spotifyResults.filteredCount / spotifyResults.originalCount) * 100) : 0}%
                        </div>
                        <div className="text-sm text-gray-600">一致率</div>
                      </div>
                    </div>

                    {spotifyResults.filteredCount > 0 && (
                      <div>
                        {/* 楽曲プレビュー */}
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-800 mb-3">
                            インポート対象楽曲 ({spotifyResults.filteredCount}曲)
                          </h4>
                          <div className="max-h-60 overflow-y-auto space-y-2">
                            {spotifyResults.tracks.slice(0, 10).map((track, index) => (
                              <div key={track.id} className="flex items-center space-x-3 p-2 bg-white rounded border">
                                {track.album?.images?.[0] && (
                                  <img
                                    src={track.album.images[0].url}
                                    alt={track.album.name}
                                    className="w-10 h-10 rounded object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{track.name}</p>
                                  <p className="text-xs text-gray-600 truncate">
                                    {track.artists?.map(a => a.name).join(', ')} • {formatDuration(track.duration_ms)}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {spotifyResults.tracks.length > 10 && (
                              <div className="text-center text-sm text-gray-500 py-2">
                                他 {spotifyResults.tracks.length - 10} 曲...
                              </div>
                            )}
                          </div>
                        </div>

                        {/* プレイリスト作成 */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              プレイリスト名
                            </label>
                            <input
                              type="text"
                              placeholder={`${spotifyResults.playlist.name} (インポート)`}
                              className="w-full px-3 py-2 border border-gray-300 rounded mb-3 text-sm"
                              id="spotifyImportPlaylistName"
                            />
                            <button
                              onClick={() => {
                                const nameInput = document.getElementById('spotifyImportPlaylistName')
                                const playlistName = nameInput.value.trim()
                                createNewPlaylist(spotifyResults, playlistName)
                              }}
                              disabled={loading}
                              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                              <Plus size={20} />
                              <span>{loading ? 'インポート中...' : 'プレイリストを作成'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* JSON インポート */
            <div className="space-y-6">
              {!jsonResults ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    JSONファイルまたはテキストからインポート
                  </h3>
                  
                  <div className="space-y-6">
                    {/* ファイルアップロード */}
                    <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center">
                      <Upload className="mx-auto text-purple-400 mb-4" size={48} />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center space-x-2"
                      >
                        <Upload size={20} />
                        <span>JSONファイルを選択</span>
                      </button>
                      <p className="text-gray-500 text-sm mt-2">
                        または、JSONテキストを直接入力
                      </p>
                    </div>

                    {/* テキスト入力 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        JSONテキスト
                      </label>
                      <textarea
                        value={jsonData}
                        onChange={(e) => setJsonData(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows="8"
                        placeholder="JSONデータを貼り付けてください..."
                      />
                      {jsonData && (
                        <button
                          onClick={parseJsonText}
                          className="mt-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          JSONを解析
                        </button>
                      )}
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-purple-800 mb-2">📋 対応形式</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• プリキュアプロフィールメーカーエクスポート形式</li>
                        <li>• Spotify API形式</li>
                        <li>• その他のJSON楽曲リスト形式</li>
                        <li>• プリキュア関連楽曲のみ自動抽出されます</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                /* JSON インポート結果 */
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      インポート結果
                    </h3>
                    
                    {/* プレイリスト情報 */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 rounded-lg flex items-center justify-center">
                          <FileText size={32} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800">{jsonResults.playlist.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            形式: {jsonResults.source === 'precure_profile_maker' ? 'プリキュアプロフィールメーカー' : 
                                  jsonResults.source === 'spotify_api' ? 'Spotify API' : '汎用JSON'}
                          </p>
                          {jsonResults.metadata?.exportedBy && (
                            <p className="text-sm text-gray-600">
                              作成者: {jsonResults.metadata.exportedBy}
                            </p>
                          )}
                          {jsonResults.playlist.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {jsonResults.playlist.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 統計情報 */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{jsonResults.originalCount}</div>
                        <div className="text-sm text-gray-600">元の楽曲数</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{jsonResults.filteredCount}</div>
                        <div className="text-sm text-gray-600">プリキュア楽曲</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {jsonResults.originalCount > 0 ? 
                            Math.round((jsonResults.filteredCount / jsonResults.originalCount) * 100) : 0}%
                        </div>
                        <div className="text-sm text-gray-600">一致率</div>
                      </div>
                    </div>

                    {jsonResults.filteredCount > 0 && (
                      <div>
                        {/* 楽曲プレビュー */}
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-800 mb-3">
                            インポート対象楽曲 ({jsonResults.filteredCount}曲)
                          </h4>
                          <div className="max-h-60 overflow-y-auto space-y-2">
                            {jsonResults.tracks.slice(0, 10).map((track, index) => (
                              <div key={track.id} className="flex items-center space-x-3 p-2 bg-white rounded border">
                                {track.album?.images?.[0] && (
                                  <img
                                    src={track.album.images[0].url}
                                    alt={track.album.name}
                                    className="w-10 h-10 rounded object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{track.name}</p>
                                  <p className="text-xs text-gray-600 truncate">
                                    {track.artists?.map(a => a.name).join(', ')} • {formatDuration(track.duration_ms)}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {jsonResults.tracks.length > 10 && (
                              <div className="text-center text-sm text-gray-500 py-2">
                                他 {jsonResults.tracks.length - 10} 曲...
                              </div>
                            )}
                          </div>
                        </div>

                        {/* プレイリスト作成 */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              プレイリスト名
                            </label>
                            <input
                              type="text"
                              placeholder={`${jsonResults.playlist.name} (インポート)`}
                              className="w-full px-3 py-2 border border-gray-300 rounded mb-3 text-sm"
                              id="jsonImportPlaylistName"
                            />
                            <button
                              onClick={() => {
                                const nameInput = document.getElementById('jsonImportPlaylistName')
                                const playlistName = nameInput.value.trim()
                                createNewPlaylist(jsonResults, playlistName)
                              }}
                              disabled={loading}
                              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                              <Plus size={20} />
                              <span>{loading ? 'インポート中...' : 'プレイリストを作成'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div className="flex items-center space-x-2">
                <AlertCircle size={20} className="text-red-500" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">エラー</h4>
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

          {/* 楽曲が見つからなかった場合 */}
          {((spotifyResults && spotifyResults.filteredCount === 0) || 
            (jsonResults && jsonResults.filteredCount === 0)) && (
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
                  setSpotifyResults(null)
                  setJsonResults(null)
                  setSpotifyUrl('')
                  setJsonData('')
                  setError('')
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                別のプレイリストを試す
              </button>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {activeTab === 'spotify' ? (
                <span>Spotify共有URLから楽曲情報を取得</span>
              ) : (
                <span>JSONファイルから楽曲データをインポート</span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                キャンセル
              </button>
              {(spotifyResults || jsonResults) && (
                <button
                  onClick={() => {
                    const currentResults = activeTab === 'spotify' ? spotifyResults : jsonResults
                    if (currentResults && currentResults.filteredCount > 0) {
                      const inputId = activeTab === 'spotify' ? 'spotifyImportPlaylistName' : 'jsonImportPlaylistName'
                      const nameInput = document.getElementById(inputId)
                      const playlistName = nameInput?.value.trim() || ''
                      createNewPlaylist(currentResults, playlistName)
                    }
                  }}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-purple-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <CheckCircle size={16} />
                  <span>{loading ? 'インポート中...' : 'インポート完了'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}