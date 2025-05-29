'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User, Heart, Star, Settings, LogOut, Edit, Save, X, Calendar, MapPin, Globe } from 'lucide-react'

export default function Profile({ session }) {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    favorite_precure: '',
    favorite_season: '',
    website: '',
    location: '',
    precure_fan_since: new Date().getFullYear()
  })
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (session?.user?.id) {
      getProfile()
    }
  }, [session])

  const getProfile = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setProfile(data)
        setFormData(data)
      } else {
        // プロフィールが存在しない場合のデフォルト値
        const defaultData = {
          username: '',
          display_name: '',
          bio: '',
          favorite_precure: '',
          favorite_season: '',
          website: '',
          location: '',
          precure_fan_since: new Date().getFullYear()
        }
        setFormData(defaultData)
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error)
      alert('プロフィールの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    try {
      setLoading(true)
      const updates = {
        id: session.user.id,
        ...formData,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(updates)

      if (error) throw error

      setProfile(updates)
      setEditing(false)
      alert('プロフィールを更新しました！✨')
    } catch (error) {
      console.error('プロフィール更新エラー:', error)
      alert('プロフィールの更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('ログアウトエラー:', error)
      alert('ログアウトに失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* ヘッダー */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 p-6 text-white">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold flex items-center space-x-2">
                <Heart size={32} />
                <span>マイプロフィール</span>
              </h1>
              <div className="flex space-x-2">
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Edit size={16} />
                    <span>編集</span>
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>ログアウト</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {!editing ? (
              /* プロフィール表示モード */
              <div className="space-y-6">
                {/* プロフィールヘッダー */}
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 rounded-full flex items-center justify-center">
                    <User size={40} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {profile?.display_name || 'プリキュアファン'}
                    </h2>
                    <p className="text-gray-600">
                      @{profile?.username || 'username'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {session.user.email}
                    </p>
                  </div>
                </div>

                {/* 自己紹介 */}
                {profile?.bio && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">✨ 自己紹介</h3>
                    <p className="text-gray-700">{profile.bio}</p>
                  </div>
                )}

                {/* プリキュア情報 */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <Heart className="text-pink-500" size={20} />
                      <h3 className="font-semibold text-gray-800">好きなプリキュア</h3>
                    </div>
                    <p className="text-gray-700">{profile?.favorite_precure || '未設定'}</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <Star className="text-purple-500" size={20} />
                      <h3 className="font-semibold text-gray-800">好きなシリーズ</h3>
                    </div>
                    <p className="text-gray-700">{profile?.favorite_season || '未設定'}</p>
                  </div>
                </div>

                {/* 追加情報 */}
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  {profile?.location && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin size={16} />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile?.website && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Globe size={16} />
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        ウェブサイト
                      </a>
                    </div>
                  )}
                  {profile?.precure_fan_since && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar size={16} />
                      <span>{profile.precure_fan_since}年からファン</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* プロフィール編集モード */
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">プロフィール編集</h2>
                  <button
                    onClick={() => setEditing(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* 編集フォーム */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ユーザー名
                    </label>
                    <input
                      type="text"
                      value={formData.username || ''}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      表示名
                    </label>
                    <input
                      type="text"
                      value={formData.display_name || ''}
                      onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="あなたの名前"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    自己紹介
                  </label>
                  <textarea
                    value={formData.bio || ''}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    rows="4"
                    placeholder="プリキュアへの想いを書いてください..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      好きなプリキュア
                    </label>
                    <input
                      type="text"
                      value={formData.favorite_precure || ''}
                      onChange={(e) => setFormData({...formData, favorite_precure: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="例：キュアブラック、キュアスカイ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      好きなシリーズ
                    </label>
                    <input
                      type="text"
                      value={formData.favorite_season || ''}
                      onChange={(e) => setFormData({...formData, favorite_season: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="例：ふたりはプリキュア、ひろがるスカイ！プリキュア"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      場所
                    </label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="例：東京都"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ウェブサイト
                    </label>
                    <input
                      type="url"
                      value={formData.website || ''}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ファン歴（開始年）
                    </label>
                    <input
                      type="number"
                      min="2004"
                      max={new Date().getFullYear()}
                      value={formData.precure_fan_since || ''}
                      onChange={(e) => setFormData({...formData, precure_fan_since: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="2004"
                    />
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
                    onClick={updateProfile}
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Save size={16} />
                    <span>{loading ? '保存中...' : '保存'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}