// components/PlaylistJsonManager.jsx - JSON エクスポート/インポート機能
'use client'

import { useState, useRef } from 'react'
import { Download, Upload, FileText, Copy, Check, ExternalLink, Music, Share2, AlertCircle, X, Plus } from 'lucide-react'

export default function PlaylistJsonManager({ 
  playlist, 
  onImportPlaylist, 
  onCreateFromJson, 
  session, 
  profile 
}) {
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState(null)
  const [importError, setImportError] = useState('')
  const [copied, setCopied] = useState(false)
  const [exportFormat, setExportFormat] = useState('detailed') // 'detailed' or 'simple'
  const fileInputRef = useRef(null)

  // プレイリストをJSONに変換
  const generatePlaylistJson = (format = 'detailed') => {
    if (!playlist) return null

    const baseData = {
      meta: {
        format_version: "1.0",
        app_name: "プリキュアプロフィールメーカー",
        export_date: new Date().toISOString(),
        export_timezone: "Asia/Tokyo",
        format_type: format
      },
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description || '',
        is_public: playlist.is_public || false,
        created_at: playlist.created_at,
        updated_at: playlist.updated_at || new Date().toISOString(),
        track_count: playlist.tracks?.length || 0,
        total_duration_ms: playlist.tracks?.reduce((sum, track) => sum + (track.duration_ms || 0), 0) || 0,
        creator: {
          user_id: session?.user?.id,
          display_name: profile?.display_name || 'プリキュアファン',
          avatar_url: profile?.avatar_url || ''
        }
      }
    }

    if (format === 'simple') {
      // シンプル版：楽曲の基本情報のみ
      baseData.tracks = playlist.tracks?.map(track => ({
        spotify_id: track.id,
        name: track.name,
        artists: track.artists?.map(artist => artist.name) || [],
        album_name: track.album?.name || '',
        duration_ms: track.duration_ms,
        spotify_url: track.external_urls?.spotify || '',
        added_at: track.added_at
      })) || []
    } else {
      // 詳細版：すべての情報を含む
      baseData.tracks = playlist.tracks?.map(track => ({
        spotify_id: track.id,
        name: track.name,
        artists: track.artists?.map(artist => ({
          id: artist.id,
          name: artist.name
        })) || [],
        album: {
          id: track.album?.id,
          name: track.album?.name || '',
          images: track.album?.images || []
        },
        duration_ms: track.duration_ms,
        preview_url: track.preview_url,
        external_urls: track.external_urls || {},
        added_at: track.added_at,
        precure_info: inferPrecureInfo(track)
      })) || []

      // 統計情報の生成
      baseData.statistics = generateStatistics(playlist.tracks || [])
      baseData.compatibility = {
        spotify_import: true,
        apple_music_search: true,
        youtube_music_search: true,
        manual_search: true
      }
    }

    return baseData
  }

  // プリキュア情報の推測
  const inferPrecureInfo = (track) => {
    const trackName = track.name?.toLowerCase() || ''
    const albumName = track.album?.name?.toLowerCase() || ''
    
    const seriesMap = {
      'ふたりは': 'ふたりはプリキュア',
      'スプラッシュ': 'ふたりはプリキュア Splash Star',
      'yes': 'Yes!プリキュア5',
      'フレッシュ': 'フレッシュプリキュア!',
      'ハートキャッチ': 'ハートキャッチプリキュア!',
      'スイート': 'スイートプリキュア♪',
      'スマイル': 'スマイルプリキュア!',
      'ドキドキ': 'ドキドキ!プリキュア',
      'ハピネス': 'ハピネスチャージプリキュア!',
      'プリンセス': 'Go!プリンセスプリキュア',
      '魔法つかい': '魔法つかいプリキュア!',
      'アラモード': 'キラキラ☆プリキュアアラモード',
      'hugっと': 'HUGっと!プリキュア',
      'スター': 'スター☆トゥインクルプリキュア',
      'ヒーリング': 'ヒーリングっど♥プリキュア',
      'トロピカル': 'トロピカル〜ジュ!プリキュア',
      'デリシャス': 'デリシャスパーティ♡プリキュア',
      'ひろがる': 'ひろがるスカイ!プリキュア',
      'わんだふる': 'わんだふるぷりきゅあ!'
    }

    let detectedSeries = 'プリキュア（シリーズ不明）'
    for (const [key, value] of Object.entries(seriesMap)) {
      if (trackName.includes(key) || albumName.includes(key)) {
        detectedSeries = value
        break
      }
    }

    let type = 'unknown'
    if (trackName.includes('オープニング') || albumName.includes('op')) type = 'opening'
    else if (trackName.includes('エンディング') || albumName.includes('ed')) type = 'ending'
    else if (trackName.includes('挿入歌')) type = 'insert'

    return {
      series: detectedSeries,
      type: type,
      confidence: 0.7
    }
  }

  // 統計情報の生成
  const generateStatistics = (tracks) => {
    const seriesBreakdown = {}
    const typeBreakdown = {}
    const artists = new Set()

    tracks.forEach(track => {
      const precureInfo = inferPrecureInfo(track)
      
      // シリーズ別集計
      seriesBreakdown[precureInfo.series] = (seriesBreakdown[precureInfo.series] || 0) + 1
      
      // タイプ別集計
      typeBreakdown[precureInfo.type] = (typeBreakdown[precureInfo.type] || 0) + 1
      
      // アーティスト集計
      track.artists?.forEach(artist => artists.add(artist.name))
    })

    return {
      series_breakdown: seriesBreakdown,
      type_breakdown: typeBreakdown,
      total_duration_minutes: Math.round(tracks.reduce((sum, track) => sum + (track.duration_ms || 0), 0) / 60000),
      artist_count: artists.size
    }
  }

  // JSONをダウンロード
  const downloadJson = () => {
    const jsonData = generatePlaylistJson(exportFormat)
    if (!jsonData) return

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${playlist.name.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '_')}_playlist.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // JSONをクリップボードにコピー
  const copyToClipboard = async () => {
    const jsonData = generatePlaylistJson(exportFormat)
    if (!jsonData) return

    try {
      await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('コピーに失敗しました:', error)
      alert('コピーに失敗しました')
    }
  }

  // ファイルからJSONを読み込み
  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setImportError('JSONファイルを選択してください')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result)
        validateAndSetImportData(jsonData)
      } catch (error) {
        setImportError('無効なJSONファイルです')
      }
    }
    reader.readAsText(file)
  }

  // テキストからJSONを読み込み
  const handleTextImport = (text) => {
    try {
      const jsonData = JSON.parse(text)
      validateAndSetImportData(jsonData)
    } catch (error) {
      setImportError('無効なJSON形式です')
    }
  }

  // インポートデータの検証
  const validateAndSetImportData = (jsonData) => {
    setImportError('')

    // 基本構造の確認
    if (!jsonData.playlist || !jsonData.tracks) {
      setImportError('プレイリストデータの形式が正しくありません')
      return
    }

    // メタデータの確認
    if (!jsonData.meta || jsonData.meta.app_name !== 'プリキュアプロフィールメーカー') {
      setImportError('⚠️ このファイルは他のアプリから出力された可能性があります。インポートを続行しますか？')
    }

    // 楽曲データの確認
    if (!Array.isArray(jsonData.tracks) || jsonData.tracks.length === 0) {
      setImportError('楽曲データが見つかりません')
      return
    }

    // プリキュア関連楽曲のフィルタリング
    const precureKeywords = ['プリキュア', 'キュア', 'cure', 'precure']
    const precureTracks = jsonData.tracks.filter(track => {
      const trackName = track.name?.toLowerCase() || ''
      const artistNames = track.artists?.map(a => typeof a === 'string' ? a : a.name).join(' ').toLowerCase() || ''
      const albumName = track.album?.name?.toLowerCase() || track.album_name?.toLowerCase() || ''
      
      return precureKeywords.some(keyword => 
        trackName.includes(keyword) || 
        artistNames.includes(keyword) || 
        albumName.includes(keyword)
      )
    })

    if (precureTracks.length === 0) {
      setImportError('プリキュア関連楽曲が見つかりませんでした')
      return
    }

    // インポート用データの準備
    const importPlaylistData = {
      ...jsonData,
      tracks: precureTracks,
      filtered_count: precureTracks.length,
      original_count: jsonData.tracks.length
    }

    setImportData(importPlaylistData)
  }

  // インポート実行
  const executeImport = async (action) => {
    if (!importData) return

    try {
      if (action === 'create_new') {
        await onCreateFromJson(importData)
      } else if (action === 'add_to_existing') {
        await onImportPlaylist(importData)
      }
      
      setShowImportModal(false)
      setImportData(null)
      setImportError('')
    } catch (error) {
      setImportError(`インポートに失敗しました: ${error.message}`)
    }
  }

  return (
    <div className="space-y-4">
      {/* エクスポートボタン */}
      {playlist && (
        <div className="flex space-x-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-colors flex items-center space-x-2"
          >
            <Download size={16} />
            <span>JSONエクスポート</span>
          </button>
          
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-teal-600 transition-colors flex items-center space-x-2"
          >
            <Upload size={16} />
            <span>JSONインポート</span>
          </button>
        </div>
      )}

      {/* エクスポートモーダル */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">プレイリストをJSONでエクスポート</h2>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* プレイリスト情報 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-800 mb-2">{playlist.name}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>楽曲数: {playlist.tracks?.length || 0}曲</p>
                  <p>総再生時間: {Math.round((playlist.tracks?.reduce((sum, track) => sum + (track.duration_ms || 0), 0) || 0) / 60000)}分</p>
                  <p>作成者: {profile?.display_name || 'あなた'}</p>
                </div>
              </div>

              {/* エクスポート形式選択 */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">エクスポート形式</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      value="detailed"
                      checked={exportFormat === 'detailed'}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium text-gray-700">詳細版</span>
                      <p className="text-xs text-gray-500">アルバムアート、プレビューURL、統計情報を含む完全版</p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      value="simple"
                      checked={exportFormat === 'simple'}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium text-gray-700">シンプル版</span>
                      <p className="text-xs text-gray-500">楽曲名とアーティスト名のみの軽量版</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* エクスポート方法 */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">エクスポート方法</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={downloadJson}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Download size={20} />
                    <span>ファイルとしてダウンロード</span>
                  </button>
                  
                  <button
                    onClick={copyToClipboard}
                    className={`${copied ? 'bg-green-500' : 'bg-indigo-500 hover:bg-indigo-600'} text-white px-4 py-3 rounded-lg transition-colors flex items-center space-x-2`}
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                    <span>{copied ? 'コピー済み' : 'クリップボードにコピー'}</span>
                  </button>
                </div>
              </div>

              {/* 使用方法 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">📋 共有方法</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• ダウンロードしたJSONファイルを他のユーザーに送信</li>
                  <li>• SNSやメッセージでJSONテキストを共有</li>
                  <li>• 受け取った側は「JSONインポート」でプレイリストを復元</li>
                  <li>• Spotify以外の音楽サービスでも楽曲検索に利用可能</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* インポートモーダル */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">JSONからプレイリストをインポート</h2>
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setImportData(null)
                    setImportError('')
                  }}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {!importData ? (
                /* インポート方法選択 */
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">インポート方法を選択</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* ファイルアップロード */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-green-400 transition-colors">
                        <div className="text-center">
                          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                          <h4 className="font-medium text-gray-800 mb-2">JSONファイルをアップロード</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            .jsonファイルを選択してインポート
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json,application/json"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            ファイルを選択
                          </button>
                        </div>
                      </div>

                      {/* テキスト入力 */}
                      <div className="border border-gray-300 rounded-lg p-6">
                        <div className="text-center mb-4">
                          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                          <h4 className="font-medium text-gray-800 mb-2">JSONテキストを貼り付け</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            コピーしたJSONテキストを直接入力
                          </p>
                        </div>
                        <textarea
                          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="JSONテキストをここに貼り付けてください..."
                          onChange={(e) => {
                            if (e.target.value.trim()) {
                              handleTextImport(e.target.value)
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* エラー表示 */}
                  {importError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <AlertCircle size={20} className="text-red-500" />
                        <p className="text-red-700">{importError}</p>
                      </div>
                    </div>
                  )}

                  {/* 説明 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">📥 インポート可能な形式</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• プリキュアプロフィールメーカーから出力されたJSON</li>
                      <li>• 他の音楽アプリから出力された互換JSON</li>
                      <li>• プリキュア関連楽曲のみ自動抽出されます</li>
                      <li>• 楽曲情報はSpotify APIで検証・補完されます</li>
                    </ul>
                  </div>
                </div>
              ) : (
                /* インポート結果表示 */
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">インポート内容の確認</h3>
                    
                    {/* プレイリスト情報 */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-bold text-gray-800">{importData.playlist.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{importData.playlist.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>作成者: {importData.playlist.creator?.display_name || '不明'}</span>
                        <span>エクスポート日: {new Date(importData.meta.export_date).toLocaleDateString('ja-JP')}</span>
                      </div>
                    </div>

                    {/* 統計情報 */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{importData.original_count}</div>
                        <div className="text-sm text-gray-600">元の楽曲数</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{importData.filtered_count}</div>
                        <div className="text-sm text-gray-600">プリキュア楽曲</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round((importData.filtered_count / importData.original_count) * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">一致率</div>
                      </div>
                    </div>

                    {/* 楽曲プレビュー */}
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-800 mb-3">
                        インポート対象楽曲 ({importData.filtered_count}曲)
                      </h4>
                      <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                        {importData.tracks.slice(0, 10).map((track, index) => (
                          <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded border">
                            {(track.album?.images?.[0] || track.album_art) && (
                              <img
                                src={track.album?.images?.[0]?.url || track.album_art}
                                alt={track.album?.name || track.album_name}
                                className="w-10 h-10 rounded object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{track.name}</p>
                              <p className="text-xs text-gray-600 truncate">
                                {Array.isArray(track.artists) 
                                  ? track.artists.map(a => typeof a === 'string' ? a : a.name).join(', ')
                                  : track.artist || '不明なアーティスト'
                                }
                              </p>
                            </div>
                          </div>
                        ))}
                        {importData.tracks.length > 10 && (
                          <div className="text-center text-sm text-gray-500 py-2">
                            他 {importData.tracks.length - 10} 曲...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* インポート方法選択 */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-800">インポート方法を選択</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={() => executeImport('create_new')}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg transition-colors text-left"
                        >
                          <div className="flex items-center space-x-3">
                            <Plus size={24} />
                            <div>
                              <div className="font-medium">新しいプレイリスト作成</div>
                              <div className="text-sm text-blue-100">
                                "{importData.playlist.name} (インポート)" として作成
                              </div>
                            </div>
                          </div>
                        </button>

                        {playlist && (
                          <button
                            onClick={() => executeImport('add_to_existing')}
                            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg transition-colors text-left"
                          >
                            <div className="flex items-center space-x-3">
                              <Music size={24} />
                              <div>
                                <div className="font-medium">既存プレイリストに追加</div>
                                <div className="text-sm text-green-100">
                                  "{playlist.name}" に楽曲を追加
                                </div>
                              </div>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 警告・注意事項 */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-2">⚠️ 注意事項</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• 楽曲情報はSpotify APIで検索・照合されます</li>
                        <li>• 一部の楽曲が見つからない場合があります</li>
                        <li>• 重複楽曲は自動的にスキップされます</li>
                        <li>• インポート後に楽曲の確認をお勧めします</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}