// app/preview/[userId]/page.jsx - Part 1: インポート・初期設定・定数定義
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Heart, Star, Sparkles, User, Image as ImageIcon, CreditCard, ExternalLink, Calendar, QrCode, ArrowLeft, Home, Edit, Music, Play, Clock, Globe, Lock } from 'lucide-react'
import { getRandomTransformationPhrase } from '../../../utils/precureLoadingMessages'

// Supabaseクライアント
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// プリキュアクレスト（全作品分）
const precureCrests = [
  { id: 'futari_wa', name: 'ふたりはプリキュア', url: '/crests/futari_wa.png' },
  { id: 'max_heart', name: 'ふたりはプリキュア Max Heart', url: '/crests/max_heart.png' },
  { id: 'splash_star', name: 'ふたりはプリキュア Splash☆Star', url: '/crests/splash_star.png' },
  { id: 'yes_precure5', name: 'Yes!プリキュア5', url: '/crests/yes_precure5.png' },
  { id: 'yes_precure5_gogo', name: 'Yes!プリキュア5GoGo!', url: '/crests/yes_precure5_gogo.png' },
  { id: 'fresh', name: 'フレッシュプリキュア!', url: '/crests/fresh.png' },
  { id: 'heartcatch', name: 'ハートキャッチプリキュア!', url: '/crests/heartcatch.png' },
  { id: 'suite', name: 'スイートプリキュア♪', url: '/crests/suite.png' },
  { id: 'smile', name: 'スマイルプリキュア!', url: '/crests/smile.png' },
  { id: 'dokidoki', name: 'ドキドキ!プリキュア', url: '/crests/dokidoki.png' },
  { id: 'happiness_charge', name: 'ハピネスチャージプリキュア!', url: '/crests/happiness_charge.png' },
  { id: 'go_princess', name: 'Go!プリンセスプリキュア', url: '/crests/go_princess.png' },
  { id: 'mahou_tsukai', name: '魔法つかいプリキュア!', url: '/crests/mahou_tsukai.png' },
  { id: 'kirakira', name: 'キラキラ☆プリキュアアラモード', url: '/crests/kirakira.png' },
  { id: 'hugtto', name: 'HUGっと!プリキュア', url: '/crests/hugtto.png' },
  { id: 'star_twinkle', name: 'スター☆トゥインクルプリキュア', url: '/crests/star_twinkle.png' },
  { id: 'healin_good', name: 'ヒーリングっど♥プリキュア', url: '/crests/healin_good.png' },
  { id: 'tropical_rouge', name: 'トロピカル〜ジュ!プリキュア', url: '/crests/tropical_rouge.png' },
  { id: 'delicious_party', name: 'デリシャスパーティ♡プリキュア', url: '/crests/delicious_party.png' },
  { id: 'hirogaru_sky', name: 'ひろがるスカイ!プリキュア', url: '/crests/hirogaru_sky.png' },
  { id: 'wonderful_precure', name: 'わんだふるぷりきゅあ!', url: '/crests/wonderful_precure.png' }
]

