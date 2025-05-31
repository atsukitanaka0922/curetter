// components/DigitalCard.jsx - デジタル名刺コンポーネント（完全書き直し版）
'use client'

import { useState, useEffect, useRef } from 'react'
import { Heart, Star, Sparkles, Share, Edit, Save, X, QrCode, Copy, Check, Move, ZoomIn, ZoomOut, Crop, RotateCcw } from 'lucide-react'
import { supabase } from '../app/page'

export default function DigitalCard({ session, profile }) {
  // 状態管理
  const [cardData, setCardData] = useState({
    name: 'プリキュアファン',
    favoriteCharacter: '未設定',
    backgroundType: 'template',
    backgroundImage: '',
    templateId: 'precure_classic',
    profileUrl: '',
    imageSettings: {
      scale: 1,
      positionX: 50,
      positionY: 50,
      opacity: 0.3,
      rotation: 0
    },
    useImageEffect: true,
    customTextColor: null,
    customAccentColor: null
  })
  
  const [images, setImages] = useState([])
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  
  // 画像編集モーダルの状態
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [selectedImageForEdit, setSelectedImageForEdit] = useState(null)
  const [tempImageSettings, setTempImageSettings] = useState({
    scale: 1,
    positionX: 50,
    positionY: 50,
    opacity: 0.3,
    rotation: 0
  })
  
  // ドラッグ関連
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  const cardRef = useRef(null)
  const imageEditorRef = useRef(null)

  // プリキュアテンプレート
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

  // 初期化
  useEffect(() => {
    if (session?.user?.id) {
      initializeCardData()
      loadImages()
      loadSavedCardData()
    }
  }, [session])

  // プロフィール変更時の更新
  useEffect(() => {
    if (profile && session?.user?.id) {
      setCardData(prev => ({
        ...prev,
        name: profile.display_name || prev.name,
        favoriteCharacter: Array.isArray(profile.favorite_character) && profile.favorite_character.length > 0 
          ? profile.favorite_character[0] 
          : prev.favoriteCharacter
      }))
    }
  }, [profile])

  // QRコード生成
  useEffect(() => {
    if (cardData.profileUrl) {
      generateQRCode()
    }
  }, [cardData.profileUrl])

  // 初期データ設定
  const initializeCardData = () => {
    const profileUrl = `${window.location.origin}/?profile=${session.user.id}`
    
    setCardData(prev => ({
      ...prev,
      name: profile?.display_name || 'プリキュアファン',
      favoriteCharacter: Array.isArray(profile?.favorite_character) && profile.favorite_character.length > 0 
        ? profile.favorite_character[0] 
        : '未設定',
      profileUrl: profileUrl
    }))
  }

  // 画像一覧を取得
  const loadImages = async () => {
    try {
      const { data: files, error } = await supabase.storage
        .from('user-images')
        .list(`${session.user.id}/`, {
          limit: 100,
          offset: 0,
        })

      if (error) throw error

      if (files) {
        const imageFiles = files
          .filter(file => file.name !== '.emptyFolderPlaceholder' && file.name !== '')
          .map(file => ({
            name: file.name,
            url: supabase.storage.from('user-images').getPublicUrl(`${session.user.id}/${file.name}`).data.publicUrl,
            fullPath: `${session.user.id}/${file.name}`
          }))
        
        setImages(imageFiles)
      }
    } catch (error) {
      console.error('画像取得エラー:', error)
    }
  }

  // 保存されたカードデータを読み込み
  const loadSavedCardData = async () => {
    try {
      const { data, error } = await supabase
        .from('digital_cards')
        .select('card_data')
        .eq('user_id', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data?.card_data) {
        const savedData = data.card_data
        setCardData(prev => ({
          ...prev,
          ...savedData,
          name: profile?.display_name || savedData.name || prev.name,
          favoriteCharacter: Array.isArray(profile?.favorite_character) && profile.favorite_character.length > 0 
            ? profile.favorite_character[0] 
            : savedData.favoriteCharacter || prev.favoriteCharacter,
          profileUrl: `${window.location.origin}/?profile=${session.user.id}`
        }))
      }
    } catch (error) {
      console.error('保存データ読み込みエラー:', error)
    }
  }

  // QRコード生成
  const generateQRCode = async () => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cardData.profileUrl)}&bgcolor=ffffff&color=000000`
      
      const response = await fetch(qrUrl)
      const blob = await response.blob()
      
      const reader = new FileReader()
      reader.onload = () => {
        setQrCodeDataUrl(reader.result)
      }
      reader.readAsDataURL(blob)
    } catch (error) {
      console.error('QRコード生成エラー:', error)
    }
  }

  // カードデータを保存
  const saveCardData = async () => {
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('digital_cards')
        .upsert({
          user_id: session.user.id,
          card_data: cardData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('保存エラー:', error)
        throw error
      }

      setEditing(false)
      alert('名刺デザインを保存しました！✨')
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 画像編集モーダルを開く
  const openImageEditor = (imageUrl) => {
    setSelectedImageForEdit(imageUrl)
    setTempImageSettings({ ...cardData.imageSettings })
    setShowImageEditor(true)
  }

  // 画像編集を適用
  const applyImageEdit = () => {
    setCardData(prev => ({
      ...prev,
      backgroundImage: selectedImageForEdit,
      backgroundType: 'image',
      imageSettings: { ...tempImageSettings }
    }))
    setShowImageEditor(false)
  }

  // 画像編集をキャンセル
  const cancelImageEdit = () => {
    setTempImageSettings({ ...cardData.imageSettings })
    setShowImageEditor(false)
  }

  // ドラッグ操作
  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    e.preventDefault()
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    
    const container = imageEditorRef.current
    if (container) {
      const rect = container.getBoundingClientRect()
      const moveX = (deltaX / rect.width) * 20
      const moveY = (deltaY / rect.height) * 20

      setTempImageSettings(prev => ({
        ...prev,
        positionX: Math.max(0, Math.min(100, prev.positionX + moveX)),
        positionY: Math.max(0, Math.min(100, prev.positionY + moveY))
      }))
      
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // マウスイベントの登録/解除
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  // 名刺をシェア
  const shareCard = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${cardData.name}のプリキュア名刺`,
          text: `プリキュアファンの${cardData.name}です！最推しは${cardData.favoriteCharacter}です✨`,
          url: cardData.profileUrl
        })
      } else {
        await navigator.clipboard.writeText(cardData.profileUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (error) {
      console.error('シェアエラー:', error)
    }
  }

  // カードデータ更新
  const updateCardData = (updates) => {
    setCardData(prev => ({
      ...prev,
      ...updates
    }))
  }

  const currentTemplate = cardTemplates[cardData.templateId]

  // プレビュー用の背景スタイル（エディター）
  const getEditorPreviewStyle = () => {
    const { scale, positionX, positionY, opacity, rotation } = tempImageSettings
    return {
      backgroundImage: `url(${selectedImageForEdit})`,
      backgroundSize: `${scale * 100}% auto`,
      backgroundPosition: `${positionX}% ${positionY}%`,
      backgroundRepeat: 'no-repeat',
      transform: `rotate(${rotation}deg)`,
      opacity: opacity,
      transition: isDragging ? 'none' : 'all 0.2s ease'
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">デジタル名刺</h1>
            <p className="text-gray-600">あなたのプリキュア愛を込めた名刺を作成しましょう ✨</p>
          </div>
          <div className="flex space-x-2">
            {!editing && (
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
            )}
          </div>
        </div>
      </div>

      {/* 名刺プレビュー */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">プレビュー</h2>
        
        <div className="flex justify-center mb-6">
          <div 
            ref={cardRef}
            className="relative rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300"
            style={{
              width: 'min(600px, calc(100vw - 3rem))',
              aspectRatio: '91/55',
              background: currentTemplate.background
            }}
          >
            {/* 背景画像レイヤー */}
            {cardData.backgroundType === 'image' && cardData.backgroundImage && (
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${cardData.backgroundImage})`,
                  backgroundSize: `${cardData.imageSettings.scale * 100}% auto`,
                  backgroundPosition: `${cardData.imageSettings.positionX}% ${cardData.imageSettings.positionY}%`,
                  backgroundRepeat: 'no-repeat',
                  transform: `rotate(${cardData.imageSettings.rotation}deg)`,
                  opacity: cardData.imageSettings.opacity,
                  mixBlendMode: cardData.useImageEffect ? 'overlay' : 'normal'
                }}
              ></div>
            )}

            {/* 装飾要素 */}
            <div className="absolute top-4 right-4 opacity-20 z-10">
              <Sparkles size={32} color={currentTemplate.accentColor} />
            </div>
            <div className="absolute bottom-4 left-4 opacity-20 z-10">
              <Heart size={24} color={currentTemplate.accentColor} />
            </div>
            <div className="absolute top-6 left-6 opacity-20 z-10">
              <Star size={20} color={currentTemplate.accentColor} />
            </div>

            {/* メインコンテンツ */}
            <div className="relative z-20 h-full flex flex-col justify-between p-6">
              <div>
                <h3 
                  className="text-2xl font-bold mb-2"
                  style={{ 
                    color: cardData.customTextColor || currentTemplate.textColor,
                    textShadow: cardData.backgroundType === 'image' && !cardData.useImageEffect ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
                  }}
                >
                  {cardData.name}
                </h3>
                <p 
                  className="text-sm opacity-90"
                  style={{ 
                    color: cardData.customTextColor || currentTemplate.textColor,
                    textShadow: cardData.backgroundType === 'image' && !cardData.useImageEffect ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
                  }}
                >
                  最推し: {cardData.favoriteCharacter}
                </p>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p 
                    className="text-lg font-semibold"
                    style={{ 
                      color: cardData.customAccentColor || currentTemplate.accentColor,
                      textShadow: cardData.backgroundType === 'image' && !cardData.useImageEffect ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
                    }}
                  >
                    プリキュアファン
                  </p>
                  <p 
                    className="text-xs opacity-80"
                    style={{ 
                      color: cardData.customTextColor || currentTemplate.textColor,
                      textShadow: cardData.backgroundType === 'image' && !cardData.useImageEffect ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
                    }}
                  >
                    Precure Profile Card
                  </p>
                </div>
                
                <div className="bg-white p-2 rounded-lg shadow-lg">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="プロフィールQRコード"
                      className="w-16 h-16"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 flex items-center justify-center">
                      <QrCode size={24} className="text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 全体のグラデーションオーバーレイ */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/10 z-10"></div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">QRコードからプロフィールページにアクセス</p>
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <QrCode size={14} />
            <span className="truncate max-w-xs">{cardData.profileUrl}</span>
            <button
              onClick={() => navigator.clipboard.writeText(cardData.profileUrl)}
              className="text-blue-500 hover:text-blue-700"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 編集パネル */}
      {editing && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">名刺編集</h2>
            <button
              onClick={() => setEditing(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">名前</label>
                <input
                  type="text"
                  value={cardData.name}
                  onChange={(e) => updateCardData({name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="あなたの名前"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">最推しプリキュア</label>
                <input
                  type="text"
                  value={cardData.favoriteCharacter}
                  onChange={(e) => updateCardData({favoriteCharacter: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="例：キュアブラック"
                />
              </div>
            </div>

            {/* 背景テンプレート */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">背景テンプレート</label>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {Object.entries(cardTemplates).map(([id, template]) => (
                  <button
                    key={id}
                    onClick={() => updateCardData({templateId: id, backgroundType: 'template'})}
                    className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      cardData.templateId === id && cardData.backgroundType === 'template'
                        ? 'border-pink-500 ring-2 ring-pink-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ background: template.background }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-white drop-shadow-lg text-center px-2">
                        {template.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* アップロード画像から選択 - シンプルリスト形式 */}
              {images.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Crop size={16} className="mr-2" />
                    アップロード済み画像から選択
                  </h4>
                  
                  <div className="space-y-2 mb-4">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className={`flex items-center p-3 border-2 rounded-lg transition-all cursor-pointer hover:bg-gray-50 ${
                          cardData.backgroundImage === image.url && cardData.backgroundType === 'image'
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => openImageEditor(image.url)}
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 mr-4 border border-gray-200">
                          <img
                            src={image.url}
                            alt={`画像 ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextElementSibling.style.display = 'flex'
                            }}
                          />
                          <div className="w-full h-full hidden items-center justify-center text-xs text-gray-500">
                            読み込みエラー
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {image.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {cardData.backgroundImage === image.url && cardData.backgroundType === 'image' ? '選択中' : 'クリックして編集'}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {cardData.backgroundImage === image.url && cardData.backgroundType === 'image' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                  使用中
                                </span>
                              )}
                              <Crop size={16} className="text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 画像エフェクト設定 */}
              {cardData.backgroundType === 'image' && cardData.backgroundImage && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">画像エフェクト設定</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={cardData.useImageEffect}
                        onChange={(e) => updateCardData({ useImageEffect: e.target.checked })}
                        className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                      />
                      <span className="text-sm text-gray-700">背景画像とテンプレートをブレンドする</span>
                    </label>
                    <p className="text-xs text-gray-500 ml-6">
                      オフにすると画像がそのまま表示され、文字が見やすくなります
                    </p>
                  </div>
                </div>
              )}

              {/* 文字色設定 */}
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">文字色設定</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">メイン文字色</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={cardData.customTextColor || currentTemplate.textColor}
                        onChange={(e) => updateCardData({ customTextColor: e.target.value })}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                      />
                      <span className="text-xs text-gray-500 flex-1">
                        {cardData.customTextColor || currentTemplate.textColor}
                      </span>
                      <button
                        onClick={() => updateCardData({ customTextColor: null })}
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >
                        リセット
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">アクセント色</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={cardData.customAccentColor || currentTemplate.accentColor}
                        onChange={(e) => updateCardData({ customAccentColor: e.target.value })}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                      />
                      <span className="text-xs text-gray-500 flex-1">
                        {cardData.customAccentColor || currentTemplate.accentColor}
                      </span>
                      <button
                        onClick={() => updateCardData({ customAccentColor: null })}
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >
                        リセット
                      </button>
                    </div>
                  </div>
                </div>

                {/* プリセット色 */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 mb-2">プリセット色</label>
                  <div className="flex space-x-2">
                    {[
                      { name: '白', text: '#ffffff', accent: '#ffffff' },
                      { name: '黒', text: '#000000', accent: '#333333' },
                      { name: 'ピンク', text: '#ffffff', accent: '#ff69b4' },
                      { name: 'ブルー', text: '#ffffff', accent: '#4a90e2' },
                      { name: 'ゴールド', text: '#000000', accent: '#ffd700' }
                    ].map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => updateCardData({ 
                          customTextColor: preset.text, 
                          customAccentColor: preset.accent 
                        })}
                        className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                        style={{ 
                          backgroundColor: preset.text === '#ffffff' ? '#f8f9fa' : preset.text,
                          color: preset.text === '#ffffff' ? '#000' : '#fff'
                        }}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 保存ボタン */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setEditing(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={saveCardData}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Save size={16} />
                <span>{loading ? '保存中...' : '保存'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Twitter風画像編集モーダル */}
      {showImageEditor && selectedImageForEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full h-full sm:max-w-6xl sm:max-h-[95vh] flex flex-col overflow-hidden">
            {/* モーダルヘッダー */}
            <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-3">
                <button
                  onClick={cancelImageEdit}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X size={20} />
                </button>
                <h3 className="text-lg font-semibold text-gray-800">メディアを編集</h3>
              </div>
              <button
                onClick={applyImageEdit}
                className="bg-black text-white px-4 sm:px-6 py-2 rounded-full hover:bg-gray-800 transition-colors font-medium text-sm sm:text-base"
              >
                適用
              </button>
            </div>

            {/* 編集エリア */}
            <div className="flex-1 flex flex-col sm:flex-row min-h-0">
              {/* プレビューエリア */}
              <div className="flex-1 bg-gray-100 relative min-h-0 flex items-center justify-center p-4">
                <div className="w-full h-full max-w-none max-h-none flex items-center justify-center">
                  {/* 名刺フレーム */}
                  <div 
                    className="relative bg-white rounded-lg shadow-xl overflow-hidden border-4 border-blue-400"
                    style={{
                      width: 'min(calc(100vw - 2rem), calc(100vh - 12rem), 520px)',
                      aspectRatio: '91/55',
                    }}
                  >
                    {/* 背景プレビュー */}
                    <div 
                      ref={imageEditorRef}
                      className="absolute inset-0 cursor-move"
                      style={getEditorPreviewStyle()}
                      onMouseDown={handleMouseDown}
                    >
                      {/* グリッドオーバーレイ */}
                      <div className="absolute inset-0 pointer-events-none opacity-30">
                        <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                          {[...Array(9)].map((_, i) => (
                            <div key={i} className="border border-white/50"></div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* テンプレート背景オーバーレイ */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{ 
                        background: currentTemplate.background,
                        opacity: 0.3,
                        mixBlendMode: 'multiply'
                      }}
                    ></div>

                    {/* 名刺コンテンツオーバーレイ */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="relative z-10 h-full flex flex-col justify-between p-3 sm:p-4">
                        <div>
                          <h3 
                            className="text-sm sm:text-lg font-bold drop-shadow-lg"
                            style={{ 
                              color: cardData.customTextColor || currentTemplate.textColor,
                              textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
                            }}
                          >
                            {cardData.name}
                          </h3>
                          <p 
                            className="text-xs sm:text-sm opacity-90 drop-shadow-lg"
                            style={{ 
                              color: cardData.customTextColor || currentTemplate.textColor,
                              textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
                            }}
                          >
                            最推し: {cardData.favoriteCharacter}
                          </p>
                        </div>

                        <div className="flex items-end justify-between">
                          <div>
                            <p 
                              className="text-xs sm:text-sm font-semibold drop-shadow-lg"
                              style={{ 
                                color: cardData.customAccentColor || currentTemplate.accentColor,
                                textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
                              }}
                            >
                              プリキュアファン
                            </p>
                            <p 
                              className="text-xs opacity-80 drop-shadow-lg"
                              style={{ 
                                color: cardData.customTextColor || currentTemplate.textColor,
                                textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
                              }}
                            >
                              Precure Profile Card
                            </p>
                          </div>
                          
                          <div className="bg-white p-1 rounded shadow">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 flex items-center justify-center">
                              <QrCode size={12} className="text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 操作ヒント */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-black/75 text-white px-3 py-2 rounded-full text-xs sm:text-sm">
                    画像をドラッグして位置を調整
                  </div>
                </div>
              </div>

              {/* コントロールパネル */}
              <div className="w-full sm:w-80 bg-white border-t sm:border-t-0 sm:border-l border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6 flex-shrink-0 overflow-y-auto max-h-64 sm:max-h-none">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
                    <ZoomIn size={16} className="mr-2" />
                    画像調整
                  </h4>

                  <div className="space-y-3 sm:space-y-4">
                    {/* ズーム */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-600">ズーム</label>
                        <span className="text-xs text-gray-500">{Math.round(tempImageSettings.scale * 100)}%</span>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <ZoomOut size={14} className="text-gray-400 flex-shrink-0" />
                        <input
                          type="range"
                          min="0.5"
                          max="3"
                          step="0.1"
                          value={tempImageSettings.scale}
                          onChange={(e) => setTempImageSettings(prev => ({
                            ...prev,
                            scale: parseFloat(e.target.value)
                          }))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <ZoomIn size={14} className="text-gray-400 flex-shrink-0" />
                      </div>
                    </div>

                    {/* 透明度 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-600">透明度</label>
                        <span className="text-xs text-gray-500">{Math.round(tempImageSettings.opacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={tempImageSettings.opacity}
                        onChange={(e) => setTempImageSettings(prev => ({
                          ...prev,
                          opacity: parseFloat(e.target.value)
                        }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* 回転 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-600">回転</label>
                        <span className="text-xs text-gray-500">{tempImageSettings.rotation}°</span>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <RotateCcw size={14} className="text-gray-400 flex-shrink-0" />
                        <input
                          type="range"
                          min="-45"
                          max="45"
                          step="5"
                          value={tempImageSettings.rotation}
                          onChange={(e) => setTempImageSettings(prev => ({
                            ...prev,
                            rotation: parseInt(e.target.value)
                          }))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <RotateCcw size={14} className="text-gray-400 transform rotate-180 flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 位置調整 */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
                    <Move size={16} className="mr-2" />
                    位置調整
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        横位置: {tempImageSettings.positionX}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={tempImageSettings.positionX}
                        onChange={(e) => setTempImageSettings(prev => ({
                          ...prev,
                          positionX: parseInt(e.target.value)
                        }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        縦位置: {tempImageSettings.positionY}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={tempImageSettings.positionY}
                        onChange={(e) => setTempImageSettings(prev => ({
                          ...prev,
                          positionY: parseInt(e.target.value)
                        }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* プリセット */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 sm:mb-4">クイック設定</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTempImageSettings(prev => ({
                        ...prev,
                        scale: 1.5,
                        positionX: 50,
                        positionY: 50,
                        opacity: 0.7
                      }))}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 sm:px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      センター
                    </button>
                    <button
                      onClick={() => setTempImageSettings(prev => ({
                        ...prev,
                        scale: 2,
                        positionX: 30,
                        positionY: 30,
                        opacity: 0.4
                      }))}
                      className="bg-green-100 hover:bg-green-200 text-green-800 px-2 sm:px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      背景風
                    </button>
                  </div>
                </div>

                {/* リセットボタン */}
                <div className="pt-3 sm:pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setTempImageSettings({
                      scale: 1,
                      positionX: 50,
                      positionY: 50,
                      opacity: 0.3,
                      rotation: 0
                    })}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    リセット
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 使用方法ガイド */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">💳 デジタル名刺の使い方</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-pink-600 mb-2">✨ 作成</h4>
            <ul className="space-y-1">
              <li>• 名前と最推しプリキュアを設定</li>
              <li>• お気に入りのテンプレートを選択</li>
              <li>• Twitter風エディターで画像を調整</li>
              <li>• ドラッグ&ドロップで直感的な編集</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-600 mb-2">🎨 編集機能</h4>
            <ul className="space-y-1">
              <li>• ズーム・位置・回転・透明度調整</li>
              <li>• リアルタイムプレビュー</li>
              <li>• プロフィールURLでシェア</li>
              <li>• 文字色とエフェクトのカスタマイズ</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}