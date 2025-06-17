// app/preview/[userId]/page.jsx - Part 1: インポートと定数定義
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Heart, Star, Sparkles, User, Image as ImageIcon, 
  CreditCard, // ← 重要: CreditCardをインポートに追加
  ExternalLink, Calendar, QrCode, ArrowLeft, Home, Edit, 
  Music, Play, Clock, Globe, Lock 
} from 'lucide-react'
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

// プリキュアテンプレート（デジタル名刺用）
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

// グラデーションプリセット（プレビュー用）
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

// app/preview/[userId]/page.jsx - Part 2: ユーティリティ関数

// 画像存在確認関数
const checkImageExists = async (imageUrl) => {
  if (!imageUrl) return false
  
  try {
    // Supabase Storage URLの場合
    if (imageUrl.includes('supabase') && imageUrl.includes('storage')) {
      const response = await fetch(imageUrl, { method: 'HEAD' })
      return response.ok
    }
    
    // Base64データURLの場合
    if (imageUrl.startsWith('data:image/')) {
      return true
    }
    
    // その他のURLの場合
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = imageUrl
    })
  } catch (error) {
    console.warn('画像存在確認エラー:', error)
    return false
  }
}

// 背景設定をページ全体に適用する関数
const applyBackgroundToPreviewPage = (backgroundData) => {
  if (typeof window === 'undefined' || !backgroundData) return

  const body = document.body
  const html = document.documentElement
  
  // 既存のスタイルをクリア
  body.style.background = ''
  body.style.backgroundColor = ''
  body.style.backgroundImage = ''
  html.style.background = ''
  html.style.backgroundColor = ''
  html.style.backgroundImage = ''
  
  switch (backgroundData.type) {
    case 'solid':
      const solidColor = backgroundData.solid_color || '#ff69b4'
      body.style.backgroundColor = solidColor
      html.style.backgroundColor = solidColor
      console.log('🎨 プレビュー: 単色背景適用:', solidColor)
      break
      
    case 'gradient':
      const gradient = gradientPresets[backgroundData.gradient_id] || gradientPresets.precure_classic
      body.style.background = gradient
      html.style.background = gradient
      console.log('🎨 プレビュー: グラデーション背景適用:', backgroundData.gradient_id)
      break
      
    case 'image':
      if (backgroundData.image_url) {
        const settings = backgroundData.image_settings || {}
        body.style.backgroundImage = `url(${backgroundData.image_url})`
        body.style.backgroundSize = `${(settings.scale || 1) * 100}%`
        body.style.backgroundPosition = `${settings.positionX || 50}% ${settings.positionY || 50}%`
        body.style.backgroundRepeat = 'no-repeat'
        body.style.backgroundAttachment = 'fixed'
        html.style.backgroundImage = `url(${backgroundData.image_url})`
        html.style.backgroundSize = `${(settings.scale || 1) * 100}%`
        html.style.backgroundPosition = `${settings.positionX || 50}% ${settings.positionY || 50}%`
        html.style.backgroundRepeat = 'no-repeat'
        html.style.backgroundAttachment = 'fixed'
        console.log('🎨 プレビュー: 画像背景適用:', backgroundData.image_url)
      }
      break
      
    default:
      // デフォルト背景
      const defaultGradient = gradientPresets.precure_classic
      body.style.background = defaultGradient
      html.style.background = defaultGradient
      break
  }
}

