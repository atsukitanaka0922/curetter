// components/ImageGallery.jsx - ポスト機能付き完全版
'use client'

import { useState, useEffect } from 'react'
import { User, X, Download, AlertCircle, Calendar, MessageSquare, Edit3, Save, Hash, Plus } from 'lucide-react'
import { supabase } from '../app/page'

export default function ImageGallery({ session, profile }) {
  const [images, setImages] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imageErrors, setImageErrors] = useState({})
  const [editingPost, setEditingPost] = useState(null)
  const [newCaption, setNewCaption] = useState('')
  const [newTags, setNewTags] = useState('')

  // プリキュア関連タグの候補
  const precureTags = [
    'プリキュア', 'キュア', 'プリキュアファン', 'アニメ', 'ファンアート',
    'ふたりはプリキュア', 'スプラッシュスター', 'Yes!プリキュア5',
    'フレッシュプリキュア', 'ハートキャッチプリキュア', 'スイートプリキュア',
    'スマイルプリキュア', 'ドキドキプリキュア', 'ハピネスチャージプリキュア',
    'プリンセスプリキュア', '魔法つかいプリキュア', 'アラモード',
    'HUGっとプリキュア', 'スタートゥインクル', 'ヒーリングっど',
    'トロピカルージュ', 'デリシャスパーティ', 'ひろがるスカイ', 'わんだふる',
    'コスプレ', 'グッズ', 'イラスト', '写真', '思い出'
  ]

  useEffect(() => {
    if (session?.user?.id) {
      loadImagesAndPosts()
    }
  }, [session])

  // 画像と投稿データを取得
  const loadImagesAndPosts = async () => {
    try {
      setLoading(true)
      console.log('📂 画像と投稿データ取得開始...', session.user.id)
      
      // 画像ファイル一覧を取得
      const { data: files, error: filesError } = await supabase.storage
        .from('user-images')
        .list(`${session.user.id}/`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (filesError) {
        console.error('❌ ファイル取得エラー:', filesError)
        throw filesError
      }

      // 投稿データを取得
      const { data: postsData, error: postsError } = await supabase
        .from('image_posts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (postsError) {
        console.error('❌ 投稿データ取得エラー:', postsError)
        throw postsError
      }

      console.log('📄 取得したファイル:', files)
      console.log('📝 取得した投稿:', postsData)

      if (files && files.length > 0) {
        const imageFiles = files
          .filter(file => file.name !== '.emptyFolderPlaceholder' && file.name !== '')
          .map(file => {
            // 公開URLを取得
            const { data: urlData } = supabase.storage
              .from('user-images')
              .getPublicUrl(`${session.user.id}/${file.name}`)
            
            // 対応する投稿データを検索
            const postData = postsData?.find(post => post.image_path === `${session.user.id}/${file.name}`)
            
            return {
              id: file.name,
              name: file.name,
              url: urlData.publicUrl,
              fullPath: `${session.user.id}/${file.name}`,
              size: file.metadata?.size || 0,
              created_at: file.created_at || new Date().toISOString(),
              // 投稿データ
              post_id: postData?.id || null,
              caption: postData?.caption || '',
              tags: postData?.tags || [],
              post_created_at: postData?.created_at || null
            }
          })
        
        console.log('✅ 処理された画像データ:', imageFiles)
        setImages(imageFiles)
      } else {
        setImages([])
      }
    } catch (error) {
      console.error('❌ データ取得エラー:', error)
      setImages([])
    } finally {
      setLoading(false)
    }
  }

  // 投稿を作成または更新
  const savePost = async (image) => {
    try {
      const postData = {
        user_id: session.user.id,
        image_path: image.fullPath,
        image_url: image.url,
        caption: newCaption.trim(),
        tags: newTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      }

      if (image.post_id) {
        // 既存投稿の更新
        const { error } = await supabase
          .from('image_posts')
          .update(postData)
          .eq('id', image.post_id)
        
        if (error) throw error
        console.log('✅ 投稿更新成功')
      } else {
        // 新規投稿の作成
        const { error } = await supabase
          .from('image_posts')
          .insert([postData])
        
        if (error) throw error
        console.log('✅ 投稿作成成功')
      }

      setEditingPost(null)
      setNewCaption('')
      setNewTags('')
      await loadImagesAndPosts()
      
    } catch (error) {
      console.error('❌ 投稿保存エラー:', error)
      alert('投稿の保存に失敗しました')
    }
  }

  // 投稿を削除
  const deletePost = async (postId) => {
    if (!confirm('この投稿を削除しますか？（画像は残ります）')) return

    try {
      const { error } = await supabase
        .from('image_posts')
        .delete()
        .eq('id', postId)
      
      if (error) throw error
      console.log('✅ 投稿削除成功')
      await loadImagesAndPosts()
      
    } catch (error) {
      console.error('❌ 投稿削除エラー:', error)
      alert('投稿の削除に失敗しました')
    }
  }

  // 編集開始
  const startEditing = (image) => {
    setEditingPost(image.id)
    setNewCaption(image.caption || '')
    setNewTags(image.tags?.join(', ') || '')
  }

  // 編集キャンセル
  const cancelEditing = () => {
    setEditingPost(null)
    setNewCaption('')
    setNewTags('')
  }

  // タグクリックで追加
  const addTag = (tag) => {
    const currentTags = newTags.split(',').map(t => t.trim()).filter(t => t.length > 0)
    if (!currentTags.includes(tag)) {
      setNewTags([...currentTags, tag].join(', '))
    }
  }

  // 画像エラーハンドリング
  const handleImageError = (imageId, event) => {
    console.error('❌ 画像読み込み失敗:', imageId)
    setImageErrors(prev => ({
      ...prev,
      [imageId]: true
    }))
  }

  // 画像読み込み成功
  const handleImageLoad = (imageId) => {
    setImageErrors(prev => ({
      ...prev,
      [imageId]: false
    }))
  }

  // 画像モーダルを開く
  const openModal = (image) => {
    setSelectedImage(image)
  }

  // 画像モーダルを閉じる
  const closeModal = () => {
    setSelectedImage(null)
  }

  // 画像ダウンロード
  const downloadImage = async (image) => {
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = image.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('❌ ダウンロードエラー:', error)
    }
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

  // ファイルサイズフォーマット
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
                  <h3 className="font-bold text-gray-800">{profile?.display_name || 'プリキュアファン'}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar size={14} />
                    <span>{formatDate(image.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => startEditing(image)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  title="投稿を編集"
                >
                  <Edit3 size={20} />
                </button>
                <button 
                  onClick={() => downloadImage(image)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="画像をダウンロード"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* キャプション表示・編集 */}
          {editingPost === image.id ? (
            /* 編集モード - 美しいデザイン */
            <div className="px-6 pb-4">
              <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 rounded-2xl p-6 border border-pink-100">
                <div className="flex items-center space-x-2 mb-4">
                  <MessageSquare className="text-pink-500" size={20} />
                  <h4 className="font-semibold text-gray-800">投稿を編集</h4>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                      <Edit3 size={16} className="text-purple-500" />
                      <span>キャプション</span>
                    </label>
                    <textarea
                      value={newCaption}
                      onChange={(e) => setNewCaption(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white shadow-sm"
                      rows="4"
                      placeholder="✨ この素敵な画像について教えてください..."
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                      <Hash size={16} className="text-blue-500" />
                      <span>タグ（カンマ区切り）</span>
                    </label>
                    <input
                      type="text"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white shadow-sm"
                      placeholder="プリキュア, ファンアート, 思い出, コスプレ..."
                    />
                    
                    {/* おすすめタグ - 美しいデザイン */}
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                        <span className="mr-2">🏷️</span>
                        おすすめタグ:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {precureTags.slice(0, 10).map((tag, tagIndex) => (
                          <button
                            key={tagIndex}
                            onClick={() => addTag(tag)}
                            className="group relative bg-white hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-500 border border-gray-200 hover:border-transparent text-gray-700 hover:text-white px-3 py-2 rounded-full transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105"
                          >
                            <span className="relative z-10">#{tag}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => savePost(image)}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Save size={16} />
                      <span className="font-medium">保存する</span>
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl transition-colors font-medium"
                    >
                      キャンセル
                    </button>
                    {image.post_id && (
                      <button
                        onClick={() => deletePost(image.post_id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl transition-colors font-medium shadow-md hover:shadow-lg"
                      >
                        投稿削除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 表示モード - Instagram風デザイン */
            image.caption && (
              <div className="px-6 pb-4">
                <div className="bg-gradient-to-r from-gray-50 to-pink-50 rounded-2xl p-5 border border-gray-100 shadow-sm">
                  {/* キャプション */}
                  <div className="mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-800 leading-relaxed font-medium">
                        {image.caption}
                      </p>
                    </div>
                  </div>
                  
                  {/* タグ表示 */}
                  {image.tags && image.tags.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Hash size={14} className="text-pink-500" />
                        <span className="text-sm font-medium text-gray-600">タグ</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {image.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="inline-flex items-center bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium border border-pink-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                          >
                            <Hash size={12} className="mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 投稿日時 */}
                  {image.post_created_at && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Calendar size={12} />
                        <span>投稿日: {formatDate(image.post_created_at)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* 画像表示エリア */}
          <div className="px-6 pb-6">
            {imageErrors[image.id] ? (
              /* エラー時の表示 */
              <div className="w-full h-64 flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl">
                <AlertCircle size={48} className="text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">画像を読み込めませんでした</p>
                <button
                  onClick={() => {
                    setImageErrors(prev => ({ ...prev, [image.id]: false }))
                    const img = new Image()
                    img.onload = () => handleImageLoad(image.id)
                    img.onerror = (e) => handleImageError(image.id, e)
                    img.src = image.url
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  再読み込み
                </button>
              </div>
            ) : (
              /* 正常時の画像表示 */
              <div 
                className="w-full cursor-pointer group"
                onClick={() => openModal(image)}
              >
                <div className="relative w-full overflow-hidden rounded-xl bg-white border border-gray-200 hover:border-pink-300 transition-all duration-300 hover:shadow-md">
                  <img
                    src={image.url}
                    alt={`投稿画像 ${index + 1}`}
                    className="w-full h-auto max-w-full block mx-auto transition-transform duration-300 group-hover:scale-[1.01]"
                    style={{
                      maxHeight: '600px',
                      objectFit: 'contain',
                      backgroundColor: 'transparent'
                    }}
                    onError={(e) => handleImageError(image.id, e)}
                    onLoad={() => handleImageLoad(image.id)}
                    loading="lazy"
                  />
                </div>
                
                {/* 画像下部にホバー時のメッセージを表示 */}
                <div className="mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    クリックで拡大表示
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* 投稿がない場合の編集促進 - 美しいデザイン */}
          {!image.caption && editingPost !== image.id && (
            <div className="px-6 pb-6">
              <button
                onClick={() => startEditing(image)}
                className="group w-full bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 hover:from-pink-100 hover:via-purple-100 hover:to-blue-100 border-2 border-dashed border-pink-200 hover:border-pink-300 text-gray-600 hover:text-pink-600 py-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 hover:shadow-lg transform hover:scale-[1.02]"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white group-hover:from-pink-500 group-hover:to-purple-500 transition-all duration-300 shadow-lg">
                  <MessageSquare size={20} />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-lg">この画像にストーリーを追加</div>
                  <div className="text-sm text-gray-500 group-hover:text-pink-500 transition-colors">
                    思い出やプリキュア愛をシェアしましょう ✨
                  </div>
                </div>
                <div className="text-pink-400 group-hover:text-pink-500 transition-colors">
                  <Plus size={24} />
                </div>
              </button>
            </div>
          )}
        </div>
      ))}

      {/* 画像モーダル */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors z-10"
            >
              <X size={24} />
            </button>
            <img
              src={selectedImage.url}
              alt="拡大画像"
              className="w-full h-full object-contain rounded-lg"
              style={{ maxHeight: '90vh' }}
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-md text-white p-6 rounded-2xl border border-white/20">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="flex items-center space-x-3 mb-3">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="プロフィール画像"
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{profile?.display_name || 'プリキュアファン'}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-300">
                        <Calendar size={12} />
                        <span>{formatDate(selectedImage.created_at)}</span>
                        <span>•</span>
                        <span>{formatFileSize(selectedImage.size)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedImage.caption && (
                    <div className="mb-4">
                      <p className="text-gray-100 leading-relaxed">{selectedImage.caption}</p>
                    </div>
                  )}
                  
                  {selectedImage.tags && selectedImage.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedImage.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="inline-flex items-center bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium border border-white/30"
                        >
                          <Hash size={12} className="mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => downloadImage(selectedImage)}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 border border-white/30 hover:border-white/50 shadow-lg hover:shadow-xl"
                >
                  <Download size={16} />
                  <span className="font-medium">保存</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}