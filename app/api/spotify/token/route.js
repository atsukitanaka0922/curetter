// app/api/spotify/token/route.js - Client Credentials Flow for Spotify API access
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🔑 Getting Spotify access token via Client Credentials Flow...')
    
    const client_id = process.env.SPOTIFY_CLIENT_ID
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET
    
    if (!client_id || !client_secret) {
      throw new Error('Spotify credentials not configured')
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Spotify token error:', error)
      throw new Error(`Failed to get Spotify token: ${error.error_description || error.error}`)
    }

    const data = await response.json()
    console.log('✅ Spotify token obtained successfully')
    
    return NextResponse.json({
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in
    })
    
  } catch (error) {
    console.error('❌ Spotify token API error:', error)
    return NextResponse.json(
      { 
        error: 'Spotifyトークンの取得に失敗しました', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}