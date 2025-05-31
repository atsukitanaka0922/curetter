// components/UserPreview.jsx - 他ユーザー向けプレビューコンポーネント
'use client'

import { useState, useEffect } from 'react'
import { Heart, Star, Sparkles, User, Image as ImageIcon, CreditCard, ExternalLink, Calendar, QrCode, X, ArrowLeft } from 'lucide-react'
import { supabase } from '../app/page'

export default function UserPreview({ userId, onClose }) {
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState(null)
  const [images, setImages] = useState([])
  const [digitalCard, setDigitalCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)

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

  useEffect(() => {
    if (userId) {
      loadUserData()
    }
  }, [userId])

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
          watched_series: Array.isArray(profileData.watched_series) 
            ? profileData.watched_series 
            : profileData.watched_series ? profileData.watched_series.split(',').map(s => s.trim()) : []
        }
        setProfile(processedProfile)
      }

      // 画像取得
      const { data: files, error: filesError } = await supabase.storage
        .from('user-images')
        .list(`${userId}/`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (!filesError && files) {
        const imageFiles = files
          .filter(file => file.name !== '.emptyFolderPlaceholder' && file.name !== '')
          .map(file => ({
            name: file.name,
            url: supabase.storage.from('user-images').getPublicUrl(`${userId}/${file.name}`).data.publicUrl,
            created_at: file.created_at
          }))
        setImages(imageFiles)
      }

      // デジタル名刺取得
      const { data: cardData, error: cardError } = await supabase
        .from('digital_cards')
        .select('card_data')
        .eq('user_id', userId)
        .single()

      if (!cardError && cardData?.card_data) {
        setDigitalCard(cardData.card_data)
      }

    } catch (error) {
      console.error('データ取得エラー:', error)
      setError(error.message || 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 日付をフォーマット
  const formatDate = (dateString) => {
    if (!dateString) return '不明'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return '1日前'
    if (diffDays < 7) return `${diffDays}日前`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`
    return `${Math.floor(diffDays / 365)}年前`
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
          <div className="flex space-x-1">
            {[
              { id: 'profile', label: 'プロフィール', icon: User },
              { id: 'gallery', label: 'ギャラリー', icon: ImageIcon },
              { id: 'card', label: 'デジタル名刺', icon: CreditCard }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
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
                        {profile.favorite_character.map((char, index) => (
                          <span key={index} className="inline-block px-2 py-1 bg-pink-200 text-pink-800 rounded-full text-xs">
                            {char}
                          </span>
                        ))}
                      </div>
                    ) : '未設定'}
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="text-purple-500" size={20} />
                    <h3 className="font-semibold text-gray-800">好きな作品</h3>
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
                    ) : '未設定'}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="text-yellow-500" size={20} />
                    <h3 className="font-semibold text-gray-800">好きな映画</h3>
                  </div>
                  <div className="text-gray-700 text-sm">
                    {Array.isArray(profile?.favorite_movie) && profile.favorite_movie.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {profile.favorite_movie.map((movie, index) => (
                          <span key={index} className="inline-block px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs">
                            {movie}
                          </span>
                        ))}
                      </div>
                    ) : '未設定'}
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="text-green-500" size={20} />
                    <h3 className="font-semibold text-gray-800">好きなエピソード</h3>
                  </div>
                  <div className="text-gray-700 text-sm">
                    {Array.isArray(profile?.favorite_episode) && profile.favorite_episode.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {profile.favorite_episode.map((episode, index) => (
                          <span key={index} className="inline-block px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs">
                            {episode}
                          </span>
                        ))}
                      </div>
                    ) : '未設定'}
                  </div>
                </div>
              </div>

              {/* 趣味・活動 */}
              {profile?.hobbies && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Heart className="text-indigo-500" size={20} />
                    <h3 className="font-semibold text-gray-800">趣味・主な活動</h3>
                  </div>
                  <p className="text-gray-700 text-sm">{profile.hobbies}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="p-6">
              {images.length > 0 ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">ギャラリー</h3>
                    <p className="text-gray-600">{images.length}枚の画像</p>
                  </div>
                  
                  {images.map((image, index) => (
                    <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <div className="p-4 pb-2">
                        <div className="flex items-center space-x-3">
                          {profile?.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt="プロフィール画像"
                              className="w-10 h-10 rounded-full object-cover border-2 border-pink-200"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 rounded-full flex items-center justify-center">
                              <User size={20} className="text-white" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-gray-800">
                              {profile?.display_name || 'プリキュアファン'}
                            </h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Calendar size={14} />
                              <span>{formatDate(image.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 min-h-[200px] flex items-center justify-center">
                        <img
                          src={image.url}
                          alt={`投稿画像 ${index + 1}`}
                          className="max-w-full max-h-96 object-contain cursor-pointer"
                          onClick={() => setSelectedImage(image)}
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextElementSibling.style.display = 'flex'
                          }}
                        />
                        <div className="hidden w-full h-48 items-center justify-center bg-gray-200 text-gray-500">
                          画像を読み込めませんでした
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center space-x-6">
                          <button className="flex items-center space-x-2 text-gray-500">
                            <Heart size={20} />
                            <span className="text-sm">いいね</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ImageIcon size={40} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">まだ画像がありません</h3>
                  <p className="text-gray-600">このユーザーはまだ画像を投稿していません</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'card' && (
            <div className="p-6">
              {digitalCard ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">デジタル名刺</h3>
                    <p className="text-gray-600">{profile?.display_name || 'プリキュアファン'}さんの名刺</p>
                  </div>

                  <div className="flex justify-center">
                    <div 
                      className="relative rounded-2xl shadow-2xl overflow-hidden"
                      style={{
                        width: 'min(500px, calc(100vw - 3rem))',
                        aspectRatio: '91/55',
                        background: cardTemplates[digitalCard.templateId]?.background || 'linear-gradient(135deg, #ff6b9d 0%, #c44cd9 50%, #6fa7ff 100%)'
                      }}
                    >
                      {/* 背景画像レイヤー */}
                      {digitalCard.backgroundType === 'image' && digitalCard.backgroundImage && (
                        <div 
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `url(${digitalCard.backgroundImage})`,
                            backgroundSize: `${digitalCard.imageSettings.scale * 100}% auto`,
                            backgroundPosition: `${digitalCard.imageSettings.positionX}% ${digitalCard.imageSettings.positionY}%`,
                            backgroundRepeat: 'no-repeat',
                            transform: `rotate(${digitalCard.imageSettings.rotation}deg)`,
                            opacity: digitalCard.imageSettings.opacity,
                            mixBlendMode: digitalCard.useImageEffect ? 'overlay' : 'normal'
                          }}
                        ></div>
                      )}

                      {/* 装飾要素 */}
                      <div className="absolute top-4 right-4 opacity-20 z-10">
                        <Sparkles size={28} color={cardTemplates[digitalCard.templateId]?.accentColor || '#ffffff'} />
                      </div>
                      <div className="absolute bottom-4 left-4 opacity-20 z-10">
                        <Heart size={20} color={cardTemplates[digitalCard.templateId]?.accentColor || '#ffffff'} />
                      </div>
                      <div className="absolute top-6 left-6 opacity-20 z-10">
                        <Star size={16} color={cardTemplates[digitalCard.templateId]?.accentColor || '#ffffff'} />
                      </div>

                      {/* メインコンテンツ */}
                      <div className="relative z-20 h-full flex flex-col justify-between p-5">
                        <div>
                          <h3 
                            className="text-xl font-bold mb-2"
                            style={{ 
                              color: digitalCard.customTextColor || cardTemplates[digitalCard.templateId]?.textColor || '#ffffff',
                              textShadow: digitalCard.backgroundType === 'image' && !digitalCard.useImageEffect ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
                            }}
                          >
                            {digitalCard.name}
                          </h3>
                          <p 
                            className="text-sm opacity-90"
                            style={{ 
                              color: digitalCard.customTextColor || cardTemplates[digitalCard.templateId]?.textColor || '#ffffff',
                              textShadow: digitalCard.backgroundType === 'image' && !digitalCard.useImageEffect ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
                            }}
                          >
                            最推し: {digitalCard.favoriteCharacter}
                          </p>
                        </div>

                        <div className="flex items-end justify-between">
                          <div>
                            <p 
                              className="text-base font-semibold"
                              style={{ 
                                color: digitalCard.customAccentColor || cardTemplates[digitalCard.templateId]?.accentColor || '#ffffff',
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
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors z-10"
            >
              <X size={24} />
            </button>
            <img
              src={selectedImage.url}
              alt="拡大画像"
              className="w-full h-full object-contain rounded-lg bg-white"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{selectedImage.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-300 mt-1">
                    <span>{formatDate(selectedImage.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}