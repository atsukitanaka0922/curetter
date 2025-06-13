// components/DigitalCard.jsx - Part 1: インポートと定数定義
import React, { useState, useRef, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Edit, 
  Share, 
  Check, 
  Upload, 
  Download, 
  RotateCw, 
  Move,
  Palette,
  Star,
  Heart,
  Sparkles,
  X,
  Save,
  RefreshCw,
  Image as ImageIcon,
  Type
} from 'lucide-react'

// Supabaseクライアント初期化
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key'
)

// プリキュアマークのデフォルト（実際のマークをアップロード後に追加可能）
const defaultPrecureMarks = [
  { id: 'heart', name: 'ハート', component: Heart },
  { id: 'star', name: 'スター', component: Star },
  { id: 'sparkles', name: 'スパークル', component: Sparkles }
]

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

// グラデーションプリセット
const gradientPresets = [
  { 
    id: 'cure_black', 
    name: 'キュアブラック', 
    gradient: 'linear-gradient(135deg, #ff69b4, #ff1493)' 
  },
  { 
    id: 'cure_white', 
    name: 'キュアホワイト', 
    gradient: 'linear-gradient(135deg, #87ceeb, #4169e1)' 
  },
  { 
    id: 'cure_bloom', 
    name: 'キュアブルーム', 
    gradient: 'linear-gradient(135deg, #ff69b4, #ffa500)' 
  },
  { 
    id: 'cure_dream', 
    name: 'キュアドリーム', 
    gradient: 'linear-gradient(135deg, #ff69b4, #ff1493, #ffd700)' 
  },
  { 
    id: 'cure_peach', 
    name: 'キュアピーチ', 
    gradient: 'linear-gradient(135deg, #ffb6c1, #ff69b4, #ffa500)' 
  },
  { 
    id: 'cure_blossom', 
    name: 'キュアブロッサム', 
    gradient: 'linear-gradient(135deg, #ffb6c1, #98fb98, #87ceeb)' 
  },
  { 
    id: 'custom', 
    name: 'カスタム', 
    gradient: 'linear-gradient(135deg, #ff69b4, #9370db)' 
  }
]

