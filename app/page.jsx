// app/page.jsx - パート1: インポートと基本設定
'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Heart, Star, Sparkles, Mail, Loader2, User, Edit, Save, X, Calendar, MapPin, Globe, LogOut } from 'lucide-react'

// Supabaseクライアントの初期化
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// パート2: ユーティリティコンポーネント

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

// パート3: 認証コンポーネント

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

// パート4: プロフィールコンポーネント（データ取得部分）

function Profile({ session }) {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [seriesData, setSeriesData] = useState([])
  const [charactersData, setCharactersData] = useState([])
  const [moviesData, setMoviesData] = useState([])
  const [episodeTypesData, setEpisodeTypesData] = useState([])
  const [formData, setFormData] = useState({
    display_name: '',
    age: '',
    fan_years: '',
    gender: '',
    watched_series: [],
    all_series_watched: false,
    what_i_love: '',
    favorite_character: [],
    favorite_series: [],
    favorite_movie: [],
    favorite_episode: [],
    hobbies: '',
    free_text: ''
  })

  useEffect(() => {
    if (session?.user?.id) {
      getProfile()
      getSeriesData()
      getCharactersData()
      getMoviesData()
      getEpisodeTypesData()
    }
  }, [session])

  const getSeriesData = async () => {
    try {
      const { data, error } = await supabase
        .from('precure_series')
        .select('*')
        .order('year_start', { ascending: true })

      if (error) throw error
      setSeriesData(data || [])
    } catch (error) {
      console.error('シリーズデータ取得エラー:', error)
    }
  }

  const getCharactersData = async () => {
    try {
      const { data, error } = await supabase
        .from('precure_characters')
        .select('*')
        .order('series_name', { ascending: true })

      if (error) throw error
      setCharactersData(data || [])
    } catch (error) {
      console.error('キャラクターデータ取得エラー:', error)
    }
  }

  const getMoviesData = async () => {
    try {
      const { data, error } = await supabase
        .from('precure_movies')
        .select('*')
        .order('release_date', { ascending: true })

      if (error) throw error
      setMoviesData(data || [])
    } catch (error) {
      console.error('映画データ取得エラー:', error)
    }
  }

  const getEpisodeTypesData = async () => {
    try {
      const { data, error } = await supabase
        .from('episode_types')
        .select('*')
        .order('category', { ascending: true })

      if (error) throw error
      setEpisodeTypesData(data || [])
    } catch (error) {
      console.error('エピソードタイプデータ取得エラー:', error)
    }
  }

  const getProfile = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        // データベースから取得したJSONを配列に変換
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
        setFormData(processedData)
      } else {
        const defaultData = {
          display_name: '',
          age: '',
          fan_years: '',
          gender: '',
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
        setFormData(defaultData)
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error)
      alert('プロフィールの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // パート5: データ処理とヘルパー関数

  const updateProfile = async () => {
    try {
      // 必須項目のチェック
      if (!formData.display_name?.trim()) {
        alert('名前は必須項目です')
        return
      }

      setLoading(true)
      
      // 配列を文字列に変換してデータベースに保存
      const updates = {
        id: session.user.id,
        ...formData,
        favorite_character: Array.isArray(formData.favorite_character) ? formData.favorite_character.join(', ') : formData.favorite_character,
        favorite_series: Array.isArray(formData.favorite_series) ? formData.favorite_series.join(', ') : formData.favorite_series,
        favorite_movie: Array.isArray(formData.favorite_movie) ? formData.favorite_movie.join(', ') : formData.favorite_movie,
        favorite_episode: Array.isArray(formData.favorite_episode) ? formData.favorite_episode.join(', ') : formData.favorite_episode,
        watched_series: Array.isArray(formData.watched_series) ? formData.watched_series.join(', ') : formData.watched_series,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(updates)

      if (error) throw error

      // 表示用にデータを配列形式で保持
      setProfile({
        ...updates,
        favorite_character: formData.favorite_character,
        favorite_series: formData.favorite_series,
        favorite_movie: formData.favorite_movie,
        favorite_episode: formData.favorite_episode,
        watched_series: formData.watched_series
      })
      setEditing(false)
      alert('プロフィールを更新しました！✨')
    } catch (error) {
      console.error('プロフィール更新エラー:', error)
      alert('プロフィールの更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // データベースからキャラクターをカテゴリ別に整理（年代順、キャラはID順）
  const getCharacterCategories = () => {
    if (charactersData.length === 0) {
      return {} // 空のオブジェクトを返す
    }

    // シリーズデータと結合して年代情報を取得
    const seriesWithYears = {}
    seriesData.forEach(series => {
      seriesWithYears[series.name] = series.year_start || 9999
    })

    // キャラクターをシリーズ別にグループ化（ID順でソート）
    const categories = {}
    charactersData.forEach(char => {
      const seriesName = char.series_name
      if (!categories[seriesName]) {
        categories[seriesName] = []
      }
      // キャラクター情報とIDを一緒に保存
      categories[seriesName].push({
        name: char.precure_name || char.name,
        id: char.id,
        originalChar: char
      })
    })

    // 各シリーズ内でキャラクターをID順でソート
    Object.keys(categories).forEach(seriesName => {
      categories[seriesName].sort((a, b) => a.id - b.id)
      // ソート後は名前のみの配列に戻す
      categories[seriesName] = categories[seriesName].map(char => char.name)
    })

    // シリーズを年代順でソート
    const sortedCategories = {}
    Object.keys(categories)
      .sort((a, b) => {
        const yearA = seriesWithYears[a] || 9999
        const yearB = seriesWithYears[b] || 9999
        return yearA - yearB
      })
      .forEach(seriesName => {
        sortedCategories[seriesName] = categories[seriesName]
      })

    return sortedCategories
  }

  // データベースから映画をカテゴリ別に整理
  const getMovieCategories = () => {
    if (moviesData.length === 0) {
      return {} // 空のオブジェクトを返す
    }

    const categories = {
      '単独映画': [],
      'オールスターズ DX': [],
      'オールスターズ New Stage': [],
      'オールスターズ その他': [],
      'クロスオーバー': []
    }

    moviesData.forEach(movie => {
      switch (movie.movie_type) {
        case 'series_movie':
          categories['単独映画'].push(movie.title)
          break
        case 'all_stars_dx':
          categories['オールスターズ DX'].push(movie.title)
          break
        case 'all_stars_ns':
          categories['オールスターズ New Stage'].push(movie.title)
          break
        case 'all_stars_other':
          categories['オールスターズ その他'].push(movie.title)
          break
        case 'crossover':
          categories['クロスオーバー'].push(movie.title)
          break
        default:
          categories['オールスターズ その他'].push(movie.title)
      }
    })

    // 空のカテゴリを削除
    Object.keys(categories).forEach(key => {
      if (categories[key].length === 0) {
        delete categories[key]
      }
    })

    return categories
  }

  // データベースからエピソードタイプをカテゴリ別に整理
  const getEpisodeTypeCategories = () => {
    if (episodeTypesData.length === 0) {
      return {} // 空のオブジェクトを返す
    }

    const categories = {}
    episodeTypesData.forEach(episode => {
      const category = episode.category
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(episode.name)
    })

    return categories
  }

  // パート6: ダイアログコンポーネント（前半）

  // プロフィール編集用の状態管理
  const [dialogs, setDialogs] = useState({
    character: false,
    series: false,
    movie: false,
    episode: false,
    watchedSeries: false
  })

  // ダイアログを開く
  const openDialog = (type) => {
    setDialogs(prev => ({ ...prev, [type]: true }))
  }

  // ダイアログを閉じる
  const closeDialog = (type) => {
    setDialogs(prev => ({ ...prev, [type]: false }))
  }

  // 選択内容を保存
  const saveSelection = (type, values) => {
    const fieldMap = {
      character: 'favorite_character',
      series: 'favorite_series', 
      movie: 'favorite_movie',
      episode: 'favorite_episode',
      watchedSeries: 'watched_series'
    }
    
    setFormData(prev => ({
      ...prev,
      [fieldMap[type]]: values
    }))
  }

  // ダイアログモーダルコンポーネント
  const SelectionDialog = ({ isOpen, onClose, title, categories, field, selectedValues, dataType, onSave }) => {
    const [tempSelectedValues, setTempSelectedValues] = useState([])
    const [openCategories, setOpenCategories] = useState({})

    useEffect(() => {
      if (isOpen) {
        setTempSelectedValues([...selectedValues])
        // 最初のカテゴリを自動で開く
        if (Object.keys(categories).length > 0) {
          setOpenCategories({ [Object.keys(categories)[0]]: true })
        }
      }
    }, [isOpen, selectedValues])

    const handleTempCheckboxChange = (value) => {
      setTempSelectedValues(prev => {
        const isChecked = prev.includes(value)
        if (isChecked) {
          return prev.filter(item => item !== value)
        } else {
          return [...prev, value]
        }
      })
    }

    const toggleCategory = (categoryName) => {
      setOpenCategories(prev => ({
        ...prev,
        [categoryName]: !prev[categoryName]
      }))
    }

    const handleSave = () => {
      onSave(tempSelectedValues)
      onClose()
    }

    const handleCancel = () => {
      setTempSelectedValues([...selectedValues])
      onClose()
    }

    // パート7: ダイアログコンポーネント（後半）

    // データタイプに応じて詳細情報を取得
    const getItemDetails = (itemName) => {
      if (dataType === "character") {
        return charactersData.find(char => 
          char.precure_name === itemName || char.name === itemName
        )
      } else if (dataType === "movie") {
        return moviesData.find(movie => movie.title === itemName)
      } else if (dataType === "episode") {
        return episodeTypesData.find(ep => ep.name === itemName)
      } else if (dataType === "series") {
        return seriesData.find(s => s.name === itemName)
      }
      return null
    }

    // カラーバッジのスタイルを取得
    const getColorStyle = (color) => {
      const colorMap = {
        'black': 'bg-gray-800 text-white',
        'white': 'bg-gray-100 text-gray-800 border border-gray-300',
        'pink': 'bg-pink-500 text-white',
        'red': 'bg-red-500 text-white',
        'orange': 'bg-orange-500 text-white',
        'yellow': 'bg-yellow-400 text-gray-800',
        'green': 'bg-green-500 text-white',
        'blue': 'bg-blue-500 text-white',
        'purple': 'bg-purple-500 text-white',
        'gold': 'bg-yellow-600 text-white',
      }
      return colorMap[color] || 'bg-gray-300 text-gray-800'
    }

    // メインカラーのスタイルを取得
    const getMainColorsStyle = (colors) => {
      if (!colors || !Array.isArray(colors)) return []
      const colorMap = {
        'black': 'bg-gray-800',
        'white': 'bg-gray-100 border border-gray-300',
        'pink': 'bg-pink-500',
        'red': 'bg-red-500',
        'orange': 'bg-orange-500',
        'yellow': 'bg-yellow-400',
        'green': 'bg-green-500',
        'blue': 'bg-blue-500',
        'purple': 'bg-purple-500',
        'gold': 'bg-yellow-600',
      }
      return colors.map(color => colorMap[color] || 'bg-gray-300')
    }

    if (!isOpen) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* ダイアログヘッダー */}
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{title}</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                  {tempSelectedValues.length}個選択中
                </span>
                <button
                  onClick={handleCancel}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          </div>

          {/* ダイアログコンテンツ */}
          <div className="flex-1 overflow-hidden flex">
            {/* カテゴリリスト */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              {Object.entries(categories).map(([categoryName, options]) => (
                <div key={categoryName} className="border-b border-gray-100">
                  <button
                    className="w-full bg-green-600 text-white px-4 py-3 text-left hover:bg-green-700 transition-colors flex justify-between items-center"
                    onClick={() => toggleCategory(categoryName)}
                  >
                    <span className="font-medium text-sm">{categoryName}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-white/20 px-2 py-1 rounded">
                        {options.filter(option => tempSelectedValues.includes(option)).length}/{options.length}
                      </span>
                      <span className="text-lg">
                        {openCategories[categoryName] ? '−' : '+'}
                      </span>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            {/* 選択項目 */}
            <div className="flex-1 overflow-y-auto p-4">
              {Object.entries(categories).map(([categoryName, options]) => 
                openCategories[categoryName] && (
                  <div key={categoryName} className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 sticky top-0 bg-white py-2">
                      {categoryName}
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {options.map((option, index) => {
                        const details = getItemDetails(option)
                        const isSelected = tempSelectedValues.includes(option)
                        return (
                          <label 
                            key={index} 
                            className={`flex items-start space-x-3 p-4 rounded-lg cursor-pointer transition-all border-2 ${
                              isSelected 
                                ? 'bg-blue-50 border-blue-300' 
                                : 'bg-gray-50 border-transparent hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleTempCheckboxChange(option)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">{option}</span>
                                {details?.color && (
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getColorStyle(details.color)}`}>
                                    {details.color}
                                  </span>
                                )}
                                {details?.movie_type && (
                                  <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {details.movie_type}
                                  </span>
                                )}
                                {details?.year_start && (
                                  <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {details.year_start}{details.year_end && details.year_end !== details.year_start ? `-${details.year_end}` : ''}
                                  </span>
                                )}
                              </div>
                              {details?.name && details.name !== option && (
                                <div className="text-xs text-gray-600 mb-1">
                                  本名: {details.name}
                                </div>
                              )}
                              {details?.name_en && (
                                <div className="text-xs text-gray-600 mb-1">
                                  英語名: {details.name_en}
                                </div>
                              )}
                              {details?.episode_count && (
                                <div className="text-xs text-gray-600 mb-1">
                                  話数: {details.episode_count}話
                                </div>
                              )}
                              {details?.release_date && (
                                <div className="text-xs text-gray-600 mb-1">
                                  公開日: {new Date(details.release_date).toLocaleDateString('ja-JP')}
                                </div>
                              )}
                              {details?.runtime_minutes && (
                                <div className="text-xs text-gray-600 mb-1">
                                  上映時間: {details.runtime_minutes}分
                                </div>
                              )}
                              {details?.main_colors && details.main_colors.length > 0 && (
                                <div className="flex items-center space-x-1 mb-1">
                                  <span className="text-xs text-gray-600">メインカラー:</span>
                                  <div className="flex space-x-1">
                                    {getMainColorsStyle(details.main_colors).map((colorClass, colorIndex) => (
                                      <span 
                                        key={colorIndex}
                                        className={`w-4 h-4 rounded-full ${colorClass}`}
                                        title={details.main_colors[colorIndex]}
                                      ></span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {details?.description && (
                                <div className="text-xs text-gray-600 leading-relaxed">
                                  {details.description}
                                </div>
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* ダイアログフッター */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                選択中: {tempSelectedValues.length}個
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-colors"
                >
                  決定
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // パート9: プロフィール表示部分

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('ログアウトエラー:', error)
      alert('ログアウトに失敗しました')
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 p-6 text-white">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold flex items-center space-x-2">
                <Heart size={32} />
                <span>マイプロフィール</span>
              </h1>
              <div className="flex space-x-2">
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Edit size={16} />
                    <span>編集</span>
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>ログアウト</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {!editing ? (
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 rounded-full flex items-center justify-center">
                    <User size={40} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {profile?.display_name || 'プリキュアファン'}
                    </h2>
                  </div>
                </div>

                {profile?.free_text && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">✨ フリー欄</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{profile.free_text}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* 基本情報 */}
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <User className="text-blue-500 mr-2" size={20} />
                      基本情報
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      {profile?.age && (
                        <div>
                          <span className="font-medium text-gray-600">年齢：</span>
                          <span className="text-gray-700">{profile.age}歳</span>
                        </div>
                      )}
                      {profile?.gender && (
                        <div>
                          <span className="font-medium text-gray-600">性別：</span>
                          <span className="text-gray-700">{profile.gender}</span>
                        </div>
                      )}
                      {profile?.fan_years && (
                        <div>
                          <span className="font-medium text-gray-600">ファン歴：</span>
                          <span className="text-gray-700">{profile.fan_years}年</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* プリキュアの"ここ"が好き */}
                  {profile?.what_i_love && (
                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                        <Heart className="text-rose-500 mr-2" size={20} />
                        プリキュアの"ここ"が好き
                      </h3>
                      <p className="text-gray-700 leading-relaxed">{profile.what_i_love}</p>
                    </div>
                  )}

                  {/* 視聴済みシリーズ */}
                  {(Array.isArray(profile?.watched_series) && profile.watched_series.length > 0) || profile?.all_series_watched ? (
                    <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                        <Star className="text-cyan-500 mr-2" size={20} />
                        視聴済みシリーズ
                        {profile?.all_series_watched ? (
                          <span className="ml-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full">
                            🏆 全作視聴済み
                          </span>
                        ) : (
                          <span className="ml-2 text-sm text-gray-600">
                            ({profile.watched_series.length}作品)
                          </span>
                        )}
                      </h3>
                      {profile?.all_series_watched ? (
                        <div className="text-center py-4">
                          <div className="text-2xl mb-2">🎉</div>
                          <p className="text-cyan-700 font-medium">すべてのプリキュアシリーズを視聴済み！</p>
                          <p className="text-cyan-600 text-sm mt-1">真のプリキュアファンですね✨</p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {profile.watched_series.map((series, index) => (
                            <span key={index} className="inline-block px-2 py-1 bg-cyan-200 text-cyan-800 rounded-full text-xs">
                              {series}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* プリキュア情報 */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <Heart className="text-pink-500" size={20} />
                        <h3 className="font-semibold text-gray-800">好きなキャラ</h3>
                      </div>
                      <div className="text-gray-700 text-sm">
                        {Array.isArray(profile?.favorite_character) && profile.favorite_character.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {profile.favorite_character.map((char, index) => (
                              <span key={index} className="inline-block px-2 py-1 bg-pink-200 text-pink-800 rounded-full text-xs">
                                {char}
                              </span>
                            ))}
                          </div>
                        ) : '未設定'}
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="text-purple-500" size={20} />
                        <h3 className="font-semibold text-gray-800">好きな作品</h3>
                      </div>
                      <div className="text-gray-700 text-sm">
                        {Array.isArray(profile?.favorite_series) && profile.favorite_series.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {profile.favorite_series.map((series, index) => (
                              <span key={index} className="inline-block px-2 py-1 bg-purple-200 text-purple-800 rounded-full text-xs">
                                {series}
                              </span>
                            ))}
                          </div>
                        ) : '未設定'}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <Sparkles className="text-yellow-500" size={20} />
                        <h3 className="font-semibold text-gray-800">好きな映画</h3>
                      </div>
                      <div className="text-gray-700 text-sm">
                        {Array.isArray(profile?.favorite_movie) && profile.favorite_movie.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {profile.favorite_movie.map((movie, index) => (
                              <span key={index} className="inline-block px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs">
                                {movie}
                              </span>
                            ))}
                          </div>
                        ) : '未設定'}
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="text-green-500" size={20} />
                        <h3 className="font-semibold text-gray-800">好きなエピソード</h3>
                      </div>
                      <div className="text-gray-700 text-sm">
                        {Array.isArray(profile?.favorite_episode) && profile.favorite_episode.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {profile.favorite_episode.map((episode, index) => (
                              <span key={index} className="inline-block px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs">
                                {episode}
                              </span>
                            ))}
                          </div>
                        ) : '未設定'}
                      </div>
                    </div>
                  </div>

                  {/* 趣味・活動 */}
                  {profile?.hobbies && (
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <Heart className="text-indigo-500" size={20} />
                        <h3 className="font-semibold text-gray-800">趣味・主な活動</h3>
                      </div>
                      <p className="text-gray-700 text-sm">{profile.hobbies}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (

              // パート11: プロフィール編集フォーム（前半）

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">プロフィール編集</h2>
                  <button
                    onClick={() => setEditing(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* 名前（必須） */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      名前 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.display_name || ''}
                      onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="あなたの名前"
                      required
                    />
                  </div>

                  {/* 年齢、性別、ファン歴 */}
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        年齢
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={formData.age || ''}
                        onChange={(e) => setFormData({...formData, age: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="例：25"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        性別
                      </label>
                      <select
                        value={formData.gender || ''}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        <option value="">選択してください</option>
                        <option value="男性">男性</option>
                        <option value="女性">女性</option>
                        <option value="内緒">内緒</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ファン歴
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={formData.fan_years || ''}
                        onChange={(e) => setFormData({...formData, fan_years: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="例：10（年）"
                      />
                    </div>
                  </div>

                  {/* プリキュアの"ここ"が好き */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      プリキュアの"ここ"が好き 
                      <span className="text-xs text-gray-500">
                        ({(formData.what_i_love || '').length}/200文字)
                      </span>
                    </label>
                    <textarea
                      value={formData.what_i_love || ''}
                      onChange={(e) => {
                        if (e.target.value.length <= 200) {
                          setFormData({...formData, what_i_love: e.target.value})
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      rows="3"
                      placeholder="プリキュアのどこが好きか、魅力に感じる部分を教えてください..."
                      maxLength="200"
                    />
                  </div>

                  // パート12: 視聴済みシリーズ編集部分

                  {/* 視聴済みシリーズ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      視聴済みシリーズ
                      {!formData.all_series_watched && formData.watched_series?.length > 0 && (
                        <span className="text-xs text-gray-500 ml-2">
                          ({formData.watched_series.length}個選択中)
                        </span>
                      )}
                    </label>

                    {/* 全作視聴済みチェックボックス */}
                    <div className="mb-3">
                      <label className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-yellow-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.all_series_watched || false}
                          onChange={(e) => {
                            setFormData({
                              ...formData, 
                              all_series_watched: e.target.checked,
                              // 全作視聴済みにチェックを入れた場合、個別選択をクリア
                              watched_series: e.target.checked ? [] : formData.watched_series
                            })
                          }}
                          className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                        />
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">🏆 全作視聴済み</span>
                          <span className="text-xs text-gray-500">(すべてのプリキュアシリーズを視聴済み)</span>
                        </div>
                      </label>
                    </div>

                    {/* 個別シリーズ選択 */}
                    {!formData.all_series_watched && (
                      <>
                        <button
                          onClick={() => openDialog('watchedSeries')}
                          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-cyan-400 hover:bg-cyan-50 transition-colors text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">視聴済みシリーズを選択</span>
                            <Edit size={16} className="text-gray-400" />
                          </div>
                        </button>
                        {formData.watched_series?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {formData.watched_series.slice(0, 5).map((value, index) => (
                              <span key={index} className="inline-block px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs">
                                {value}
                              </span>
                            ))}
                            {formData.watched_series.length > 5 && (
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                +{formData.watched_series.length - 5}個
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* 全作視聴済み時の表示 */}
                    {formData.all_series_watched && (
                      <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg text-center">
                        <div className="text-2xl mb-2">🎉</div>
                        <p className="text-yellow-700 font-medium">すべてのプリキュアシリーズを視聴済み！</p>
                        <p className="text-yellow-600 text-sm mt-1">真のプリキュアファンですね✨</p>
                      </div>
                    )}
                  </div>

                  // パート13: 好きな項目選択ボタン部分

                  {/* 好きなキャラと好きな作品 */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* 好きなキャラ */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        好きなキャラ
                        {formData.favorite_character?.length > 0 && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({formData.favorite_character.length}個選択中)
                          </span>
                        )}
                      </label>
                      <button
                        onClick={() => openDialog('character')}
                        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-400 hover:bg-pink-50 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">キャラクターを選択</span>
                          <Edit size={16} className="text-gray-400" />
                        </div>
                      </button>
                      {formData.favorite_character?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {formData.favorite_character.slice(0, 5).map((value, index) => (
                            <span key={index} className="inline-block px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs">
                              {value}
                            </span>
                          ))}
                          {formData.favorite_character.length > 5 && (
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{formData.favorite_character.length - 5}個
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 好きな作品 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        好きな作品
                        {formData.favorite_series?.length > 0 && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({formData.favorite_series.length}個選択中)
                          </span>
                        )}
                      </label>
                      <button
                        onClick={() => openDialog('series')}
                        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">作品を選択</span>
                          <Edit size={16} className="text-gray-400" />
                        </div>
                      </button>
                      {formData.favorite_series?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {formData.favorite_series.slice(0, 3).map((value, index) => (
                            <span key={index} className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                              {value}
                            </span>
                          ))}
                          {formData.favorite_series.length > 3 && (
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{formData.favorite_series.length - 3}個
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 好きな映画と好きなエピソード */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* 好きな映画 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        好きな映画
                        {formData.favorite_movie?.length > 0 && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({formData.favorite_movie.length}個選択中)
                          </span>
                        )}
                      </label>
                      <button
                        onClick={() => openDialog('movie')}
                        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">映画を選択</span>
                          <Edit size={16} className="text-gray-400" />
                        </div>
                      </button>
                      {formData.favorite_movie?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {formData.favorite_movie.slice(0, 3).map((value, index) => (
                            <span key={index} className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                              {value}
                            </span>
                          ))}
                          {formData.favorite_movie.length > 3 && (
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{formData.favorite_movie.length - 3}個
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 好きなエピソード */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        好きなエピソード
                        {formData.favorite_episode?.length > 0 && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({formData.favorite_episode.length}個選択中)
                          </span>
                        )}
                      </label>
                      <button
                        onClick={() => openDialog('episode')}
                        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">エピソードを選択</span>
                          <Edit size={16} className="text-gray-400" />
                        </div>
                      </button>
                      {formData.favorite_episode?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {formData.favorite_episode.slice(0, 4).map((value, index) => (
                            <span key={index} className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              {value}
                            </span>
                          ))}
                          {formData.favorite_episode.length > 4 && (
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{formData.favorite_episode.length - 4}個
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  // パート14: フォーム最終部分とダイアログ

                  {/* 趣味・主な活動 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      趣味・主な活動
                    </label>
                    <input
                      type="text"
                      value={formData.hobbies || ''}
                      onChange={(e) => setFormData({...formData, hobbies: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="例：イラスト、コスプレ、グッズ収集"
                    />
                  </div>

                  {/* フリー欄 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      フリー欄 
                      <span className="text-xs text-gray-500">
                        ({(formData.free_text || '').length}/300文字)
                      </span>
                    </label>
                    <textarea
                      value={formData.free_text || ''}
                      onChange={(e) => {
                        if (e.target.value.length <= 300) {
                          setFormData({...formData, free_text: e.target.value})
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      rows="4"
                      placeholder="プリキュアへの想いや、その他伝えたいことを自由に書いてください..."
                      maxLength="300"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setEditing(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={updateProfile}
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Save size={16} />
                    <span>{loading ? '保存中...' : '保存'}</span>
                  </button>
                </div>

                {/* ダイアログコンポーネント */}
                <SelectionDialog
                  isOpen={dialogs.character}
                  onClose={() => closeDialog('character')}
                  title="好きなキャラクターを選択"
                  categories={getCharacterCategories()}
                  field="favorite_character"
                  selectedValues={formData.favorite_character || []}
                  dataType="character"
                  onSave={(values) => saveSelection('character', values)}
                />

                <SelectionDialog
                  isOpen={dialogs.series}
                  onClose={() => closeDialog('series')}
                  title="好きな作品を選択"
                  categories={{'プリキュアシリーズ': seriesData.length > 0 ? seriesData.map(s => s.name) : []}}
                  field="favorite_series"
                  selectedValues={formData.favorite_series || []}
                  dataType="series"
                  onSave={(values) => saveSelection('series', values)}
                />

                <SelectionDialog
                  isOpen={dialogs.movie}
                  onClose={() => closeDialog('movie')}
                  title="好きな映画を選択"
                  categories={getMovieCategories()}
                  field="favorite_movie"
                  selectedValues={formData.favorite_movie || []}
                  dataType="movie"
                  onSave={(values) => saveSelection('movie', values)}
                />

                <SelectionDialog
                  isOpen={dialogs.episode}
                  onClose={() => closeDialog('episode')}
                  title="好きなエピソードを選択"
                  categories={getEpisodeTypeCategories()}
                  field="favorite_episode"
                  selectedValues={formData.favorite_episode || []}
                  dataType="episode"
                  onSave={(values) => saveSelection('episode', values)}
                />

                <SelectionDialog
                  isOpen={dialogs.watchedSeries}
                  onClose={() => closeDialog('watchedSeries')}
                  title="視聴済みシリーズを選択"
                  categories={{'プリキュアシリーズ': seriesData.length > 0 ? seriesData.map(s => s.name) : []}}
                  field="watched_series"
                  selectedValues={formData.watched_series || []}
                  dataType="series"
                  onSave={(values) => saveSelection('watchedSeries', values)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// パート15: メインコンポーネントとエクスポート

// メインコンポーネント
export default function Home() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('セッション取得エラー:', error)
        } else {
          setSession(session)
        }
      } catch (error) {
        console.error('予期しないエラー:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('認証状態変更:', event, session?.user?.email)
      setSession(session)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <main className="relative z-10">
      {!session ? (
        <Auth />
      ) : (
        <Profile session={session} />
      )}
    </main>
  )
}