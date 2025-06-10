// components/SocialLinkManager.jsx - 修正版（アイコン改善・ID入力対応）
'use client'

import { useState } from 'react'
import { Plus, X, ExternalLink, Globe, AlertCircle } from 'lucide-react'

export default function SocialLinkManager({ links = [], onLinksChange }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLink, setNewLink] = useState({
    platform: '',
    user_id: '',
    display_name: ''
  })
  const [error, setError] = useState('')

  // 利用可能なプラットフォーム（ID入力対応）
  const platforms = [
    { 
      id: 'X (Twitter)', 
      name: 'X (Twitter)', 
      placeholder: 'ユーザー名（@なし）例: username',
      urlTemplate: 'https://x.com/{user_id}',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: 'text-gray-800',
      bgColor: 'bg-gray-100'
    },
    { 
      id: 'YouTube', 
      name: 'YouTube', 
      placeholder: 'チャンネル名 例: @channelname',
      urlTemplate: 'https://youtube.com/{user_id}',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
      color: 'text-white',
      bgColor: 'bg-red-600'
    },
    { 
      id: 'pixiv', 
      name: 'pixiv', 
      placeholder: 'ユーザーID 例: 12345678',
      urlTemplate: 'https://www.pixiv.net/users/{user_id}',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.935 0A4.924 4.924 0 0 0 0 4.935v14.13A4.924 4.924 0 0 0 4.935 24h14.13A4.924 4.924 0 0 0 24 19.065V4.935A4.924 4.924 0 0 0 19.065 0zm8.5 5.5c2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5h-3v3h-2V5.5zm0 7c1.4 0 2.5-1.1 2.5-2.5s-1.1-2.5-2.5-2.5h-3v5z"/>
        </svg>
      ),
      color: 'text-white',
      bgColor: 'bg-blue-500'
    },
    { 
      id: 'Instagram', 
      name: 'Instagram', 
      placeholder: 'ユーザー名 例: username',
      urlTemplate: 'https://instagram.com/{user_id}',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      color: 'text-white',
      bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    { 
      id: 'TikTok', 
      name: 'TikTok', 
      placeholder: 'ユーザー名 例: @username',
      urlTemplate: 'https://tiktok.com/{user_id}',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      ),
      color: 'text-white',
      bgColor: 'bg-gray-800'
    },
    { 
      id: 'Twitch', 
      name: 'Twitch', 
      placeholder: 'ユーザー名 例: username',
      urlTemplate: 'https://twitch.tv/{user_id}',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
        </svg>
      ),
      color: 'text-white',
      bgColor: 'bg-purple-600'
    },
    { 
      id: 'Discord', 
      name: 'Discord', 
      placeholder: 'ユーザーID 例: username#1234',
      urlTemplate: 'https://discord.com/users/{user_id}',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/>
        </svg>
      ),
      color: 'text-white',
      bgColor: 'bg-indigo-600'
    },
    { 
      id: 'ニコニコ動画', 
      name: 'ニコニコ動画', 
      placeholder: 'ユーザーID 例: 12345678',
      urlTemplate: 'https://www.nicovideo.jp/user/{user_id}',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="8" cy="12" r="3"/>
          <circle cx="16" cy="12" r="3"/>
        </svg>
      ),
      color: 'text-white',
      bgColor: 'bg-orange-600'
    },
    { 
      id: 'その他', 
      name: 'その他のサイト', 
      placeholder: 'https://example.com',
      urlTemplate: '{user_id}', // URLそのまま
      icon: <Globe className="w-4 h-4" />,
      color: 'text-white',
      bgColor: 'bg-gray-700'
    }
  ]

  // URLを生成する関数
  const generateUrl = (platform, userId) => {
    const platformConfig = platforms.find(p => p.id === platform)
    if (!platformConfig) return userId

    if (platform === 'その他') {
      return userId.startsWith('http') ? userId : `https://${userId}`
    }

    // プラットフォーム固有のURL生成
    let processedUserId = userId.trim()
    
    // プラットフォーム別の前処理
    switch (platform) {
      case 'X (Twitter)':
        processedUserId = processedUserId.replace('@', '')
        break
      case 'YouTube':
        if (!processedUserId.startsWith('@')) {
          processedUserId = `@${processedUserId}`
        }
        break
      case 'TikTok':
        if (!processedUserId.startsWith('@')) {
          processedUserId = `@${processedUserId}`
        }
        break
    }

    return platformConfig.urlTemplate.replace('{user_id}', processedUserId)
  }

  // ID/ユーザー名のバリデーション
  const validateUserId = (platform, userId) => {
    if (!userId.trim()) return false
    
    const validators = {
      'X (Twitter)': (id) => /^@?[A-Za-z0-9_]{1,15}$/.test(id),
      'YouTube': (id) => /^@?[A-Za-z0-9_-]{1,30}$/.test(id),
      'pixiv': (id) => /^\d+$/.test(id),
      'Instagram': (id) => /^[A-Za-z0-9_.]{1,30}$/.test(id),
      'TikTok': (id) => /^@?[A-Za-z0-9_.]{1,24}$/.test(id),
      'Twitch': (id) => /^[A-Za-z0-9_]{4,25}$/.test(id),
      'Discord': (id) => /^.+#\d{4}$/.test(id) || /^\d{17,19}$/.test(id),
      'ニコニコ動画': (id) => /^\d+$/.test(id)
    }

    if (platform === 'その他') {
      try {
        new URL(userId.startsWith('http') ? userId : `https://${userId}`)
        return true
      } catch {
        return false
      }
    }

    return validators[platform] ? validators[platform](userId) : true
  }

  // リンク追加
  const addLink = () => {
    setError('')

    // バリデーション
    if (!newLink.platform) {
      setError('プラットフォームを選択してください')
      return
    }

    if (!newLink.user_id.trim()) {
      setError('ユーザーIDを入力してください')
      return
    }

    if (!validateUserId(newLink.platform, newLink.user_id)) {
      setError(`${newLink.platform}の正しいIDまたはユーザー名を入力してください`)
      return
    }

    // URL生成
    const generatedUrl = generateUrl(newLink.platform, newLink.user_id)

    // 重複チェック
    if (links.some(link => link.url === generatedUrl)) {
      setError('このリンクは既に追加されています')
      return
    }

    // 最大数チェック
    if (links.length >= 8) {
      setError('リンクは最大8個まで追加できます')
      return
    }

    // リンク追加
    const linkToAdd = {
      platform: newLink.platform,
      url: generatedUrl,
      user_id: newLink.user_id.trim(),
      display_name: newLink.display_name.trim() || null
    }

    onLinksChange([...links, linkToAdd])

    // フォームリセット
    setNewLink({ platform: '', user_id: '', display_name: '' })
    setShowAddForm(false)
    setError('')
  }

  // リンク削除
  const removeLink = (index) => {
    const updatedLinks = links.filter((_, i) => i !== index)
    onLinksChange(updatedLinks)
  }

  // プラットフォームアイコン取得（背景色付き）
  const getPlatformIcon = (platformName) => {
    const platform = platforms.find(p => p.id === platformName)
    if (!platform) return <Globe className="w-4 h-4" />

    return (
      <div className={`w-8 h-8 rounded-full ${platform.bgColor} flex items-center justify-center`}>
        <div className={platform.color}>
          {platform.icon}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 既存のリンク表示 */}
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {getPlatformIcon(link.platform)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {link.display_name || link.platform}
                    </span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                      title="リンクを開く"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {link.user_id || link.url}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeLink(index)}
                className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors p-1"
                title="削除"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* リンク追加ボタン */}
      {!showAddForm && links.length < 8 && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
        >
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <Plus size={20} />
            <span>ソーシャルリンクを追加</span>
          </div>
        </button>
      )}

      {/* リンク追加フォーム */}
      {showAddForm && (
        <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プラットフォーム
              </label>
              <select
                value={newLink.platform}
                onChange={(e) => setNewLink({...newLink, platform: e.target.value, user_id: ''})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">選択してください</option>
                {platforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {newLink.platform === 'その他' ? 'URL' : 'ユーザーID / ユーザー名'}
              </label>
              <input
                type="text"
                value={newLink.user_id}
                onChange={(e) => setNewLink({...newLink, user_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={
                  newLink.platform 
                    ? platforms.find(p => p.id === newLink.platform)?.placeholder || 'ユーザーIDを入力'
                    : 'まずプラットフォームを選択してください'
                }
                disabled={!newLink.platform}
              />
              {newLink.platform && newLink.user_id && (
                <div className="mt-1 text-xs text-gray-500">
                  プレビュー: {generateUrl(newLink.platform, newLink.user_id)}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                表示名（オプション）
              </label>
              <input
                type="text"
                value={newLink.display_name}
                onChange={(e) => setNewLink({...newLink, display_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="カスタム表示名（空白の場合はプラットフォーム名を表示）"
                maxLength="20"
              />
              <p className="text-xs text-gray-500 mt-1">
                最大20文字まで。空白の場合はプラットフォーム名が表示されます。
              </p>
            </div>

            {/* エラー表示 */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* ボタン */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewLink({ platform: '', user_id: '', display_name: '' })
                  setError('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={addLink}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 制限表示 */}
      {links.length >= 8 && (
        <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <span className="text-sm text-yellow-700">
            ソーシャルリンクは最大8個まで追加できます
          </span>
        </div>
      )}

      {/* 説明 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• プロフィールページで名前の横にアイコンとして表示されます</p>
        <p>• IDやユーザー名を入力するだけで自動的にURLが生成されます</p>
        <p>• 最大8個まで追加可能です</p>
        <p>• リンクは新しいタブで開かれます</p>
      </div>
    </div>
  )
}