// ユーザー背景のインラインスタイル取得（フォールバック用）
const getUserBackgroundInlineStyle = (userBackground) => {
  if (!userBackground) return {}

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

// プレイリスト再生時間の計算
const formatPlaylistDuration = (tracks) => {
  if (!tracks || tracks.length === 0) return '0分'
  
  const totalMs = tracks.reduce((sum, track) => {
    return sum + (track.duration_ms || 0)
  }, 0)
  
  const totalMinutes = Math.floor(totalMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`
}

// 日付フォーマット
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

// エピソードタイプデータ取得
const getEpisodeTypesData = async () => {
  try {
    const { data, error } = await supabase
      .from('precure_episodes')
      .select('*')
      .order('id', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('エピソードデータ取得エラー:', error)
    return []
  }
}

// app/preview/[userId]/page.jsx - Part 3: 安全なデジタル名刺表示コンポーネント

// 安全なデジタル名刺表示コンポーネント
const SafeDigitalCardDisplay = ({ digitalCard, profile }) => {
  const [validatedCardData, setValidatedCardData] = useState(null)
  const [imageError, setImageError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const validateCardData = async () => {
      if (!digitalCard?.card_data) {
        setValidatedCardData(null)
        setLoading(false)
        return
      }

      function validateCardData(digitalCard) {
        let cardData = { ...digitalCard.card_data }
        if (!cardData.precureMarks) cardData.precureMarks = []
        if (!cardData.precureCrests) cardData.precureCrests = []
        if (cardData.showQR === undefined) cardData.showQR = true
        console.log('🎴 プレビュー: デジタル名刺データ:', cardData)
        return cardData
      }
      let cardData = validateCardData(digitalCard)

      // 背景画像の検証
      if (cardData.backgroundType === 'image' && cardData.backgroundImage) {
        console.log('🔍 プレビュー: 背景画像の存在確認中...', cardData.backgroundImage)
        
        const imageExists = await checkImageExists(cardData.backgroundImage)
        
        if (!imageExists) {
          console.log('❌ プレビュー: 背景画像が削除されています - グラデーションに変更')
          setImageError(true)
          
          cardData = {
            ...cardData,
            backgroundType: 'gradient',
            gradientId: 'precure_classic',
            backgroundImage: null
          }
        } else {
          console.log('✅ プレビュー: 背景画像は正常に存在します')
        }
      }

      setValidatedCardData(cardData)
      setLoading(false)
    }

    validateCardData()
  }, [digitalCard])

  // ローディング中
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">デジタル名刺を読み込み中...</p>
      </div>
    )
  }

  // データがない場合
  if (!validatedCardData) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 rounded-full flex items-center justify-center mx-auto mb-6">
          <CreditCard size={40} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">デジタル名刺がありません</h3>
        <p className="text-gray-600">このユーザーはまだデジタル名刺を作成していません</p>
      </div>
    )
  }

  // 背景スタイルの取得
  const getBackgroundStyle = () => {
    switch (validatedCardData.backgroundType) {
      case 'gradient':
        return { 
          background: gradientPresets[validatedCardData.gradientId] || gradientPresets.precure_classic 
        }
      
      case 'solid':
        return { 
          backgroundColor: validatedCardData.solidColor || '#ff69b4' 
        }
      
      case 'image':
        if (!validatedCardData.backgroundImage) {
          return { 
            background: gradientPresets.precure_classic 
          }
        }
        
        const settings = validatedCardData.imageSettings || {}
        return {
          backgroundImage: `url(${validatedCardData.backgroundImage})`,
          backgroundSize: `${(settings.scale || 1) * 100}%`,
          backgroundPosition: `${settings.positionX || 50}% ${settings.positionY || 50}%`,
          backgroundRepeat: 'no-repeat'
        }
      
      default:
        return { 
          background: gradientPresets.precure_classic 
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* 画像エラー通知 */}
      {imageError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600">⚠️</span>
            <p className="text-yellow-800 text-sm">
              設定されていた背景画像が削除されているため、デフォルトの背景を表示しています。
            </p>
          </div>
        </div>
      )}

      {/* デジタル名刺表示 */}
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-8">
          <div 
            className="relative rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300"
            style={{
              width: 'min(600px, calc(100vw - 3rem))',
              aspectRatio: '91/55',
              ...getBackgroundStyle()
            }}
          >
            {/* フィルター効果 */}
            {validatedCardData.backgroundType === 'image' && 
             validatedCardData.backgroundImage && 
             validatedCardData.imageSettings?.filter !== 'none' && (
              <div 
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background: 'linear-gradient(45deg, rgba(255, 105, 180, 0.2), rgba(147, 112, 219, 0.2))',
                  mixBlendMode: 'overlay'
                }}
              />
            )}

            {/* 名刺コンテンツ */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none z-20">
              <div>
                <h3 
                  className="text-xl font-bold drop-shadow-lg"
                  style={{ color: validatedCardData.textColor || '#ffffff' }}
                >
                  {validatedCardData.name || profile?.display_name || 'プリキュアファン'}
                </h3>
                <p 
                  className="text-sm opacity-90 drop-shadow-lg"
                  style={{ color: validatedCardData.textColor || '#ffffff' }}
                >
                  最推し: {validatedCardData.favoriteCharacter || profile?.favorite_character?.[0] || 'キュアドリーム'}
                </p>
              </div>

              <div className="flex items-end justify-between">
                <p 
                  className="text-xs opacity-80 drop-shadow-lg"
                  style={{ color: validatedCardData.textColor || '#ffffff' }}
                >
                  プリキュアファンプロフィール
                </p>
                
                {/* QRコード表示 */}
                {validatedCardData.showQR && (
                  <div className="bg-white/20 backdrop-blur-sm rounded p-2">
                    <QrCode size={16} className="text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* プリキュアマーク表示 */}
            {validatedCardData.precureMarks && validatedCardData.precureMarks.map((mark) => {
              const MarkComponent = defaultPrecureMarks.find(m => m.id === mark.type)?.component || Heart
              return (
                <div
                  key={mark.id}
                  className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-30"
                  style={{
                    left: `${mark.x}%`,
                    top: `${mark.y}%`,
                    color: mark.color || '#ffffff',
                    transform: `translate(-50%, -50%) rotate(${mark.rotation || 0}deg)`
                  }}
                >
                  <MarkComponent size={mark.size || 20} className="drop-shadow-lg" />
                </div>
              )
            })}

            {/* プリキュアクレスト表示 */}
            {validatedCardData.precureCrests && validatedCardData.precureCrests.map((crest) => {
              const crestData = precureCrests.find(c => c.id === crest.crestId)
              return (
                <div
                  key={crest.id}
                  className="absolute pointer-events-none z-30"
                  style={{
                    left: `${crest.x}%`,
                    top: `${crest.y}%`,
                    opacity: crest.opacity || 0.9,
                    transform: `translate(-50%, -50%) rotate(${crest.rotation || 0}deg)`,
                    width: `${crest.size || 60}px`,
                    height: `${crest.size || 60}px`
                  }}
                >
                  {crestData ? (
                    <img 
                      src={crestData.url} 
                      alt={crestData.name}
                      style={{ 
                        width: '100%', 
                        height: '100%',
                        objectFit: 'contain'
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
                  <div className="hidden w-full h-full flex items-center justify-center">
                    <Star 
                      size={Math.min((crest.size || 60) * 0.8, 48)} 
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
          {imageError && (
            <p className="text-yellow-600 text-sm">
              背景画像を再設定することをお勧めします
            </p>
          )}
          {validatedCardData.backgroundType === 'image' && 
           validatedCardData.imageSettings?.filter !== 'none' && (
            <div className="text-sm text-gray-500">
              フィルター効果: カスタム
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// デジタル名刺セクションコンポーネント
const DigitalCardSection = ({ digitalCard, profile }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">デジタル名刺</h3>
      
      {digitalCard ? (
        <SafeDigitalCardDisplay digitalCard={digitalCard} profile={profile} />
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
  )
}

// エラーバウンダリー付きの画像処理
const ImageErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const handleError = (event) => {
      if (event.target.tagName === 'IMG') {
        console.warn('画像読み込みエラー:', event.target.src)
        setHasError(true)
      }
    }

    document.addEventListener('error', handleError, true)
    return () => document.removeEventListener('error', handleError, true)
  }, [])

  if (hasError) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <ImageIcon size={32} className="text-gray-400" />
        </div>
        <p className="text-gray-600">画像の読み込みに失敗しました</p>
      </div>
    )
  }

  return children
}

// app/preview/[userId]/page.jsx - Part 4: メインコンポーネントとstate管理

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
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [loading])

  // 初期データ取得
  useEffect(() => {
    if (userId) {
      fetchData()
    }
  }, [userId])

  // メインのデータ取得関数
  const fetchData = async () => {
    setLoading(true)
    try {
      // 現在のセッション確認
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentSession(session)
      setIsOwnProfile(session?.user?.id === userId)

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
        const processedProfile = {
          ...profileData,
          favorite_character: Array.isArray(profileData.favorite_character) 
            ? profileData.favorite_character 
            : profileData.favorite_character ? profileData.favorite_character.split(',').map(s => s.trim()) : [],
          favorite_series: Array.isArray(profileData.favorite_series) 
            ? profileData.favorite_series 
            : profileData.favorite_series ? profileData.favorite_series.split(',').map(s => s.trim()) : [],
          favorite_movie: Array.isArray(profileData.favorite_movie) 
            ? profileData.favorite_movie 
            : profileData.favorite_movie ? profileData.favorite_movie.split(',').map(s => s.trim()) : [],
          favorite_episode: Array.isArray(profileData.favorite_episode) 
            ? profileData.favorite_episode 
            : profileData.favorite_episode ? profileData.favorite_episode.split(',').map(s => s.trim()) : [],
          favorite_fairy: Array.isArray(profileData.favorite_fairy) 
            ? profileData.favorite_fairy 
            : profileData.favorite_fairy ? profileData.favorite_fairy.split(',').map(s => s.trim()) : [],
          watched_series: Array.isArray(profileData.watched_series) 
            ? profileData.watched_series 
            : profileData.watched_series ? profileData.watched_series.split(',').map(s => s.trim()) : [],
          social_links: Array.isArray(profileData.social_links) ? profileData.social_links : []
        }
        setProfile(processedProfile)
      }

      // 背景設定取得
      try {
        const { data: backgroundData, error: backgroundError } = await supabase
          .from('user_backgrounds')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (!backgroundError && backgroundData) {
          console.log('🎨 プレビュー: 背景データ取得成功:', backgroundData)
          setUserBackground(backgroundData)
          
          // 即座にページ全体に背景を適用
          applyBackgroundToPreviewPage(backgroundData)
        } else {
          console.log('🎨 プレビュー: 背景設定なし、デフォルト背景を使用')
        }
      } catch (error) {
        console.error('🎨 プレビュー: 背景データ取得エラー:', error)
      }

      // デジタル名刺データ取得（エラーハンドリング強化）
      try {
        const { data: cardData, error: cardError } = await supabase
          .from('digital_cards')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle() // singleの代わりにmaybeSingleを使用

        if (cardError) {
          console.error('デジタル名刺取得エラー:', cardError)
        } else if (cardData) {
          console.log('✅ デジタル名刺データ取得成功:', cardData)
          setDigitalCard(cardData)
        } else {
          console.log('📄 デジタル名刺データなし')
          setDigitalCard(null)
        }
      } catch (cardFetchError) {
        console.error('❌ デジタル名刺取得例外:', cardFetchError)
        setDigitalCard(null)
      }

      // ギャラリー画像取得（image_posts + user_images）
      const { data: imageData, error: imageError } = await supabase
        .from('image_posts')
        .select('id, caption, event_name, event_venue, event_date, tags, created_at, image_url')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (imageError) {
        console.error('画像データ取得エラー:', imageError)
        setImages([])
      } else if (imageData) {
        setImages(imageData)
      } else {
        setImages([])
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
      const episodeData = await getEpisodeTypesData()
      setEpisodeTypesData(episodeData)

    } catch (error) {
      console.error('データ取得エラー:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // app/preview/[userId]/page.jsx - Part 5: レンダリング部分

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
                    className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-white/20 flex items-center justify-center">
                    <User size={40} className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{profile?.display_name || 'プリキュアファン'}</h2>
                <div className="flex flex-wrap gap-4 text-sm">
                  {profile?.age && (
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      {profile.age}歳
                    </span>
                  )}
                  {profile?.fan_years && (
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      プリキュア歴{profile.fan_years}年
                    </span>
                  )}
                  {profile?.gender && (
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      {profile.gender}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* タブナビゲーション */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm mb-8">
            <div className="flex space-x-1 p-2">
              {[
                { id: 'profile', label: 'プロフィール', icon: User },
                { id: 'card', label: 'デジタル名刺', icon: CreditCard },
                { id: 'gallery', label: 'ギャラリー', icon: ImageIcon },
                { id: 'playlists', label: 'プレイリスト', icon: Music }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <tab.icon size={16} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* タブコンテンツ */}
          <ImageErrorBoundary>
            {/* デジタル名刺タブ */}
            {activeTab === 'card' && (
              <DigitalCardSection digitalCard={digitalCard} profile={profile} />
            )}

            {/* プロフィールタブ */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">プロフィール詳細</h2>
                  
                  {/* 基本情報 */}
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* 好きなキャラクター */}
                    {profile?.favorite_character && profile.favorite_character.length > 0 && (
                      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Heart size={20} className="mr-2 text-pink-500" />
                          好きなキャラクター
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.favorite_character.slice(0, 5).map((character, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium"
                            >
                              {character}
                            </span>
                          ))}
                          {profile.favorite_character.length > 5 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                              +{profile.favorite_character.length - 5}人
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 好きなシリーズ */}
                    {profile?.favorite_series && profile.favorite_series.length > 0 && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Star size={20} className="mr-2 text-blue-500" />
                          好きなシリーズ
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.favorite_series.slice(0, 4).map((series, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                            >
                              {series}
                            </span>
                          ))}
                          {profile.favorite_series.length > 4 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                              +{profile.favorite_series.length - 4}作品
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 好きな映画 */}
                    {profile?.favorite_movie && profile.favorite_movie.length > 0 && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <ExternalLink size={20} className="mr-2 text-purple-500" />
                          好きな映画
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.favorite_movie.slice(0, 3).map((movie, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                            >
                              {movie}
                            </span>
                          ))}
                          {profile.favorite_movie.length > 3 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                              +{profile.favorite_movie.length - 3}作品
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 好きな妖精 */}
                    {profile?.favorite_fairy && profile.favorite_fairy.length > 0 && (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Sparkles size={20} className="mr-2 text-yellow-500" />
                          好きな妖精
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.favorite_fairy.slice(0, 4).map((fairy, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
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
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {profile.watched_series.map((series, index) => (
                          <span
                            key={index}
                            className="px-3 py-2 bg-indigo-100 text-indigo-800 rounded-lg text-sm text-center"
                          >
                            {series}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* その他の情報 */}
                  <div className="grid md:grid-cols-2 gap-6 mt-8">
                    {/* プリキュア愛 */}
                    {profile?.what_i_love && (
                      <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">プリキュアの好きなところ</h3>
                        <p className="text-gray-600 leading-relaxed">{profile.what_i_love}</p>
                      </div>
                    )}

                    {/* 趣味 */}
                    {profile?.hobbies && (
                      <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">趣味</h3>
                        <p className="text-gray-600 leading-relaxed">{profile.hobbies}</p>
                      </div>
                    )}
                  </div>

                  {/* 自由記述 */}
                  {profile?.free_text && (
                    <div className="mt-6 bg-white rounded-xl p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">自己紹介</h3>
                      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{profile.free_text}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ギャラリータブ */}
            {activeTab === 'gallery' && (
              <div className="py-8">
                {images.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[300px]">
                    <span className="text-4xl text-gray-400 mb-4">
                      <ImageIcon size={64} />
                    </span>
                    <p className="text-lg text-gray-600 font-semibold mb-2">まだ投稿がありません</p>
                    <p className="text-gray-500">このユーザーはまだ画像を投稿していません</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {images.map((img) => {
                      // img.urlをそのまま使う
                      const imageUrl = img.url || null;
                      return (
                        <div key={img.id} className="rounded-lg overflow-hidden shadow-md bg-white flex flex-col">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={img.caption || 'ギャラリー画像'}
                              className="w-full h-64 object-cover"
                            />
                          ) : (
                            <div className="w-full h-64 flex items-center justify-center bg-gray-100 text-gray-400">No Image</div>
                          )}
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="font-bold text-gray-800 mb-1 text-lg flex items-center">
                                {img.caption || 'タイトルなし'}
                              </div>
                              <div className="text-xs text-gray-500 mb-1">{formatDate(img.created_at)}</div>
                              {/* イベント情報ボックス */}
                              {(img.event_name || img.event_date || img.event_venue || img.event_description) && (
                                <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-2 text-green-900 text-sm space-y-1">
                                  {img.event_name && <div className="font-semibold">📍 イベント情報</div>}
                                  {img.event_date && <div>🕒 {img.event_date}</div>}
                                  {img.event_venue && <div>📍 {img.event_venue}</div>}
                                  {img.event_description && <div>☆ {img.event_description}</div>}
                                  {img.event_name && <div>☆ {img.event_name}</div>}
                                </div>
                              )}
                              {/* 投稿許可・第三者映り込み確認ボックス */}
                              {(img.no_third_party_in_photo || img.post_permission_confirmed) && (
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-2 text-blue-900 text-sm space-y-1">
                                  {img.post_permission_confirmed && <div>✔ 投稿許可確認済み</div>}
                                  {img.no_third_party_in_photo && <div>✔ 第三者映り込みなし確認済み</div>}
                                </div>
                              )}
                              {/* タグ表示 */}
                              {img.tags && img.tags.length > 0 && (
                                <div className="mb-2">
                                  <div className="text-xs text-pink-600 font-bold mb-1"># タグ</div>
                                  <div className="flex flex-wrap gap-2">
                                    {img.tags.map((tag, idx) => (
                                      <span key={idx} className="px-3 py-1 bg-pink-100 text-pink-700 text-sm rounded-full">#{tag}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* プレイリストタブ */}
            {activeTab === 'playlists' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">公開プレイリスト</h2>
                
                {playlists && playlists.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {playlists.map((playlist) => (
                      <div key={playlist.id} className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">{playlist.name}</h3>
                            {playlist.description && (
                              <p className="text-gray-600 text-sm mb-3">{playlist.description}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 text-xs">
                            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                              playlist.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
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
                            )
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
          </ImageErrorBoundary>
        </div>

        {/* 画像モーダル */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">画像詳細</h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex justify-center">
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.caption || 'ギャラリー画像'}
                      className="max-w-full max-h-96 object-contain rounded-lg"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    {selectedImage.caption && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">キャプション</h4>
                        <p className="text-gray-600">{selectedImage.caption}</p>
                      </div>
                    )}
                    
                    {selectedImage.event_name && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">イベント情報</h4>
                        <div className="space-y-1">
                          <p className="text-purple-600 font-medium">{selectedImage.event_name}</p>
                          {selectedImage.event_venue && (
                            <p className="text-gray-600">📍 {selectedImage.event_venue}</p>
                          )}
                          {selectedImage.event_date && (
                            <p className="text-gray-600">📅 {new Date(selectedImage.event_date).toLocaleDateString('ja-JP')}</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {selectedImage.tags && selectedImage.tags.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">タグ</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedImage.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
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
          </div>
        )}
      </div>
    </div>
  )
}

// app/preview/[userId]/page.jsx - Part 6: デバッグ機能とエクスポート

// ※本番用のため、window.debug...系や不完全なtry文を削除し、構文エラーを解消

// プレビューページのパフォーマンス最適化
if (typeof window !== 'undefined') {
  // 画像の遅延読み込み対応
  const observeImages = () => {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.removeAttribute('data-src')
            observer.unobserve(img)
          }
        }
      })
    })

    // 遅延読み込み対象の画像を監視
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img)
    })
  }

  // ページ読み込み完了後に遅延読み込みを開始
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeImages)
  } else {
    observeImages()
  }
}

// エラー追跡とレポート機能
const trackError = (error, context = '') => {
  console.error(`❌ プレビューページエラー [${context}]:`, error)
  
  // 本番環境では外部エラー追跡サービスに送信
  if (process.env.NODE_ENV === 'production') {
    // 例: Sentry, LogRocket, などへの送信
    // sentry.captureException(error, { extra: { context, userId } })
  }
}

// グローバルエラーハンドラー
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    trackError(event.error, 'Global Error')
  })

  window.addEventListener('unhandledrejection', (event) => {
    trackError(event.reason, 'Unhandled Promise Rejection')
  })
}

// プレビューページのメタデータ取得（SEO用）
export const getPreviewMetadata = async (userId) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, what_i_love, avatar_url')
      .eq('id', userId)
      .single()

    if (profile) {
      return {
        title: `${profile.display_name || 'プリキュアファン'}のプロフィール | キュアサークル`,
        description: profile.what_i_love || 'プリキュアを愛するファンのプロフィール・名刺・ギャラリー',
        image: profile.avatar_url || '/default-avatar.png',
        url: `${window.location.origin}/preview/${userId}`
      }
    }
  } catch (error) {
    // エラー時はnullを返す
    return null;
  }
}