// app/auth/error/page.js
'use client'

import { useSearchParams } from 'next/navigation'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (errorType) => {
    switch (errorType) {
      case 'Configuration':
        return {
          title: '設定エラー',
          message: 'Spotify連携の設定に問題があります。管理者にお問い合わせください。',
          technical: 'OAuth設定またはリダイレクトURIに問題があります。'
        }
      case 'AccessDenied':
        return {
          title: 'アクセス拒否',
          message: 'Spotify連携が拒否されました。再度お試しください。',
          technical: 'ユーザーがOAuth認証を拒否しました。'
        }
      case 'Verification':
        return {
          title: '認証エラー',
          message: '認証の検証に失敗しました。再度お試しください。',
          technical: 'OAuth認証の検証プロセスでエラーが発生しました。'
        }
      case 'Default':
      default:
        return {
          title: '認証エラー',
          message: 'Spotify連携中にエラーが発生しました。再度お試しください。',
          technical: '不明なエラーが発生しました。'
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* エラーアイコン */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} className="text-red-500" />
          </div>

          {/* エラーメッセージ */}
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {errorInfo.title}
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            {errorInfo.message}
          </p>

          {/* テクニカル情報（開発時のみ表示） */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-800 mb-2">開発者向け情報:</h3>
              <p className="text-xs text-gray-600">{errorInfo.technical}</p>
              {error && (
                <p className="text-xs text-gray-500 mt-1">
                  エラーコード: {error}
                </p>
              )}
            </div>
          )}

          {/* アクションボタン */}
          <div className="space-y-3">
            <Link
              href="/"
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white py-3 px-6 rounded-xl hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-2"
            >
              <ArrowLeft size={20} />
              <span>ホームに戻る</span>
            </Link>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl transition-colors font-medium"
            >
              再試行
            </button>
          </div>

          {/* ヘルプ情報 */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-800 mb-2">
              🔧 トラブルシューティング
            </h3>
            <div className="text-xs text-gray-600 text-left space-y-1">
              <p>• Spotifyアカウントにログインしているか確認</p>
              <p>• ブラウザのポップアップブロックを無効化</p>
              <p>• プライベートブラウジングモードを無効化</p>
              <p>• しばらく時間を置いてから再試行</p>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>✨ プリキュアファンプロフィール ✨</p>
        </div>
      </div>
    </div>
  )
}