// 画像フィルター効果
const imageFilters = [
  { id: 'none', name: 'フィルターなし', style: {} },
  {
    id: 'precure_rainbow',
    name: 'プリキュアレインボー',
    style: {
      background: 'linear-gradient(45deg, rgba(255, 105, 180, 0.8), rgba(147, 112, 219, 0.8), rgba(135, 206, 235, 0.8), rgba(255, 215, 0, 0.8))',
      mixBlendMode: 'overlay'
    }
  },
  {
    id: 'pink_dream',
    name: 'ピンクドリーム',
    style: {
      background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.7), rgba(255, 105, 180, 0.7))',
      mixBlendMode: 'multiply'
    }
  },
  {
    id: 'magical_purple',
    name: 'マジカルパープル',
    style: {
      background: 'linear-gradient(135deg, rgba(147, 112, 219, 0.7), rgba(138, 43, 226, 0.7))',
      mixBlendMode: 'overlay'
    }
  },
  {
    id: 'sky_blue',
    name: 'スカイブルー',
    style: {
      background: 'linear-gradient(135deg, rgba(135, 206, 235, 0.7), rgba(65, 105, 225, 0.7))',
      mixBlendMode: 'multiply'
    }
  },
  {
    id: 'sunshine_yellow',
    name: 'サンシャインイエロー',
    style: {
      background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.7), rgba(255, 165, 0, 0.7))',
      mixBlendMode: 'multiply'
    }
  },
  {
    id: 'fresh_green',
    name: 'フレッシュグリーン',
    style: {
      background: 'linear-gradient(135deg, rgba(144, 238, 144, 0.7), rgba(34, 139, 34, 0.7))',
      mixBlendMode: 'multiply'
    }
  },
  {
    id: 'crystal_clear',
    name: 'クリスタルクリア',
    style: {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(230, 230, 250, 0.3))',
      mixBlendMode: 'soft-light'
    }
  },
  {
    id: 'vintage_sepia',
    name: 'ビンテージセピア',
    style: {
      background: 'linear-gradient(135deg, rgba(160, 82, 45, 0.4), rgba(210, 180, 140, 0.4))',
      mixBlendMode: 'multiply'
    }
  }
]

// プリキュアマークのデフォルト
const defaultPrecureMarks = [
  { id: 'heart', name: 'ハート', component: Heart },
  { id: 'star', name: 'スター', component: Star },
  { id: 'sparkles', name: 'スパークル', component: Sparkles }
]

// 最新のプリキュアテンプレート（デジタル名刺用）
const cardTemplates = {
  precure_classic: {
    name: 'クラシックプリキュア',
    background: 'linear-gradient(135deg, #ff6b9d 0%, #c44cd9 50%, #6fa7ff 100%)',
    textColor: '#ffffff',
    accentColor: '#ffffff',
    decorativeElements: { pattern: 'sparkles' }
  },
  cure_black_white: {
    name: 'ふたりはプリキュア',
    background: 'linear-gradient(135deg, #000000 0%, #4a4a4a 50%, #ffffff 100%)',
    textColor: '#ffffff',
    accentColor: '#ff69b4',
    decorativeElements: { pattern: 'hearts' }
  },
  splash_star: {
    name: 'Splash☆Star',
    background: 'linear-gradient(135deg, #ffb74d 0%, #ff9800 50%, #e65100 100%)',
    textColor: '#ffffff',
    accentColor: '#fff3e0',
    decorativeElements: { pattern: 'stars' }
  },
  yes_precure5: {
    name: 'Yes!プリキュア5',
    background: 'linear-gradient(135deg, #e91e63 0%, #9c27b0 50%, #673ab7 100%)',
    textColor: '#ffffff',
    accentColor: '#fce4ec',
    decorativeElements: { pattern: 'flowers' }
  },
  fresh: {
    name: 'フレッシュプリキュア!',
    background: 'linear-gradient(135deg, #ff4081 0%, #ff6ec7 50%, #ffb3ff 100%)',
    textColor: '#ffffff',
    accentColor: '#fff',
    decorativeElements: { pattern: 'clover' }
  },
  heartcatch: {
    name: 'ハートキャッチプリキュア!',
    background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 50%, #cddc39 100%)',
    textColor: '#ffffff',
    accentColor: '#f1f8e9',
    decorativeElements: { pattern: 'nature' }
  }
}

