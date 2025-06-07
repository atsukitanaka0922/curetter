// components/EnhancedAuth.jsx - 改良された認証コンポーネント
'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Heart, Star, Sparkles, Mail, Loader2, Lock, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react'

export default function EnhancedAuth() {
  const [authMode, setAuthMode] = useState('signin') // 'signin', 'signup', 'magic'
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' or 'error'
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const supabase = createClientComponentClient()

  // フォームデータの更新
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // エラーメッセージをクリア
    if (message && messageType === 'error') {
      setMessage('')
      setMessageType('')
    }
  }

  // バリデーション
  const validateForm = () => {
    if (!formData.email) {
      setMessage('メールアドレスを入力してください')
      setMessageType('error')
      return false
    }

    if (!formData.email.includes('@')) {
      setMessage('有効なメールアドレスを入力してください')
      setMessageType('error')
      return false
    }

    if (authMode !== 'magic') {
      if (!formData.password) {
        setMessage('パスワードを入力してください')
        setMessageType('error')
        return false
      }

      if (formData.password.length < 6) {
        setMessage('パスワードは6文字以上で入力してください')
        setMessageType('error')
        return false
      }

      if (authMode === 'signup' && formData.password !== formData.confirmPassword) {
        setMessage('パスワードが一致しません')
        setMessageType('error')
        return false
      }
    }

    return true
  }

  // マジックリンクログイン
  const handleMagicLinkLogin = async (e) => {
    e.preventDefault()
    
    if (!formData.email) {
      setMessage('メールアドレスを入力してください')
      setMessageType('error')
      return
    }

    try {
      setLoading(true)
      setMessage('')
      
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (error) throw error

      setMessage('メールをチェックしてマジカルリンクをクリックしてください！✨')
      setMessageType('success')
      setFormData({ email: '', password: '', confirmPassword: '' })
    } catch (error) {
      console.error('マジックリンクエラー:', error)
      setMessage(error.message || 'エラーが発生しました。もう一度お試しください。')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // パスワードログイン
  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)
      setMessage('')
      
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) throw error

      setMessage('ログインしました！✨')
      setMessageType('success')
    } catch (error) {
      console.error('ログインエラー:', error)
      if (error.message.includes('Invalid login credentials')) {
        setMessage('メールアドレスまたはパスワードが間違っています')
      } else if (error.message.includes('Email not confirmed')) {
        setMessage('メールアドレスの確認が完了していません。メールをご確認ください。')
      } else {
        setMessage(error.message || 'ログインに失敗しました')
      }
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // 新規登録
  const handleSignUp = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)
      setMessage('')
      
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      })

      if (error) throw error

      setMessage('確認メールを送信しました！メールボックスをチェックしてアカウントを有効化してください。✨')
      setMessageType('success')
      setFormData({ email: '', password: '', confirmPassword: '' })
    } catch (error) {
      console.error('新規登録エラー:', error)
      if (error.message.includes('User already registered')) {
        setMessage('このメールアドレスは既に登録されています。ログインしてください。')
      } else {
        setMessage(error.message || 'アカウント作成に失敗しました')
      }
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // フォーム送信ハンドラー
  const handleSubmit = (e) => {
    switch (authMode) {
      case 'magic':
        return handleMagicLinkLogin(e)
      case 'signin':
        return handlePasswordLogin(e)
      case 'signup':
        return handleSignUp(e)
      default:
        e.preventDefault()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* ヘッダー */}
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

          {/* 認証モード選択 */}
          <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => {
                setAuthMode('signin')
                setMessage('')
                setMessageType('')
              }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
                authMode === 'signin'
                  ? 'bg-white shadow-md text-pink-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <LogIn size={16} />
              <span className="text-sm font-medium">ログイン</span>
            </button>
            <button
              onClick={() => {
                setAuthMode('signup')
                setMessage('')
                setMessageType('')
              }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
                authMode === 'signup'
                  ? 'bg-white shadow-md text-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <UserPlus size={16} />
              <span className="text-sm font-medium">新規登録</span>
            </button>
            <button
              onClick={() => {
                setAuthMode('magic')
                setMessage('')
                setMessageType('')
              }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
                authMode === 'magic'
                  ? 'bg-white shadow-md text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Sparkles size={16} />
              <span className="text-sm font-medium">マジック</span>
            </button>
          </div>

          {/* フォーム */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* メールアドレス */}
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
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 bg-white/50"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* パスワード（マジックリンク以外） */}
            {authMode !== 'magic' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="6文字以上のパスワード"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 bg-white/50"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            {/* パスワード確認（新規登録時のみ） */}
            {authMode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード確認
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="パスワードを再入力"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 bg-white/50"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white py-3 px-6 rounded-xl hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span>
                    {authMode === 'magic' && '送信中...'}
                    {authMode === 'signin' && 'ログイン中...'}
                    {authMode === 'signup' && '登録中...'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  {authMode === 'magic' && (
                    <>
                      <Sparkles size={20} />
                      <span>マジカルリンクを送信</span>
                    </>
                  )}
                  {authMode === 'signin' && (
                    <>
                      <LogIn size={20} />
                      <span>ログイン</span>
                    </>
                  )}
                  {authMode === 'signup' && (
                    <>
                      <UserPlus size={20} />
                      <span>アカウント作成</span>
                    </>
                  )}
                </div>
              )}
            </button>
          </form>

          {/* メッセージ表示 */}
          {message && (
            <div className={`mt-6 p-4 rounded-xl text-sm ${
              messageType === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* 説明文 */}
          <div className="mt-8 text-center">
            <div className="text-xs text-gray-500 space-y-1">
              {authMode === 'magic' && (
                <p>パスワード不要！メールアドレスに送られるリンクからログインできます</p>
              )}
              {authMode === 'signin' && (
                <p>既存のアカウントでログインしてください</p>
              )}
              {authMode === 'signup' && (
                <p>新規アカウントを作成します。確認メールが送信されます。</p>
              )}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>✨ みんなで一緒にプリキュア愛を共有しよう！ ✨</p>
        </div>
      </div>
    </div>
  )
}