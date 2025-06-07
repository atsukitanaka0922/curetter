export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          {/* メインスピナー */}
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
          
          {/* 装飾的な要素 */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-400 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-400 rounded-full animate-pulse animation-delay-1000"></div>
        </div>
        
        <p className="mt-4 text-gray-600 animate-pulse">
          プリキュアの魔法を準備中...
        </p>
      </div>
    </div>
  )
}