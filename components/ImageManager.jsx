// components/ImageManager.jsx - 画像アップロード・管理コンポーネント
'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, Loader2, User, Trash2, X, Star, Camera, Image as ImageIcon } from 'lucide-react'
import { supabase } from '../app/page'

export default function ImageManager({ session, currentAvatar, onAvatarChange }) {
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (session?.user?.id) {
      loadImages()
      checkStorageSetup()
    }
  }, [session])

  // Storageの設定確認
  const checkStorageSetup = async () => {
    try {
      console.log('🔍 Storage設定を確認中...')
      
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      console.log('📁 利用可能なバケット:', buckets)
      
      if (bucketsError) {
        console.error('❌ バケット取得エラー:', bucketsError)
        setDebugInfo(`バケット取得エラー: ${bucketsError.message}`)
        return
      }

      const userImagesBucket = buckets.find(bucket => bucket.name === 'user-images')
      if (!userImagesBucket) {
        setDebugInfo('❌ user-images バケットが存在しません。Supabaseダッシュボードで作成してください。')
        return
      }

      console.log('✅ user-images バケットが見つかりました:', userImagesBucket)
      setDebugInfo('✅ Storage設定OK')

    } catch (error) {
      console.error('❌ Storage設定確認エラー:', error)
      setDebugInfo(`Storage設定確認エラー: ${error.message}`)
    }
  }

  // 画像一覧を取得
  const loadImages = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('📂 画像一覧を取得中...', `${session.user.id}/`)
      
      const { data: files, error } = await supabase.storage
        .from('user-images')
        .list(`${session.user.id}/`, {
          limit: 100,
          offset: 0,
        })

      if (error) {
        console.error('❌ ファイル一覧取得エラー:', error)
        throw error
      }

      console.log('📄 取得したファイル:', files)

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
        console.log('🖼️ 処理された画像ファイル:', imageFiles)
      }
    } catch (error) {
      console.error('❌ 画像取得エラー:', error)
      setError(`画像の取得に失敗しました: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 画像をアップロード
  const uploadImage = async (event) => {
    try {
      setUploading(true)
      setError('')
      
      if (!event.target.files || event.target.files.length === 0) {
        console.log('⚠️ ファイルが選択されていません')
        return
      }

      const file = event.target.files[0]
      console.log('📄 選択されたファイル:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      })
      
      // ファイルサイズチェック (5MB)
      if (file.size > 5 * 1024 * 1024) {
        const errorMsg = `ファイルサイズが大きすぎます: ${(file.size / 1024 / 1024).toFixed(2)}MB (最大5MB)`
        setError(errorMsg)
        alert(errorMsg)
        return
      }

      // ファイルタイプチェック
      if (!file.type.startsWith('image/')) {
        const errorMsg = `サポートされていないファイル形式です: ${file.type}`
        setError(errorMsg)
        alert('画像ファイル（JPEG, PNG, GIF, WebP）を選択してください')
        return
      }

      // ユニークなファイル名を生成
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${session.user.id}/${fileName}`
      
      console.log('📤 アップロード開始:', filePath)

      // アップロード実行
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ アップロードエラー:', uploadError)
        throw uploadError
      }

      console.log('✅ アップロード成功:', uploadData)
      setError('')
      alert('画像をアップロードしました！✨')
      await loadImages()
      
    } catch (error) {
      console.error('❌ アップロードエラー:', error)
      const errorMsg = `画像のアップロードに失敗しました: ${error.message}`
      setError(errorMsg)
      alert(errorMsg)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 画像を削除
  const deleteImage = async (imagePath) => {
    if (!confirm('この画像を削除しますか？')) {
      return
    }

    try {
      console.log('🗑️ 画像削除中:', imagePath)
      
      const { error } = await supabase.storage
        .from('user-images')
        .remove([imagePath])

      if (error) {
        console.error('❌ 削除エラー:', error)
        throw error
      }

      console.log('✅ 削除成功')
      alert('画像を削除しました')
      await loadImages()
      
      // アバターとして設定されていた場合はクリア
      if (currentAvatar === supabase.storage.from('user-images').getPublicUrl(imagePath).data.publicUrl) {
        onAvatarChange('')
      }
    } catch (error) {
      console.error('❌ 削除エラー:', error)
      const errorMsg = `画像の削除に失敗しました: ${error.message}`
      setError(errorMsg)
      alert(errorMsg)
    }
  }

  // アバターとして設定
  const setAsAvatar = async (imageUrl) => {
    try {
      console.log('👤 アバター設定中:', imageUrl)
      
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: imageUrl })
        .eq('id', session.user.id)

      if (error) {
        console.error('❌ アバター設定エラー:', error)
        throw error
      }

      console.log('✅ アバター設定成功')
      onAvatarChange(imageUrl)
      alert('アイコンを設定しました！✨')
    } catch (error) {
      console.error('❌ アイコン設定エラー:', error)
      const errorMsg = `アイコンの設定に失敗しました: ${error.message}`
      setError(errorMsg)
      alert(errorMsg)
    }
  }

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center space-x-2">
              <Camera size={28} className="text-pink-500" />
              <span>画像管理</span>
            </h1>
            <p className="text-gray-600">
              プリキュア画像をアップロードして、プロフィールをカスタマイズしましょう ✨
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-500">{images.length}</div>
            <div className="text-sm text-gray-600">枚の画像</div>
          </div>
        </div>
      </div>

      {/* アップロードセクション */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">新しい画像をアップロード</h3>
          <div className="flex space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={uploadImage}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-colors disabled:opacity-50 flex items-center space-x-2 shadow-lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>アップロード中...</span>
                </>
              ) : (
                <>
                  <Upload size={20} />
                  <span>画像を選択</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
          <p>• 対応形式: JPEG, PNG, GIF, WebP</p>
          <p>• ファイルサイズ: 5MB以下</p>
          <p>• アップロードした画像はプロフィールアイコンとして設定できます</p>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setShowDebug(true)}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded transition-colors"
                >
                  詳細情報を表示
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* デバッグ情報表示（エラー時または手動表示時のみ） */}
      {showDebug && debugInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div className="flex">
              <div className="flex-shrink-0">
                <Star className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">システム情報</h3>
                <div className="mt-2 text-sm text-blue-700">
                  {debugInfo}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowDebug(false)}
              className="text-blue-400 hover:text-blue-600"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* トラブルシューティング（エラー時のみ表示） */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-yellow-800">トラブルシューティング</h4>
              <p className="text-xs text-yellow-700">アップロードに問題がある場合は、設定を確認してください</p>
            </div>
            <button
              onClick={() => {
                checkStorageSetup()
                setShowDebug(true)
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              設定確認
            </button>
          </div>
        </div>
      )}

      {/* 開発者向けデバッグボタン（右下に小さく） */}
      {!error && !showDebug && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              checkStorageSetup()
              setShowDebug(true)
            }}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            システム情報を表示
          </button>
        </div>
      )}

      {/* 画像一覧 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">アップロード済み画像</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="animate-spin mx-auto mb-2" size={24} />
            <p className="text-gray-600">画像を読み込み中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-md">
                  <img
                    src={image.url}
                    alt={`アップロード画像 ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      console.error('❌ 画像読み込みエラー:', image.url)
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
                
                {/* ホバー時のオーバーレイ */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-center justify-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setAsAvatar(image.url)}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition-colors shadow-lg"
                      title="アイコンに設定"
                    >
                      <User size={16} />
                    </button>
                    <button
                      onClick={() => deleteImage(image.fullPath)}
                      className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-colors shadow-lg"
                      title="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* 現在のアバターマーク */}
                {currentAvatar === image.url && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                    アイコン
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {images.length === 0 && !loading && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
            <ImageIcon className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-lg font-medium text-gray-600 mb-2">まだ画像がありません</h3>
            <p className="text-gray-500 text-sm mb-4">
              「画像を選択」ボタンから最初の画像を追加してください
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-colors"
            >
              画像をアップロード
            </button>
          </div>
        )}
      </div>
    </div>
  )
}