// lib/spotify.js
class SpotifyAPI {
  constructor(accessToken) {
    this.accessToken = accessToken
    this.baseURL = 'https://api.spotify.com/v1'
  }

  async fetch(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Spotify API Error: ${error.error?.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Spotify API Request Error:', error)
      throw error
    }
  }

  // プリキュア関連キーワード
  getPrecureKeywords() {
    return [
      'プリキュア', 'PreCure', 'Pretty Cure',
      'ふたりはプリキュア', 'Max Heart', 'Splash Star',
      'Yes!プリキュア5', 'フレッシュプリキュア', 'ハートキャッチプリキュア',
      'スイートプリキュア', 'スマイルプリキュア', 'ドキドキ!プリキュア',
      'ハピネスチャージプリキュア', 'Go!プリンセスプリキュア', '魔法つかいプリキュア',
      'キラキラ☆プリキュアアラモード', 'HUGっと!プリキュア', 'スター☆トゥインクルプリキュア',
      'ヒーリングっど♥プリキュア', 'トロピカル〜ジュ!プリキュア', 'デリシャスパーティ♡プリキュア',
      'ひろがるスカイ!プリキュア', 'わんだふるぷりきゅあ!'
    ]
  }

  // プリキュア楽曲を検索
  async searchPrecureTracks(query, limit = 20) {
    try {
      const searchQuery = encodeURIComponent(query)
      const response = await this.fetch(`/search?q=${searchQuery}&type=track&limit=${limit}&market=JP`)
      
      // プリキュア関連楽曲をフィルタリング
      const precureKeywords = this.getPrecureKeywords()
      const filteredTracks = response.tracks.items.filter(track => {
        const trackName = track.name.toLowerCase()
        const artistNames = track.artists.map(artist => artist.name.toLowerCase()).join(' ')
        const albumName = track.album.name.toLowerCase()
        
        return precureKeywords.some(keyword => 
          trackName.includes(keyword.toLowerCase()) ||
          artistNames.includes(keyword.toLowerCase()) ||
          albumName.includes(keyword.toLowerCase())
        )
      })

      return {
        tracks: {
          items: filteredTracks,
          total: filteredTracks.length
        }
      }
    } catch (error) {
      console.error('プリキュア楽曲検索エラー:', error)
      throw error
    }
  }

  // ユーザー情報を取得
  async getCurrentUser() {
    return await this.fetch('/me')
  }

  // ユーザーのプレイリスト一覧を取得
  async getUserPlaylists(limit = 50) {
    return await this.fetch(`/me/playlists?limit=${limit}`)
  }

  // プレイリストを作成
  async createPlaylist(userId, name, description, isPublic = true) {
    return await this.fetch(`/users/${userId}/playlists`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        public: isPublic
      })
    })
  }

  // プレイリストに楽曲を追加
  async addTracksToPlaylist(playlistId, trackUris) {
    return await this.fetch(`/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({
        uris: trackUris
      })
    })
  }

  // プレイリストから楽曲を削除
  async removeTracksFromPlaylist(playlistId, trackUris) {
    return await this.fetch(`/playlists/${playlistId}/tracks`, {
      method: 'DELETE',
      body: JSON.stringify({
        tracks: trackUris.map(uri => ({ uri }))
      })
    })
  }

  // プレイリストの詳細を取得
  async getPlaylist(playlistId) {
    return await this.fetch(`/playlists/${playlistId}`)
  }

  // プレイリストの楽曲一覧を取得
  async getPlaylistTracks(playlistId, limit = 100) {
    return await this.fetch(`/playlists/${playlistId}/tracks?limit=${limit}`)
  }

  // プレイリストを更新
  async updatePlaylist(playlistId, name, description, isPublic) {
    return await this.fetch(`/playlists/${playlistId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name,
        description,
        public: isPublic
      })
    })
  }

  // プレイリストを削除（フォローを解除）
  async unfollowPlaylist(playlistId) {
    return await this.fetch(`/playlists/${playlistId}/followers`, {
      method: 'DELETE'
    })
  }

  // 楽曲の詳細情報を取得
  async getTrack(trackId) {
    return await this.fetch(`/tracks/${trackId}`)
  }

  // 複数楽曲の詳細情報を取得
  async getTracks(trackIds) {
    const ids = trackIds.join(',')
    return await this.fetch(`/tracks?ids=${ids}`)
  }

  // アーティスト情報を取得
  async getArtist(artistId) {
    return await this.fetch(`/artists/${artistId}`)
  }

  // アルバム情報を取得
  async getAlbum(albumId) {
    return await this.fetch(`/albums/${albumId}`)
  }
}

export default SpotifyAPI