// components/ImageGallery.jsx - 修正版：画像表示問題解決
'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Calendar, User, X, Download, ExternalLink, AlertCircle } from 'lucide-react'
import { supabase } from '../app/page'

export default function ImageGallery({ session, profile }) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imageErrors, setImageErrors] = useState({})

  useEffect(() => {
    if (session?.user?.id) {
      loadImages()
    }
  }, [session])

  // 画像一覧を取得
  const loadImages = async () => {
    try {
      setLoading(true)
      console.log('📂 画像取得開始...', session.user.id)
      
      const { data: files, error } = await supabase.storage
        .from('user-images')
        .list(`${session.user.id}/`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        console.error('❌ ファイル取得エラー:', error)
        throw error
      }

      console.log('📄 取得したファイル一覧:', files)

      if (files && files.length > 0) {
        const imageFiles = files
          .filter(file => file.name !== '.emptyFolderPlaceholder' && file.name !== '')
          .map(file => {
            // 公開URLを取得
            const { data: urlData } = supabase.storage
              .from('user-images')
              .getPublicUrl(`${session.user.id}/${file.name}`)
            
            console.log('🔗 生成されたURL:', urlData.publicUrl)
            
            return {
              id: file.name,
              name: file.name,
              url: urlData.publicUrl,
              fullPath: `${session.user.id}/${file.name}`,
              created_at: file.created_at,
              updated_at: file.updated_at,
              size: file.metadata?.size || 0
            }
          })
        
        console.log('🖼️ 処理された画像一覧:', imageFiles)
        setImages(imageFiles)
      } else {
        console.log('📭 画像が見つかりませんでした')
        setImages([])
      }
    } catch (error) {
      console.error('❌ 画像取得エラー:', error)
      setImages([])
    } finally {
      setLoading(false)
    }
  }

  // 画像読み込みエラーハンドリング
  const handleImageError = (imageId, errorEvent) => {
    console.error('❌ 画像読み込みエラー:', imageId, errorEvent)
    setImageErrors(prev => ({
      ...prev,
      [imageId]: true
    }))
  }

  // 画像読み込み成功時
  const handleImageLoad = (imageId) => {
    console.log('✅ 画像読み込み成功:', imageId)
    setImageErrors(prev => ({
      ...prev,
      [imageId]: false
    }))
  }

  // 代替画像URL生成（Signed URL使用）
  const getSignedUrl = async (imagePath) => {
    try {
      const { data, error } = await supabase.storage
        .from('user-images')
        .createSignedUrl(imagePath, 3600) // 1時間有効

      if (error) {
        console.error('❌ Signed URL生成エラー:', error)
        return null
      }

      console.log('🔐 Signed URL生成成功:', data.signedUrl)
      return data.signedUrl
    } catch (error) {
      console.error('❌ Signed URL生成失敗:', error)
      return null
    }
  }

  // ファイルサイズを人間が読みやすい形式に変換
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

  // モーダルを開く
  const openModal = (image) => {
    setSelectedImage(image)
  }

  // モーダルを閉じる
  const closeModal = () => {
    setSelectedImage(null)
  }

  // 画像をダウンロード
  const downloadImage = async (image) => {
    try {
      console.log('💾 ダウンロード開始:', image.fullPath)
      
      const { data, error } = await supabase.storage
        .from('user-images')
        .download(image.fullPath)

      if (error) {
        console.error('❌ ダウンロードエラー:', error)
        throw error
      }

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = image.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      console.log('✅ ダウンロード完了')
    } catch (error) {
      console.error('❌ ダウンロードエラー:', error)
      alert('ダウンロードに失敗しました')
    }
  }

  // 画像再読み込み
  const retryImageLoad = async (image) => {
    try {
      console.log('🔄 画像再読み込み:', image.fullPath)
      
      // Signed URLを取得して再試行
      const signedUrl = await getSignedUrl(image.fullPath)
      if (signedUrl) {
        // 画像リストを更新
        setImages(prevImages => 
          prevImages.map(img => 
            img.id === image.id 
              ? { ...img, url: signedUrl }
              : img
          )
        )
        
        // エラー状態をクリア
        setImageErrors(prev => ({
          ...prev,
          [image.id]: false
        }))
      }
    } catch (error) {
      console.error('❌ 画像再読み込みエラー:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/6"></div>
              </div>
            </div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        ))}
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 rounded-full flex items-center justify-center mx-auto mb-6">
          <User size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">まだ画像がありません</h2>
        <p className="text-gray-600 mb-6">
          あなたの最初の画像をアップロードして、プリキュア愛を共有しましょう！
        </p>
        <button
          onClick={() => window.location.hash = '#manage'}
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-colors"
        >
          画像をアップロード
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">画像ギャラリー</h1>
            <p className="text-gray-600">あなたのプリキュア愛が詰まった画像たち ✨</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-pink-500">{images.length}</div>
            <div className="text-sm text-gray-600">枚の画像</div>
          </div>
        </div>
      </div>

      {/* 画像投稿一覧 */}
      {images.map((image, index) => (
        <div key={image.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
          {/* 投稿ヘッダー */}
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="プロフィール画像"
                    className="w-12 h-12 rounded-full object-cover border-2 border-pink-200"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 rounded-full flex items-center justify-center">
                    <User size={24} className="text-white" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-gray-800">
                    {profile?.display_name || 'プリキュアファン'}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar size={14} />
                    <span>{formatDate(image.created_at)}</span>
                  </div>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>

          {/* 画像表示エリア */}
          <div className="relative bg-gray-50 min-h-[200px] flex items-center justify-center">
            {imageErrors[image.id] ? (
              /* エラー時の表示 */
              <div className="w-full h-64 flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300">
                <AlertCircle size={48} className="text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">画像を読み込めませんでした</p>
                <button
                  onClick={() => retryImageLoad(image)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  再読み込み
                </button>
                <p className="text-xs text-gray-500 mt-2">{image.name}</p>
              </div>
            ) : (
              /* 正常時の画像表示 */
              <div className="w-full group cursor-pointer" onClick={() => openModal(image)}>
                <div className="relative w-full" style={{ minHeight: '200px' }}>
                  <img
                    src={image.url}
                    alt={`投稿画像 ${index + 1}`}
                    className="w-full h-auto max-w-full block mx-auto"
                    style={{
                      maxHeight: '500px',
                      objectFit: 'contain',
                      backgroundColor: 'white'
                    }}
                    onError={(e) => {
                      console.error('❌ 画像読み込みエラー:', image.id, image.url, e)
                      handleImageError(image.id, e)
                    }}
                    onLoad={(e) => {
                      console.log('✅ 画像読み込み成功:', image.id, e.target.naturalWidth, 'x', e.target.naturalHeight)
                      handleImageLoad(image.id)
                    }}
                    loading="lazy"
                  />
                  
                  {/* ホバーオーバーレイ */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                      <ExternalLink size={20} className="text-gray-700" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="p-6 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-500 transition-colors">
                  <Heart size={20} />
                  <span className="text-sm">いいね</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
                  <MessageCircle size={20} />
                  <span className="text-sm">コメント</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
                  <Share size={20} />
                  <span className="text-sm">シェア</span>
                </button>
              </div>
              <button 
                onClick={() => downloadImage(image)}
                className="flex items-center space-x-2 text-gray-500 hover:text-purple-500 transition-colors"
              >
                <Download size={20} />
                <span className="text-sm">保存</span>
              </button>
            </div>
            
            {/* ファイル情報とデバッグ */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span className="truncate flex-1 mr-4">{image.name}</span>
                <span className="flex-shrink-0">{formatFileSize(image.size)}</span>
              </div>
              
              {/* 画像URLテスト用リンク */}
              <div className="text-xs space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">画像URL:</span>
                  <a 
                    href={image.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline truncate flex-1"
                  >
                    {image.url}
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(image.url)}
                    className="text-blue-500 hover:text-blue-700 px-2 py-1 border border-blue-300 rounded text-xs"
                  >
                    コピー
                  </button>
                </div>
                
                {/* 直接画像テスト */}
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <p className="text-gray-600 mb-1">画像テスト（小サイズ）:</p>
                  <img 
                    src={image.url} 
                    alt="テスト画像" 
                    className="w-20 h-20 object-contain border border-gray-300 bg-white"
                    onError={(e) => {
                      console.error('❌ テスト画像エラー:', image.url)
                      e.target.style.border = '2px solid red'
                      e.target.alt = 'エラー'
                    }}
                    onLoad={(e) => {
                      console.log('✅ テスト画像OK:', image.url)
                      e.target.style.border = '2px solid green'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* 画像モーダル */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors z-10"
            >
              <X size={24} />
            </button>
            <img
              src={selectedImage.url}
              alt="拡大画像"
              className="w-full h-full object-contain rounded-lg bg-white"
              onError={(e) => {
                console.error('❌ モーダル画像読み込みエラー:', selectedImage.url)
                e.target.style.display = 'none'
              }}
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{selectedImage.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-300 mt-1">
                    <span>{formatDate(selectedImage.created_at)}</span>
                    <span>{formatFileSize(selectedImage.size)}</span>
                  </div>
                </div>
                <button
                  onClick={() => downloadImage(selectedImage)}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Download size={16} />
                  <span>ダウンロード</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}