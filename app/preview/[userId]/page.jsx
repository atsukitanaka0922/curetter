// app/preview/[userId]/page.jsx - Part 1: インポート・初期設定・テンプレート定義
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Heart, Star, Sparkles, User, Image as ImageIcon, CreditCard, ExternalLink, Calendar, QrCode, ArrowLeft, Home, Edit, Music, Play, Clock, Globe, Lock } from 'lucide-react'

// Supabaseクライアント
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function PreviewPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState(null)
  const [images, setImages] = useState([])
  const [digitalCard, setDigitalCard] = useState(null)
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [episodeTypesData, setEpisodeTypesData] = useState([])
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [currentSession, setCurrentSession] = useState(null)

  const userId = params.userId

  // 最新のプリキュアテンプレート（デジタル名刺用）
  const cardTemplates = {
    precure_classic: {
      name: 'クラシックプリキュア',
      background: 'linear-gradient(135deg, #ff6b9d 0%, #c44cd9 50%, #6fa7ff 100%)',
      textColor: '#ffffff',
      accentColor: '#ffffff',
      decorativeElements: {
        pattern: 'sparkles'
      }
    },
    cure_black_white: {
      name: 'ふたりはプリキュア',
      background: 'linear-gradient(135deg, #000000 0%, #4a4a4a 50%, #ffffff 100%)',
      textColor: '#ffffff',
      accentColor: '#ff69b4',
      decorativeElements: {
        pattern: 'hearts'
      }
    },
    splash_star: {
      name: 'スプラッシュスター',
      background: 'linear-gradient(135deg, #ff9a56 0%, #ff6b9d 50%, #c44cd9 100%)',
      textColor: '#ffffff',
      accentColor: '#ffd700',
      decorativeElements: {
        pattern: 'stars'
      }
    },
    heartcatch: {
      name: 'ハートキャッチプリキュア',
      background: 'linear-gradient(135deg, #e91e63 0%, #9c27b0 50%, #2196f3 100%)',
      textColor: '#ffffff',
      accentColor: '#ffeb3b',
      decorativeElements: {
        pattern: 'flowers'
      }
    },
    smile: {
      name: 'スマイルプリキュア',
      background: 'linear-gradient(135deg, #ffeb3b 0%, #ff9800 25%, #e91e63 50%, #9c27b0 75%, #2196f3 100%)',
      textColor: '#ffffff',
      accentColor: '#ffffff',
      decorativeElements: {
        pattern: 'rainbow'
      }
    },
    tropical: {
      name: 'トロピカル〜ジュ！プリキュア',
      background: 'linear-gradient(135deg, #00bcd4 0%, #4caf50 33%, #ffeb3b 66%, #ff9800 100%)',
      textColor: '#ffffff',
      accentColor: '#ffffff',
      decorativeElements: {
        pattern: 'waves'
      }
    }
  }

  // 装飾パターン（SVG）
  const decorativePatterns = {
    sparkles: (
      <defs>
        <pattern id="sparkles" patternUnits="userSpaceOnUse" width="100" height="100">
          <circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.3" />
          <circle cx="80" cy="40" r="1.5" fill="currentColor" opacity="0.4" />
          <circle cx="60" cy="80" r="1" fill="currentColor" opacity="0.5" />
          <circle cx="30" cy="70" r="1.5" fill="currentColor" opacity="0.3" />
          <circle cx="90" cy="15" r="1" fill="currentColor" opacity="0.4" />
        </pattern>
      </defs>
    ),
    hearts: (
      <defs>
        <pattern id="hearts" patternUnits="userSpaceOnUse" width="80" height="80">
          <path d="M25,35 C25,25 35,20 40,30 C45,20 55,25 55,35 C55,45 40,60 40,60 C40,60 25,45 25,35" 
                fill="currentColor" opacity="0.2" />
        </pattern>
      </defs>
    ),
    stars: (
      <defs>
        <pattern id="stars" patternUnits="userSpaceOnUse" width="60" height="60">
          <polygon points="30,10 35,20 45,20 37,28 40,38 30,33 20,38 23,28 15,20 25,20" 
                   fill="currentColor" opacity="0.25" />
        </pattern>
      </defs>
    ),
    flowers: (
      <defs>
        <pattern id="flowers" patternUnits="userSpaceOnUse" width="70" height="70">
          <circle cx="35" cy="35" r="8" fill="currentColor" opacity="0.2" />
          <circle cx="27" cy="27" r="4" fill="currentColor" opacity="0.3" />
          <circle cx="43" cy="27" r="4" fill="currentColor" opacity="0.3" />
          <circle cx="27" cy="43" r="4" fill="currentColor" opacity="0.3" />
          <circle cx="43" cy="43" r="4" fill="currentColor" opacity="0.3" />
        </pattern>
      </defs>
    ),
    rainbow: (
      <defs>
        <pattern id="rainbow" patternUnits="userSpaceOnUse" width="200" height="100">
          <path d="M0,80 Q100,20 200,80" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.3" />
          <path d="M0,85 Q100,25 200,85" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.4" />
        </pattern>
      </defs>
    ),
    waves: (
      <defs>
        <pattern id="waves" patternUnits="userSpaceOnUse" width="100" height="50">
          <path d="M0,25 Q25,10 50,25 T100,25" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3" />
          <path d="M0,35 Q25,20 50,35 T100,35" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
        </pattern>
      </defs>
    )
  }

  // Part 2: useEffect・データ取得関数

  useEffect(() => {
    if (userId) {
      checkSession()
      loadUserData()
      getEpisodeTypesData()
    }
  }, [userId])

  // セッション確認（自分のプロフィールかチェック）
  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentSession(session)
      setIsOwnProfile(session?.user?.id === userId)
    } catch (error) {
      console.error('セッション確認エラー:', error)
    }
  }

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
          
          return uniqueEpisodes.slice(0, 3) // 3個まで制限
        }

        const processedProfile = {
          ...profileData,
          favorite_character: processArrayData(profileData.favorite_character),
          favorite_series: processArrayData(profileData.favorite_series),
          favorite_movie: processArrayData(profileData.favorite_movie),
          favorite_episode: processEpisodeData(profileData.favorite_episode),
          watched_series: processArrayData(profileData.watched_series)
        }

        setProfile(processedProfile)

        // 画像ギャラリー取得
        if (profileData.image_urls && Array.isArray(profileData.image_urls)) {
          setImages(profileData.image_urls.map(url => ({ url })))
        }

        // デジタル名刺取得
        const { data: cardData } = await supabase
          .from('digital_cards')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (cardData) {
          setDigitalCard(cardData)
        }

        // プレイリスト取得（公開のみ）
        const { data: playlistData } = await supabase
          .from('local_playlists')
          .select('*')
          .eq('user_id', userId)
          .eq('is_public', true)
          .order('created_at', { ascending: false })

        if (playlistData) {
          setPlaylists(playlistData)
        }

      } else {
        throw new Error('プロフィールが見つかりません')
      }
    } catch (error) {
      console.error('ユーザーデータ取得エラー:', error)
      setError(error.message)
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

  // 総再生時間計算
  const getTotalDuration = (tracks) => {
    const totalMs = tracks?.reduce((sum, track) => sum + (track.duration_ms || 0), 0) || 0
    const hours = Math.floor(totalMs / 3600000)
    const minutes = Math.floor((totalMs % 3600000) / 60000)
    return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`
  }

  // Part 3: ローディング・エラー表示・ヘッダー

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">プロフィールを読み込み中...</p>
        </div>
      </div>
    )
  }

  // エラー時
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">プロフィールが見つかりません</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
          >
            <Home size={20} />
            <span>ホームに戻る</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg sticky top-0 z-40">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
              >
                <ArrowLeft size={20} />
                <span>戻る</span>
              </button>
              <div className="w-px h-6 bg-gray-300"></div>
              <h1 className="text-xl font-bold text-gray-800">
                {profile?.display_name || 'プリキュアファン'} のプロフィール
              </h1>
              {isOwnProfile && (
                <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                  あなたのプロフィール
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {isOwnProfile && (
                <button
                  onClick={() => router.push('/')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Edit size={16} />
                  <span>編集モードに戻る</span>
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
              >
                <Home size={20} />
                <span>ホーム</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* プロフィールヘッダー */}
        <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-2xl p-6 text-white mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="プロフィール画像"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <User size={40} className="text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {profile?.display_name || 'プリキュアファン'}
              </h1>
              <p className="text-white/80">プリキュアファンのプロフィール</p>
              <div className="flex items-center space-x-4 mt-3 text-sm text-white/80">
                <span>登録日: {new Date(profile?.created_at).toLocaleDateString('ja-JP')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="flex overflow-x-auto">
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
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
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

        {/* Part 4: プロフィールタブ */}
        {/* コンテンツエリア */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {activeTab === 'profile' && (
            <div className="space-y-8">
              {/* フリー欄 */}
              {profile?.free_text && (
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">✨ フリー欄</h3>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{profile.free_text}</p>
                </div>
              )}

              {/* 基本情報 */}
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <User className="text-blue-500 mr-2" size={20} />
                  基本情報
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
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
                <div className="bg-rose-50 p-6 rounded-xl border border-rose-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Heart className="text-rose-500 mr-2" size={20} />
                    プリキュアの"ここ"が好き
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{profile.what_i_love}</p>
                </div>
              )}

              {/* 視聴済みシリーズ */}
              {(Array.isArray(profile?.watched_series) && profile.watched_series.length > 0) || profile?.all_series_watched ? (
                <div className="bg-cyan-50 p-6 rounded-xl border border-cyan-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Star className="text-cyan-500 mr-2" size={20} />
                    視聴済みシリーズ
                    {profile?.all_series_watched ? (
                      <span className="ml-3 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full">
                        🏆 全作視聴済み
                      </span>
                    ) : (
                      <span className="ml-3 text-sm text-gray-600">
                        ({profile.watched_series.length}作品)
                      </span>
                    )}
                  </h3>
                  {profile?.all_series_watched ? (
                    <div className="text-center py-6">
                      <div className="text-3xl mb-3">🎉</div>
                      <p className="text-cyan-700 font-medium text-lg">すべてのプリキュアシリーズを視聴済み！</p>
                      <p className="text-cyan-600 mt-2">真のプリキュアファンですね✨</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.watched_series.map((series, index) => (
                        <span key={index} className="inline-block px-3 py-1 bg-cyan-200 text-cyan-800 rounded-full text-sm">
                          {series}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {/* プリキュア情報グリッド */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* 好きなキャラクター */}
                <div className="bg-pink-50 p-6 rounded-xl border border-pink-100">
                  <div className="flex items-center space-x-2 mb-3">
                    <Heart className="text-pink-500" size={20} />
                    <h3 className="font-semibold text-gray-800">好きなキャラクター</h3>
                  </div>
                  <div className="text-gray-700">
                    {Array.isArray(profile?.favorite_character) && profile.favorite_character.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.favorite_character.map((char, index) => (
                          <span key={index} className="inline-block px-2 py-1 bg-pink-200 text-pink-800 rounded-full text-sm">
                            {char}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">未設定</p>
                    )}
                  </div>
                </div>

                {/* 好きなシリーズ */}
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                  <div className="flex items-center space-x-2 mb-3">
                    <Star className="text-purple-500" size={20} />
                    <h3 className="font-semibold text-gray-800">好きなシリーズ</h3>
                  </div>
                  <div className="text-gray-700">
                    {Array.isArray(profile?.favorite_series) && profile.favorite_series.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.favorite_series.map((series, index) => (
                          <span key={index} className="inline-block px-2 py-1 bg-purple-200 text-purple-800 rounded-full text-sm">
                            {series}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">未設定</p>
                    )}
                  </div>
                </div>

                {/* 好きな映画 */}
                <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100">
                  <div className="flex items-center space-x-2 mb-3">
                    <Sparkles className="text-yellow-500" size={20} />
                    <h3 className="font-semibold text-gray-800">好きな映画</h3>
                  </div>
                  <div className="text-gray-700">
                    {Array.isArray(profile?.favorite_movie) && profile.favorite_movie.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.favorite_movie.map((movie, index) => (
                          <span key={index} className="inline-block px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm">
                            {movie}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">未設定</p>
                    )}
                  </div>
                </div>

                {/* 好きなエピソード */}
                <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar className="text-green-500" size={20} />
                    <h3 className="font-semibold text-gray-800">好きなエピソード</h3>
                  </div>
                  <div className="text-gray-700">
                    {Array.isArray(profile?.favorite_episode) && profile.favorite_episode.length > 0 ? (
                      <div className="space-y-2">
                        {profile.favorite_episode.map((episode, index) => (
                          <div key={index} className="p-2 bg-green-200 text-green-800 rounded-lg text-sm">
                            {episode}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">未設定</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ソーシャルリンク */}
              {profile?.social_links && Array.isArray(profile.social_links) && profile.social_links.length > 0 && (
                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <ExternalLink className="text-indigo-500 mr-2" size={20} />
                    ソーシャルリンク
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {profile.social_links.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg transition-colors"
                      >
                        <ExternalLink size={16} />
                        <span>{link.display_name || link.platform}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'gallery' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">ギャラリー</h2>
              {images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group cursor-pointer" onClick={() => setSelectedImage(image)}>
                      <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-md">
                        <img
                          src={image.url}
                          alt={`ギャラリー画像 ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">画像がありません</h3>
                  <p className="text-gray-500">まだ画像がアップロードされていません</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'playlists' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">公開プレイリスト</h2>
              {playlists.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {playlists.map((playlist) => (
                    <div 
                      key={playlist.id} 
                      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                      onClick={() => {
                        setSelectedPlaylist(playlist)
                        setShowPlaylistModal(true)
                      }}
                    >
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
                                    alt={track.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-white/20 flex items-center justify-center">
                                    <Music size={20} className="text-white/60" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Music size={48} className="text-white/30" />
                          </div>
                        )}

                        {/* 公開設定表示 */}
                        <div className="absolute top-3 right-3">
                          <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-100 border border-green-400/30">
                            <Globe size={12} />
                            <span>公開</span>
                          </div>
                        </div>

                        {/* プレイボタン */}
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                          <div className="bg-white/20 hover:bg-white/30 rounded-full p-3 backdrop-blur-sm transition-colors">
                            <Play size={24} className="text-white" />
                          </div>
                        </div>
                      </div>

                      {/* プレイリスト情報 */}
                      <div className="p-4">
                        <h3 className="font-bold text-gray-800 mb-2 truncate">{playlist.name}</h3>
                        {playlist.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{playlist.description}</p>
                        )}
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>{playlist.tracks?.length || 0} 曲</span>
                          <span>{getTotalDuration(playlist.tracks)}</span>
                        </div>
                        
                        {/* 楽曲プレビュー */}
                        {playlist.tracks && playlist.tracks.length > 0 && (
                          <div className="mt-3 space-y-1 max-h-20 overflow-hidden">
                            {playlist.tracks.slice(0, 3).map((track, index) => (
                              <div key={track.id} className="text-xs text-gray-500 truncate">
                                {index + 1}. {track.name} - {track.artists?.map(a => a.name).join(', ')}
                              </div>
                            ))}
                            {playlist.tracks.length > 3 && (
                              <div className="text-xs text-gray-400">
                                他 {playlist.tracks.length - 3} 曲...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Music size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">公開プレイリストがありません</h3>
                  <p className="text-gray-500">まだ公開プレイリストが作成されていません</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'card' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">デジタル名刺</h2>
              {digitalCard ? (
                <div className="max-w-2xl mx-auto">
                  <div className="flex justify-center mb-8">
                    <div 
                      className="relative rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300"
                      style={{
                        width: 'min(600px, calc(100vw - 3rem))',
                        aspectRatio: '91/55',
                        background: digitalCard.card_data?.customBackground || 
                                   cardTemplates[digitalCard.card_data?.templateId]?.background || 
                                   cardTemplates.precure_classic.background
                      }}
                    >
                      {/* 装飾パターンのSVGオーバーレイ */}
                      {digitalCard.card_data?.templateId && cardTemplates[digitalCard.card_data.templateId]?.decorativeElements && (
                        <svg 
                          className="absolute inset-0 w-full h-full pointer-events-none z-5"
                          style={{ color: cardTemplates[digitalCard.card_data.templateId].accentColor }}
                        >
                          {decorativePatterns[cardTemplates[digitalCard.card_data.templateId].decorativeElements.pattern]}
                          <rect 
                            width="100%" 
                            height="100%" 
                            fill={`url(#${cardTemplates[digitalCard.card_data.templateId].decorativeElements.pattern})`}
                          />
                        </svg>
                      )}

                      {/* 背景画像 */}
                      {digitalCard.card_data?.backgroundType === 'image' && digitalCard.card_data?.backgroundImage && (
                        <div 
                          className="absolute inset-0 z-10"
                          style={{
                            backgroundImage: `url(${digitalCard.card_data.backgroundImage})`,
                            backgroundSize: `${(digitalCard.card_data.imageSettings?.scale || 1) * 100}% auto`,
                            backgroundPosition: `${digitalCard.card_data.imageSettings?.positionX || 50}% ${digitalCard.card_data.imageSettings?.positionY || 50}%`,
                            backgroundRepeat: 'no-repeat',
                            transform: `rotate(${digitalCard.card_data.imageSettings?.rotation || 0}deg)`,
                            opacity: digitalCard.card_data.imageSettings?.opacity || 1,
                            mixBlendMode: digitalCard.card_data.useImageEffect ? 'multiply' : 'normal'
                          }}
                        />
                      )}

                      {/* コンテンツ */}
                      <div className="relative z-20 h-full flex items-center justify-between p-8">
                        <div className="flex-1">
                          <h2 
                            className="text-2xl font-bold mb-1"
                            style={{ 
                              color: digitalCard.card_data?.customTextColor || 
                                     cardTemplates[digitalCard.card_data?.templateId]?.textColor || 
                                     '#ffffff',
                              textShadow: digitalCard.card_data?.backgroundType === 'image' && !digitalCard.card_data?.useImageEffect ? 
                                         '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
                            }}
                          >
                            {digitalCard.card_data?.name || profile?.display_name || 'プリキュアファン'}
                          </h2>
                          {digitalCard.card_data?.favoriteCharacter && (
                            <p 
                              className="text-lg opacity-90 mb-2"
                              style={{ 
                                color: digitalCard.card_data?.customTextColor || 
                                       cardTemplates[digitalCard.card_data?.templateId]?.textColor || 
                                       '#ffffff',
                                textShadow: digitalCard.card_data?.backgroundType === 'image' && !digitalCard.card_data?.useImageEffect ? 
                                           '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
                              }}
                            >
                              最推し: {digitalCard.card_data.favoriteCharacter}
                            </p>
                          )}
                          <p 
                            className="text-sm opacity-80"
                            style={{ 
                              color: digitalCard.card_data?.customTextColor || 
                                     cardTemplates[digitalCard.card_data?.templateId]?.textColor || 
                                     '#ffffff',
                              textShadow: digitalCard.card_data?.backgroundType === 'image' && !digitalCard.card_data?.useImageEffect ? 
                                         '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
                            }}
                          >
                            Precure Profile Card
                          </p>
                        </div>
                        
                        <div className="bg-white p-3 rounded-lg shadow-lg">
                          <div className="w-16 h-16 bg-gray-200 flex items-center justify-center">
                            <QrCode size={24} className="text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {/* グラデーションオーバーレイ */}
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/10 z-10"></div>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-gray-600">
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

      {/* プレイリスト詳細モーダル */}
      {showPlaylistModal && selectedPlaylist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* ヘッダー */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
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
                    <h3 className="text-xl font-bold mb-1">{selectedPlaylist.name}</h3>
                    <p className="text-white/80 text-sm">
                      {selectedPlaylist.description || 'プリキュア楽曲のプレイリスト'}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-white/80">
                      <span>{selectedPlaylist.tracks?.length || 0} 曲</span>
                      <span>{getTotalDuration(selectedPlaylist.tracks)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowPlaylistModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <ArrowLeft size={24} />
                </button>
              </div>
            </div>

            {/* 楽曲リスト */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 ? (
                <div className="space-y-3">
                  {selectedPlaylist.tracks.map((track, index) => (
                    <div key={track.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="text-sm text-gray-500 w-8 text-center">
                        {index + 1}
                      </div>
                      
                      {/* アルバムアート */}
                      <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        {track.album?.images?.[0] ? (
                          <img 
                            src={track.album.images[0].url} 
                            alt={track.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music size={16} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{track.name}</h4>
                        <p className="text-sm text-gray-600 truncate">
                          {track.artists?.map(artist => artist.name).join(', ')}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {track.album?.name}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {formatDuration(track.duration_ms)}
                        </span>
                        
                        {track.external_urls?.spotify && (
                          <a
                            href={track.external_urls.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-500 hover:text-green-600 transition-colors"
                            title="Spotifyで開く"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                        
                        {track.preview_url && (
                          <button
                            onClick={() => {
                              const audio = new Audio(track.preview_url)
                              audio.play().catch(e => console.log('プレビュー再生エラー:', e))
                            }}
                            className="text-indigo-500 hover:text-indigo-600 transition-colors"
                            title="プレビュー再生"
                          >
                            <Play size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Music size={48} className="mx-auto text-gray-300 mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">楽曲がありません</h4>
                  <p className="text-gray-500">このプレイリストには楽曲が含まれていません</p>
                </div>
              )}
            </div>

            {/* フッター */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>作成日: {new Date(selectedPlaylist.created_at).toLocaleDateString('ja-JP')}</span>
                <span>最終更新: {new Date(selectedPlaylist.updated_at).toLocaleDateString('ja-JP')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 画像拡大モーダル */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10 bg-black/20 rounded-full p-2"
            >
              ×
            </button>
            <img
              src={selectedImage.url}
              alt="拡大画像"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}