// components/PrecureLoader.jsx - プリキュア変身セリフローディングコンポーネント
'use client'

import { useState, useEffect } from 'react'
import { getRandomTransformationPhrase } from '../utils/precureLoadingMessages'

export const PrecureLoader = ({ 
  className = '',
  showSpinner = true,
  size = 'medium',
  customMessage = null,
  showSparkles = true,
  animationSpeed = 3000 // メッセージ変更の間隔（ミリ秒）
}) => {
  const [currentMessage, setCurrentMessage] = useState(
    customMessage || getRandomTransformationPhrase()
  )
  
  // メッセージをランダムに変更
  useEffect(() => {
    if (!customMessage) {
      const interval = setInterval(() => {
        setCurrentMessage(getRandomTransformationPhrase())
      }, animationSpeed)
      return () => clearInterval(interval)
    }
  }, [customMessage, animationSpeed])
  
  // スピナーのサイズクラス
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12', 
    large: 'w-16 h-16',
    xlarge: 'w-20 h-20'
  }
  
  // メッセージのテキストサイズ
  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-xl',
    xlarge: 'text-2xl'
  }
  
  return (
    <div className={`flex flex-col items-center justify-center py-6 ${className}`}>
      {showSpinner && (
        <div className="relative mb-4">
          {/* プリキュア風スピナー */}
          <div className={`${sizeClasses[size]} border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto`}></div>
          
          {/* キラキラエフェクト（中央） */}
          {showSparkles && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-pink-400 animate-pulse">✨</div>
            </div>
          )}
        </div>
      )}
      
      {/* メッセージ表示 */}
      <div className="text-center max-w-md mx-auto">
        <p className={`${textSizeClasses[size]} font-bold text-pink-600 mb-2 animate-pulse break-words`}>
          {currentMessage}
        </p>
      </div>
      
      {/* キラキラエフェクト（下部） */}
      {showSparkles && (
        <div className="flex space-x-2 mt-4 animate-bounce">
          <span className="text-pink-400">💖</span>
          <span className="text-purple-400">✨</span>
          <span className="text-blue-400">⭐</span>
          <span className="text-yellow-400">🌟</span>
          <span className="text-green-400">💫</span>
        </div>
      )}
    </div>
  )
}

// フルスクリーンローディング用のコンポーネント
export const PrecureFullScreenLoader = ({ 
  isVisible = true,
  customMessage = null,
  onClose = null 
}) => {
  const [currentMessage, setCurrentMessage] = useState(
    customMessage || getRandomTransformationPhrase()
  )
  
  useEffect(() => {
    if (!customMessage && isVisible) {
      const interval = setInterval(() => {
        setCurrentMessage(getRandomTransformationPhrase())
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [customMessage, isVisible])
  
  if (!isVisible) return null
  
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center z-50">
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
        <div className="space-y-3 max-w-md mx-auto px-4">
          <p className="text-xl font-bold text-pink-600 animate-pulse break-words">
            {currentMessage}
          </p>
        </div>
        
        {/* キラキラエフェクト */}
        <div className="flex justify-center space-x-2 mt-6 animate-bounce">
          <span className="text-pink-400">💖</span>
          <span className="text-purple-400">✨</span>
          <span className="text-blue-400">⭐</span>
          <span className="text-yellow-400">🌟</span>
          <span className="text-green-400">💫</span>
        </div>
        
        {/* 閉じるボタン（オプション） */}
        {onClose && (
          <button
            onClick={onClose}
            className="mt-8 px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors duration-200"
          >
            閉じる
          </button>
        )}
      </div>
    </div>
  )
}

// インラインローディング用のコンポーネント
export const PrecureInlineLoader = ({ 
  message = null,
  showSpinner = true,
  className = '' 
}) => {
  const [currentMessage, setCurrentMessage] = useState(
    message || getRandomTransformationPhrase()
  )
  
  useEffect(() => {
    if (!message) {
      const interval = setInterval(() => {
        setCurrentMessage(getRandomTransformationPhrase())
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [message])
  
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {showSpinner && (
        <div className="relative">
          <div className="w-6 h-6 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-pink-400 animate-pulse text-xs">✨</div>
          </div>
        </div>
      )}
      <span className="text-sm font-medium text-pink-600 animate-pulse">
        {currentMessage}
      </span>
    </div>
  )
}

// ボタン用ローディング状態
export const PrecureButtonLoader = ({ 
  isLoading = false,
  children,
  loadingMessage = null,
  ...buttonProps 
}) => {
  const [currentMessage, setCurrentMessage] = useState(
    loadingMessage || getRandomTransformationPhrase()
  )
  
  useEffect(() => {
    if (isLoading && !loadingMessage) {
      const interval = setInterval(() => {
        setCurrentMessage(getRandomTransformationPhrase())
      }, 2500)
      return () => clearInterval(interval)
    }
  }, [isLoading, loadingMessage])
  
  return (
    <button
      {...buttonProps}
      disabled={isLoading || buttonProps.disabled}
      className={`${buttonProps.className} ${
        isLoading ? 'cursor-not-allowed opacity-75' : ''
      }`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span className="animate-pulse">{currentMessage}</span>
        </div>
      ) : (
        children
      )}
    </button>
  )
}

// モーダル用ローディング
export const PrecureModalLoader = ({ 
  isVisible = true,
  title = "読み込み中...",
  customMessage = null 
}) => {
  const [currentMessage, setCurrentMessage] = useState(
    customMessage || getRandomTransformationPhrase()
  )
  
  useEffect(() => {
    if (!customMessage && isVisible) {
      const interval = setInterval(() => {
        setCurrentMessage(getRandomTransformationPhrase())
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [customMessage, isVisible])
  
  if (!isVisible) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">{title}</h3>
        
        <PrecureLoader size="large" customMessage={currentMessage} />
      </div>
    </div>
  )
}

// デフォルトエクスポート
export default PrecureLoader