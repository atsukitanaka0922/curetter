// components/UserPreview.jsx - 拡張版（妖精・ソーシャル・プレイリスト・ギャラリー対応）
'use client'

import { useState, useEffect } from 'react'
import { Heart, Star, Sparkles, User, Image as ImageIcon, CreditCard, ExternalLink, Calendar, QrCode, X, ArrowLeft, Music, Globe, Lock, Play, Clock, Users } from 'lucide-react'
import { supabase } from '../app/page'

export default function UserPreview({ userId, onClose }) {
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState(null)
  const [images, setImages] = useState([])
  const [digitalCard, setDigitalCard] = useState(null)
  const [socialLinks, setSocialLinks] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [episodeTypesData, setEpisodeTypesData] = useState([])

  // プリキュアテンプレート（名刺用）
  const cardTemplates = {
    precure_classic: {
      name: 'クラシックプリキュア',
      background: 'linear-gradient(135deg, #ff6b9d 0%, #c44cd9 50%, #6fa7ff 100%)',
      textColor: '#ffffff',
      accentColor: '#ffffff'
    },
    cure_black_white: {
      name: 'ふたりはプリキュア',
      background: 'linear-gradient(135deg, #000000 0%, #4a4a4a 50%, #ffffff 100%)',
      textColor: '#ffffff',
      accentColor: '#ff69b4'
    },
    splash_star: {
      name: 'スプラッシュスター',
      background: 'linear-gradient(135deg, #ff9a56 0%, #ff6b9d 50%, #c44cd9 100%)',
      textColor: '#ffffff',
      accentColor: '#ffd700'
    },
    heartcatch: {
      name: 'ハートキャッチプリキュア',
      background: 'linear-gradient(135deg, #e91e63 0%, #9c27b0 50%, #2196f3 100%)',
      textColor: '#ffffff',
      accentColor: '#ffeb3b'
    },
    smile: {
      name: 'スマイルプリキュア',
      background: 'linear-gradient(135deg, #ffeb3b 0%, #ff9800 25%, #e91e63 50%, #9c27b0 75%, #2196f3 100%)',
      textColor: '#ffffff',
      accentColor: '#ffffff'
    },
    tropical: {
      name: 'トロピカル〜ジュ！プリキュア',
      background: 'linear-gradient(135deg, #00bcd4 0%, #4caf50 33%, #ffeb3b 66%, #ff9800 100%)',
      textColor: '#ffffff',
      accentColor: '#ffffff'
    }
  }

  // ソーシャルプラットフォームのアイコン設定
  const getPlatformIcon = (platform) => {
    const iconMap = {
      'X (Twitter)': (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      'YouTube': (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
      'Instagram': (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      'pixiv': (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.935 0A4.924 4.924 0 0 0 0 4.935v14.13A4.924 4.924 0 0 0 4.935 24h14.13A4.924 4.924 0 0 0 24 19.065V4.935A4.924 4.924 0 0 0 19.065 0zm8.5 5.5c2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5h-3v3h-2V5.5zm0 7c1.4 0 2.5-1.1 2.5-2.5s-1.1-2.5-2.5-2.5h-3v5z"/>
        </svg>
      ),
      'その他': <Globe className="w-4 h-4" />
    }
    return iconMap[platform] || <Globe className="w-4 h-4" />
  }

  useEffect(() => {
    if (userId) {
      loadUserData()
      getEpisodeTypesData()
    }
  }, [userId])

  // エピソード詳細データを取得
  const getEpisodeTypesData = async () => {
    try {
      const { data, error } = await supabase
        .from('episode_types')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      setEpisodeTypesData(data || [])
    } catch (error) {
      console.error('エピソードタイプデータ取得エラー:', error)
    }
  }

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError('')

      // プロフィール取得
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw new Error('プロフィールが見つかりません')
      }

      if (profileData) {
        // 配列データの処理
        const processArrayData = (data) => {
          if (Array.isArray(data)) {
            return data
          } else if (typeof data === 'string' && data.trim()) {
            return data.split(',').map(s => s.trim()).filter(s => s.length > 0)
          }
          return []
        }

        // エピソードデータの処理（3個制限と重複除去）
        const processEpisodeData = (episodes) => {
          const processedEpisodes = processArrayData(episodes)
          const uniqueEpisodes = []
          const seenEpisodes = new Set()
          
          processedEpisodes.forEach(episode => {
            const cleanEpisodeName = episode.replace(/^第\d+話　/, '')
            if (!seenEpisodes.has(cleanEpisodeName)) {
              seenEpisodes.add(cleanEpisodeName)
              uniqueEpisodes.push(cleanEpisodeName)
            }
          })
          
          return uniqueEpisodes.slice(0, 3)
        }

        const processedProfile = {
          ...profileData,
          favorite_character: processArrayData(profileData.favorite_character),
          favorite_series: processArrayData(profileData.favorite_series),
          favorite_movie: processArrayData(profileData.favorite_movie),
          favorite_episode: processEpisodeData(profileData.favorite_episode),
          favorite_fairy: processArrayData(profileData.favorite_fairy),
          watched_series: processArrayData(profileData.watched_series)
        }

        setProfile(processedProfile)

        // ギャラリー画像取得
        const { data: imagesData, error: imagesError } = await supabase
          .from('user_images')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (imagesError && imagesError.code !== 'PGRST116') {
          console.error('画像取得エラー:', imagesError)
        } else {
          setImages(imagesData || [])
        }

        // デジタル名刺取得
        const { data: cardData, error: cardError } = await supabase
          .from('digital_cards')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (cardError && cardError.code !== 'PGRST116') {
          console.error('名刺取得エラー:', cardError)
        } else {
          setDigitalCard(cardData)
        }

        // ソーシャルリンク取得
        const { data: linksData, error: linksError } = await supabase
          .from('social_links')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })

        if (linksError && linksError.code !== 'PGRST116') {
          console.error('ソーシャルリンク取得エラー:', linksError)
        } else {
          setSocialLinks(linksData || [])
        }

        // 公開プレイリスト取得
        const { data: playlistsData, error: playlistsError } = await supabase
          .from('local_playlists')
          .select('*')
          .eq('user_id', userId)
          .eq('is_public', true)
          .order('created_at', { ascending: false })

        if (playlistsError && playlistsError.code !== 'PGRST116') {
          console.error('プレイリスト取得エラー:', playlistsError)
        } else {
          setPlaylists(playlistsData || [])
        }
      }
    } catch (error) {
      console.error('ユーザーデータ取得エラー:', error)
      setError(error.message || 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 相対時間表示
  const getRelativeTime = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffTime = now - date
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '今日'
    if (diffDays === 1) return '1日前'
    if (diffDays < 7) return `${diffDays}日前`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`
    return `${Math.floor(diffDays / 365)}年前`
  }

  // 総再生時間計算
  const getTotalDuration = (tracks) => {
    const totalMs = tracks?.reduce((sum, track) => sum + (track.duration_ms || 0), 0) || 0
    const hours = Math.floor(totalMs / 3600000)
    const minutes = Math.floor((totalMs % 3600000) / 60000)
    return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">プロフィールを読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">エラー</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="プロフィール画像"
                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <User size={32} className="text-white" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {profile?.display_name || 'プリキュアファン'}
                </h1>
                <p className="text-white/80 text-sm">プリキュアファンのプロフィール</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'profile', label: 'プロフィール', icon: User },
              { id: 'gallery', label: 'ギャラリー', icon: ImageIcon },
              { id: 'playlists', label: 'プレイリスト', icon: Music },
              { id: 'card', label: 'デジタル名刺', icon: CreditCard }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-pink-500 text-pink-600 bg-pink-50'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'profile' && (
            <div className="p-6 space-y-6">
              {/* フリー欄 */}
              {profile?.free_text && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">✨ フリー欄</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{profile.free_text}</p>
                </div>
              )}

              {/* 基本情報 */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <User className="text-blue-500 mr-2" size={20} />
                  基本情報
                </h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  {profile?.age && (
                    <div>
                      <span className="font-medium text-gray-600">年齢：</span>
                      <span className="text-gray-700">{profile.age}歳</span>
                    </div>
                  )}
                  {profile?.gender && (
                    <div>
                      <span className="font-medium text-gray-600">性別：</span>
                      <span className="text-gray-700">{profile.gender}</span>
                    </div>
                  )}
                  {profile?.fan_years && (
                    <div>
                      <span className="font-medium text-gray-600">ファン歴：</span>
                      <span className="text-gray-700">{profile.fan_years}年</span>
                    </div>
                  )}
                </div>
              </div>

              {/* プリキュアの"ここ"が好き */}
              {profile?.what_i_love && (
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    <Heart className="text-rose-500 mr-2" size={20} />
                    プリキュアの"ここ"が好き
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{profile.what_i_love}</p>
                </div>
              )}

              {/* 視聴済みシリーズ */}
              {(Array.isArray(profile?.watched_series) && profile.watched_series.length > 0) || profile?.all_series_watched ? (
                <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    <Star className="text-cyan-500 mr-2" size={20} />
                    視聴済みシリーズ
                    {profile?.all_series_watched ? (
                      <span className="ml-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full">
                        🏆 全作視聴済み
                      </span>
                    ) : (
                      <span className="ml-2 text-sm text-gray-600">
                        ({profile.watched_series.length}作品)
                      </span>
                    )}
                  </h3>
                  {profile?.all_series_watched ? (
                    <div className="text-center py-4">
                      <div className="text-2xl mb-2">🎉</div>
                      <p className="text-cyan-700 font-medium">すべてのプリキュアシリーズを視聴済み！</p>
                      <p className="text-cyan-600 text-sm mt-1">真のプリキュアファンですね✨</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {profile.watched_series.map((series, index) => (
                        <span key={index} className="inline-block px-2 py-1 bg-cyan-200 text-cyan-800 rounded-full text-xs">
                          {series}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {/* プリキュア情報 */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Heart className="text-pink-500" size={20} />
                    <h3 className="font-semibold text-gray-800">好きなキャラ</h3>
                  </div>
                  <div className="text-gray-700 text-sm">
                    {Array.isArray(profile?.favorite_character) && profile.favorite_character.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {profile.favorite_character.map((character, index) => (
                          <span key={index} className="inline-block px-2 py-1 bg-pink-200 text-pink-800 rounded-full text-xs">
                            {character}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">未設定</span>
                    )}
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="text-purple-500" size={20} />
                    <h3 className="font-semibold text-gray-800">好きなシリーズ</h3>
                  </div>
                  <div className="text-gray-700 text-sm">
                    {Array.isArray(profile?.favorite_series) && profile.favorite_series.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {profile.favorite_series.map((series, index) => (
                          <span key={index} className="inline-block px-2 py-1 bg-purple-200 text-purple-800 rounded-full text-xs">
                            {series}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">未設定</span>
                    )}
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="text-green-500" size={20} />
                    <h3 className="font-semibold text-gray-800">好きな映画</h3>
                  </div>
                  <div className="text-gray-700 text-sm">
                    {Array.isArray(profile?.favorite_movie) && profile.favorite_movie.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {profile.favorite_movie.map((movie, index) => (
                          <span key={index} className="inline-block px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs">
                            {movie}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">未設定</span>
                    )}
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="text-yellow-500" size={20} />
                    <h3 className="font-semibold text-gray-800">好きなエピソード</h3>
                  </div>
                  <div className="text-gray-700 text-sm">
                    {Array.isArray(profile?.favorite_episode) && profile.favorite_episode.length > 0 ? (
                      <div className="space-y-1">
                        {profile.favorite_episode.map((episode, index) => (
                          <div key={index} className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs">
                            {episode}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">未設定</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 好きな妖精 */}
              {Array.isArray(profile?.favorite_fairy) && profile.favorite_fairy.length > 0 && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="text-indigo-500" size={20} />
                    <h3 className="font-semibold text-gray-800">好きな妖精</h3>
                    <span className="text-sm text-gray-600">({profile.favorite_fairy.length}匹)</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {profile.favorite_fairy.map((fairy, index) => (
                      <span key={index} className="inline-block px-2 py-1 bg-indigo-200 text-indigo-800 rounded-full text-xs">
                        {fairy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ソーシャルリンク */}
              {socialLinks.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-2 mb-3">
                    <ExternalLink className="text-gray-500" size={20} />
                    <h3 className="font-semibold text-gray-800">ソーシャルリンク</h3>
                    <span className="text-sm text-gray-600">({socialLinks.length}件)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {socialLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                      >
                        <div className="flex-shrink-0 text-gray-600 group-hover:text-blue-600 transition-colors">
                          {getPlatformIcon(link.platform)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 text-sm truncate">
                            {link.display_name || link.platform}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {link.user_id || link.url}
                          </div>
                        </div>
                        <ExternalLink size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="p-6">
              {images.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">ギャラリー</h3>
                    <span className="text-sm text-gray-600">{images.length} 枚の画像</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className="relative group cursor-pointer"
                        onClick={() => setSelectedImage(image)}
                      >
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={image.image_url}
                            alt={image.caption || 'ギャラリー画像'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        {image.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 rounded-b-lg">
                            <p className="text-xs truncate">{image.caption}</p>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                            {getRelativeTime(image.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ImageIcon size={40} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">ギャラリーが空です</h3>
                  <p className="text-gray-600">まだ画像が投稿されていません</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'playlists' && (
            <div className="p-6">
              {playlists.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">公開プレイリスト</h3>
                    <span className="text-sm text-gray-600">{playlists.length} 個のプレイリスト</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    {playlists.map((playlist) => (
                      <div
                        key={playlist.id}
                        className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                        onClick={() => {
                          setSelectedPlaylist(playlist)
                          setShowPlaylistModal(true)
                        }}
                      >
                        {/* プレイリストカバー */}
                        <div className="h-40 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 relative">
                          {playlist.tracks && playlist.tracks.length > 0 ? (
                            <div className="grid grid-cols-2 gap-1 h-full p-2">
                              {playlist.tracks.slice(0, 4).map((track, index) => (
                                <div key={index} className="bg-white/10 rounded-lg overflow-hidden">
                                  {track.album?.images?.[0] ? (
                                    <img 
                                      src={track.album.images[0].url} 
                                      alt={track.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-white/20 flex items-center justify-center">
                                      <Music size={16} className="text-white/60" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Music size={32} className="text-white/30" />
                            </div>
                          )}

                          {/* 公開マーク */}
                          <div className="absolute top-2 right-2">
                            <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 text-green-100 border border-green-400/30 rounded-full text-xs font-medium">
                              <Globe size={10} />
                              <span>公開</span>
                            </div>
                          </div>

                          {/* プレイボタン */}
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                            <div className="bg-white/20 hover:bg-white/30 rounded-full p-2 backdrop-blur-sm transition-colors">
                              <Play size={20} className="text-white" />
                            </div>
                          </div>
                        </div>

                        {/* プレイリスト情報 */}
                        <div className="p-4">
                          <h4 className="font-bold text-gray-800 mb-1 truncate">{playlist.name}</h4>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {playlist.description || 'プリキュア楽曲のプレイリスト'}
                          </p>
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <div className="flex items-center space-x-3">
                              <span className="flex items-center space-x-1">
                                <Music size={14} />
                                <span>{playlist.tracks?.length || 0} 曲</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock size={14} />
                                <span>{getTotalDuration(playlist.tracks)}</span>
                              </span>
                            </div>
                            <span>{getRelativeTime(playlist.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Music size={40} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">公開プレイリストがありません</h3>
                  <p className="text-gray-600">このユーザーはまだプレイリストを公開していません</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'card' && (
            <div className="p-6">
              {digitalCard ? (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">デジタル名刺</h3>
                  
                  {/* 名刺プレビュー */}
                  <div className="flex justify-center">
                    <div className="w-80 h-48 rounded-2xl shadow-2xl overflow-hidden relative">
                      {/* 背景 */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: digitalCard.backgroundType === 'image' && digitalCard.backgroundImageUrl
                            ? `url(${digitalCard.backgroundImageUrl})`
                            : digitalCard.customBackground || cardTemplates[digitalCard.templateId]?.background || cardTemplates.precure_classic.background,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />

                      {/* 背景画像の調整 */}
                      {digitalCard.backgroundType === 'image' && digitalCard.backgroundImageUrl && digitalCard.imageSettings && (
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `url(${digitalCard.backgroundImageUrl})`,
                            backgroundSize: digitalCard.imageSettings.scale ? `${digitalCard.imageSettings.scale * 100}%` : 'cover',
                            backgroundPosition: digitalCard.imageSettings.positionX && digitalCard.imageSettings.positionY 
                              ? `${digitalCard.imageSettings.positionX}% ${digitalCard.imageSettings.positionY}%` 
                              : 'center',
                            opacity: digitalCard.imageSettings.opacity || 1,
                            transform: digitalCard.imageSettings.rotation ? `rotate(${digitalCard.imageSettings.rotation}deg)` : 'none'
                          }}
                        />
                      )}

                      {/* エフェクトオーバーレイ */}
                      {digitalCard.useImageEffect && digitalCard.backgroundType === 'image' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-blue-500/30"></div>
                      )}

                      {/* コンテンツ */}
                      <div className="relative z-20 h-full flex flex-col justify-between p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 
                              className="text-xl font-bold mb-1"
                              style={{ 
                                color: digitalCard.customTextColor || cardTemplates[digitalCard.templateId]?.textColor || '#ffffff',
                                textShadow: digitalCard.backgroundType === 'image' && !digitalCard.useImageEffect ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
                              }}
                            >
                              {profile?.display_name || 'プリキュアファン'}
                            </h2>
                            <p 
                              className="text-sm opacity-80"
                              style={{ 
                                color: digitalCard.customTextColor || cardTemplates[digitalCard.templateId]?.textColor || '#ffffff',
                                textShadow: digitalCard.backgroundType === 'image' && !digitalCard.useImageEffect ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
                              }}
                            >
                              プリキュアファン
                            </p>
                            <p 
                              className="text-xs opacity-80"
                              style={{ 
                                color: digitalCard.customTextColor || cardTemplates[digitalCard.templateId]?.textColor || '#ffffff',
                                textShadow: digitalCard.backgroundType === 'image' && !digitalCard.useImageEffect ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
                              }}
                            >
                              Precure Profile Card
                            </p>
                          </div>
                          
                          <div className="bg-white p-2 rounded-lg shadow-lg">
                            <div className="w-12 h-12 bg-gray-200 flex items-center justify-center">
                              <QrCode size={20} className="text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 全体のグラデーションオーバーレイ */}
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/10 z-10"></div>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      素敵な名刺ですね！✨
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CreditCard size={40} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">デジタル名刺がありません</h3>
                  <p className="text-gray-600">このユーザーはまだデジタル名刺を作成していません</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 画像拡大モーダル */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
            >
              <X size={24} />
            </button>
            <img
              src={selectedImage.image_url}
              alt={selectedImage.caption || 'ギャラリー画像'}
              className="w-full h-full object-contain rounded-lg"
            />
            {selectedImage.caption && (
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded-lg">
                <p className="text-sm">{selectedImage.caption}</p>
                <p className="text-xs text-gray-300 mt-1">
                  投稿日: {new Date(selectedImage.created_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* プレイリスト詳細モーダル */}
      {showPlaylistModal && selectedPlaylist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            {/* ヘッダー */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-t-2xl flex-shrink-0">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-bold">{selectedPlaylist.name}</h3>
                    <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 text-green-100 border border-green-400/30 rounded-full text-xs font-medium">
                      <Globe size={10} />
                      <span>公開</span>
                    </div>
                  </div>
                  <p className="text-white/80 text-sm">
                    {selectedPlaylist.description || 'プリキュア楽曲のプレイリスト'}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-white/80">
                    <span>{selectedPlaylist.tracks?.length || 0} 曲</span>
                    <span>{getTotalDuration(selectedPlaylist.tracks)}</span>
                    <span>作成: {getRelativeTime(selectedPlaylist.created_at)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowPlaylistModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 楽曲リスト */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 ? (
                <div className="space-y-2">
                  {selectedPlaylist.tracks.map((track, index) => (
                    <div key={track.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="text-sm text-gray-500 w-6 text-center">
                        {index + 1}
                      </div>
                      
                      {track.album?.images?.[0] && (
                        <img 
                          src={track.album.images[0].url} 
                          alt={track.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">{track.name}</h4>
                        <p className="text-xs text-gray-600 truncate">
                          {track.artists?.map(artist => artist.name).join(', ')} • {track.album?.name}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                        </span>
                        
                        {track.external_urls?.spotify && (
                          <a
                            href={track.external_urls.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-500 hover:text-green-600 transition-colors"
                            title="Spotifyで開く"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Music size={32} className="mx-auto text-gray-300 mb-2" />
                  <h4 className="font-medium text-gray-600 mb-1">楽曲がありません</h4>
                  <p className="text-sm text-gray-500">このプレイリストには楽曲が追加されていません</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}