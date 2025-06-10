// components/UnifiedImportModal.jsx - JSON機能削除・Spotifyのみ版
'use client'

import { useState } from 'react'
import { X, Music, ExternalLink, Clock, User, Calendar, AlertCircle, RefreshCw } from 'lucide-react'

export default function UnifiedImportModal({ 
  isOpen, 
  onClose, 
  onCreatePlaylist 
}) {
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [spotifyResults, setSpotifyResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [playlistName, setPlaylistName] = useState('')
  const [playlistDescription, setPlaylistDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  // モーダルを閉じる
  const handleClose = () => {
    onClose()
    // 状態をリセット
    setSpotifyUrl('')
    setSpotifyResults(null)
    setLoading(false)
    setError('')
    setPlaylistName('')
    setPlaylistDescription('')
    setIsPublic(false)
  }

  // SpotifyURLからインポート
  const importFromSpotify = async () => {
    if (!spotifyUrl.trim()) {
      setError('Spotify URLを入力してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('🔍 Importing from Spotify URL:', spotifyUrl)

      const response = await fetch('/api/spotify/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spotifyUrl: spotifyUrl.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'インポートに失敗しました')
      }

      console.log('✅ Spotify import successful:', data)

      // プリキュア楽曲のみをフィルタリング
      const precureKeywords = [
        'プリキュア', 'PreCure', 'Pretty Cure', 'キュア', 'cure',
        'ふたりはプリキュア', 'Max Heart', 'Splash Star',
        'Yes!プリキュア5', 'フレッシュプリキュア', 'ハートキャッチプリキュア',
        'スイートプリキュア', 'スマイルプリキュア', 'ドキドキ!プリキュア',
        'ハピネスチャージプリキュア', 'Go!プリンセスプリキュア', '魔法つかいプリキュア',
        'キラキラ☆プリキュアアラモード', 'HUGっと!プリキュア', 'スター☆トゥインクルプリキュア',
        'ヒーリングっど♥プリキュア', 'トロピカル〜ジュ!プリキュア', 'デリシャスパーティ♡プリキュア',
        'ひろがるスカイ!プリキュア', 'わんだふるぷりきゅあ!'
      ]

      const filteredTracks = data.tracks.filter(track => {
        const trackName = track.name.toLowerCase()
        const artistNames = track.artists.map(artist => artist.name.toLowerCase()).join(' ')
        const albumName = track.album.name.toLowerCase()
        
        return precureKeywords.some(keyword => 
          trackName.includes(keyword.toLowerCase()) ||
          artistNames.includes(keyword.toLowerCase()) ||
          albumName.includes(keyword.toLowerCase())
        )
      })

      const results = {
        playlist: data.playlist,
        tracks: filteredTracks,
        originalCount: data.tracks.length,
        filteredCount: filteredTracks.length
      }

      setSpotifyResults(results)
      
      // プレイリスト名を自動設定
      setPlaylistName(`${data.playlist.name} (プリキュア楽曲)`)
      setPlaylistDescription(`${data.playlist.description ? data.playlist.description + '\n\n' : ''}Spotifyプレイリスト「${data.playlist.name}」からプリキュア関連楽曲を抽出\nインポート日時: ${new Date().toLocaleString('ja-JP')}`)

    } catch (error) {
      console.error('❌ Spotify import error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // プレイリスト作成実行
  const executeImport = async () => {
    if (!spotifyResults || !playlistName.trim()) {
      setError('プレイリスト名を入力してください')
      return
    }

    try {
      setLoading(true)
      setError('')

      const playlistData = {
        name: playlistName.trim(),
        description: playlistDescription.trim(),
        is_public: isPublic,
        tracks: spotifyResults.tracks
      }

      await onCreatePlaylist(playlistData)
      
      alert(`プレイリスト「${playlistName}」を作成しました！\n${spotifyResults.tracks.length}曲のプリキュア楽曲をインポートしました。✨`)
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
              <h2 className="text-xl font-bold">Spotifyプレイリストインポート</h2>
              <p className="text-white/80 text-sm mt-1">
                Spotifyプレイリストからプリキュア楽曲を抽出してインポート
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

        {/* メインコンテンツ */}
        <div className="flex-1 overflow-y-auto p-6">
          {!spotifyResults ? (
            /* Spotify URL入力 */
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Spotify プレイリストURL
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      プレイリストURL
                    </label>
                    <input
                      type="url"
                      value={spotifyUrl}
                      onChange={(e) => setSpotifyUrl(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="https://open.spotify.com/playlist/..."
                    />
                  </div>
                  
                  <button
                    onClick={importFromSpotify}
                    disabled={loading || !spotifyUrl.trim()}
                    className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={20} className="animate-spin" />
                        <span>インポート中...</span>
                      </>
                    ) : (
                      <>
                        <Music size={20} />
                        <span>プレイリストを分析</span>
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle size={20} className="text-red-500" />
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">📋 使い方</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Spotifyのプレイリストページから共有URLをコピー</li>
                  <li>• URLを上の入力欄に貼り付け</li>
                  <li>• プリキュア関連楽曲が自動的に抽出されます</li>
                  <li>• 抽出された楽曲でプレイリストを作成</li>
                </ul>
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
                          className="inline-flex items-center space-x-1 text-green-600 hover:text-green-800 mt-2"
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

                {spotifyResults.filteredCount > 0 ? (
                  <div>
                    {/* プレイリスト設定 */}
                    <div className="mb-6 space-y-4">
                      <h4 className="font-medium text-gray-800">プレイリスト設定</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          プレイリスト名
                        </label>
                        <input
                          type="text"
                          value={playlistName}
                          onChange={(e) => setPlaylistName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="プレイリスト名"
                          maxLength="100"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          説明
                        </label>
                        <textarea
                          value={playlistDescription}
                          onChange={(e) => setPlaylistDescription(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="プレイリストの説明"
                          rows="3"
                          maxLength="500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          公開設定
                        </label>
                        <div className="flex items-center space-x-3">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="privacy"
                              checked={!isPublic}
                              onChange={() => setIsPublic(false)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">非公開</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="privacy"
                              checked={isPublic}
                              onChange={() => setIsPublic(true)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">公開</span>
                          </label>
                        </div>
                      </div>
                    </div>

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
                                alt={track.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 text-sm truncate">{track.name}</h5>
                              <p className="text-xs text-gray-600 truncate">
                                {track.artists.map(artist => artist.name).join(', ')}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDuration(track.duration_ms)}
                            </span>
                          </div>
                        ))}
                        {spotifyResults.tracks.length > 10 && (
                          <div className="text-center text-sm text-gray-500 py-2">
                            他 {spotifyResults.tracks.length - 10} 曲...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 作成ボタン */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setSpotifyResults(null)}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
                      >
                        戻る
                      </button>
                      <button
                        onClick={executeImport}
                        disabled={loading || !playlistName.trim()}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        <span>{loading ? 'インポート中...' : 'プレイリストを作成'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle size={48} className="mx-auto text-yellow-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-800 mb-2">プリキュア楽曲が見つかりませんでした</h4>
                    <p className="text-gray-600 mb-4">
                      このプレイリストにはプリキュア関連の楽曲が含まれていないようです。
                    </p>
                    <button
                      onClick={() => setSpotifyResults(null)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      別のプレイリストを試す
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}