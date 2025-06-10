// components/Profile.jsx - 妖精追加版 Part 1: インポート・初期設定・State管理
'use client'

import { useState, useEffect } from 'react'
import { Heart, Star, Sparkles, User, Edit, Save, X, ExternalLink, Plus, Trash2, Globe, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../app/page'
import SocialLinkManager from './SocialLinkManager'

export default function Profile({ session, profile, onProfileUpdate, onAvatarChange }) {
  // === State管理 ===
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [seriesData, setSeriesData] = useState([])
  const [charactersData, setCharactersData] = useState([])
  const [moviesData, setMoviesData] = useState([])
  const [episodeTypesData, setEpisodeTypesData] = useState([])
  const [fairiesData, setFairiesData] = useState([]) // 妖精データ追加
  
  // フォームデータ
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
    favorite_fairy: [], // 好きな妖精を追加
    hobbies: '',
    free_text: '',
    avatar_url: '',
    social_links: []
  })

  // ダイアログ管理
  const [dialogs, setDialogs] = useState({
    character: false,
    series: false,
    movie: false,
    episode: false,
    fairy: false, // 妖精ダイアログを追加
    watchedSeries: false
  })

  const [tempSelectedValues, setTempSelectedValues] = useState([])
  const [openCategories, setOpenCategories] = useState({})

  // === Effect Hook ===
  useEffect(() => {
    if (session?.user?.id) {
      getSeriesData()
      getCharactersData()
      getMoviesData()
      getEpisodeTypesData()
      getFairiesData() // 妖精データ取得を追加
    }
  }, [session])

  useEffect(() => {
    if (profile) {
      // プロフィールデータの配列処理を改善
      const processArrayData = (data) => {
        if (Array.isArray(data)) {
          return data
        } else if (typeof data === 'string' && data.trim()) {
          return data.split(',').map(s => s.trim()).filter(s => s.length > 0)
        }
        return []
      }

      // エピソードデータの処理 - 元の表記を保持
      const processEpisodeData = (episodes) => {
        const processedEpisodes = processArrayData(episodes)
        const uniqueEpisodes = []
        const seenEpisodes = new Set()
        
        processedEpisodes.forEach(episode => {
          // 元のエピソード表記を保持（【シリーズ名】第X話 エピソード名）
          const originalEpisode = episode.trim()
          // 重複チェックのため、エピソード名部分のみを抽出
          const episodeName = originalEpisode.replace(/^【[^】]*】第\d+話\s*/, '')
          
          if (!seenEpisodes.has(episodeName)) {
            seenEpisodes.add(episodeName)
            uniqueEpisodes.push(originalEpisode) // 元の表記を保持
          }
        })
        
        return uniqueEpisodes.slice(0, 3)
      }

      // ソーシャルリンクの処理
      const processSocialLinks = (links) => {
        if (Array.isArray(links)) {
          return links
        } else if (typeof links === 'string' && links.trim()) {
          try {
            return JSON.parse(links)
          } catch {
            return []
          }
        }
        return []
      }

      setFormData({
        ...profile,
        favorite_character: processArrayData(profile.favorite_character),
        favorite_series: processArrayData(profile.favorite_series),
        favorite_movie: processArrayData(profile.favorite_movie),
        favorite_episode: processEpisodeData(profile.favorite_episode),
        favorite_fairy: processArrayData(profile.favorite_fairy), // 妖精データ処理を追加
        watched_series: processArrayData(profile.watched_series),
        social_links: processSocialLinks(profile.social_links)
      })
    }
  }, [profile])

  // components/Profile.jsx - 妖精追加版 Part 2: データ取得関数

  // === データ取得関数群 ===
  const getSeriesData = async () => {
    try {
      console.log('📺 シリーズデータ取得開始...')
      const { data, error } = await supabase
        .from('precure_series')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      console.log('✅ シリーズデータ取得成功:', data?.length || 0, '件')
      setSeriesData(data || [])
    } catch (error) {
      console.error('❌ シリーズデータ取得エラー:', error)
      setSeriesData([])
    }
  }

  const getCharactersData = async () => {
    try {
      console.log('👥 キャラクターデータ取得開始...')
      const { data, error } = await supabase
        .from('precure_characters')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      console.log('✅ キャラクターデータ取得成功:', data?.length || 0, '件')
      setCharactersData(data || [])
    } catch (error) {
      console.error('❌ キャラクターデータ取得エラー:', error)
      setCharactersData([])
    }
  }

  const getMoviesData = async () => {
    try {
      console.log('🎬 映画データ取得開始...')
      const { data, error } = await supabase
        .from('precure_movies')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      console.log('✅ 映画データ取得成功:', data?.length || 0, '件')
      setMoviesData(data || [])
    } catch (error) {
      console.error('❌ 映画データ取得エラー:', error)
      setMoviesData([])
    }
  }

  // エピソードデータ取得関数（修正版）
  const getEpisodeTypesData = async () => {
    try {
      console.log('🔍 エピソードデータ取得開始...')
      
      // まず precure_episodes テーブルを試行
      let { data, error } = await supabase
        .from('precure_episodes')
        .select('*')
        .order('id', { ascending: true })

      // precure_episodes が存在しない場合は episode_types を試行
      if (error && error.code === '42P01') { // テーブル不存在エラー
        console.log('⚠️ precure_episodes テーブルが見つかりません。episode_types を試行します...')
        
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('episode_types')
          .select('*')
          .order('id', { ascending: true })
        
        data = fallbackData
        error = fallbackError
      }

      if (error) {
        console.error('❌ エピソードデータ取得エラー:', error)
        throw error
      }

      console.log('✅ エピソードデータ取得成功:', data?.length || 0, '件')
      setEpisodeTypesData(data || [])
      
      // デバッグ用：取得したデータの構造を確認
      if (data && data.length > 0) {
        console.log('📊 エピソードデータサンプル:', data[0])
      }
      
    } catch (error) {
      console.error('❌ エピソードデータ取得エラー:', error)
      // エラーが発生してもアプリが止まらないように空配列を設定
      setEpisodeTypesData([])
      
      // ユーザーに分かりやすいエラーメッセージを表示
      alert('エピソードデータの取得に失敗しました。管理者にお問い合わせください。')
    }
  }

  // 妖精データ取得関数（新規追加）
  const getFairiesData = async () => {
    try {
      console.log('🧚 妖精データ取得開始...')
      const { data, error } = await supabase
        .from('precure_fairies')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      console.log('✅ 妖精データ取得成功:', data?.length || 0, '件')
      setFairiesData(data || [])
      
      // デバッグ用：取得したデータの構造を確認
      if (data && data.length > 0) {
        console.log('🧚 妖精データサンプル:', data[0])
      }
      
    } catch (error) {
      console.error('❌ 妖精データ取得エラー:', error)
      setFairiesData([])
      
      // 開発者向けの詳細エラー情報
      if (error.code === '42P01') {
        console.warn('⚠️ precure_fairies テーブルが存在しません。データベースの設定を確認してください。')
      }
    }
  }

  // デバッグ用関数（開発時のみ使用）
  const debugProfileData = () => {
    console.log('🔍 プロフィールデータデバッグ情報:')
    console.log('シリーズデータ:', seriesData.length, '件')
    console.log('キャラクターデータ:', charactersData.length, '件')
    console.log('映画データ:', moviesData.length, '件')
    console.log('エピソードデータ:', episodeTypesData.length, '件')
    console.log('妖精データ:', fairiesData.length, '件')
    console.log('フォームデータ:', formData)
    
    // Supabaseのテーブル構造確認用クエリ（開発時のみ）
    if (process.env.NODE_ENV === 'development') {
      supabase
        .from('precure_fairies')
        .select('*')
        .limit(1)
        .then(({ data, error }) => {
          if (error) {
            console.log('precure_fairies テーブルエラー:', error)
          } else {
            console.log('妖精テーブル構造サンプル:', data)
          }
        })
    }
  }

  // components/Profile.jsx - 妖精追加版 Part 3: プロフィール更新関数

  // === プロフィール更新関数 ===
  const updateProfile = async () => {
    if (!session?.user?.id) {
      alert('ログインが必要です')
      return
    }

    if (!formData.display_name || formData.display_name.trim() === '') {
      alert('名前は必須です')
      return
    }

    setLoading(true)
    try {
      console.log('🔄 プロフィール更新開始:', {
        userId: session.user.id,
        socialLinks: formData.social_links,
        socialLinksType: typeof formData.social_links,
        fairies: formData.favorite_fairy
      })

      // ソーシャルリンクの安全な処理
      let processedSocialLinks
      try {
        if (Array.isArray(formData.social_links)) {
          processedSocialLinks = formData.social_links
        } else if (typeof formData.social_links === 'string') {
          processedSocialLinks = JSON.parse(formData.social_links)
        } else {
          processedSocialLinks = []
        }
      } catch (error) {
        console.warn('⚠️ ソーシャルリンクのパース失敗、空配列を使用:', error)
        processedSocialLinks = []
      }

      // エピソードデータの処理 - 元の表記を保持
      const processEpisodeDataForSave = (episodes) => {
        if (Array.isArray(episodes)) {
          const uniqueEpisodes = []
          const seenEpisodes = new Set()
          
          episodes.forEach(episode => {
            const originalEpisode = episode.trim()
            const episodeName = originalEpisode.replace(/^【[^】]*】第\d+話\s*/, '')
            
            if (!seenEpisodes.has(episodeName)) {
              seenEpisodes.add(episodeName)
              uniqueEpisodes.push(originalEpisode) // 元の表記を保持
            }
          })
          
          return uniqueEpisodes.slice(0, 3)
        }
        return []
      }

      // 更新データの準備
      const updates = {
        id: session.user.id,
        display_name: formData.display_name.trim(),
        age: formData.age ? parseInt(formData.age) : null,
        fan_years: formData.fan_years ? parseInt(formData.fan_years) : null,
        gender: formData.gender || null,
        all_series_watched: formData.all_series_watched || false,
        what_i_love: formData.what_i_love || '',
        hobbies: formData.hobbies || '',
        free_text: formData.free_text || '',
        avatar_url: formData.avatar_url || null,
        
        // 配列データを文字列として保存
        favorite_character: Array.isArray(formData.favorite_character) 
          ? formData.favorite_character.join(', ') 
          : formData.favorite_character || '',
        favorite_series: Array.isArray(formData.favorite_series) 
          ? formData.favorite_series.join(', ') 
          : formData.favorite_series || '',
        favorite_movie: Array.isArray(formData.favorite_movie) 
          ? formData.favorite_movie.join(', ') 
          : formData.favorite_movie || '',
        favorite_episode: Array.isArray(formData.favorite_episode) 
          ? processEpisodeDataForSave(formData.favorite_episode).join(', ') 
          : formData.favorite_episode || '',
        favorite_fairy: Array.isArray(formData.favorite_fairy) 
          ? formData.favorite_fairy.join(', ') 
          : formData.favorite_fairy || '', // 妖精データの保存処理を追加
        watched_series: Array.isArray(formData.watched_series) 
          ? formData.watched_series.join(', ') 
          : formData.watched_series || '',
        
        // ソーシャルリンクをJSONBとして保存
        social_links: processedSocialLinks,
        
        updated_at: new Date().toISOString()
      }

      console.log('📝 更新データ:', updates)

      // データベース更新の実行
      const { data, error } = await supabase
        .from('profiles')
        .upsert(updates, {
          onConflict: 'id'
        })
        .select()

      if (error) {
        console.error('❌ データベース更新エラー:', error)
        
        if (error.code) {
          console.error('エラーコード:', error.code)
        }
        if (error.details) {
          console.error('エラー詳細:', error.details)
        }
        if (error.hint) {
          console.error('エラーヒント:', error.hint)
        }
        
        throw new Error(`データベース更新失敗: ${error.message}`)
      }

      console.log('✅ プロフィール更新成功:', data)

      // UIの状態更新
      const updatedProfile = {
        ...updates,
        favorite_character: formData.favorite_character,
        favorite_series: formData.favorite_series,
        favorite_movie: formData.favorite_movie,
        favorite_episode: processEpisodeDataForSave(formData.favorite_episode),
        favorite_fairy: formData.favorite_fairy, // 妖精データをUIに反映
        watched_series: formData.watched_series,
        social_links: processedSocialLinks
      }

      onProfileUpdate(updatedProfile)
      setEditing(false)
      alert('プロフィールを更新しました！✨')

    } catch (error) {
      console.error('❌ プロフィール更新エラー:', error)
      
      let errorMessage = 'プロフィールの更新に失敗しました'
      
      if (error.message.includes('social_links')) {
        errorMessage += '\n\nソーシャルリンクの保存に問題があります。データベースの設定を確認してください。'
      } else if (error.message.includes('favorite_fairy')) {
        errorMessage += '\n\n妖精データの保存に問題があります。データベースの設定を確認してください。'
      } else if (error.message.includes('column')) {
        errorMessage += '\n\nデータベースの構造に問題があります。管理者にお問い合わせください。'
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // ソーシャルリンク更新ハンドラー
  const handleSocialLinksUpdate = (newLinks) => {
    setFormData(prev => ({
      ...prev,
      social_links: newLinks
    }))
  }

  // components/Profile.jsx - 妖精追加版 Part 4: カテゴリ整理・ダイアログ関数

  // === カテゴリ整理関数 ===
  
  // データベースからキャラクターをカテゴリ別に整理
  const getCharacterCategories = () => {
    if (charactersData.length === 0) {
      return {}
    }

    const seriesWithYears = {}
    seriesData.forEach(series => {
      seriesWithYears[series.name] = series.year_start || 9999
    })

    const categories = {}
    const sortedCharacters = [...charactersData].sort((a, b) => a.id - b.id)
    
    sortedCharacters.forEach(char => {
      const seriesName = char.series_name
      if (!categories[seriesName]) {
        categories[seriesName] = []
      }
      categories[seriesName].push({
        name: char.precure_name || char.name,
        id: char.id,
        originalChar: char
      })
    })

    Object.keys(categories).forEach(seriesName => {
      categories[seriesName] = categories[seriesName].map(char => char.name)
    })

    const sortedCategories = {}
    Object.keys(categories)
      .sort((a, b) => (seriesWithYears[a] || 9999) - (seriesWithYears[b] || 9999))
      .forEach(key => {
        sortedCategories[key] = categories[key]
      })

    return sortedCategories
  }

  // エピソードデータをカテゴリ別に整理（修正版）
  const getEpisodeCategories = () => {
    if (episodeTypesData.length === 0) {
      console.warn('⚠️ エピソードデータが空です')
      return {}
    }

    console.log('📋 エピソードカテゴリ整理開始:', episodeTypesData.length, '件')

    const categories = {}
    episodeTypesData.forEach(episode => {
      // データ構造の柔軟性を高める
      const category = episode.category || episode.series_name || episode.series || 'その他'
      const episodeName = episode.name || episode.title || episode.episode_name || '不明なエピソード'
      const episodeNumber = episode.episode_number || episode.number || '?'
      
      if (!categories[category]) {
        categories[category] = []
      }
      
      // フォーマット：【シリーズ名】第X話 エピソード名
      const formattedEpisode = `【${category}】第${episodeNumber}話 ${episodeName}`
      categories[category].push(formattedEpisode)
    })

    console.log('✅ エピソードカテゴリ整理完了:', Object.keys(categories).length, 'カテゴリ')
    return categories
  }

  // 妖精データをカテゴリ別に整理（新規追加）
  const getFairyCategories = () => {
    if (fairiesData.length === 0) {
      console.warn('⚠️ 妖精データが空です')
      return {}
    }

    console.log('🧚 妖精カテゴリ整理開始:', fairiesData.length, '件')

    const categories = {}
    fairiesData.forEach(fairy => {
      const category = fairy.series_name || 'その他'
      
      if (!categories[category]) {
        categories[category] = []
      }
      
      categories[category].push(fairy.name)
    })

    // シリーズの放送順でソート
    const seriesOrder = {
      'ふたりはプリキュア': 1,
      'ふたりはプリキュア Max Heart': 2,
      'ふたりはプリキュア Splash Star': 3,
      'Yes!プリキュア5': 4,
      'Yes!プリキュア5GoGo!': 5,
      'フレッシュプリキュア!': 6,
      'ハートキャッチプリキュア!': 7,
      'スイートプリキュア♪': 8,
      'スマイルプリキュア!': 9,
      'ドキドキ!プリキュア': 10,
      'ハピネスチャージプリキュア!': 11,
      'Go!プリンセスプリキュア': 12,
      '魔法つかいプリキュア!': 13,
      'キラキラ☆プリキュアアラモード': 14,
      'HUGっと!プリキュア': 15,
      'スター☆トゥインクルプリキュア': 16,
      'ヒーリングっど♥プリキュア': 17,
      'トロピカル〜ジュ!プリキュア': 18,
      'デリシャスパーティ♡プリキュア': 19,
      'ひろがるスカイ!プリキュア': 20,
      'わんだふるぷりきゅあ!': 21
    }

    const sortedCategories = {}
    Object.keys(categories)
      .sort((a, b) => (seriesOrder[a] || 999) - (seriesOrder[b] || 999))
      .forEach(key => {
        sortedCategories[key] = categories[key]
      })

    console.log('✅ 妖精カテゴリ整理完了:', Object.keys(sortedCategories).length, 'カテゴリ')
    return sortedCategories
  }

  // === ダイアログ関連の関数 ===
  
  const openDialog = (type, selectedValues) => {
    setTempSelectedValues([...selectedValues])
    setDialogs(prev => ({ ...prev, [type]: true }))
    
    if (type === 'character') {
      const categories = getCharacterCategories()
      const initialOpenState = {}
      Object.keys(categories).forEach(categoryName => {
        initialOpenState[categoryName] = false
      })
      setOpenCategories(initialOpenState)
    } else if (type === 'episode') {
      const categories = getEpisodeCategories()
      const initialOpenState = {}
      Object.keys(categories).forEach(categoryName => {
        initialOpenState[categoryName] = false
      })
      setOpenCategories(initialOpenState)
    } else if (type === 'fairy') {
      // 妖精ダイアログの初期化
      const categories = getFairyCategories()
      const initialOpenState = {}
      Object.keys(categories).forEach(categoryName => {
        initialOpenState[categoryName] = false
      })
      setOpenCategories(initialOpenState)
    }
  }

  const closeDialog = (type) => {
    setDialogs(prev => ({ ...prev, [type]: false }))
    setTempSelectedValues([])
    setOpenCategories({})
  }

  const saveDialogSelection = (type, values) => {
    if (type === 'episode') {
      const processedValues = values.slice(0, 3)
      setFormData(prev => ({ ...prev, [`favorite_${type}`]: processedValues }))
    } else {
      setFormData(prev => ({ ...prev, [`favorite_${type}`]: values }))
    }
    closeDialog(type)
  }

  const saveWatchedSeriesSelection = (values) => {
    setFormData(prev => ({ ...prev, watched_series: values }))
    closeDialog('watchedSeries')
  }

  // components/Profile.jsx - 妖精追加版 Part 5: SelectionDialog コンポーネント

  // === 選択ダイアログコンポーネント ===
  const SelectionDialog = ({ 
    isOpen, 
    onClose, 
    title, 
    dataType, 
    selectedValues, 
    onSave 
  }) => {
    const toggleSelection = (value) => {
      setTempSelectedValues(prev => {
        if (prev.includes(value)) {
          return prev.filter(item => item !== value)
        } else {
          const maxCount = dataType === "episode" ? 3 : Infinity
          if (prev.length >= maxCount) {
            alert(`${dataType === "episode" ? "エピソード" : "項目"}は最大${maxCount}個まで選択できます`)
            return prev
          }
          
          if (dataType === "episode") {
            const episodeName = value.replace(/^【[^】]*】第\d+話\s*/, '')
            const hasDuplicate = prev.some(item => {
              const itemName = item.replace(/^【[^】]*】第\d+話\s*/, '')
              return itemName === episodeName
            })
            
            if (hasDuplicate) {
              return prev
            }
          }
          
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

    // getItemDetails関数（妖精対応版）
    const getItemDetails = (itemName) => {
      if (dataType === "character") {
        return charactersData.find(char => 
          char.precure_name === itemName || char.name === itemName
        )
      } else if (dataType === "movie") {
        return moviesData.find(movie => movie.title === itemName)
      } else if (dataType === "episode") {
        // エピソード名を抽出（【シリーズ名】第X話 エピソード名 から エピソード名 を取得）
        const episodeName = itemName.replace(/^【[^】]*】第\d+話\s*/, '')
        
        // より柔軟な検索
        return episodeTypesData.find(ep => {
          const epName = ep.name || ep.title || ep.episode_name || ''
          return epName === episodeName || 
                 epName.includes(episodeName) || 
                 episodeName.includes(epName)
        })
      } else if (dataType === "fairy") {
        // 妖精詳細情報の取得
        return fairiesData.find(fairy => fairy.name === itemName)
      } else if (dataType === "series") {
        return seriesData.find(s => s.name === itemName)
      }
      return null
    }

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
        'cream': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
        'brown': 'bg-amber-600 text-white',
        'aqua': 'bg-cyan-500 text-white',
        'rainbow': 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white',
        'multicolor': 'bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 text-white',
        'hamster': 'bg-orange-400 text-white'
      }
      return colorMap[color] || 'bg-gray-300 text-gray-800'
    }

    if (!isOpen) return null

    // データの準備
    let categories = {}
    if (dataType === "character") {
      categories = getCharacterCategories()
    } else if (dataType === "series") {
      categories = { "プリキュアシリーズ": seriesData.map(s => s.name) }
    } else if (dataType === "movie") {
      categories = { "映画": moviesData.map(m => m.title) }
    } else if (dataType === "episode") {
      categories = getEpisodeCategories()
    } else if (dataType === "fairy") {
      categories = getFairyCategories() // 妖精カテゴリ取得を追加
    } else if (dataType === "watchedSeries") {
      categories = { "視聴済みシリーズ": seriesData.map(s => s.name) }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{title}</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                  {tempSelectedValues.length}個選択中
                  {dataType === "episode" && (
                    <span className="ml-1">/ 最大3個</span>
                  )}
                </span>
                <button
                  onClick={handleCancel}
                  className="text-white hover:text-gray-200"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {Object.entries(categories).map(([categoryName, items]) => (
                <div key={categoryName} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleCategory(categoryName)}
                    className="w-full bg-gray-50 hover:bg-gray-100 p-4 flex justify-between items-center text-left transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-gray-800">{categoryName}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{items.length}個</span>
                      {openCategories[categoryName] ? 
                        <ChevronUp size={20} className="text-gray-500" /> : 
                        <ChevronDown size={20} className="text-gray-500" />
                      }
                    </div>
                  </button>
                  
                  {openCategories[categoryName] && (
                    <div className="p-4 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {items.map((item, index) => {
                          const isSelected = tempSelectedValues.includes(item)
                          const details = getItemDetails(item)
                          const isDisabled = dataType === "episode" && 
                            !isSelected && 
                            tempSelectedValues.length >= 3

                          return (
                            <label
                              key={index}
                              className={`
                                flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                                ${isSelected 
                                  ? 'border-pink-500 bg-pink-50' 
                                  : isDisabled 
                                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                    : 'border-gray-200 hover:border-pink-300 hover:bg-pink-25'
                                }
                              `}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => !isDisabled && toggleSelection(item)}
                                disabled={isDisabled}
                                className="mt-1 text-pink-500 rounded focus:ring-pink-500"
                              />
                              <div className="flex-1 min-w-0">
                                <div className={`font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-800'}`}>
                                  {item}
                                </div>
                                {details?.color && (
                                  <div className="mt-1">
                                    <span className={`px-2 py-1 rounded-full text-xs ${getColorStyle(details.color)}`}>
                                      {details.color}
                                    </span>
                                  </div>
                                )}
                                {details?.name && details.name !== item && (
                                  <div className={`text-xs mt-1 ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                                    本名: {details.name}
                                  </div>
                                )}
                                {details?.description && (
                                  <div className={`text-xs leading-relaxed mt-1 ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {details.description}
                                  </div>
                                )}
                                {details?.type && dataType === "fairy" && (
                                  <div className={`text-xs mt-1 ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                                    タイプ: {details.type}
                                  </div>
                                )}
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                選択中: {tempSelectedValues.length}個
                {dataType === "episode" && (
                  <span className="text-orange-600 ml-2">
                    (最大3個まで)
                  </span>
                )}
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

  // components/Profile.jsx - 妖精追加版 Part 6: プロフィール表示部分

  // === ソーシャルリンクアイコン表示関数 ===
  const platforms = [
    { 
      id: 'X (Twitter)', 
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: 'text-white',
      bgColor: 'bg-gray-800'
    },
    { 
      id: 'YouTube', 
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
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      color: 'text-white',
      bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    { 
      id: 'その他', 
      icon: <Globe className="w-4 h-4" />,
      color: 'text-white',
      bgColor: 'bg-gray-700'
    }
  ]

  // プラットフォームアイコン取得関数（背景色付き）
  const getPlatformIcon = (platformName) => {
    const platform = platforms.find(p => p.id === platformName)
    if (!platform) return (
      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
        <Globe className="w-4 h-4 text-white" />
      </div>
    )

    return (
      <div className={`w-8 h-8 rounded-full ${platform.bgColor} flex items-center justify-center hover:scale-110 transition-transform duration-200`}>
        <div className={platform.color}>
          {platform.icon}
        </div>
      </div>
    )
  }

  // === メインレンダー部分 ===
  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 p-6 text-white">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold flex items-center space-x-2">
              <Heart size={32} />
              <span>プロフィール詳細</span>
            </h1>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Edit size={16} />
                <span>編集</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {!editing ? (
            /* プロフィール表示モード */
            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="プロフィール画像"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 rounded-full flex items-center justify-center">
                      <User size={40} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {profile?.display_name || 'プリキュアファン'}
                    </h2>
                    
                    {/* ソーシャルリンク表示 - 修正版 */}
                    {profile?.social_links && Array.isArray(profile.social_links) && profile.social_links.length > 0 && (
                      <div className="flex items-center space-x-2">
                        {profile.social_links.map((link, index) => (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition-transform duration-200 hover:scale-110"
                            title={`${link.display_name || link.platform}で開く`}
                          >
                            {getPlatformIcon(link.platform)}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
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
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <Star className="text-green-500 mr-2" size={20} />
                      視聴済みシリーズ
                    </h3>
                    <div className="text-sm text-gray-700">
                      {profile?.all_series_watched ? (
                        <div className="font-medium text-green-600">
                          ✨ 全シリーズ視聴済み！
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {profile.watched_series.map((series, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs"
                            >
                              {series}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* お気に入り情報 */}
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Sparkles className="text-purple-500 mr-2" size={20} />
                    お気に入り
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* お気に入りキャラクター */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">💖 キャラクター</h4>
                      <div className="text-sm text-gray-700">
                        {Array.isArray(profile?.favorite_character) && profile.favorite_character.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {profile.favorite_character.map((character, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-pink-200 text-pink-800 rounded-full text-xs"
                              >
                                {character}
                              </span>
                            ))}
                          </div>
                        ) : '未設定'}
                      </div>
                    </div>

                    {/* お気に入りシリーズ */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">📺 シリーズ</h4>
                      <div className="text-sm text-gray-700">
                        {Array.isArray(profile?.favorite_series) && profile.favorite_series.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {profile.favorite_series.map((series, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-xs"
                              >
                                {series}
                              </span>
                            ))}
                          </div>
                        ) : '未設定'}
                      </div>
                    </div>

                    {/* お気に入り映画 */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">🎬 映画</h4>
                      <div className="text-sm text-gray-700">
                        {Array.isArray(profile?.favorite_movie) && profile.favorite_movie.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {profile.favorite_movie.map((movie, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs"
                              >
                                {movie}
                              </span>
                            ))}
                          </div>
                        ) : '未設定'}
                      </div>
                    </div>

                    {/* お気に入り妖精 - 新規追加 */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">🧚 妖精</h4>
                      <div className="text-sm text-gray-700">
                        {Array.isArray(profile?.favorite_fairy) && profile.favorite_fairy.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {profile.favorite_fairy.map((fairy, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-xs"
                              >
                                {fairy}
                              </span>
                            ))}
                          </div>
                        ) : '未設定'}
                      </div>
                    </div>

                    {/* お気に入りエピソード */}
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-gray-800 mb-2">✨ エピソード</h4>
                      <div className="text-sm text-gray-700">
                        {Array.isArray(profile?.favorite_episode) && profile.favorite_episode.length > 0 ? (
                          <div className="space-y-1">
                            {profile.favorite_episode.map((episode, index) => (
                              <div key={index} className="block">
                                <span className="inline-block px-3 py-2 bg-green-200 text-green-800 rounded-lg text-xs leading-relaxed w-full">
                                  {episode}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : '未設定'}
                      </div>
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

            // components/Profile.jsx - 妖精追加版 Part 7: 編集フォーム部分

            /* プロフィール編集モード */
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

                {/* ソーシャルリンク */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ソーシャルリンク
                  </label>
                  <SocialLinkManager
                    links={formData.social_links}
                    onLinksChange={handleSocialLinksUpdate}
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
                      placeholder="例: 25"
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
                      <option value="その他">その他</option>
                      <option value="回答しない">回答しない</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ファン歴（年）
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={formData.fan_years || ''}
                      onChange={(e) => setFormData({...formData, fan_years: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="例: 5"
                    />
                  </div>
                </div>

                {/* プリキュアの"ここ"が好き */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    プリキュアの"ここ"が好き
                  </label>
                  <textarea
                    value={formData.what_i_love || ''}
                    onChange={(e) => setFormData({...formData, what_i_love: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    rows="3"
                    placeholder="プリキュアのどこが好きか教えてください"
                  />
                </div>

                {/* 視聴済みシリーズ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    視聴済みシリーズ
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="all_series_watched"
                        checked={formData.all_series_watched || false}
                        onChange={(e) => setFormData({...formData, all_series_watched: e.target.checked})}
                        className="text-pink-500 rounded focus:ring-pink-500"
                      />
                      <label htmlFor="all_series_watched" className="text-sm text-gray-700">
                        全シリーズ視聴済み
                      </label>
                    </div>
                    
                    {!formData.all_series_watched && (
                      <div>
                        <button
                          type="button"
                          onClick={() => openDialog('watchedSeries', formData.watched_series)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        >
                          {Array.isArray(formData.watched_series) && formData.watched_series.length > 0
                            ? `${formData.watched_series.length}個のシリーズを選択中`
                            : 'シリーズを選択してください'
                          }
                        </button>
                        {Array.isArray(formData.watched_series) && formData.watched_series.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {formData.watched_series.map((series, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs"
                              >
                                {series}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* お気に入り選択セクション */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* お気に入りキャラクター */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      お気に入りキャラクター
                    </label>
                    <button
                      type="button"
                      onClick={() => openDialog('character', formData.favorite_character)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      {Array.isArray(formData.favorite_character) && formData.favorite_character.length > 0
                        ? `${formData.favorite_character.length}人のキャラクターを選択中`
                        : 'キャラクターを選択してください'
                      }
                    </button>
                    {Array.isArray(formData.favorite_character) && formData.favorite_character.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.favorite_character.map((character, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-pink-200 text-pink-800 rounded-full text-xs"
                          >
                            {character}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* お気に入りシリーズ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      お気に入りシリーズ
                    </label>
                    <button
                      type="button"
                      onClick={() => openDialog('series', formData.favorite_series)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      {Array.isArray(formData.favorite_series) && formData.favorite_series.length > 0
                        ? `${formData.favorite_series.length}個のシリーズを選択中`
                        : 'シリーズを選択してください'
                      }
                    </button>
                    {Array.isArray(formData.favorite_series) && formData.favorite_series.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.favorite_series.map((series, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs"
                          >
                            {series}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* お気に入り映画 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      お気に入り映画
                    </label>
                    <button
                      type="button"
                      onClick={() => openDialog('movie', formData.favorite_movie)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      {Array.isArray(formData.favorite_movie) && formData.favorite_movie.length > 0
                        ? `${formData.favorite_movie.length}本の映画を選択中`
                        : '映画を選択してください'
                      }
                    </button>
                    {Array.isArray(formData.favorite_movie) && formData.favorite_movie.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.favorite_movie.map((movie, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs"
                          >
                            {movie}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* お気に入り妖精 - 新規追加 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      お気に入り妖精
                    </label>
                    <button
                      type="button"
                      onClick={() => openDialog('fairy', formData.favorite_fairy)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      {Array.isArray(formData.favorite_fairy) && formData.favorite_fairy.length > 0
                        ? `${formData.favorite_fairy.length}体の妖精を選択中`
                        : '妖精を選択してください'
                      }
                    </button>
                    {Array.isArray(formData.favorite_fairy) && formData.favorite_fairy.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.favorite_fairy.map((fairy, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-purple-200 text-purple-800 rounded-full text-xs"
                          >
                            {fairy}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* お気に入りエピソード */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    お気に入りエピソード <span className="text-orange-600 text-xs">(最大3個)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => openDialog('episode', formData.favorite_episode)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    {Array.isArray(formData.favorite_episode) && formData.favorite_episode.length > 0
                      ? `${formData.favorite_episode.length}個のエピソードを選択中`
                      : 'エピソードを選択してください'
                    }
                  </button>
                  {Array.isArray(formData.favorite_episode) && formData.favorite_episode.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {formData.favorite_episode.map((episode, index) => (
                        <div key={index} className="block">
                          <span className="inline-block px-3 py-2 bg-green-200 text-green-800 rounded-lg text-xs leading-relaxed w-full">
                            {episode}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 趣味・主な活動 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    趣味・主な活動
                  </label>
                  <textarea
                    value={formData.hobbies || ''}
                    onChange={(e) => setFormData({...formData, hobbies: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    rows="3"
                    placeholder="プリキュア以外の趣味や活動があれば教えてください"
                  />
                </div>

                {/* フリー欄 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    フリー欄
                  </label>
                  <textarea
                    value={formData.free_text || ''}
                    onChange={(e) => setFormData({...formData, free_text: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    rows="4"
                    placeholder="自由にメッセージを書いてください"
                  />
                </div>

                {/* 保存ボタン */}
                <div className="pt-4">
                  <button
                    onClick={updateProfile}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 px-6 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>更新中...</span>
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        <span>プロフィールを保存</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 選択ダイアログ */}
      <SelectionDialog
        isOpen={dialogs.character}
        onClose={() => closeDialog('character')}
        title="お気に入りキャラクターを選択"
        dataType="character"
        selectedValues={formData.favorite_character}
        onSave={(values) => saveDialogSelection('character', values)}
      />

      <SelectionDialog
        isOpen={dialogs.series}
        onClose={() => closeDialog('series')}
        title="お気に入りシリーズを選択"
        dataType="series"
        selectedValues={formData.favorite_series}
        onSave={(values) => saveDialogSelection('series', values)}
      />

      <SelectionDialog
        isOpen={dialogs.movie}
        onClose={() => closeDialog('movie')}
        title="お気に入り映画を選択"
        dataType="movie"
        selectedValues={formData.favorite_movie}
        onSave={(values) => saveDialogSelection('movie', values)}
      />

      <SelectionDialog
        isOpen={dialogs.episode}
        onClose={() => closeDialog('episode')}
        title="お気に入りエピソードを選択（最大3個）"
        dataType="episode"
        selectedValues={formData.favorite_episode}
        onSave={(values) => saveDialogSelection('episode', values)}
      />

      {/* 妖精ダイアログ - 新規追加 */}
      <SelectionDialog
        isOpen={dialogs.fairy}
        onClose={() => closeDialog('fairy')}
        title="お気に入り妖精を選択"
        dataType="fairy"
        selectedValues={formData.favorite_fairy}
        onSave={(values) => saveDialogSelection('fairy', values)}
      />

      <SelectionDialog
        isOpen={dialogs.watchedSeries}
        onClose={() => closeDialog('watchedSeries')}
        title="視聴済みシリーズを選択"
        dataType="watchedSeries"
        selectedValues={formData.watched_series}
        onSave={saveWatchedSeriesSelection}
      />

      {/* デバッグ機能（開発時のみ表示） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">🔧 開発者向けデバッグ</h4>
          <div className="flex flex-wrap space-x-2 space-y-2">
            <button
              onClick={debugProfileData}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              プロフィールデータ確認
            </button>
            <button
              onClick={() => console.log('妖精データ:', fairiesData)}
              className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
            >
              妖精データ確認
            </button>
            <button
              onClick={() => console.log('フォームデータ:', formData)}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              フォームデータ確認
            </button>
            <button
              onClick={() => console.log('プロフィール:', profile)}
              className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
            >
              プロフィール確認
            </button>
            <button
              onClick={() => {
                console.log('妖精カテゴリ:', getFairyCategories())
                console.log('妖精データ詳細:', fairiesData.slice(0, 3))
              }}
              className="px-3 py-1 bg-pink-500 text-white rounded text-sm hover:bg-pink-600"
            >
              妖精カテゴリ確認
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            <p>データ件数: シリーズ{seriesData.length}件 | キャラクター{charactersData.length}件 | 映画{moviesData.length}件 | エピソード{episodeTypesData.length}件 | 妖精{fairiesData.length}件</p>
          </div>
        </div>
      )}
    </div>
  )
}

// === 開発時のヘルパー関数 ===
// グローバルスコープでデバッグ関数を利用可能にする（開発時のみ）
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.debugProfile = {
    checkProfileData: () => {
      console.log('🔍 プロフィールデータの状態確認')
      // この関数は開発時にブラウザコンソールから呼び出し可能
    },
    checkFairyData: () => {
      console.log('🧚 妖精データの状態確認')
      // 妖精データのデバッグ用
    },
    checkDatabase: async () => {
      console.log('🔍 データベース接続確認')
      try {
        // precure_fairies テーブルの確認
        const { data: fairyData, error: fairyError } = await supabase
          .from('precure_fairies')
          .select('count(*)')
          .single()
        
        if (fairyError) {
          console.error('❌ 妖精テーブルエラー:', fairyError)
        } else {
          console.log('✅ 妖精テーブル接続OK, 妖精数:', fairyData.count)
        }

        // その他のテーブルも確認
        const { data: episodeData, error: episodeError } = await supabase
          .from('precure_episodes')
          .select('count(*)')
          .single()
        
        if (episodeError) {
          console.error('❌ エピソードテーブルエラー:', episodeError)
        } else {
          console.log('✅ エピソードテーブル接続OK, エピソード数:', episodeData.count)
        }
        
      } catch (error) {
        console.error('❌ 接続テストエラー:', error)
      }
    },
    testFairyCategories: () => {
      console.log('🧚 妖精カテゴリテスト')
      // カテゴリ整理のテスト用
    }
  }
}