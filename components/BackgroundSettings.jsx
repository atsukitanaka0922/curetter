// components/BackgroundSettings.jsx - プロフィール背景設定コンポーネント
'use client'

import { useState, useEffect } from 'react'
import { Palette, Upload, X, Save, RotateCcw, Image as ImageIcon, Sparkles, Sliders } from 'lucide-react'
import { supabase } from '../app/page'

export default function BackgroundSettings({ session, currentBackground, onBackgroundUpdate }) {
  const [isOpen, setIsOpen] = useState(false)
  const [backgroundType, setBackgroundType] = useState('gradient')
  const [selectedGradient, setSelectedGradient] = useState('precure_classic')
  const [solidColor, setSolidColor] = useState('#ff69b4')
  const [backgroundImage, setBackgroundImage] = useState(null)
  const [imageSettings, setImageSettings] = useState({
    scale: 1,
    positionX: 50,
    positionY: 50,
    opacity: 1,
    blur: 0,
    brightness: 100,
    contrast: 100
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  // プリキュア風グラデーションプリセット
  const gradientPresets = [
    {
      id: 'precure_classic',
      name: 'クラシックプリキュア',
      gradient: 'linear-gradient(135deg, #ff6b9d 0%, #c44cd9 50%, #6fa7ff 100%)'
    },
    {
      id: 'cure_black_white',
      name: 'ふたりはプリキュア',
      gradient: 'linear-gradient(135deg, #ff69b4 0%, #4169e1 50%, #ffffff 100%)'
    },
    {
      id: 'splash_star',
      name: 'Splash☆Star',
      gradient: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 50%, #fff3e0 100%)'
    },
    {
      id: 'yes_precure5',
      name: 'Yes!プリキュア5',
      gradient: 'linear-gradient(135deg, #e91e63 0%, #9c27b0 50%, #673ab7 100%)'
    },
    {
      id: 'fresh',
      name: 'フレッシュプリキュア!',
      gradient: 'linear-gradient(135deg, #ff4081 0%, #ff6ec7 50%, #ffb3ff 100%)'
    },
    {
      id: 'heartcatch',
      name: 'ハートキャッチプリキュア!',
      gradient: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 50%, #cddc39 100%)'
    },
    {
      id: 'suite',
      name: 'スイートプリキュア♪',
      gradient: 'linear-gradient(135deg, #9c27b0 0%, #e91e63 50%, #ff9800 100%)'
    },
    {
      id: 'smile',
      name: 'スマイルプリキュア!',
      gradient: 'linear-gradient(135deg, #ffeb3b 0%, #ff9800 25%, #e91e63 50%, #9c27b0 75%, #3f51b5 100%)'
    },
    {
      id: 'dokidoki',
      name: 'ドキドキ!プリキュア',
      gradient: 'linear-gradient(135deg, #e91e63 0%, #ad1457 50%, #880e4f 100%)'
    },
    {
      id: 'happiness_charge',
      name: 'ハピネスチャージプリキュア!',
      gradient: 'linear-gradient(135deg, #ff69b4 0%, #87ceeb 50%, #98fb98 100%)'
    },
    {
      id: 'go_princess',
      name: 'Go!プリンセスプリキュア',
      gradient: 'linear-gradient(135deg, #9c27b0 0%, #e91e63 50%, #ff9800 100%)'
    },
    {
      id: 'mahou_tsukai',
      name: '魔法つかいプリキュア!',
      gradient: 'linear-gradient(135deg, #9c27b0 0%, #ff69b4 50%, #ffeb3b 100%)'
    },
    {
      id: 'kirakira',
      name: 'キラキラ☆プリキュアアラモード',
      gradient: 'linear-gradient(135deg, #ff69b4 0%, #ffeb3b 25%, #4caf50 50%, #2196f3 75%, #9c27b0 100%)'
    },
    {
      id: 'hugtto',
      name: 'HUGっと!プリキュア',
      gradient: 'linear-gradient(135deg, #ff69b4 0%, #ffeb3b 50%, #2196f3 100%)'
    },
    {
      id: 'star_twinkle',
      name: 'スター☆トゥインクルプリキュア',
      gradient: 'linear-gradient(135deg, #9c27b0 0%, #ff69b4 25%, #ffeb3b 50%, #4caf50 75%, #2196f3 100%)'
    },
    {
      id: 'healin_good',
      name: 'ヒーリングっど♥プリキュア',
      gradient: 'linear-gradient(135deg, #ff69b4 0%, #4caf50 50%, #2196f3 100%)'
    },
    {
      id: 'tropical_rouge',
      name: 'トロピカル〜ジュ!プリキュア',
      gradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 25%, #fff200 50%, #00aeef 75%, #ec008c 100%)'
    },
    {
      id: 'delicious_party',
      name: 'デリシャスパーティ♡プリキュア',
      gradient: 'linear-gradient(135deg, #ff69b4 0%, #ffeb3b 25%, #4caf50 50%, #ff9800 75%, #9c27b0 100%)'
    },
    {
      id: 'hirogaru_sky',
      name: 'ひろがるスカイ!プリキュア',
      gradient: 'linear-gradient(135deg, #87ceeb 0%, #ff69b4 50%, #ffeb3b 100%)'
    },
    {
      id: 'wonderful_precure',
      name: 'わんだふるぷりきゅあ!',
      gradient: 'linear-gradient(135deg, #ff69b4 0%, #9c27b0 25%, #2196f3 50%, #4caf50 75%, #ffeb3b 100%)'
    }
  ]

  // 現在の背景設定を読み込み
  useEffect(() => {
    if (currentBackground) {
      setBackgroundType(currentBackground.type || 'gradient')
      setSelectedGradient(currentBackground.gradient_id || 'precure_classic')
      setSolidColor(currentBackground.solid_color || '#ff69b4')
      setBackgroundImage(currentBackground.image_url || null)
      setImageSettings(currentBackground.image_settings || {
        scale: 1,
        positionX: 50,
        positionY: 50,
        opacity: 1,
        blur: 0,
        brightness: 100,
        contrast: 100
      })
    }
  }, [currentBackground])

  // 画像アップロード処理
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック (5MB制限)
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください')
      return
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください')
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${session.user.id}/background_${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('user-images')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('user-images')
        .getPublicUrl(fileName)

      setBackgroundImage(publicUrl)
      setBackgroundType('image')
    } catch (error) {
      console.error('画像アップロードエラー:', error)
      alert('画像のアップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  // 背景設定保存
  const saveBackgroundSettings = async () => {
    if (!session?.user?.id) return

    setSaving(true)
    try {
      const backgroundData = {
        user_id: session.user.id,
        type: backgroundType,
        gradient_id: backgroundType === 'gradient' ? selectedGradient : null,
        solid_color: backgroundType === 'solid' ? solidColor : null,
        image_url: backgroundType === 'image' ? backgroundImage : null,
        image_settings: backgroundType === 'image' ? imageSettings : null,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('user_backgrounds')
        .upsert(backgroundData, { onConflict: 'user_id' })

      if (error) throw error

      onBackgroundUpdate(backgroundData)
      setIsOpen(false)
      alert('背景設定を保存しました！✨')
    } catch (error) {
      console.error('背景設定保存エラー:', error)
      alert('背景設定の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // 設定リセット
  const resetSettings = () => {
    setBackgroundType('gradient')
    setSelectedGradient('precure_classic')
    setSolidColor('#ff69b4')
    setBackgroundImage(null)
    setImageSettings({
      scale: 1,
      positionX: 50,
      positionY: 50,
      opacity: 1,
      blur: 0,
      brightness: 100,
      contrast: 100
    })
  }

  // プレビューしながら設定を取得
  const getPreviewStyle = () => {
    switch (backgroundType) {
      case 'gradient':
        const gradient = gradientPresets.find(g => g.id === selectedGradient)
        return { background: gradient?.gradient || gradientPresets[0].gradient }
      
      case 'solid':
        return { backgroundColor: solidColor }
      
      case 'image':
        if (!backgroundImage) return { backgroundColor: '#f3f4f6' }
        return {
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: `${imageSettings.scale * 100}%`,
          backgroundPosition: `${imageSettings.positionX}% ${imageSettings.positionY}%`,
          backgroundRepeat: 'no-repeat',
          filter: `blur(${imageSettings.blur}px) brightness(${imageSettings.brightness}%) contrast(${imageSettings.contrast}%)`,
          opacity: imageSettings.opacity
        }
      
      default:
        return { background: gradientPresets[0].gradient }
    }
  }

  return (
    <>
      {/* 設定ボタン */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 shadow-lg"
      >
        <Palette size={16} />
        <span>背景設定</span>
      </button>

      {/* 設定モーダル */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* ヘッダー */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <Sparkles size={24} />
                  <span>プロフィール背景設定</span>
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex max-h-[calc(90vh-80px)]">
              {/* 設定パネル */}
              <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200">
                <div className="space-y-6">
                  {/* 背景タイプ選択 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">背景タイプ</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'gradient', label: 'グラデーション', icon: Sparkles },
                        { id: 'solid', label: '単色', icon: Palette },
                        { id: 'image', label: '画像', icon: ImageIcon }
                      ].map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          onClick={() => setBackgroundType(id)}
                          className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center space-y-2 ${
                            backgroundType === id
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon size={20} />
                          <span className="text-sm font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* グラデーション設定 */}
                  {backgroundType === 'gradient' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">プリキュアグラデーション</h3>
                      <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                        {gradientPresets.map((gradient) => (
                          <button
                            key={gradient.id}
                            onClick={() => setSelectedGradient(gradient.id)}
                            className={`p-3 rounded-lg border-2 transition-colors ${
                              selectedGradient === gradient.id
                                ? 'border-purple-500 shadow-lg'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div
                              className="w-full h-12 rounded-lg mb-2"
                              style={{ background: gradient.gradient }}
                            />
                            <p className="text-xs font-medium text-center text-gray-700">
                              {gradient.name}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 単色設定 */}
                  {backgroundType === 'solid' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">背景色</h3>
                      <div className="space-y-3">
                        <input
                          type="color"
                          value={solidColor}
                          onChange={(e) => setSolidColor(e.target.value)}
                          className="w-full h-12 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={solidColor}
                          onChange={(e) => setSolidColor(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="#ff69b4"
                        />
                      </div>
                    </div>
                  )}

                  {/* 画像設定 */}
                  {backgroundType === 'image' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">背景画像</h3>
                      
                      {/* 画像アップロード */}
                      <div>
                        <label className="block w-full cursor-pointer">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                            {uploading ? (
                              <div className="flex flex-col items-center space-y-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                                <span className="text-sm text-gray-600">アップロード中...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center space-y-2">
                                <Upload size={24} className="text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  クリックして画像を選択 (最大5MB)
                                </span>
                              </div>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploading}
                          />
                        </label>
                      </div>

                      {/* 画像調整 */}
                      {backgroundImage && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-800 flex items-center space-x-2">
                            <Sliders size={16} />
                            <span>画像調整</span>
                          </h4>
                          
                          {/* スケール */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              スケール: {Math.round(imageSettings.scale * 100)}%
                            </label>
                            <input
                              type="range"
                              min="0.5"
                              max="3"
                              step="0.1"
                              value={imageSettings.scale}
                              onChange={(e) => setImageSettings(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                              className="w-full"
                            />
                          </div>

                          {/* 位置 */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                水平位置: {imageSettings.positionX}%
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={imageSettings.positionX}
                                onChange={(e) => setImageSettings(prev => ({ ...prev, positionX: parseInt(e.target.value) }))}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                垂直位置: {imageSettings.positionY}%
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={imageSettings.positionY}
                                onChange={(e) => setImageSettings(prev => ({ ...prev, positionY: parseInt(e.target.value) }))}
                                className="w-full"
                              />
                            </div>
                          </div>

                          {/* 透明度 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              透明度: {Math.round(imageSettings.opacity * 100)}%
                            </label>
                            <input
                              type="range"
                              min="0.1"
                              max="1"
                              step="0.1"
                              value={imageSettings.opacity}
                              onChange={(e) => setImageSettings(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                              className="w-full"
                            />
                          </div>

                          {/* フィルター効果 */}
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                ぼかし: {imageSettings.blur}px
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="10"
                                value={imageSettings.blur}
                                onChange={(e) => setImageSettings(prev => ({ ...prev, blur: parseInt(e.target.value) }))}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                明度: {imageSettings.brightness}%
                              </label>
                              <input
                                type="range"
                                min="50"
                                max="150"
                                value={imageSettings.brightness}
                                onChange={(e) => setImageSettings(prev => ({ ...prev, brightness: parseInt(e.target.value) }))}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                コントラスト: {imageSettings.contrast}%
                              </label>
                              <input
                                type="range"
                                min="50"
                                max="150"
                                value={imageSettings.contrast}
                                onChange={(e) => setImageSettings(prev => ({ ...prev, contrast: parseInt(e.target.value) }))}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* プレビューパネル */}
              <div className="w-1/2 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">プレビュー</h3>
                <div
                  className="w-full h-80 rounded-xl shadow-lg relative overflow-hidden"
                  style={getPreviewStyle()}
                >
                  {/* プレビューコンテンツ */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between">
                    <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 text-white">
                      <h4 className="text-xl font-bold mb-2">プリキュアファン</h4>
                      <p className="text-sm opacity-90">これはプレビューです</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
                      <p>背景設定のプレビューが表示されます</p>
                    </div>
                  </div>
                </div>

                {/* 操作ボタン */}
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={resetSettings}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <RotateCcw size={16} />
                    <span>リセット</span>
                  </button>
                  <button
                    onClick={saveBackgroundSettings}
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>保存中...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>保存</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}