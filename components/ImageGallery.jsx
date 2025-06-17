// components/ImageGallery.jsx - 最終修正版 Part 1: インポートと初期設定
'use client'

import { useState, useEffect } from 'react'
import { User, X, Download, AlertCircle, Calendar, MessageSquare, Edit3, Save, Hash, Plus, CheckCircle, MapPin, Clock, Users, Camera, Star } from 'lucide-react'
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
  
  // 投稿許可チェック関連の状態
  const [eventInfo, setEventInfo] = useState({
    date: '',
    venue: '',
    eventName: ''
  })
  const [permissionChecks, setPermissionChecks] = useState({
    noThirdPartyInPhoto: false
  })

  // プリキュア関連タグの候補
  const precureTags = [
    'プリキュア', 'キュア', 'プリキュアファン', 'アニメ', 'ファンアート',
    'ふたりはプリキュア', 'スプラッシュスター', 'Yes!プリキュア5',
    'フレッシュプリキュア', 'ハートキャッチプリキュア', 'スイートプリキュア',
    'スマイルプリキュア', 'ドキドキプリキュア', 'ハピネスチャージプリキュア',
    'プリンセスプリキュア', '魔法つかいプリキュア', 'アラモード',
    'HUGっとプリキュア', 'スタートゥインクル', 'ヒーリングっど',
    'トロピカルージュ', 'デリシャスパーティ', 'ひろがるスカイ', 'わんだふる',
    'コスプレ', 'グッズ', 'イラスト', '写真', '思い出', 'イベント'
  ]

  useEffect(() => {
    if (session?.user?.id) {
      loadImagesAndPosts()
    }
  }, [session])

  // components/ImageGallery.jsx - 最終修正版 Part 2: データ取得関数

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
        console.error('❌ 投稿取得エラー:', postsError)
        throw postsError
      }

      console.log('✅ データ取得成功:', {
        files: files?.length || 0,
        posts: postsData?.length || 0
      })

      // 画像URLを生成し、投稿データとマージ
      const imagesWithPosts = files
        ?.filter(file => file.name && !file.name.includes('.emptyFolderPlaceholder'))
        .map(file => {
          const matchingPost = postsData?.find(post => post.image_path === file.name)

          // image_url優先、なければStorageのpublicUrlを生成
          let url = ''
          if (matchingPost?.image_url) {
            url = matchingPost.image_url
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('user-images')
              .getPublicUrl(`${session.user.id}/${file.name}`)
            url = publicUrl
          }

          return {
            id: file.name,
            name: file.name,
            url,
            size: file.metadata?.size || 0,
            created_at: file.created_at,
            // 投稿データをマージ
            post_id: matchingPost?.id,
            caption: matchingPost?.caption,
            tags: matchingPost?.tags || [],
            post_created_at: matchingPost?.created_at,
            // 投稿許可関連データ
            event_date: matchingPost?.event_date,
            event_venue: matchingPost?.event_venue,
            event_name: matchingPost?.event_name,
            no_third_party_in_photo: Boolean(matchingPost?.no_third_party_in_photo) // ←型を明示
          }
        }) || []

      setImages(imagesWithPosts)
      setPosts(postsData || [])

    } catch (error) {
      console.error('❌ データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // components/ImageGallery.jsx - 最終修正版 Part 3: 投稿操作関数（修正版）

  // 投稿編集開始
  const startEditing = (image) => {
    setEditingPost(image.id)
    setNewCaption(image.caption || '')
    setNewTags(image.tags ? image.tags.join(', ') : '')
    
    // イベント情報と許可チェックの初期化
    setEventInfo({
      date: image.event_date || '',
      venue: image.event_venue || '',
      eventName: image.event_name || ''
    })
    setPermissionChecks({
      noThirdPartyInPhoto: image.no_third_party_in_photo || false
    })
  }

  // 投稿編集キャンセル
  const cancelEditing = () => {
    setEditingPost(null)
    setNewCaption('')
    setNewTags('')
    setEventInfo({ date: '', venue: '', eventName: '' })
    setPermissionChecks({ noThirdPartyInPhoto: false })
  }

  // 投稿保存・更新（修正版 - image_url追加）
  const savePost = async (imageId) => {
    try {
      const image = images.find(img => img.id === imageId)
      if (!image) return

      // タグ処理
      const processedTags = newTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const postData = {
        user_id: session.user.id,
        image_path: image.name,
        image_url: image.url, // 修正：image_urlを追加
        caption: newCaption.trim(),
        tags: processedTags,
        // イベント情報
        event_date: eventInfo.date || null,
        event_venue: eventInfo.venue || null,
        event_name: eventInfo.eventName || null,
        // 投稿許可チェック
        no_third_party_in_photo: permissionChecks.noThirdPartyInPhoto
      }

      let result
      if (image.post_id) {
        // 既存投稿の更新
        result = await supabase
          .from('image_posts')
          .update(postData)
          .eq('id', image.post_id)
          .select()
      } else {
        // 新規投稿作成
        result = await supabase
          .from('image_posts')
          .insert(postData)
          .select()
      }

      if (result.error) throw result.error

      console.log('✅ 投稿保存成功:', result.data)
      
      // UI更新
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { 
              ...img, 
              post_id: result.data[0].id,
              caption: postData.caption,
              tags: postData.tags,
              post_created_at: result.data[0].created_at,
              event_date: postData.event_date,
              event_venue: postData.event_venue,
              event_name: postData.event_name,
              no_third_party_in_photo: postData.no_third_party_in_photo
            }
          : img
      ))

      cancelEditing()

    } catch (error) {
      console.error('❌ 投稿保存エラー:', error)
      
      // より詳細なエラーメッセージ
      let errorMessage = '投稿の保存に失敗しました'
      
      if (error.code === '23502') {
        errorMessage = 'データベースの必須項目が不足しています。管理者にお問い合わせください。'
      } else if (error.message?.includes('image_url')) {
        errorMessage = '画像URLの設定に問題があります。画像を再アップロードしてお試しください。'
      }
      
      alert(errorMessage)
    }
  }

  // 投稿削除
  const deletePost = async (postId) => {
    if (!confirm('この投稿を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('image_posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      // UI更新
      setImages(prev => prev.map(img => 
        img.post_id === postId 
          ? { 
              ...img, 
              post_id: null, 
              caption: null, 
              tags: [], 
              post_created_at: null,
              event_date: null,
              event_venue: null,
              event_name: null,
              no_third_party_in_photo: false
            }
          : img
      ))

      cancelEditing()
      console.log('✅ 投稿削除成功')

    } catch (error) {
      console.error('❌ 投稿削除エラー:', error)
      alert('投稿の削除に失敗しました')
    }
  }

  // components/ImageGallery.jsx - 最終修正版 Part 4: ユーティリティ関数

  // 画像エラーハンドリング
  const handleImageError = (imageId, error) => {
    console.error(`❌ 画像読み込みエラー (${imageId}):`, error)
    setImageErrors(prev => ({ ...prev, [imageId]: true }))
  }

  // 画像読み込み成功
  const handleImageLoad = (imageId) => {
    setImageErrors(prev => ({ ...prev, [imageId]: false }))
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

  // イベント情報の変更ハンドラー
  const handleEventInfoChange = (field, value) => {
    setEventInfo(prev => ({ ...prev, [field]: value }))
  }

  // 許可チェックの変更ハンドラー
  const handlePermissionCheckChange = (field, value) => {
    setPermissionChecks(prev => ({ ...prev, [field]: value }))
  }

  // components/ImageGallery.jsx - 最終修正版 Part 5: レンダリング開始とヘッダー

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
            <div className="w-full h-64 bg-gray-200 rounded-xl mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Camera size={32} className="text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">まだ画像がありません</h3>
        <p className="text-gray-600 mb-6">画像管理ページから素敵な写真をアップロードしてみましょう！</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {images.map((image) => (
          <div key={image.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            {/* ユーザー情報ヘッダー */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="アバター" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-white" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {profile?.display_name || 'プリキュアファン'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(image.created_at)}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {formatFileSize(image.size)}
              </div>
            </div>

            {/* 画像表示エリア */}
            <div className="relative group">
              {imageErrors[image.id] ? (
                <div className="w-full h-96 bg-gray-100 flex flex-col items-center justify-center">
                  <AlertCircle size={48} className="text-gray-400 mb-2" />
                  <p className="text-gray-500 text-sm">画像を読み込めませんでした</p>
                  <p className="text-gray-400 text-xs mt-1">{image.name}</p>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-auto max-h-96 object-contain cursor-pointer bg-gray-50"
                    onClick={() => openModal(image)}
                    style={{
                      imageRendering: 'crisp-edges',
                      backgroundColor: 'transparent'
                    }}
                    onError={(e) => handleImageError(image.id, e)}
                    onLoad={() => handleImageLoad(image.id)}
                    loading="lazy"
                  />
                  
                  {/* 画像下部にホバー時のメッセージを表示 */}
                  <div className="mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      クリックで拡大表示
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* 投稿がない場合の編集促進 */}
            {!image.caption && editingPost !== image.id && (
              <div className="px-6 pb-6">
                <button
                  onClick={() => startEditing(image)}
                  className="group w-full bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 hover:from-pink-100 hover:via-purple-100 hover:to-blue-100 border-2 border-dashed border-pink-200 hover:border-pink-300 text-gray-600 hover:text-pink-600 py-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 hover:shadow-lg transform hover:scale-[1.02]"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white group-hover:from-pink-500 group-hover:to-purple-500 transition-all duration-300 shadow-lg">
                    <MessageSquare size={20} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">投稿を作成</p>
                    <p className="text-sm text-gray-500">この画像にコメントやタグを追加しましょう ✨</p>
                  </div>
                </button>
              </div>
            )}

            {editingPost === image.id ? (
              /* 編集モード */
              <div className="px-6 pb-4">
                <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 rounded-2xl p-6 border border-pink-100">
                  <div className="flex items-center space-x-2 mb-4">
                    <MessageSquare className="text-pink-500" size={20} />
                    <h4 className="font-semibold text-gray-800">投稿を編集</h4>
                  </div>
                  
                  <div className="space-y-5">
                    {/* キャプション入力 */}
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
                    
                    {/* タグ入力 */}
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                        <Hash size={16} className="text-blue-500" />
                        <span>タグ（カンマ区切り）</span>
                      </label>
                      <input
                        type="text"
                        value={newTags}
                        onChange={(e) => setNewTags(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                        placeholder="プリキュア, イベント, コスプレ..."
                      />
                      
                      {/* タグ候補表示 */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {precureTags.slice(0, 8).map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              const currentTags = newTags.split(',').map(t => t.trim()).filter(t => t)
                              if (!currentTags.includes(tag)) {
                                setNewTags(currentTags.length > 0 ? `${newTags}, ${tag}` : tag)
                              }
                            }}
                            className="text-xs bg-gray-100 hover:bg-pink-100 text-gray-600 hover:text-pink-600 px-3 py-1 rounded-full transition-colors border border-gray-200 hover:border-pink-200"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* イベント情報入力セクション */}
                    <div className="border-t border-gray-200 pt-5">
                      <div className="flex items-center space-x-2 mb-4">
                        <MapPin size={16} className="text-green-500" />
                        <h5 className="font-medium text-gray-800">イベント情報（任意）</h5>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">
                            <Clock size={14} className="inline mr-1" />
                            日付
                          </label>
                          <input
                            type="date"
                            value={eventInfo.date}
                            onChange={(e) => handleEventInfoChange('date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">
                            <MapPin size={14} className="inline mr-1" />
                            会場
                          </label>
                          <input
                            type="text"
                            value={eventInfo.venue}
                            onChange={(e) => handleEventInfoChange('venue', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            placeholder="例: 東京ビッグサイト"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">
                            <Star size={14} className="inline mr-1" />
                            イベント名
                          </label>
                          <input
                            type="text"
                            value={eventInfo.eventName}
                            onChange={(e) => handleEventInfoChange('eventName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            placeholder="例: プリキュアイベント2025"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 投稿許可チェックセクション */}
                    <div className="border-t border-gray-200 pt-5">
                      <div className="flex items-center space-x-2 mb-4">
                        <CheckCircle size={16} className="text-orange-500" />
                        <h5 className="font-medium text-gray-800">SNS投稿許可確認</h5>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200 cursor-pointer hover:bg-red-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={permissionChecks.noThirdPartyInPhoto}
                            onChange={(e) => handlePermissionCheckChange('noThirdPartyInPhoto', e.target.checked)}
                            className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Users size={14} className="text-red-600" />
                              <span className="text-sm font-medium text-red-800">
                                第三者の映り込みがないことを確認しました
                              </span>
                            </div>
                            <p className="text-xs text-red-600 mt-1">
                              他の参加者のプライバシー保護のため、写真にはご本人のみが写っていることをご確認ください
                            </p>
                          </div>
                        </label>
                      </div>
                      
                      {/* 投稿許可の説明 */}
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-start space-x-2">
                          <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
                          <div className="text-sm text-yellow-800">
                            <p className="font-medium mb-1">SNS投稿時のガイドライン</p>
                            <ul className="text-xs space-y-1 list-disc list-inside">
                              <li>イベント主催者のSNS投稿規約を必ず確認してください</li>
                              <li>他の参加者が映っている場合は投稿前に許可を得てください</li>
                              <li>イベント情報を正確に記載することで、コミュニティとの共有が促進されます</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ボタンエリア */}
                    <div className="flex flex-wrap gap-3 pt-4">
                      <button
                        onClick={() => savePost(image.id)}
                        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
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

              // components/ImageGallery.jsx - 最終修正版 Part 9: 投稿表示モード

              /* 表示モード */
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
                    
                    {/* イベント情報表示 */}
                    {(image.event_date || image.event_venue || image.event_name) && (
                      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin size={14} className="text-green-600" />
                          <span className="text-sm font-medium text-green-800">イベント情報</span>
                        </div>
                        <div className="text-sm text-green-700 space-y-1">
                          {image.event_date && (
                            <div className="flex items-center space-x-2">
                              <Clock size={12} />
                              <span>{new Date(image.event_date).toLocaleDateString('ja-JP')}</span>
                            </div>
                          )}
                          {image.event_venue && (
                            <div className="flex items-center space-x-2">
                              <MapPin size={12} />
                              <span>{image.event_venue}</span>
                            </div>
                          )}
                          {image.event_name && (
                            <div className="flex items-center space-x-2">
                              <Star size={12} />
                              <span>{image.event_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 投稿許可ステータス表示 */}
                    {image.no_third_party_in_photo && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle size={14} className="text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">投稿許可確認済み</span>
                        </div>
                        <div className="space-y-1 text-xs text-blue-700">
                          <div className="flex items-center space-x-2">
                            <CheckCircle size={10} className="text-blue-500" />
                            <span>第三者映り込みなし確認済み</span>
                          </div>
                        </div>
                      </div>
                    )}

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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Calendar size={12} />
                            <span>投稿日: {formatDate(image.post_created_at)}</span>
                          </div>
                          <button
                            onClick={() => startEditing(image)}
                            className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                          >
                            編集
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        ))}
      </div>

      {/* 画像モーダル - 改良版 */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          {/* 背景クリックで閉じる */}
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={closeModal}
          />
          
          {/* モーダルコンテンツ */}
          <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col">
            {/* 上部コントロールバー */}
            <div className="flex justify-between items-center mb-4 px-2">
              <div className="text-white text-sm bg-black bg-opacity-50 px-3 py-2 rounded-lg backdrop-blur-sm">
                {selectedImage.name}
              </div>
              
              {/* 閉じるボタン - 改善版 */}
              <button
                onClick={closeModal}
                className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 border-2 border-white border-opacity-20 hover:border-opacity-40 backdrop-blur-sm z-10"
                aria-label="モーダルを閉じる"
              >
                <X size={24} className="drop-shadow-lg" />
              </button>
            </div>

            {/* 画像コンテナ */}
            <div className="relative flex-1 flex items-center justify-center">
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                style={{
                  imageRendering: 'high-quality'
                }}
              />
            </div>

            {/* 下部コントロールバー */}
            <div className="flex justify-between items-center mt-4 px-2">
              {/* ファイル情報 */}
              <div className="text-white text-xs bg-black bg-opacity-50 px-3 py-2 rounded-lg backdrop-blur-sm">
                {formatFileSize(selectedImage.size)}
              </div>
              
              {/* ダウンロードボタン - 改善版 */}
              <button
                onClick={() => downloadImage(selectedImage)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 border border-white border-opacity-20"
              >
                <Download size={16} className="drop-shadow-sm" />
                <span className="font-medium drop-shadow-sm">ダウンロード</span>
              </button>
            </div>

            {/* キーボードショートカットヒント */}
            <div className="absolute top-full left-0 right-0 mt-2 text-center">
              <div className="text-white text-xs bg-black bg-opacity-40 px-3 py-1 rounded-lg backdrop-blur-sm inline-block">
                ESCキーまたは背景クリックで閉じる
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}