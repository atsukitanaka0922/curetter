// lib/supabase-auth.js - 拡張認証設定
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Supabase クライアント（認証機能拡張版）
export const createAuthClient = () => {
  const supabase = createClientComponentClient()
  
  // 認証状態の監視
  const onAuthStateChange = (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.email)
      callback(event, session)
    })
  }
  
  // プロフィール初期化（新規登録時）
  const initializeProfile = async (user) => {
    try {
      console.log('👤 Initializing profile for:', user.email)
      
      // 既存プロフィールをチェック
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
        
      if (existingProfile) {
        console.log('✅ Profile already exists')
        return { data: existingProfile, error: null }
      }
      
      // 新規プロフィール作成
      const profileData = {
        id: user.id,
        display_name: user.user_metadata?.display_name || 
                     user.user_metadata?.full_name || 
                     user.email?.split('@')[0] || 
                     'プリキュアファン',
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // デフォルト値
        age: null,
        gender: null,
        fan_years: null,
        watched_series: [],
        all_series_watched: false,
        what_i_love: '',
        favorite_character: [],
        favorite_series: [],
        favorite_movie: [],
        favorite_episode: [],
        hobbies: '',
        free_text: ''
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single()
        
      if (error) {
        console.error('❌ Profile creation error:', error)
        return { data: null, error }
      }
      
      console.log('✅ Profile created successfully:', data.display_name)
      return { data, error: null }
      
    } catch (error) {
      console.error('❌ Initialize profile error:', error)
      return { data: null, error }
    }
  }
  
  // Google認証
  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Starting Google authentication...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      
      if (error) throw error
      return { data, error: null }
      
    } catch (error) {
      console.error('❌ Google auth error:', error)
      return { data: null, error }
    }
  }
  
  // パスワード認証
  const signInWithPassword = async (email, password) => {
    try {
      console.log('🔑 Password authentication for:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      return { data, error: null }
      
    } catch (error) {
      console.error('❌ Password auth error:', error)
      return { data: null, error }
    }
  }
  
  // アカウント作成
  const signUp = async (email, password, displayName) => {
    try {
      console.log('👤 Creating account for:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: displayName,
            avatar_url: '',
          }
        }
      })
      
      if (error) throw error
      return { data, error: null }
      
    } catch (error) {
      console.error('❌ Sign up error:', error)
      return { data: null, error }
    }
  }
  
  // マジックリンク認証
  const signInWithMagicLink = async (email) => {
    try {
      console.log('✨ Sending magic link to:', email)
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      })
      
      if (error) throw error
      return { error: null }
      
    } catch (error) {
      console.error('❌ Magic link error:', error)
      return { error }
    }
  }
  
  // ログアウト
  const signOut = async () => {
    try {
      console.log('👋 Signing out...')
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      console.log('✅ Signed out successfully')
      return { error: null }
      
    } catch (error) {
      console.error('❌ Sign out error:', error)
      return { error }
    }
  }
  
  return {
    ...supabase,
    auth: {
      ...supabase.auth,
      onAuthStateChange,
      signInWithGoogle,
      signInWithPassword,
      signUp,
      signInWithMagicLink,
      signOut,
      initializeProfile
    }
  }
}

export const supabase = createAuthClient()