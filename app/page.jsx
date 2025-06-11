// app/page.jsx - プレビューページリダイレクト対応版
'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { Heart, Star, Sparkles, User, LogOut, Camera, Image as ImageIcon, CreditCard, Eye, Music, ExternalLink } from 'lucide-react'
import Profile from '../components/Profile'
import ImageGallery from '../components/ImageGallery'
import ImageManager from '../components/ImageManager'
import DigitalCard from '../components/DigitalCard'
import LocalPlaylist from '../components/LocalPlaylist'
import EnhancedAuth from '../components/EnhancedAuth'

// Supabaseクライアントの初期化
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ローディングスピナーコンポーネント
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-400 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
        </div>
        <p className="mt-4 text-gray-600 animate-pulse">
          プリキュアの魔法を準備中...✨
        </p>
        <div className="mt-2 flex justify-center space-x-2">
          <Heart size={16} className="text-pink-400 animate-bounce" />
          <Sparkles size={16} className="text-purple-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
          <Star size={16} className="text-blue-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    </div>
  )
}

// メインダッシュボード
function Dashboard({ session }) {
  const router = useRouter()
  const [currentView, setCurrentView] = useState('profile')
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      getProfile()
    }
  }, [session])

  const getProfile = async () => {
    try {
      setProfileLoading(true)
      
      console.log('📂 Loading profile for user:', session.user.id)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Profile fetch error:', error)
        throw error
      }

      if (data) {
        console.log('✅ Profile loaded:', data.display_name || 'No name')
        
        // 配列データの処理
        const processedData = {
          ...data,
          favorite_character: Array.isArray(data.favorite_character) ? 
            data.favorite_character : 
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
      } else {
        console.log('ℹ️ No profile found, will create on first edit')
        setProfile(null)
      }
    } catch (error) {
      console.error('❌ Profile loading error:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleSignOut = async () => {
    if (!confirm('ログアウトしますか？')) {
      return
    }
    
    try {
      console.log('👋 Signing out user:', session.user.email)
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ Signout error:', error)
        throw error
      }
      
      console.log('✅ Signout successful')
      
      // 状態をクリア
      setProfile(null)
      setCurrentView('profile')
      
    } catch (error) {
      console.error('❌ Signout failed:', error)
      alert('ログアウトに失敗しました: ' + error.message)
    }
  }

  const handleAvatarChange = (newAvatarUrl) => {
    console.log('📸 Avatar changed:', newAvatarUrl)
    setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }))
  }

  const handleProfileUpdate = (updatedProfile) => {
    console.log('👤 Profile updated:', updatedProfile.display_name)
    setProfile(updatedProfile)
  }

  // プレビューページに移動
  const handlePreview = () => {
    router.push(`/preview/${session.user.id}`)
  }

  // プロフィール読み込み中の表示
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
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                )}
                <div>
                  <h1 className="font-bold text-gray-800">
                    {profile?.display_name || 'プリキュアファン'}
                  </h1>
                  <p className="text-xs text-gray-600">
                    {session.user.email}
                  </p>
                </div>
              </div>

              {/* ナビゲーション */}
              <nav className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentView('profile')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 text-xs font-medium ${
                    currentView === 'profile'
                      ? 'bg-pink-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-pink-50 hover:text-pink-600'
                  }`}
                >
                  <User size={14} />
                  <span>プロフィール</span>
                </button>
                <button
                  onClick={() => setCurrentView('gallery')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 text-xs font-medium ${
                    currentView === 'gallery'
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                  }`}
                >
                  <ImageIcon size={14} />
                  <span>ギャラリー</span>
                </button>
                <button
                  onClick={() => setCurrentView('card')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 text-xs font-medium ${
                    currentView === 'card'
                      ? 'bg-green-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                  }`}
                >
                  <CreditCard size={14} />
                  <span>デジタル名刺</span>
                </button>
                <button
                  onClick={() => setCurrentView('playlist')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 text-xs font-medium ${
                    currentView === 'playlist'
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  <Music size={14} />
                  <span>プレイリスト</span>
                </button>
                <button
                  onClick={() => setCurrentView('manage')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 text-xs font-medium ${
                    currentView === 'manage'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <Camera size={14} />
                  <span>画像管理</span>
                </button>
              </nav>

              {/* アクションボタン */}
              <div className="flex items-center space-x-2 ml-2 pl-2 border-l border-gray-200">
                <button
                  onClick={handlePreview}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 text-xs font-medium shadow-sm"
                  title="他ユーザーから見たプレビュー"
                >
                  <ExternalLink size={14} />
                  <span>プレビュー</span>
                </button>

                <button
                  onClick={handleSignOut}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 text-xs font-medium shadow-sm"
                  title="ログアウト"
                >
                  <LogOut size={14} />
                  <span>ログアウト</span>
                </button>
              </div>
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
        console.log('🔍 Checking session...')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('❌ Session fetch error:', error)
        } else if (mounted) {
          console.log('✅ Session check complete:', session?.user?.email || 'No session')
          setSession(session)
        }
      } catch (error) {
        console.error('❌ Unexpected session error:', error)
      } finally {
        if (mounted) {
          setAuthLoading(false)
        }
      }
    }

    getSession()

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'No session')
      
      if (mounted) {
        setSession(session)
        setAuthLoading(false)
        
        // ログインイベントの場合は追加処理
        if (event === 'SIGNED_IN' && session) {
          console.log('🎉 User signed in successfully')
        }
        
        // ログアウトイベントの場合
        if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out')
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // ローディング中
  if (authLoading) {
    return <LoadingSpinner />
  }

  return (
    <main className="relative z-10">
      {!session ? (
        <EnhancedAuth />
      ) : (
        <Dashboard session={session} />
      )}
    </main>
  )
}

// Export Supabase client for use in other components
export { supabase }