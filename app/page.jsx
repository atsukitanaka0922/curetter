// app/page.jsx - メインアプリ（ローカルプレイリスト対応版）
'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Heart, Star, Sparkles, Mail, Loader2, User, Edit, LogOut, Camera, Image as ImageIcon, CreditCard, Eye, Music } from 'lucide-react'
import Profile from '../components/Profile'
import ImageGallery from '../components/ImageGallery'
import ImageManager from '../components/ImageManager'
import DigitalCard from '../components/DigitalCard'
import UserPreview from '../components/UserPreview'
import LocalPlaylist from '../components/LocalPlaylist' // 変更: Playlist → LocalPlaylist

// Supabaseクライアントの初期化
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ローディングスピナーコンポーネント
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-400 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
        </div>
        <p className="mt-4 text-gray-600 animate-pulse">
          プリキュアの魔法を準備中...
        </p>
      </div>
    </div>
  )
}

// 認証コンポーネント
function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!email) {
      setMessage('メールアドレスを入力してください')
      setMessageType('error')
      return
    }

    try {
      setLoading(true)
      setMessage('')
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (error) {
        throw error
      }

      setMessage('メールをチェックしてマジカルリンクをクリックしてください！✨')
      setMessageType('success')
      setEmail('')
    } catch (error) {
      console.error('ログインエラー:', error)
      setMessage(error.message || 'エラーが発生しました。もう一度お試しください。')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center space-x-2 mb-4">
              <Heart className="text-pink-500" size={32} />
              <Sparkles className="text-purple-500" size={28} />
              <Star className="text-blue-500" size={30} />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              プリキュアファン
            </h1>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              プロフィール
            </h2>
            <p className="text-gray-600 text-sm">
              あなたのプリキュア愛を共有しましょう！
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 bg-white/50"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white py-3 px-6 rounded-xl hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span>マジカルログイン中...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Sparkles size={20} />
                  <span>マジカルログイン</span>
                </div>
              )}
            </button>
          </form>

          {message && (
            <div className={`mt-6 p-4 rounded-xl text-sm ${
              messageType === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              パスワード不要！メールアドレスに送られるリンクからログインできます
            </p>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>✨ みんなで一緒にプリキュア愛を共有しよう！ ✨</p>
        </div>
      </div>
    </div>
  )
}

// メインダッシュボード
function Dashboard({ session }) {
  const [currentView, setCurrentView] = useState('profile') // 'profile', 'gallery', 'manage', 'card', 'playlist'
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      getProfile()
    }
  }, [session])

  const getProfile = async () => {
    try {
      setProfileLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        const processedData = {
          ...data,
          favorite_character: Array.isArray(data.favorite_character) ? data.favorite_character : 
                             data.favorite_character ? data.favorite_character.split(',').map(s => s.trim()) : [],
          favorite_series: Array.isArray(data.favorite_series) ? data.favorite_series : 
                          data.favorite_series ? data.favorite_series.split(',').map(s => s.trim()) : [],
          favorite_movie: Array.isArray(data.favorite_movie) ? data.favorite_movie : 
                         data.favorite_movie ? data.favorite_movie.split(',').map(s => s.trim()) : [],
          favorite_episode: Array.isArray(data.favorite_episode) ? data.favorite_episode : 
                           data.favorite_episode ? data.favorite_episode.split(',').map(s => s.trim()) : [],
          watched_series: Array.isArray(data.watched_series) ? data.watched_series : 
                         data.watched_series ? data.watched_series.split(',').map(s => s.trim()) : []
        }
        setProfile(processedData)
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('ログアウトエラー:', error)
      alert('ログアウトに失敗しました')
    }
  }

  const handleAvatarChange = (newAvatarUrl) => {
    setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }))
  }

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile)
  }

  if (profileLoading && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">プロフィールを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg sticky top-0 z-40">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* プロフィール画像とユーザー名 */}
              <div className="flex items-center space-x-3">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="プロフィール画像"
                    className="w-10 h-10 rounded-full object-cover border-2 border-pink-300"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 rounded-full flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-bold text-gray-800">
                    {profile?.display_name || 'プリキュアファン'}
                  </h1>
                  <p className="text-xs text-gray-600">{session.user.email}</p>
                </div>
              </div>
            </div>

            {/* ナビゲーション */}
            <div className="flex items-center space-x-2">
              <nav className="flex space-x-1">
                <button
                  onClick={() => setCurrentView('profile')}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    currentView === 'profile'
                      ? 'bg-pink-500 text-white'
                      : 'text-gray-600 hover:bg-pink-50'
                  }`}
                >
                  <User size={16} />
                  <span>プロフィール</span>
                </button>
                <button
                  onClick={() => setCurrentView('gallery')}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    currentView === 'gallery'
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-600 hover:bg-purple-50'
                  }`}
                >
                  <ImageIcon size={16} />
                  <span>ギャラリー</span>
                </button>
                <button
                  onClick={() => setCurrentView('card')}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    currentView === 'card'
                      ? 'bg-green-500 text-white'
                      : 'text-gray-600 hover:bg-green-50'
                  }`}
                >
                  <CreditCard size={16} />
                  <span>デジタル名刺</span>
                </button>
                <button
                  onClick={() => setCurrentView('playlist')}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    currentView === 'playlist'
                      ? 'bg-indigo-500 text-white'
                      : 'text-gray-600 hover:bg-indigo-50'
                  }`}
                >
                  <Music size={16} />
                  <span>プレイリスト</span>
                </button>
                <button
                  onClick={() => setCurrentView('manage')}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    currentView === 'manage'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-blue-50'
                  }`}
                >
                  <Camera size={16} />
                  <span>画像管理</span>
                </button>
              </nav>

              {/* プレビューボタン */}
              <button
                onClick={() => setShowPreview(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                title="他ユーザーから見たプレビュー"
              >
                <Eye size={16} />
                <span>プレビュー</span>
              </button>

              <button
                onClick={handleSignOut}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <LogOut size={16} />
                <span>ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {currentView === 'profile' && (
          <Profile 
            session={session} 
            profile={profile}
            onProfileUpdate={handleProfileUpdate}
            onAvatarChange={handleAvatarChange}
          />
        )}
        {currentView === 'gallery' && (
          <ImageGallery 
            session={session}
            profile={profile}
          />
        )}
        {currentView === 'card' && (
          <DigitalCard 
            session={session}
            profile={profile}
          />
        )}
        {currentView === 'playlist' && (
          <LocalPlaylist 
            session={session}
            profile={profile}
          />
        )}
        {currentView === 'manage' && (
          <ImageManager 
            session={session}
            currentAvatar={profile?.avatar_url || ''}
            onAvatarChange={handleAvatarChange}
          />
        )}
      </div>

      {/* プレビューモーダル */}
      {showPreview && (
        <UserPreview 
          userId={session.user.id}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}

// メインコンポーネント
export default function Home() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('セッション取得エラー:', error)
        } else if (mounted) {
          setSession(session)
        }
      } catch (error) {
        console.error('予期しないエラー:', error)
      } finally {
        if (mounted) {
          setAuthLoading(false)
        }
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('認証状態変更:', event, session?.user?.email)
      if (mounted) {
        setSession(session)
        setAuthLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (authLoading) {
    return <LoadingSpinner />
  }

  return (
    <main className="relative z-10">
      {!session ? (
        <Auth />
      ) : (
        <Dashboard session={session} />
      )}
    </main>
  )
}

// Export Supabase client for use in other components
export { supabase }