// 画像フィルター効果
const imageFilters = [
  {
    id: 'none',
    name: 'フィルターなし',
    style: {}
  },
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

// components/DigitalCard.jsx - Part 2: コンポーネント初期化とステート
export default function EnhancedDigitalCard({ profile }) {
  const [editing, setEditing] = useState(false)
  const [loading, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const cardRef = useRef(null)
  
  // 名刺データの初期値
  const getDefaultCardData = () => ({
    name: profile?.display_name || 'プリキュアファン',
    favoriteCharacter: profile?.favorite_character?.[0] || 'キュアドリーム',
    backgroundType: 'gradient',
    gradientId: 'cure_dream',
    customGradient: {
      startColor: '#ff69b4',
      endColor: '#9370db',
      direction: 135
    },
    solidColor: '#ff69b4',
    backgroundImage: null,
    imageSettings: {
      scale: 1,
      positionX: 50,
      positionY: 50,
      rotation: 0,
      opacity: 0.8,
      filter: 'none'
    },
    textColor: '#ffffff',
    accentColor: '#ffd700',
    precureMarks: [
      { 
        id: 'heart1', 
        type: 'heart', 
        x: 80, 
        y: 20, 
        size: 20, 
        color: '#ffffff', 
        rotation: 0 
      }
    ],
    precureCrests: [
      {
        id: 'crest1',
        crestId: 'smile',
        x: 20,
        y: 80,
        size: 60, // デフォルトサイズを少し大きく
        opacity: 0.9,
        rotation: 0
      }
    ],
    showQR: true
  })

  // 名刺データの状態
  const [cardData, setCardData] = useState(getDefaultCardData())

  // 編集モード状態
  const [activeTab, setActiveTab] = useState('background') // 'background' | 'text' | 'marks' | 'crests'
  const [selectedMark, setSelectedMark] = useState(null)
  const [selectedCrest, setSelectedCrest] = useState(null)
  const [dragging, setDragging] = useState(null)

  // 画像管理フォルダから画像を取得
  const [userImages, setUserImages] = useState([])
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [loadingImages, setLoadingImages] = useState(false)

  // ユーザーの画像一覧を取得
  const loadUserImages = async () => {
    if (!profile?.id) return
    
    try {
      setLoadingImages(true)
      console.log('📂 ユーザー画像一覧を取得中...', `${profile.id}/`)
      
      const { data: files, error } = await supabase.storage
        .from('user-images')
        .list(`${profile.id}/`, {
          limit: 100,
          offset: 0,
        })

      if (error) {
        console.error('❌ ユーザー画像取得エラー:', error)
        return
      }

      if (files) {
        const imageFiles = files
          .filter(file => file.name !== '.emptyFolderPlaceholder')
          .map(file => ({
            name: file.name,
            url: supabase.storage
              .from('user-images')
              .getPublicUrl(`${profile.id}/${file.name}`).data.publicUrl,
            fullPath: `${profile.id}/${file.name}`
          }))
        
        setUserImages(imageFiles)
        console.log('🖼️ ユーザー画像:', imageFiles.length, '件')
      }
    } catch (error) {
      console.error('❌ 画像取得エラー:', error)
    } finally {
      setLoadingImages(false)
    }
  }

  // コンポーネント初期化時に画像を読み込み
  useEffect(() => {
    if (profile?.id && showImagePicker) {
      loadUserImages()
    }
  }, [profile?.id, showImagePicker])

  // コンポーネント初期化時に保存済みデータを読み込み
  useEffect(() => {
    if (profile?.id) {
      loadSavedCardData()
    }
  }, [profile?.id])

  // 保存済みの名刺データを読み込み
  const loadSavedCardData = async () => {
    if (!profile?.id) return

    try {
      setInitialLoading(true)
      console.log('📄 保存済み名刺データを読み込み中...', profile.id)
      
      const { data, error } = await supabase
        .from('digital_cards')
        .select('*')
        .eq('user_id', profile.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // データが存在しない場合は初期値を使用
          console.log('📄 新規ユーザー - 初期値を使用')
          return
        }
        throw error
      }

      if (data && data.card_data) {
        console.log('✅ 保存済みデータを復元:', data.card_data)
        
        // 保存されたデータと初期値をマージ（新しいフィールドに対応）
        const mergedData = {
          ...getDefaultCardData(),
          ...data.card_data,
          // プロフィール情報は最新のものを使用
          name: profile?.display_name || data.card_data.name || 'プリキュアファン',
          favoriteCharacter: profile?.favorite_character?.[0] || data.card_data.favoriteCharacter || 'キュアドリーム'
        }
        
        setCardData(mergedData)
      }
    } catch (error) {
      console.error('❌ 名刺データ読み込みエラー:', error)
      // エラーが発生しても初期値で続行
    } finally {
      setInitialLoading(false)
    }
  }

  // components/DigitalCard.jsx - Part 3: ユーティリティ関数
  // 背景スタイルを取得
  const getBackgroundStyle = () => {
    switch (cardData.backgroundType) {
      case 'gradient':
        if (cardData.gradientId === 'custom') {
          const { startColor, endColor, direction } = cardData.customGradient
          return {
            background: `linear-gradient(${direction}deg, ${startColor}, ${endColor})`
          }
        }
        const preset = gradientPresets.find(p => p.id === cardData.gradientId)
        return { background: preset?.gradient || gradientPresets[0].gradient }
        
      case 'solid':
        return { backgroundColor: cardData.solidColor }
        
      case 'image':
        if (!cardData.backgroundImage) {
          return { backgroundColor: '#f3f4f6' }
        }
        
        const baseStyle = {
          backgroundImage: `url(${cardData.backgroundImage})`,
          backgroundSize: `${cardData.imageSettings.scale * 100}%`,
          backgroundPosition: `${cardData.imageSettings.positionX}% ${cardData.imageSettings.positionY}%`,
          backgroundRepeat: 'no-repeat',
          transform: `rotate(${cardData.imageSettings.rotation}deg)`,
          opacity: cardData.imageSettings.opacity
        }
        
        return baseStyle
        
      default:
        return { background: gradientPresets[0].gradient }
    }
  }

  // 画像選択ダイアログを開く
  const openImagePicker = () => {
    setShowImagePicker(true)
    loadUserImages()
  }

  // 管理フォルダから画像を選択
  const selectFromLibrary = (imageUrl) => {
    setCardData(prev => ({
      ...prev,
      backgroundType: 'image',
      backgroundImage: imageUrl
    }))
    setShowImagePicker(false)
  }

  // 画像アップロード処理
  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      // Base64に変換（実際の実装ではSupabase Storageを使用）
      const reader = new FileReader()
      reader.onload = (e) => {
        setCardData(prev => ({
          ...prev,
          backgroundType: 'image',
          backgroundImage: e.target.result
        }))
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('画像アップロードエラー:', error)
    }
  }

  // プリキュアマーク追加
  const addPrecureMark = (markType) => {
    const newMark = {
      id: `${markType}_${Date.now()}`,
      type: markType,
      x: 50 + Math.random() * 20 - 10, // ランダムな位置
      y: 50 + Math.random() * 20 - 10,
      size: 24,
      color: cardData.accentColor,
      rotation: 0
    }
    
    setCardData(prev => ({
      ...prev,
      precureMarks: [...prev.precureMarks, newMark]
    }))
  }

  // プリキュアクレスト追加
  const addPrecureCrest = (crestId) => {
    const newCrest = {
      id: `crest_${Date.now()}`,
      crestId: crestId,
      x: 50 + Math.random() * 20 - 10,
      y: 50 + Math.random() * 20 - 10,
      size: 60, // デフォルトサイズを大きく
      opacity: 0.9,
      rotation: 0
    }
    
    setCardData(prev => ({
      ...prev,
      precureCrests: [...prev.precureCrests, newCrest]
    }))
  }

  // マークのドラッグ処理
  const handleMarkMouseDown = (e, markId, type = 'mark') => {
    e.stopPropagation()
    setDragging({ id: markId, type })
    if (type === 'mark') {
      setSelectedMark(markId)
      setSelectedCrest(null)
    } else {
      setSelectedCrest(markId)
      setSelectedMark(null)
    }
  }

  const handleMouseMove = (e) => {
    if (!dragging) return
    
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setCardData(prev => {
      if (dragging.type === 'mark') {
        return {
          ...prev,
          precureMarks: prev.precureMarks.map(mark =>
            mark.id === dragging.id
              ? { ...mark, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
              : mark
          )
        }
      } else {
        return {
          ...prev,
          precureCrests: prev.precureCrests.map(crest =>
            crest.id === dragging.id
              ? { ...crest, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
              : crest
          )
        }
      }
    })
  }

  const handleMouseUp = () => {
    setDragging(null)
  }

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging])

  // 名刺保存
  const saveCard = async () => {
    if (!profile?.id) {
      alert('ユーザー情報が見つかりません')
      return
    }

    setSaving(true)
    try {
      console.log('💾 名刺データを保存中...', cardData)
      
      // データベースに保存するためのデータ準備
      const saveData = {
        user_id: profile.id,
        card_data: cardData,
        updated_at: new Date().toISOString()
      }

      // 既存データの確認
      const { data: existingData, error: checkError } = await supabase
        .from('digital_cards')
        .select('id')
        .eq('user_id', profile.id)
        .single()

      let result
      if (existingData) {
        // 更新
        result = await supabase
          .from('digital_cards')
          .update(saveData)
          .eq('user_id', profile.id)
          .select()
      } else {
        // 新規作成
        saveData.created_at = new Date().toISOString()
        result = await supabase
          .from('digital_cards')
          .insert([saveData])
          .select()
      }

      if (result.error) {
        throw result.error
      }

      console.log('✅ 名刺データ保存成功:', result.data)
      alert('名刺を保存しました！✨')
      setEditing(false)
      
    } catch (error) {
      console.error('❌ 保存エラー:', error)
      
      // エラータイプに応じたメッセージ
      let errorMessage = '保存に失敗しました'
      if (error.code === '42P01') {
        errorMessage = 'データベーステーブルが見つかりません。管理者にお問い合わせください。'
      } else if (error.message) {
        errorMessage = `保存エラー: ${error.message}`
      }
      
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  // シェア機能
  const shareCard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('シェアエラー:', error)
    }
  }

  // マーク削除
  const deleteMark = (markId) => {
    setCardData(prev => ({
      ...prev,
      precureMarks: prev.precureMarks.filter(mark => mark.id !== markId)
    }))
    setSelectedMark(null)
  }

  // クレスト削除
  const deleteCrest = (crestId) => {
    setCardData(prev => ({
      ...prev,
      precureCrests: prev.precureCrests.filter(crest => crest.id !== crestId)
    }))
    setSelectedCrest(null)
  }

  // components/DigitalCard.jsx - Part 4: メインレンダー（ヘッダーとプレビュー）
  return (
    <div className="space-y-6">
      {/* 初期読み込み中の表示 */}
      {initialLoading ? (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="animate-spin mx-auto mb-4 text-blue-500" size={32} />
              <p className="text-gray-600">名刺データを読み込み中...</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ヘッダー */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">デジタル名刺エディター</h1>
                <p className="text-gray-600">カラーピッカーとプリキュアマークで、あなただけの名刺を作成 ✨</p>
              </div>
              <div className="flex space-x-2">
                {!editing ? (
                  <>
                    <button
                      onClick={() => setEditing(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Edit size={16} />
                      <span>編集</span>
                    </button>
                    <button
                      onClick={shareCard}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      {copied ? <Check size={16} /> : <Share size={16} />}
                      <span>{copied ? 'コピー済み' : 'シェア'}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditing(false)
                        // 編集をキャンセルした場合は保存済みデータを再読み込み
                        loadSavedCardData()
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={saveCard}
                      disabled={loading}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                      {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                      <span>{loading ? '保存中...' : '保存'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* 名刺プレビュー */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">プレビュー</h2>
              
              <div className="flex justify-center">
                <div 
                  ref={cardRef}
                  className="relative rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300 cursor-pointer"
                  style={{
                    width: 'min(600px, calc(100vw - 3rem))',
                    aspectRatio: '91/55',
                    ...getBackgroundStyle()
                  }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  {/* 背景画像のフィルター効果 */}
                  {cardData.backgroundType === 'image' && cardData.backgroundImage && cardData.imageSettings.filter !== 'none' && (
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={imageFilters.find(f => f.id === cardData.imageSettings.filter)?.style || {}}
                    />
                  )}

                  {/* 名刺コンテンツ */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">
                    <div>
                      <h3 
                        className="text-xl font-bold drop-shadow-lg"
                        style={{ color: cardData.textColor }}
                      >
                        {cardData.name}
                      </h3>
                      <p 
                        className="text-sm opacity-90 drop-shadow-lg"
                        style={{ color: cardData.textColor }}
                      >
                        最推し: {cardData.favoriteCharacter}
                      </p>
                    </div>

                    <div className="flex items-end justify-between">
                      <p 
                        className="text-sm font-bold drop-shadow-lg"
                        style={{ color: cardData.accentColor }}
                      >
                        Precure Profile Card
                      </p>
                      
                      {cardData.showQR && (
                        <div className="bg-white p-2 rounded shadow-sm">
                          <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center text-xs">
                            QR
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* プリキュアマーク */}
                  {cardData.precureMarks.map((mark) => {
                    const MarkComponent = defaultPrecureMarks.find(m => m.id === mark.type)?.component || Heart
                    return (
                      <div
                        key={mark.id}
                        className={`absolute cursor-move transform -translate-x-1/2 -translate-y-1/2 ${
                          editing ? 'pointer-events-auto' : 'pointer-events-none'
                        } ${selectedMark === mark.id ? 'ring-2 ring-blue-400 ring-opacity-75' : ''}`}
                        style={{
                          left: `${mark.x}%`,
                          top: `${mark.y}%`,
                          color: mark.color,
                          transform: `translate(-50%, -50%) rotate(${mark.rotation}deg)`
                        }}
                        onMouseDown={(e) => editing && handleMarkMouseDown(e, mark.id, 'mark')}
                      >
                        <MarkComponent size={mark.size} className="drop-shadow-lg" />
                      </div>
                    )
                  })}

                  {/* プリキュアクレスト */}
                  {cardData.precureCrests.map((crest) => {
                    const crestData = precureCrests.find(c => c.id === crest.crestId)
                    return (
                      <div
                        key={crest.id}
                        className={`absolute cursor-move ${
                          editing ? 'pointer-events-auto' : 'pointer-events-none'
                        } ${selectedCrest === crest.id ? 'ring-2 ring-blue-400 ring-opacity-75' : ''}`}
                        style={{
                          left: `${crest.x}%`,
                          top: `${crest.y}%`,
                          opacity: crest.opacity,
                          transform: `translate(-50%, -50%)`,
                          width: `${crest.size}px`,
                          height: `${crest.size}px`
                        }}
                        onMouseDown={(e) => editing && handleMarkMouseDown(e, crest.id, 'crest')}
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
                              // フォールバック: 画像が見つからない場合はスターアイコンを表示
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
            </div>

            {/* エディターパネル */}
            {editing && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">エディター</h2>
                
                {/* タブナビゲーション */}
                <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
                  {[
                    { id: 'background', label: '背景', icon: Palette },
                    { id: 'text', label: 'テキスト', icon: Type },
                    { id: 'marks', label: 'マーク', icon: Star },
                    { id: 'crests', label: 'クレスト', icon: Sparkles }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-colors ${
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

                {/* 背景設定 */}
                {activeTab === 'background' && (
                  <div className="space-y-4">
                    {/* 背景タイプ選択 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">背景タイプ</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'gradient', label: 'グラデーション' },
                          { id: 'solid', label: 'ソリッド' },
                          { id: 'image', label: '画像' }
                        ].map(type => (
                          <button
                            key={type.id}
                            onClick={() => setCardData(prev => ({ ...prev, backgroundType: type.id }))}
                            className={`p-2 text-xs font-medium rounded-lg transition-colors ${
                              cardData.backgroundType === type.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* グラデーション設定 */}
                    {cardData.backgroundType === 'gradient' && (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">プリセット</label>
                        <div className="grid grid-cols-2 gap-2">
                          {gradientPresets.map(preset => (
                            <button
                              key={preset.id}
                              onClick={() => setCardData(prev => ({ ...prev, gradientId: preset.id }))}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                cardData.gradientId === preset.id
                                  ? 'border-blue-500 ring-2 ring-blue-200'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              style={{ background: preset.gradient }}
                            >
                              <div className="text-xs font-medium text-white drop-shadow-lg">
                                {preset.name}
                              </div>
                            </button>
                          ))}
                        </div>
                        
                        {cardData.gradientId === 'custom' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">開始色</label>
                              <input
                                type="color"
                                value={cardData.customGradient.startColor}
                                onChange={(e) => setCardData(prev => ({
                                  ...prev,
                                  customGradient: { ...prev.customGradient, startColor: e.target.value }
                                }))}
                                className="w-full h-10 rounded-lg border border-gray-300"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">終了色</label>
                              <input
                                type="color"
                                value={cardData.customGradient.endColor}
                                onChange={(e) => setCardData(prev => ({
                                  ...prev,
                                  customGradient: { ...prev.customGradient, endColor: e.target.value }
                                }))}
                                className="w-full h-10 rounded-lg border border-gray-300"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ソリッドカラー設定 */}
                    {cardData.backgroundType === 'solid' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">背景色</label>
                        <input
                          type="color"
                          value={cardData.solidColor}
                          onChange={(e) => setCardData(prev => ({ ...prev, solidColor: e.target.value }))}
                          className="w-full h-12 rounded-lg border border-gray-300"
                        />
                      </div>
                    )}

                    {/* 画像アップロード */}
                    {cardData.backgroundType === 'image' && (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">背景画像</label>
                        
                        {/* 画像選択方法 */}
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="background-upload"
                          />
                          <label
                            htmlFor="background-upload"
                            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                          >
                            <Upload size={20} className="text-gray-400 mb-1" />
                            <span className="text-xs text-gray-600 text-center">新しい画像を<br />アップロード</span>
                          </label>
                          
                          <button
                            onClick={openImagePicker}
                            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 transition-colors bg-blue-50"
                          >
                            <ImageIcon size={20} className="text-blue-500 mb-1" />
                            <span className="text-xs text-blue-600 text-center">画像管理から<br />選択</span>
                          </button>
                        </div>
                        
                        {cardData.backgroundImage && (
                          <div className="space-y-2">
                            <div className="relative">
                              <img 
                                src={cardData.backgroundImage} 
                                alt="選択された背景画像" 
                                className="w-full h-20 object-cover rounded-lg border"
                              />
                              <button
                                onClick={() => setCardData(prev => ({ ...prev, backgroundImage: null }))}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            
                            <label className="block text-xs text-gray-600">透明度</label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={cardData.imageSettings.opacity}
                              onChange={(e) => setCardData(prev => ({
                                ...prev,
                                imageSettings: { ...prev.imageSettings, opacity: parseFloat(e.target.value) }
                              }))}
                              className="w-full"
                            />
                            
                            <label className="block text-xs text-gray-600 mt-2 mb-1">フィルター効果</label>
                            <select
                              value={cardData.imageSettings.filter}
                              onChange={(e) => setCardData(prev => ({
                                ...prev,
                                imageSettings: { ...prev.imageSettings, filter: e.target.value }
                              }))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            >
                              {imageFilters.map(filter => (
                                <option key={filter.id} value={filter.id}>
                                  {filter.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* テキスト設定 */}
                {activeTab === 'text' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">名前</label>
                      <input
                        type="text"
                        value={cardData.name}
                        onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">最推しキャラクター</label>
                      <input
                        type="text"
                        value={cardData.favoriteCharacter}
                        onChange={(e) => setCardData(prev => ({ ...prev, favoriteCharacter: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">テキスト色</label>
                        <input
                          type="color"
                          value={cardData.textColor}
                          onChange={(e) => setCardData(prev => ({ ...prev, textColor: e.target.value }))}
                          className="w-full h-10 rounded-lg border border-gray-300"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">アクセント色</label>
                        <input
                          type="color"
                          value={cardData.accentColor}
                          onChange={(e) => setCardData(prev => ({ ...prev, accentColor: e.target.value }))}
                          className="w-full h-10 rounded-lg border border-gray-300"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="show-qr"
                        checked={cardData.showQR}
                        onChange={(e) => setCardData(prev => ({ ...prev, showQR: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="show-qr" className="text-sm text-gray-700">QRコードを表示</label>
                    </div>
                  </div>
                )}

                {/* プリキュアマーク設定 */}
                {activeTab === 'marks' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">マークを追加</label>
                      <div className="grid grid-cols-3 gap-2">
                        {defaultPrecureMarks.map(mark => (
                          <button
                            key={mark.id}
                            onClick={() => addPrecureMark(mark.id)}
                            className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <mark.component size={20} className="text-pink-500 mb-1" />
                            <span className="text-xs text-gray-600">{mark.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 配置済みマーク一覧 */}
                    {cardData.precureMarks.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">配置済みマーク</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {cardData.precureMarks.map((mark, index) => {
                            const MarkComponent = defaultPrecureMarks.find(m => m.id === mark.type)?.component || Heart
                            return (
                              <div
                                key={mark.id}
                                className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                                  selectedMark === mark.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                }`}
                                onClick={() => setSelectedMark(mark.id)}
                              >
                                <div className="flex items-center space-x-2">
                                  <MarkComponent size={16} style={{ color: mark.color }} />
                                  <span className="text-sm text-gray-700">マーク {index + 1}</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteMark(mark.id)
                                  }}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {selectedMark && (
                      <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">選択中のマーク設定</label>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">色</label>
                            <input
                              type="color"
                              value={cardData.precureMarks.find(m => m.id === selectedMark)?.color || '#ffffff'}
                              onChange={(e) => setCardData(prev => ({
                                ...prev,
                                precureMarks: prev.precureMarks.map(mark =>
                                  mark.id === selectedMark ? { ...mark, color: e.target.value } : mark
                                )
                              }))}
                              className="w-full h-8 rounded border border-gray-300"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">サイズ</label>
                            <input
                              type="range"
                              min="12"
                              max="48"
                              value={cardData.precureMarks.find(m => m.id === selectedMark)?.size || 24}
                              onChange={(e) => setCardData(prev => ({
                                ...prev,
                                precureMarks: prev.precureMarks.map(mark =>
                                  mark.id === selectedMark ? { ...mark, size: parseInt(e.target.value) } : mark
                                )
                              }))}
                              className="w-full"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">回転</label>
                            <input
                              type="range"
                              min="0"
                              max="360"
                              value={cardData.precureMarks.find(m => m.id === selectedMark)?.rotation || 0}
                              onChange={(e) => setCardData(prev => ({
                                ...prev,
                                precureMarks: prev.precureMarks.map(mark =>
                                  mark.id === selectedMark ? { ...mark, rotation: parseInt(e.target.value) } : mark
                                )
                              }))}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                      <p>💡 ヒント:</p>
                      <ul className="mt-1 space-y-1">
                        <li>• マークをクリックして選択・編集</li>
                        <li>• ドラッグして位置を調整</li>
                        <li>• プリキュアマークの画像をアップロード予定</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* プリキュアクレスト設定 */}
                {activeTab === 'crests' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">プリキュアクレストを追加</label>
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                        {precureCrests.map(crest => (
                          <button
                            key={crest.id}
                            onClick={() => addPrecureCrest(crest.id)}
                            className="flex items-center space-x-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                          >
                            <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                              <Star size={16} className="text-white" />
                            </div>
                            <span className="text-xs text-gray-700 truncate">{crest.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 配置済みクレスト一覧 */}
                    {cardData.precureCrests.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">配置済みクレスト</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {cardData.precureCrests.map((crest, index) => {
                            const crestData = precureCrests.find(c => c.id === crest.crestId)
                            return (
                              <div
                                key={crest.id}
                                className={`flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer ${
                                  selectedCrest === crest.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                }`}
                                onClick={() => setSelectedCrest(crest.id)}
                              >
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                                    <Star size={12} className="text-white" />
                                  </div>
                                  <span className="text-sm text-gray-700 truncate">
                                    {crestData?.name || 'クレスト'} {index + 1}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteCrest(crest.id)
                                  }}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {selectedCrest && (
                      <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">選択中のクレスト設定</label>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">透明度</label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={cardData.precureCrests.find(c => c.id === selectedCrest)?.opacity || 0.9}
                              onChange={(e) => setCardData(prev => ({
                                ...prev,
                                precureCrests: prev.precureCrests.map(crest =>
                                  crest.id === selectedCrest ? { ...crest, opacity: parseFloat(e.target.value) } : crest
                                )
                              }))}
                              className="w-full"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">サイズ</label>
                            <input
                              type="range"
                              min="20"
                              max="120"
                              value={cardData.precureCrests.find(c => c.id === selectedCrest)?.size || 60}
                              onChange={(e) => setCardData(prev => ({
                                ...prev,
                                precureCrests: prev.precureCrests.map(crest =>
                                  crest.id === selectedCrest ? { ...crest, size: parseInt(e.target.value) } : crest
                                )
                              }))}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>小さい (20px)</span>
                              <span>大きい (120px)</span>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">回転</label>
                            <input
                              type="range"
                              min="0"
                              max="360"
                              value={cardData.precureCrests.find(c => c.id === selectedCrest)?.rotation || 0}
                              onChange={(e) => setCardData(prev => ({
                                ...prev,
                                precureCrests: prev.precureCrests.map(crest =>
                                  crest.id === selectedCrest ? { ...crest, rotation: parseInt(e.target.value) } : crest
                                )
                              }))}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                      <p>💡 ヒント:</p>
                      <ul className="mt-1 space-y-1">
                        <li>• クレストをクリックして選択・編集</li>
                        <li>• ドラッグして位置を調整</li>
                        <li>• 全21作品のクレストに対応</li>
                        <li>• JPG画像ファイルを/crests/フォルダに配置</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 画像選択モーダル */}
          {showImagePicker && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
                {/* モーダルヘッダー */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-800">画像管理フォルダから選択</h3>
                  <button
                    onClick={() => setShowImagePicker(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                {/* 画像一覧 */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  {loadingImages ? (
                    <div className="text-center py-12">
                      <RefreshCw className="animate-spin mx-auto mb-4 text-gray-400" size={32} />
                      <p className="text-gray-600">画像を読み込み中...</p>
                    </div>
                  ) : userImages.length > 0 ? (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {userImages.map((image, index) => (
                        <div
                          key={index}
                          className="relative group cursor-pointer"
                          onClick={() => selectFromLibrary(image.url)}
                        >
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                            <img
                              src={image.url}
                              alt={image.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          </div>
                          
                          {/* ホバー時のオーバーレイ */}
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                            <div className="text-white text-center">
                              <ImageIcon size={24} className="mx-auto mb-1" />
                              <span className="text-xs font-medium">選択</span>
                            </div>
                          </div>
                          
                          {/* 選択中の画像表示 */}
                          {cardData.backgroundImage === image.url && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                              <Check size={12} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ImageIcon className="mx-auto mb-4 text-gray-300" size={64} />
                      <h4 className="text-lg font-medium text-gray-600 mb-2">画像がありません</h4>
                      <p className="text-gray-500 mb-4">
                        まず「画像管理」ページから画像をアップロードしてください
                      </p>
                      <button
                        onClick={() => {
                          setShowImagePicker(false)
                          // 画像管理ページに移動（実際の実装では適切なナビゲーション）
                          console.log('画像管理ページに移動')
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        画像管理ページへ
                      </button>
                    </div>
                  )}
                </div>
                
                {/* モーダルフッター */}
                <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
                  <div className="text-sm text-gray-600">
                    {userImages.length > 0 && `${userImages.length}枚の画像が利用可能`}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowImagePicker(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      キャンセル
                    </button>
                    {cardData.backgroundImage && (
                      <button
                        onClick={() => setShowImagePicker(false)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        選択完了
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 使用方法ガイド */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🎨 強化版デジタル名刺エディターの特徴</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-pink-600 mb-3">✨ 背景カスタマイズ</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                    <span>プリキュア作品別グラデーションプリセット</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>カラーピッカーでカスタムグラデーション</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>8種類の画像フィルター効果</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>画像管理フォルダから選択可能</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-purple-600 mb-3">🌟 プリキュア装飾機能</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                    <span>全21作品のプリキュアクレスト対応</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>ドラッグ&ドロップで自由配置</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>透明度・サイズ・回転を個別調整</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>JPG画像ファイル対応予定</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-white rounded-lg border border-pink-200">
              <h5 className="font-medium text-gray-800 mb-2">🎯 画像フィルター効果</h5>
              <div className="grid md:grid-cols-4 gap-3 text-sm text-gray-600">
                <div>
                  <span className="font-medium text-pink-600">プリキュアレインボー</span>
                  <p>虹色グラデーション効果</p>
                </div>
                <div>
                  <span className="font-medium text-purple-600">ピンクドリーム</span>
                  <p>優しいピンクフィルター</p>
                </div>
                <div>
                  <span className="font-medium text-blue-600">マジカルパープル</span>
                  <p>神秘的な紫フィルター</p>
                </div>
                <div>
                  <span className="font-medium text-green-600">その他5種類</span>
                  <p>様々なムード演出</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h5 className="font-medium text-gray-800 mb-2">📁 ファイル準備のお願い</h5>
              <p className="text-sm text-gray-600">
                プリキュアクレストの画像ファイル（JPG/PNG）を <code className="bg-yellow-200 px-1 rounded">/public/crests/</code> フォルダに配置してください。
                ファイル名は <code className="bg-yellow-200 px-1 rounded">futari_wa.png</code>, <code className="bg-yellow-200 px-1 rounded">smile.png</code> などの形式でお願いします。
              </p>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-medium text-gray-800 mb-2">💾 自動保存機能</h5>
              <p className="text-sm text-gray-600">
                設定変更は「保存」ボタンを押すとデータベースに保存され、ページを更新しても設定が保持されます。
                編集中に「キャンセル」を押すと、最後に保存した状態に戻ります。
              </p>
            </div>
          </div>
          </>
      )}
    </div>
  )
}