// app/preview/[userId]/page.jsx - Part 2: メインコンポーネント・状態管理・useEffect

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
  const [userBackground, setUserBackground] = useState(null)
  
  // プリキュア変身セリフローディング用
  const [loadingMessage, setLoadingMessage] = useState(getRandomTransformationPhrase())

  const userId = params.userId

  // ローディング中にメッセージを変更
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingMessage(getRandomTransformationPhrase())
      }, 3000) // 3秒ごとに変身セリフを変更
      return () => clearInterval(interval)
    }
  }, [loading])

  useEffect(() => {
    if (userId) {
      checkSession()
      loadUserData()
    }
  }, [userId])

  // セッション確認
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

  // app/preview/[userId]/page.jsx - Part 3: データ取得・ユーティリティ関数

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError('')
      setLoadingMessage(getRandomTransformationPhrase())

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
          favorite_fairy: processArrayData(profileData.favorite_fairy),
          watched_series: processArrayData(profileData.watched_series),
          social_links: Array.isArray(profileData.social_links) 
            ? profileData.social_links 
            : []
        }

        setProfile(processedProfile)
      }

      // デジタル名刺データ取得（新しいテーブル構造に対応）
      const { data: cardData, error: cardError } = await supabase
        .from('digital_cards')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (cardError && cardError.code !== 'PGRST116') {
        console.error('デジタル名刺取得エラー:', cardError)
      } else if (cardData) {
        setDigitalCard(cardData)
      }

      // 画像データ取得
      try {
        const { data: imageData, error: imageError } = await supabase
          .from('image_posts')
          .select(`
            *,
            images:user_images(*)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (!imageError && imageData) {
          setImages(imageData)
        }
      } catch (error) {
        console.error('画像データ取得エラー:', error)
      }

      // プレイリストデータ取得
      try {
        const { data: playlistData, error: playlistError } = await supabase
          .from('local_playlists')
          .select('*')
          .eq('user_id', userId)
          .eq('is_public', true)
          .order('created_at', { ascending: false })

        if (!playlistError && playlistData) {
          setPlaylists(playlistData)
        }
      } catch (error) {
        console.error('プレイリストデータ取得エラー:', error)
      }

      // エピソードデータ取得
      await getEpisodeTypesData()

      // 背景データ取得
      try {
        const { data: backgroundData, error: backgroundError } = await supabase
          .from('user_backgrounds')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (!backgroundError && backgroundData) {
          setUserBackground(backgroundData)
        }
      } catch (error) {
        console.error('背景データ取得エラー:', error)
      }

    } catch (error) {
      console.error('データ取得エラー:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // 背景スタイルを取得（デジタル名刺用）
  const getBackgroundStyle = (cardData) => {
    if (!cardData) return {}

    switch (cardData.backgroundType) {
      case 'gradient':
        if (cardData.gradientId === 'custom') {
          const { startColor, endColor, direction } = cardData.customGradient || {}
          return {
            background: `linear-gradient(${direction || 135}deg, ${startColor || '#ff69b4'}, ${endColor || '#9370db'})`
          }
        }
        // プリセットグラデーション
        const gradientPresets = {
          'cure_black': 'linear-gradient(135deg, #ff69b4, #ff1493)',
          'cure_white': 'linear-gradient(135deg, #87ceeb, #4169e1)',
          'cure_bloom': 'linear-gradient(135deg, #ff69b4, #ffa500)',
          'cure_dream': 'linear-gradient(135deg, #ff69b4, #ff1493, #ffd700)',
          'cure_peach': 'linear-gradient(135deg, #ffb6c1, #ff69b4, #ffa500)',
          'cure_blossom': 'linear-gradient(135deg, #ffb6c1, #98fb98, #87ceeb)',
          'custom': 'linear-gradient(135deg, #ff69b4, #9370db)'
        }
        return { background: gradientPresets[cardData.gradientId] || gradientPresets.cure_dream }
        
      case 'solid':
        return { backgroundColor: cardData.solidColor || '#ff69b4' }
        
      case 'image':
        if (!cardData.backgroundImage) {
          return { backgroundColor: '#f3f4f6' }
        }
        
        const imageSettings = cardData.imageSettings || {}
        return {
          backgroundImage: `url(${cardData.backgroundImage})`,
          backgroundSize: `${(imageSettings.scale || 1) * 100}%`,
          backgroundPosition: `${imageSettings.positionX || 50}% ${imageSettings.positionY || 50}%`,
          backgroundRepeat: 'no-repeat',
          transform: `rotate(${imageSettings.rotation || 0}deg)`,
          opacity: imageSettings.opacity || 0.8
        }
        
      default:
        return { background: 'linear-gradient(135deg, #ff69b4, #ff1493, #ffd700)' }
    }
  }

  // 時間フォーマット関数
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = ((ms % 60000) / 1000).toFixed(0)
    return `${minutes}:${seconds.padStart(2, '0')}`
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '今日'
    if (diffDays === 1) return '1日前'
    if (diffDays < 7) return `${diffDays}日前`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`
    return `${Math.floor(diffDays / 365)}年前`
  }

  const formatPlaylistDuration = (tracks) => {
    if (!tracks || tracks.length === 0) return '0分'
    
    const totalMs = tracks.reduce((total, track) => {
      return total + (track.duration_ms || 0)
    }, 0)
    
    const totalMinutes = Math.floor(totalMs / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    return hours > 0 ? 
      `${hours}時間${minutes}分` : `${minutes}分`
  }

  // app/preview/[userId]/page.jsx - Part 4: ローディング・エラー表示・ヘッダー（プリキュア変身セリフ対応）

  // ローディング中（プリキュア変身セリフ版）
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          {/* プリキュア風スピナー */}
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto"></div>
            {/* キラキラエフェクト */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 text-pink-400 animate-pulse">✨</div>
            </div>
          </div>
          {/* 変身セリフ */}
          <div className="space-y-3">
            <p className="text-xl font-bold text-pink-600 animate-pulse">
              {loadingMessage}
            </p>
          </div>
          {/* キラキラエフェクト */}
          <div className="flex justify-center space-x-2 mt-4 animate-bounce">
            <span className="text-pink-400">💖</span>
            <span className="text-purple-400">✨</span>
            <span className="text-blue-400">⭐</span>
            <span className="text-yellow-400">🌟</span>
            <span className="text-green-400">💫</span>
          </div>
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
    <div 
      className={userBackground ? "min-h-screen" : "min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50"}
      style={getUserBackgroundInlineStyle()}
    >
      {/* 背景がある場合のオーバーレイ */}
      {userBackground && userBackground.type === 'image' && (
        <div className="fixed inset-0 bg-black/10 pointer-events-none z-0"></div>
      )}
      {/* 既存のコンテンツ */}
      <div className="relative z-10">
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
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* タブコンテンツ */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* デジタル名刺タブ */}
            {activeTab === 'card' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">デジタル名刺</h2>
                {digitalCard && digitalCard.card_data ? (
                  <div className="max-w-2xl mx-auto">
                    <div className="flex justify-center mb-8">
                      <div 
                        className="relative rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300"
                        style={{
                          width: 'min(600px, calc(100vw - 3rem))',
                          aspectRatio: '91/55',
                          ...getBackgroundStyle(digitalCard.card_data)
                        }}
                      >
                        {/* 背景画像のフィルター効果 */}
                        {digitalCard.card_data.backgroundType === 'image' && 
                         digitalCard.card_data.backgroundImage && 
                         digitalCard.card_data.imageSettings?.filter !== 'none' && (
                          <div 
                            className="absolute inset-0 pointer-events-none z-10"
                            style={imageFilters.find(f => f.id === digitalCard.card_data.imageSettings.filter)?.style || {}}
                          />
                        )}

                        {/* 名刺コンテンツ */}
                        <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none z-20">
                          <div>
                            <h3 
                              className="text-xl font-bold drop-shadow-lg"
                              style={{ color: digitalCard.card_data.textColor || '#ffffff' }}
                            >
                              {digitalCard.card_data.name}
                            </h3>
                            <p 
                              className="text-sm opacity-90 drop-shadow-lg"
                              style={{ color: digitalCard.card_data.textColor || '#ffffff' }}
                            >
                              最推し: {digitalCard.card_data.favoriteCharacter}
                            </p>
                          </div>

                          <div className="flex items-end justify-between">
                            <p 
                              className="text-sm font-bold drop-shadow-lg"
                              style={{ color: digitalCard.card_data.accentColor || '#ffd700' }}
                            >
                              Precure Profile Card
                            </p>
                            
                            {digitalCard.card_data.showQR && (
                              <div className="bg-white p-2 rounded shadow-sm">
                                <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center text-xs">
                                  <QrCode size={20} className="text-gray-500" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* プリキュアマーク */}
                        {digitalCard.card_data.precureMarks?.map((mark) => {
                          const MarkComponent = defaultPrecureMarks.find(m => m.id === mark.type)?.component || Heart
                          return (
                            <div
                              key={mark.id}
                              className="absolute pointer-events-none z-30"
                              style={{
                                left: `${mark.x}%`,
                                top: `${mark.y}%`,
                                color: mark.color,
                                transform: `translate(-50%, -50%) rotate(${mark.rotation}deg)`
                              }}
                            >
                              <MarkComponent size={mark.size} className="drop-shadow-lg" />
                            </div>
                          )
                        })}

                        {/* プリキュアクレスト */}
                        {digitalCard.card_data.precureCrests?.map((crest) => {
                          const crestData = precureCrests.find(c => c.id === crest.crestId)
                          return (
                            <div
                              key={crest.id}
                              className="absolute pointer-events-none z-30"
                              style={{
                                left: `${crest.x}%`,
                                top: `${crest.y}%`,
                                opacity: crest.opacity,
                                transform: `translate(-50%, -50%)`,
                                width: `${crest.size}px`,
                                height: `${crest.size}px`
                              }}
                            >
                              {crestData ? (
                                <img 
                                  src={crestData.url} 
                                  alt={crestData.name}
                                  style={{ 
                                    width: '100%', 
                                    height: '100%',
                                    objectFit: 'contain',
                                    transform: `rotate(${crest.rotation}deg)`
                                  }}
                                  className="drop-shadow-lg"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    const fallbackIcon = e.target.nextElementSibling
                                    if (fallbackIcon) {
                                      fallbackIcon.style.display = 'flex'
                                    }
                                  }}
                                />
                              ) : null}
                              <div
                                className="hidden w-full h-full flex items-center justify-center"
                                style={{ transform: `rotate(${crest.rotation}deg)` }}
                              >
                                <Star 
                                  size={Math.min(crest.size * 0.8, 48)} 
                                  className="drop-shadow-lg text-yellow-400"
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-gray-600 mb-4">
                        素敵な名刺ですね！✨
                      </p>
                      {digitalCard.card_data.backgroundType === 'image' && digitalCard.card_data.imageSettings?.filter !== 'none' && (
                        <div className="text-sm text-gray-500">
                          フィルター効果: {imageFilters.find(f => f.id === digitalCard.card_data.imageSettings.filter)?.name || 'カスタム'}
                        </div>
                      )}
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

            {/* プロフィールタブ */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">プロフィール詳細</h2>
                  
                  {/* 基本情報 */}
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <User size={20} className="mr-2 text-pink-500" />
                        基本情報
                      </h3>
                      <div className="space-y-3">
                        {profile?.age && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">年齢</span>
                            <span className="font-medium">{profile.age}歳</span>
                          </div>
                        )}
                        {profile?.gender && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">性別</span>
                            <span className="font-medium">{profile.gender}</span>
                          </div>
                        )}
                        {profile?.fan_years && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">ファン歴</span>
                            <span className="font-medium">{profile.fan_years}年</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">全シリーズ視聴</span>
                          <span className="font-medium">
                            {profile?.all_series_watched ? '✅ 完走済み' : '📺 視聴中'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Heart size={20} className="mr-2 text-blue-500" />
                        ソーシャルリンク
                      </h3>
                      {profile?.social_links && profile.social_links.length > 0 ? (
                        <div className="space-y-2">
                          {profile.social_links.map((link, index) => (
                            <a
                              key={index}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/50 transition-colors"
                            >
                              <ExternalLink size={16} className="text-blue-500" />
                              <span className="text-sm font-medium text-gray-700">
                                {link.display_name || link.platform}
                              </span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">ソーシャルリンクは設定されていません</p>
                      )}
                    </div>
                  </div>

                  {/* プリキュア情報 */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* 好きなキャラクター */}
                    {profile?.favorite_character && profile.favorite_character.length > 0 && (
                      <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Star size={20} className="mr-2 text-pink-500" />
                          好きなキャラクター
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.favorite_character.slice(0, 6).map((character, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium"
                            >
                              {character}
                            </span>
                          ))}
                          {profile.favorite_character.length > 6 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                              +{profile.favorite_character.length - 6}個
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 好きなシリーズ */}
                    {profile?.favorite_series && profile.favorite_series.length > 0 && (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Sparkles size={20} className="mr-2 text-purple-500" />
                          好きなシリーズ
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.favorite_series.slice(0, 4).map((series, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                            >
                              {series}
                            </span>
                          ))}
                          {profile.favorite_series.length > 4 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                              +{profile.favorite_series.length - 4}個
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 好きな映画 */}
                    {profile?.favorite_movie && profile.favorite_movie.length > 0 && (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Star size={20} className="mr-2 text-yellow-500" />
                          好きな映画
                        </h3>
                        <div className="space-y-2">
                          {profile.favorite_movie.slice(0, 3).map((movie, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm"
                            >
                              {movie}
                            </div>
                          ))}
                          {profile.favorite_movie.length > 3 && (
                            <div className="text-xs text-gray-500">
                              他 {profile.favorite_movie.length - 3} 作品...
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 好きな妖精 */}
                    {profile?.favorite_fairy && profile.favorite_fairy.length > 0 && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Sparkles size={20} className="mr-2 text-purple-500" />
                          好きな妖精
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.favorite_fairy.slice(0, 4).map((fairy, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                            >
                              {fairy}
                            </span>
                          ))}
                          {profile.favorite_fairy.length > 4 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                              +{profile.favorite_fairy.length - 4}個
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 好きなエピソード */}
                    {profile?.favorite_episode && profile.favorite_episode.length > 0 && (
                      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Calendar size={20} className="mr-2 text-green-500" />
                          好きなエピソード
                        </h3>
                        <div className="space-y-2">
                          {profile.favorite_episode.map((episode, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm"
                            >
                              {episode}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 視聴済みシリーズ */}
                  {profile?.watched_series && profile.watched_series.length > 0 && (
                    <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <ExternalLink size={20} className="mr-2 text-indigo-500" />
                        視聴済みシリーズ ({profile.watched_series.length}作品)
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {profile.watched_series.map((series, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm text-center font-medium"
                          >
                            {series}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* フリーテキスト */}
                  {profile?.what_i_love && (
                    <div className="mt-8 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Heart size={20} className="mr-2 text-pink-500" />
                        プリキュアの好きなところ
                      </h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {profile.what_i_love}
                      </p>
                    </div>
                  )}

                  {profile?.free_text && (
                    <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <User size={20} className="mr-2 text-blue-500" />
                        自由記入欄
                      </h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {profile.free_text}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ギャラリータブ */}
            {activeTab === 'gallery' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">ギャラリー</h2>
                {images && images.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.map((post, index) => (
                      <div
                        key={post.id}
                        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedImage(post)}
                      >
                        <div className="aspect-square bg-gray-100">
                          {post.images && post.images.length > 0 ? (
                            <img
                              src={post.images[0].url}
                              alt="ギャラリー画像"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon size={40} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        {post.caption && (
                          <div className="p-4">
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {post.caption}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatDate(post.created_at)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ImageIcon size={32} className="text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">まだ画像がありません</h3>
                    <p className="text-gray-600">素敵な写真の投稿をお待ちしています！</p>
                  </div>
                )}
              </div>
            )}

            {/* プレイリストタブ */}
            {activeTab === 'playlists' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">プレイリスト</h2>
                {playlists && playlists.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {playlists.map((playlist) => (
                      <div
                        key={playlist.id}
                        className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => {
                          setSelectedPlaylist(playlist)
                          setShowPlaylistModal(true)
                        }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">{playlist.name}</h3>
                            {playlist.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {playlist.description}
                              </p>
                            )}
                          </div>
                          <div className="ml-4 text-right text-sm text-gray-500">
                            <div>{formatDate(playlist.created_at)}</div>
                            <div className="flex items-center mt-1">
                              {playlist.is_public ? (
                                <Globe size={12} className="mr-1" />
                              ) : (
                                <Lock size={12} className="mr-1" />
                              )}
                              <span>{playlist.is_public ? '公開' : '非公開'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{playlist.tracks?.length || 0} 曲</span>
                          <span>{formatPlaylistDuration(playlist.tracks)}</span>
                        </div>

                        {playlist.tracks && playlist.tracks.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <div className="text-xs text-gray-500 mb-2">プレビュー:</div>
                            {playlist.tracks.slice(0, 3).map((track, index) => (
                              <div key={index} className="text-xs text-gray-600 truncate">
                                {track.name} - {track.artists?.map(a => a.name).join(', ')}
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
                          alt="アルバムアート"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Music size={32} className="text-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold mb-2 truncate">{selectedPlaylist.name}</h2>
                      {selectedPlaylist.description && (
                        <p className="text-white/80 text-sm line-clamp-2">{selectedPlaylist.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-3 text-sm text-white/80">
                        <span>{selectedPlaylist.tracks?.length || 0} 曲</span>
                        <span>{formatPlaylistDuration(selectedPlaylist.tracks)}</span>
                        <span>{formatDate(selectedPlaylist.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowPlaylistModal(false)}
                    className="text-white/80 hover:text-white transition-colors p-2"
                  >
                    <ExternalLink size={24} />
                  </button>
                </div>
              </div>

              {/* トラックリスト */}
              <div className="flex-1 overflow-y-auto p-6">
                {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 ? (
                  <div className="space-y-3">
                    {selectedPlaylist.tracks.map((track, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-8 text-center text-sm text-gray-500 font-medium">
                          {index + 1}
                        </div>
                        
                        {track.album?.images?.[0] && (
                          <img
                            src={track.album.images[0].url}
                            alt="アルバムアート"
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{track.name}</div>
                          <div className="text-sm text-gray-600 truncate">
                            {track.artists?.map(artist => artist.name).join(', ')}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          {formatDuration(track.duration_ms)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Music size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">トラックがありません</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 画像詳細モーダル */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div 
              className="max-w-4xl max-h-[90vh] w-full bg-white rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col md:flex-row">
                {/* 画像表示部分 */}
                <div className="md:w-2/3 bg-gray-100">
                  {selectedImage.images && selectedImage.images.length > 0 ? (
                    <img
                      src={selectedImage.images[0].url}
                      alt="詳細画像"
                      className="w-full h-64 md:h-96 object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 md:h-96 flex items-center justify-center">
                      <ImageIcon size={64} className="text-gray-400" />
                    </div>
                  )}
                </div>

                {/* 詳細情報 */}
                <div className="md:w-1/3 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-800">画像詳細</h3>
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ExternalLink size={20} />
                    </button>
                  </div>

                  {selectedImage.caption && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">キャプション</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {selectedImage.caption}
                      </p>
                    </div>
                  )}

                  {selectedImage.tags && selectedImage.tags.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">タグ</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedImage.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedImage.event_name || selectedImage.event_venue || selectedImage.event_date) && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">イベント情報</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {selectedImage.event_name && (
                          <div>
                            <span className="font-medium">イベント名:</span> {selectedImage.event_name}
                          </div>
                        )}
                        {selectedImage.event_venue && (
                          <div>
                            <span className="font-medium">会場:</span> {selectedImage.event_venue}
                          </div>
                        )}
                        {selectedImage.event_date && (
                          <div>
                            <span className="font-medium">日時:</span> {new Date(selectedImage.event_date).toLocaleDateString('ja-JP')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    投稿日: {formatDate(selectedImage.created_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const getUserBackgroundInlineStyle = () => {
  if (!userBackground) return {}

  const gradientPresets = {
    'precure_classic': 'linear-gradient(135deg, #ff6b9d 0%, #c44cd9 50%, #6fa7ff 100%)',
    'cure_black_white': 'linear-gradient(135deg, #ff69b4 0%, #4169e1 50%, #ffffff 100%)',
    'splash_star': 'linear-gradient(135deg, #ff9800 0%, #ffb74d 50%, #fff3e0 100%)',
    'yes_precure5': 'linear-gradient(135deg, #e91e63 0%, #9c27b0 50%, #673ab7 100%)',
    'fresh': 'linear-gradient(135deg, #ff4081 0%, #ff6ec7 50%, #ffb3ff 100%)',
    'heartcatch': 'linear-gradient(135deg, #4caf50 0%, #8bc34a 50%, #cddc39 100%)',
    'suite': 'linear-gradient(135deg, #9c27b0 0%, #e91e63 50%, #ff9800 100%)',
    'smile': 'linear-gradient(135deg, #ffeb3b 0%, #ff9800 25%, #e91e63 50%, #9c27b0 75%, #3f51b5 100%)',
    'dokidoki': 'linear-gradient(135deg, #e91e63 0%, #ad1457 50%, #880e4f 100%)',
    'happiness_charge': 'linear-gradient(135deg, #ff69b4 0%, #87ceeb 50%, #98fb98 100%)',
    'go_princess': 'linear-gradient(135deg, #9c27b0 0%, #e91e63 50%, #ff9800 100%)',
    'mahou_tsukai': 'linear-gradient(135deg, #9c27b0 0%, #ff69b4 50%, #ffeb3b 100%)',
    'kirakira': 'linear-gradient(135deg, #ff69b4 0%, #ffeb3b 25%, #4caf50 50%, #2196f3 75%, #9c27b0 100%)',
    'hugtto': 'linear-gradient(135deg, #ff69b4 0%, #ffeb3b 50%, #2196f3 100%)',
    'star_twinkle': 'linear-gradient(135deg, #9c27b0 0%, #ff69b4 25%, #ffeb3b 50%, #4caf50 75%, #2196f3 100%)',
    'healin_good': 'linear-gradient(135deg, #ff69b4 0%, #4caf50 50%, #2196f3 100%)',
    'tropical_rouge': 'linear-gradient(135deg, #ff6b35 0%, #f7931e 25%, #fff200 50%, #00aeef 75%, #ec008c 100%)',
    'delicious_party': 'linear-gradient(135deg, #ff69b4 0%, #ffeb3b 25%, #4caf50 50%, #ff9800 75%, #9c27b0 100%)',
    'hirogaru_sky': 'linear-gradient(135deg, #87ceeb 0%, #ff69b4 50%, #ffeb3b 100%)',
    'wonderful_precure': 'linear-gradient(135deg, #ff69b4 0%, #9c27b0 25%, #2196f3 50%, #4caf50 75%, #ffeb3b 100%)'
  }

  switch (userBackground.type) {
    case 'gradient':
      return {
        background: gradientPresets[userBackground.gradient_id] || gradientPresets.precure_classic
      }
    case 'solid':
      return {
        backgroundColor: userBackground.solid_color || '#ff69b4'
      }
    case 'image':
      if (!userBackground.image_url) {
        return { backgroundColor: '#f3f4f6' }
      }
      const settings = userBackground.image_settings || {}
      return {
        backgroundImage: `url(${userBackground.image_url})`,
        backgroundSize: `${(settings.scale || 1) * 100}%`,
        backgroundPosition: `${settings.positionX || 50}% ${settings.positionY || 50}%`,
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        filter: `blur(${settings.blur || 0}px) brightness(${settings.brightness || 100}%) contrast(${settings.contrast || 100}%)`,
        opacity: settings.opacity || 1
      }
    default:
      return {}
  }
}