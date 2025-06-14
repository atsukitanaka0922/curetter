// utils/precureLoadingMessages.js - プリキュア変身セリフローディングシステム

// プリキュア変身セリフ（全シリーズ対応）
export const precureTransformationPhrases = [
  // ふたりはプリキュア
  "デュアル・オーロラ・ウェーブ！",
  
  // ふたりはプリキュア Max Heart
  "ルミナス・シャイニング・ストリーム！",
  
  // ふたりはプリキュア Splash☆Star
  "デュアル・スピリチュアル・パワー！",

  // Yes！プリキュア5
  "プリキュア・メタモルフォーゼ！",
  
  // Yes！プリキュア5GoGo！
  "スカイローズ・トランスレイト！",
  
  // フレッシュプリキュア！
  "チェインジ・プリキュア！ビートアップ！",
  
  // ハートキャッチプリキュア！
  "プリキュア・オープンマイハート！",
  
  // スイートプリキュア♪
  "レッツプレイ！プリキュア・モジュレーション！",
  
  // スマイルプリキュア！
  "プリキュア！スマイルチャージ！",
  
  // ドキドキ！プリキュア
  "プリキュア！ラブリンク！",
  
  // ハピネスチャージプリキュア！
  "プリキュア！くるりんミラーチェンジ！",
  
  // Go！プリンセスプリキュア
  "プリキュア・プリンセスエンゲージ！",
  
  // 魔法つかいプリキュア！
  "キュアップ・ラパパ！",
  "ミラクル・マジカル・ジュエリーレ！",
  "フェリーチェ・ファンファン・フラワーレ！",
  
  // キラキラ☆プリキュアアラモード
  "キュアアラモード！デコレーション！",
  
  // HUGっと！プリキュア
  "ハート・キラッと！",
  
  // スター☆トゥインクルプリキュア
  "スターカラーペンダント！カラーチャージ！",
  
  // ヒーリングっど♥プリキュア
  "プリキュア・オペレーション！",
  
  // トロピカル〜ジュ！プリキュア
  "プリキュア！トロピカルチェンジ！",
  
  // デリシャスパーティ♡プリキュア
  "プリキュア！デリシャスタンバイ！パーティゴー！",
  
  // ひろがるスカイ！プリキュア
  "ひろがるチェンジ！",
  
  // わんだふるぷりきゅあ！
  "プリキュア！マイエボリューション！",
]

// 変身セリフからランダムに選択する関数
export const getRandomTransformationPhrase = () => {
  const randomIndex = Math.floor(Math.random() * precureTransformationPhrases.length)
  return precureTransformationPhrases[randomIndex]
}

// ローディングアニメーション付きコンポーネント
export const PrecureLoadingComponent = ({ 
  className = '',
  showSpinner = true,
  customMessage = null 
}) => {
  const [currentMessage, setCurrentMessage] = useState(
    customMessage || getRandomTransformationPhrase()
  )
  
  // メッセージをランダムに変更
  useEffect(() => {
    if (customMessage) return // カスタムメッセージの場合は変更しない
    
    const interval = setInterval(() => {
      setCurrentMessage(getRandomTransformationPhrase())
    }, 3000) // 3秒ごとにメッセージ変更
    
    return () => clearInterval(interval)
  }, [customMessage])
  
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      {showSpinner && (
        <div className="relative mb-4">
          {/* プリキュア風スピナー */}
          <div className="w-12 h-12 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin"></div>
          {/* キラキラエフェクト */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 text-pink-400 animate-pulse">
              ✨
            </div>
          </div>
        </div>
      )}
      
      {/* メッセージ表示 */}
      <div className="text-center">
        <p className="text-lg font-bold text-pink-600 mb-2 animate-pulse">
          {currentMessage}
        </p>
      </div>
      
      {/* 追加のキラキラエフェクト */}
      <div className="flex space-x-2 mt-4 animate-bounce">
        <span className="text-pink-400">💖</span>
        <span className="text-purple-400">✨</span>
        <span className="text-blue-400">⭐</span>
        <span className="text-yellow-400">🌟</span>
        <span className="text-green-400">💫</span>
      </div>
    </div>
  )
}

// 使用例:
/*
// 基本的な使用
<PrecureLoadingComponent />

// カスタムメッセージ
<PrecureLoadingComponent customMessage="デュアル・オーロラ・ウェーブ！" />

// スピナーなし
<PrecureLoadingComponent showSpinner={false} />
*/