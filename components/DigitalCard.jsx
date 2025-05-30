// components/DigitalCard.jsx - デジタル名刺コンポーネント（完全版）
'use client'

import { useState, useEffect, useRef } from 'react'
import { Heart, Star, Sparkles, Download, Share, Edit, Save, X, QrCode, Copy, Check, Move, ZoomIn, ZoomOut } from 'lucide-react'
import { supabase } from '../app/page'

export default function DigitalCard({ session, profile }) {
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
      opacity: 0.3
    }
  })
  
  const [images, setImages] = useState([])
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const cardRef = useRef(null)

  // プリキュアテーマのテンプレート
  const cardTemplates = {
    precure_classic: {
      name: 'クラシックプリキュア',
      background: 'linear-gradient(135deg, #ff6b9d 0%, #c44cd9 50%, #6fa7ff 100%)',
      textColor: 'white',
      accentColor: '#ffffff'
    },
    cure_black_white: {
      name: 'ふたりはプリキュア',
      background: 'linear-gradient(135deg, #000000 0%, #4a4a4a 50%, #ffffff 100%)',
      textColor: 'white',
      accentColor: '#ff69b4'
    },
    splash_star: {
      name: 'スプラッシュスター',
      background: 'linear-gradient(135deg, #ff9a56 0%, #ff6b9d 50%, #c44cd9 100%)',
      textColor: 'white',
      accentColor: '#ffd700'
    },
    heartcatch: {
      name: 'ハートキャッチプリキュア',
      background: 'linear-gradient(135deg, #e91e63 0%, #9c27b0 50%, #2196f3 100%)',
      textColor: 'white',
      accentColor: '#ffeb3b'
    },
    smile: {
      name: 'スマイルプリキュア',
      background: 'linear-gradient(135deg, #ffeb3b 0%, #ff9800 25%, #e91e63 50%, #9c27b0 75%, #2196f3 100%)',
      textColor: 'white',
      accentColor: '#ffffff'
    },
    tropical: {
      name: 'トロピカル〜ジュ！プリキュア',
      background: 'linear-gradient(135deg, #00bcd4 0%, #4caf50 33%, #ffeb3b 66%, #ff9800 100%)',
      textColor: 'white',
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
  }, [session, profile])

  // QRコード生成
  useEffect(() => {
    if (cardData.profileUrl) {
      generateQRCode()
    }
  }, [cardData.profileUrl])

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
          .filter(file => file.name !== '.emptyFolderPlaceholder')
          .map(file => ({
            name: file.name,
            url: supabase.storage
              .from('user-images')
              .getPublicUrl(`${session.user.id}/${file.name}`).data.publicUrl,
            fullPath: `${session.user.id}/${file.name}`
          }))
        
        setImages(imageFiles)
      }
    } catch (error) {
      console.error('画像取得エラー:', error)
    }
  }

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
        setCardData(prev => ({
          ...prev,
          ...data.card_data,
          name: profile?.display_name || data.card_data.name || 'プリキュアファン',
          favoriteCharacter: Array.isArray(profile?.favorite_character) && profile.favorite_character.length > 0 
            ? profile.favorite_character[0] 
            : data.card_data.favoriteCharacter || '未設定'
        }))
      }
    } catch (error) {
      console.error('保存データ読み込みエラー:', error)
    }
  }

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

  const saveCardData = async () => {
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('digital_cards')
        .upsert({
          user_id: session.user.id,
          card_data: cardData,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setEditing(false)
      alert('名刺デザインを保存しました！✨')
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const downloadCard = async () => {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // 名刺サイズ（91mm x 55mm を 300dpi）
      const width = 1071
      const height = 648
      
      canvas.width = width
      canvas.height = height

      // 背景描画
      await drawCardBackground(ctx, width, height)
      
      // テキスト描画
      drawCardTexts(ctx, width, height)
      
      // QRコード描画
      if (qrCodeDataUrl) {
        await drawCardQRCode(ctx, width, height)
      }

      // ダウンロード
      const link = document.createElement('a')
      link.download = `${cardData.name}_precure_card.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
    } catch (error) {
      console.error('ダウンロードエラー:', error)
      alert('ダウンロードに失敗しました')
    }
  }

  const drawCardBackground = async (ctx, width, height) => {
    const template = cardTemplates[cardData.templateId]
    
    if (cardData.backgroundType === 'image' && cardData.backgroundImage) {
      // テンプレート背景を先に描画
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, '#ff6b9d')
      gradient.addColorStop(0.5, '#c44cd9')
      gradient.addColorStop(1, '#6fa7ff')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
      
      // 画像を重ねて描画
      return new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const { scale, positionX, positionY, opacity } = cardData.imageSettings
          
          const scaledWidth = width * scale
          const scaledHeight = height * scale
          const x = (width * positionX / 100) - (scaledWidth / 2)
          const y = (height * positionY / 100) - (scaledHeight / 2)
          
          ctx.globalAlpha = opacity
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
          ctx.globalAlpha = 1
          resolve()
        }
        img.onerror = () => resolve()
        img.src = cardData.backgroundImage
      })
    } else {
      // テンプレート背景
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, '#ff6b9d')
      gradient.addColorStop(0.5, '#c44cd9')
      gradient.addColorStop(1, '#6fa7ff')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
    }
  }

  const drawCardTexts = (ctx, width, height) => {
    const template = cardTemplates[cardData.templateId]
    
    // 名前
    ctx.fillStyle = template.textColor
    ctx.font = 'bold 64px Arial, sans-serif'
    ctx.fillText(cardData.name, 80, 200)
    
    // 最推し
    ctx.font = '40px Arial, sans-serif'
    ctx.fillText(`最推し: ${cardData.favoriteCharacter}`, 80, 280)
    
    // プリキュアファン
    ctx.fillStyle = template.accentColor
    ctx.font = 'bold 48px Arial, sans-serif'
    ctx.fillText('プリキュアファン', 80, height - 120)
    
    // サブタイトル
    ctx.font = '24px Arial, sans-serif'
    ctx.fillText('Precure Profile Card', 80, height - 80)
  }

  const drawCardQRCode = async (ctx, width, height) => {
    return new Promise((resolve) => {
      const qrImg = new Image()
      qrImg.crossOrigin = 'anonymous'
      qrImg.onload = () => {
        const qrSize = 120
        const qrX = width - qrSize - 60
        const qrY = height - qrSize - 60
        
        // 白い背景
        ctx.fillStyle = 'white'
        ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20)
        
        // QRコード描画
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
        resolve()
      }
      qrImg.onerror = () => resolve()
      qrImg.src = qrCodeDataUrl
    })
  }

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

  const updateCardData = (updates) => {
    setCardData(prev => ({
      ...prev,
      ...updates
    }))
  }

  const currentTemplate = cardTemplates[cardData.templateId]

  // 背景スタイル生成
  const getBackgroundStyle = () => {
    if (cardData.backgroundType === 'image' && cardData.backgroundImage) {
      const { scale, positionX, positionY, opacity } = cardData.imageSettings
      return {
        backgroundImage: `${currentTemplate.background}, url(${cardData.backgroundImage})`,
        backgroundBlendMode: 'overlay',
        backgroundSize: `cover, ${scale * 100}% ${scale * 100}%`,
        backgroundPosition: `center, ${positionX}% ${positionY}%`,
        backgroundRepeat: 'no-repeat, no-repeat',
        opacity: opacity
      }
    } else {
      return {
        background: currentTemplate.background
      }
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
                  onClick={downloadCard}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Download size={16} />
                  <span>ダウンロード</span>
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
            className="relative w-96 h-60 rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300"
            style={getBackgroundStyle()}
          >
            {/* 装飾要素 */}
            <div className="absolute top-4 right-4 opacity-20">
              <Sparkles size={32} color={currentTemplate.accentColor} />
            </div>
            <div className="absolute bottom-4 left-4 opacity-20">
              <Heart size={24} color={currentTemplate.accentColor} />
            </div>
            <div className="absolute top-6 left-6 opacity-20">
              <Star size={20} color={currentTemplate.accentColor} />
            </div>

            {/* メインコンテンツ */}
            <div className="relative z-10 h-full flex flex-col justify-between p-6">
              <div>
                <h3 
                  className="text-2xl font-bold mb-2"
                  style={{ color: currentTemplate.textColor }}
                >
                  {cardData.name}
                </h3>
                <p 
                  className="text-sm opacity-90"
                  style={{ color: currentTemplate.textColor }}
                >
                  最推し: {cardData.favoriteCharacter}
                </p>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p 
                    className="text-lg font-semibold"
                    style={{ color: currentTemplate.accentColor }}
                  >
                    プリキュアファン
                  </p>
                  <p 
                    className="text-xs opacity-80"
                    style={{ color: currentTemplate.textColor }}
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

            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/10"></div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  名前
                </label>
                <input
                  type="text"
                  value={cardData.name}
                  onChange={(e) => updateCardData({name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="あなたの名前"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最推しプリキュア
                </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-4">
                背景テンプレート
              </label>
              
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

              {/* アップロード画像から選択 */}
              {images.length > 0 && (
                <>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">アップロード済み画像から選択</h4>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-4">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => updateCardData({
                          backgroundImage: image.url, 
                          backgroundType: 'image'
                        })}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          cardData.backgroundImage === image.url && cardData.backgroundType === 'image'
                            ? 'border-pink-500 ring-2 ring-pink-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={`背景画像 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* 画像配置設定 */}
              {cardData.backgroundType === 'image' && cardData.backgroundImage && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                    <Move size={16} className="mr-2" />
                    画像配置設定
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        サイズ: {Math.round(cardData.imageSettings.scale * 100)}%
                      </label>
                      <div className="flex items-center space-x-2">
                        <ZoomOut size={14} className="text-gray-400" />
                        <input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.1"
                          value={cardData.imageSettings.scale}
                          onChange={(e) => updateCardData({
                            imageSettings: {
                              ...cardData.imageSettings,
                              scale: parseFloat(e.target.value)
                            }
                          })}
                          className="flex-1"
                        />
                        <ZoomIn size={14} className="text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        透明度: {Math.round(cardData.imageSettings.opacity * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={cardData.imageSettings.opacity}
                        onChange={(e) => updateCardData({
                          imageSettings: {
                            ...cardData.imageSettings,
                            opacity: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        横位置: {cardData.imageSettings.positionX}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={cardData.imageSettings.positionX}
                        onChange={(e) => updateCardData({
                          imageSettings: {
                            ...cardData.imageSettings,
                            positionX: parseInt(e.target.value)
                          }
                        })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        縦位置: {cardData.imageSettings.positionY}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={cardData.imageSettings.positionY}
                        onChange={(e) => updateCardData({
                          imageSettings: {
                            ...cardData.imageSettings,
                            positionY: parseInt(e.target.value)
                          }
                        })}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => updateCardData({
                        imageSettings: {
                          scale: 1,
                          positionX: 50,
                          positionY: 50,
                          opacity: 0.3
                        }
                      })}
                      className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded transition-colors"
                    >
                      リセット
                    </button>
                  </div>
                </div>
              )}
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

      {/* 使用方法ガイド */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">💳 デジタル名刺の使い方</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-pink-600 mb-2">✨ 作成</h4>
            <ul className="space-y-1">
              <li>• 名前と最推しプリキュアを設定</li>
              <li>• お気に入りのテンプレートを選択</li>
              <li>• アップロード画像も背景に使用可能</li>
              <li>• 画像の位置・サイズ・透明度を調整</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-600 mb-2">🚀 シェア</h4>
            <ul className="space-y-1">
              <li>• QRコードでプロフィールへ誘導</li>
              <li>• 高品質PNG画像をダウンロード</li>
              <li>• プリキュアイベントで交換しよう！</li>
              <li>• SNSでプリキュア愛をアピール</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )}