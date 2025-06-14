// app/page.jsx - プリキュア変身セリフローディング対応版
'use client'

import { useState, useEffect } from 'react'
import Profile from '../components/Profile'
import ImageGallery from '../components/ImageGallery'
import ImageManager from '../components/ImageManager'
import DigitalCard from '../components/DigitalCard'
import LocalPlaylist from '../components/LocalPlaylist'
import EnhancedAuth from '../components/EnhancedAuth'
import { getRandomTransformationPhrase } from '../utils/precureLoadingMessages'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { Heart, User, Image as ImageIcon, CreditCard, Music, Camera, ExternalLink, LogOut, Sparkles } from 'lucide-react'

// Supabaseクライアントの初期化
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// プリキュア変身セリフローディングスピナーコンポーネント
function PrecureLoadingSpinner() {
  const [currentMessage, setCurrentMessage] = useState(getRandomTransformationPhrase())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage(getRandomTransformationPhrase())
    }, 3000) // 3秒ごとに変身セリフを変更

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="text-center">
        {/* プリキュア風スピナー */}
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto"></div>
          {/* キラキラエフェクト */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 text-pink-400 animate-pulse">✨</div>
          </div>
        </div>
        
        {/* 変身セリフ */}
        <div className="space-y-3">
          <p className="text-xl font-bold text-pink-600 animate-pulse">
            {currentMessage}
          </p>
        </div>
        
        {/* キラキラエフェクト */}
        <div className="flex justify-center space-x-2 mt-4 animate-bounce">
          <span className="text-pink-400">💖</span>
          <span className="text-purple-400">✨</span>
          <span className="text-blue-400">⭐</span>
          <span className="text-yellow-400">🌟</span>
          <span className="text-green-400">💫</span>
        </div>
      </div>
    </div>
  )
}

// グラデーションIDごとのCSS
const gradientMap = {
  precure_classic: 'linear-gradient(135deg, #ff6b9d 0%, #c44cd9 50%, #6fa7ff 100%)',
  cure_black_white: 'linear-gradient(135deg, #ff69b4 0%, #4169e1 50%, #ffffff 100%)',
  splash_star: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 50%, #fff3e0 100%)',
  yes_precure5: 'linear-gradient(135deg, #e91e63 0%, #9c27b0 50%, #673ab7 100%)',
  fresh: 'linear-gradient(135deg, #ff4081 0%, #ff6ec7 50%, #ffb3ff 100%)',
  heartcatch: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 50%, #cddc39 100%)',
  suite: 'linear-gradient(135deg, #9c27b0 0%, #e91e63 50%, #ff9800 100%)',
  smile: 'linear-gradient(135deg, #ffeb3b 0%, #ff9800 25%, #e91e63 50%, #9c27b0 75%, #3f51b5 100%)',
  dokidoki: 'linear-gradient(135deg, #e91e63 0%, #ad1457 50%, #880e4f 100%)',
  happiness_charge: 'linear-gradient(135deg, #ff69b4 0%, #87ceeb 50%, #98fb98 100%)',
  go_princess: 'linear-gradient(135deg, #9c27b0 0%, #e91e63 50%, #ff9800 100%)',
  mahou_tsukai: 'linear-gradient(135deg, #9c27b0 0%, #ff69b4 50%, #ffeb3b 100%)',
  kirakira: 'linear-gradient(135deg, #ff69b4 0%, #ffeb3b 25%, #4caf50 50%, #2196f3 75%, #9c27b0 100%)',
  hugtto: 'linear-gradient(135deg, #ff69b4 0%, #ffeb3b 50%, #2196f3 100%)',
  star_twinkle: 'linear-gradient(135deg, #9c27b0 0%, #ff69b4 25%, #ffeb3b 50%, #4caf50 75%, #2196f3 100%)',
  healin_good: 'linear-gradient(135deg, #ff69b4 0%, #4caf50 50%, #2196f3 100%)',
  tropical_rouge: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 25%, #fff200 50%, #00aeef 75%, #ec008c 100%)',
  delicious_party: 'linear-gradient(135deg, #ff69b4 0%, #ffeb3b 25%, #4caf50 50%, #ff9800 75%, #9c27b0 100%)',
  hirogaru_sky: 'linear-gradient(135deg, #87ceeb 0%, #ff69b4 50%, #ffeb3b 100%)',
  wonderful_precure: 'linear-gradient(135deg, #ff69b4 0%, #9c27b0 25%, #2196f3 50%, #4caf50 75%, #ffeb3b 100%)'
}

// メインダッシュボード
function Dashboard({ session }) {
  const router = useRouter()
  const [currentView, setCurrentView] = useState('profile')
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  // userBackgroundを管理
  const [userBackground, setUserBackground] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
          favorite_fairy: Array.isArray(data.favorite_fairy) ? data.favorite_fairy : 
                         data.favorite_fairy ? data.favorite_fairy.split(',').map(s => s.trim()) : [],
          watched_series: Array.isArray(data.watched_series) ? data.watched_series : 
                         data.watched_series ? data.watched_series.split(',').map(s => s.trim()) : [],
          social_links: Array.isArray(data.social_links) ? data.social_links : []
        }
        
        setProfile(processedData)
      }
    } catch (error) {
      console.error('❌ Profile loading error:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile)
  }

  const handleAvatarChange = (newAvatarUrl) => {
    setProfile(prev => ({
      ...prev,
      avatar_url: newAvatarUrl
    }))
  }

  // Profileから背景設定を受け取る
  const handleBackgroundUpdate = (newBackground) => {
    setUserBackground(newBackground)
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ Sign out error:', error)
        alert('ログアウトに失敗しました')
      }
    } catch (error) {
      console.error('❌ Sign out error:', error)
      alert('ログアウトに失敗しました')
    }
  }

  const handlePreview = () => {
    if (session?.user?.id) {
      const url = `/preview/${session.user.id}`
      window.open(url, '_blank')
    }
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'profile':
        return (
          <Profile
            session={session}
            profile={profile}
            onProfileUpdate={handleProfileUpdate}
            onAvatarChange={handleAvatarChange}
            onBackgroundUpdate={handleBackgroundUpdate} // 追加
          />
        )
      case 'gallery':
        return <ImageGallery session={session} profile={profile} />
      case 'card':
        return <DigitalCard session={session} profile={profile} />
      case 'playlist':
        return <LocalPlaylist session={session} />
      case 'manage':
        return <ImageManager session={session} />
      default:
        return (
          <Profile
            session={session}
            profile={profile}
            onProfileUpdate={handleProfileUpdate}
            onAvatarChange={handleAvatarChange}
            onBackgroundUpdate={handleBackgroundUpdate} // 追加
          />
        )
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #ff6b9d 0%, #c44cd9 50%, #6fa7ff 100%)' }}>
      {/* ローディングやスケルトンなど */}
    </div>
  )
}

// メインアプリケーションコンポーネント
export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authMessage, setAuthMessage] = useState(getRandomTransformationPhrase())
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // 認証状態の初期確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 認証状態のローディング中にメッセージを変更
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setAuthMessage(getRandomTransformationPhrase())
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [loading])

  useEffect(() => {
    setIsClient(true)
  }, [])

  // SSR時は必ず同じ背景にする
  if (!isClient) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #ff6b9d 0%, #c44cd9 50%, #6fa7ff 100%)' }}>
        {/* ローディングやスケルトンなど */}
      </div>
    )
  }

  // クライアント描画時のみ背景を切り替える
  return (
    <div
      className="min-h-screen"
      style={
        userBackground?.type === 'gradient'
          ? { background: gradientMap[userBackground.gradient_id] || gradientMap.precure_classic }
          : userBackground?.type === 'solid'
          ? { backgroundColor: userBackground.solid_color || '#ff69b4' }
          : { background: 'linear-gradient(135deg, #ff6b9d 0%, #c44cd9 50%, #6fa7ff 100%)' }
      }
    >
      {/* ...既存の内容... */}
    </div>
  )
}