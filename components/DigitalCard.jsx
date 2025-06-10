// components/DigitalCard.jsx - プリキュア作品別テンプレート対応版
'use client'

import { useState, useEffect, useRef } from 'react'
import { Heart, Star, Sparkles, Share, Edit, Save, X, QrCode, Copy, Check, Move, ZoomIn, ZoomOut, Crop, RotateCcw } from 'lucide-react'
import { supabase } from '../app/page'

export default function DigitalCard({ session, profile }) {
  // 状態管理
  const [cardData, setCardData] = useState({
    name: 'プリキュアファン',
    favoriteCharacter: '未設定',
    backgroundType: 'template',
    backgroundImage: '',
    templateId: 'max_heart',
    profileUrl: '',
    imageSettings: {
      scale: 1,
      positionX: 50,
      positionY: 50,
      opacity: 0.3,
      rotation: 0
    },
    useImageEffect: true,
    customTextColor: null,
    customAccentColor: null
  })
  
  const [images, setImages] = useState([])
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  
  // 画像編集モーダルの状態
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [selectedImageForEdit, setSelectedImageForEdit] = useState(null)
  const [tempImageSettings, setTempImageSettings] = useState({
    scale: 1,
    positionX: 50,
    positionY: 50,
    opacity: 0.3,
    rotation: 0
  })
  
  // ドラッグ関連
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  const cardRef = useRef(null)
  const imageEditorRef = useRef(null)

  // 装飾パターンのSVG定義
  const decorativePatterns = {
    hearts: (
      <defs>
        <pattern id="hearts" patternUnits="userSpaceOnUse" width="60" height="60">
          <path d="M30,45 C25,35 15,35 15,25 C15,20 20,15 25,15 C27,15 29,16 30,18 C31,16 33,15 35,15 C40,15 45,20 45,25 C45,35 35,35 30,45 Z" 
                fill="currentColor" opacity="0.15"/>
        </pattern>
      </defs>
    ),
    
    stars: (
      <defs>
        <pattern id="stars" patternUnits="userSpaceOnUse" width="80" height="80">
          <polygon points="40,10 45,25 60,25 48,35 53,50 40,42 27,50 32,35 20,25 35,25" 
                   fill="currentColor" opacity="0.2"/>
        </pattern>
      </defs>
    ),
    
    butterflies_roses: (
      <defs>
        <pattern id="butterflies_roses" patternUnits="userSpaceOnUse" width="100" height="100">
          <g transform="translate(25,25)" opacity="0.25">
            <ellipse cx="0" cy="-5" rx="8" ry="12" fill="currentColor"/>
            <ellipse cx="0" cy="5" rx="6" ry="10" fill="currentColor"/>
            <ellipse cx="0" cy="-5" rx="8" ry="12" fill="currentColor" transform="scale(-1,1)"/>
            <ellipse cx="0" cy="5" rx="6" ry="10" fill="currentColor" transform="scale(-1,1)"/>
          </g>
          <g transform="translate(75,75)" opacity="0.25">
            <circle cx="0" cy="0" r="3" fill="currentColor"/>
            <circle cx="0" cy="0" r="6" fill="none" stroke="currentColor" strokeWidth="1"/>
            <circle cx="0" cy="0" r="9" fill="none" stroke="currentColor" strokeWidth="1"/>
          </g>
        </pattern>
      </defs>
    ),
    
    fruits: (
      <defs>
        <pattern id="fruits" patternUnits="userSpaceOnUse" width="90" height="90">
          <g transform="translate(20,20)" opacity="0.2">
            <circle cx="0" cy="2" r="12" fill="currentColor"/>
            <rect x="-1" y="-8" width="2" height="6" fill="currentColor"/>
          </g>
          <g transform="translate(70,70)" opacity="0.2">
            <circle cx="0" cy="0" r="10" fill="currentColor"/>
            <circle cx="0" cy="0" r="6" fill="none" stroke="currentColor" strokeWidth="2"/>
          </g>
        </pattern>
      </defs>
    ),
    
    flowers: (
      <defs>
        <pattern id="flowers" patternUnits="userSpaceOnUse" width="70" height="70">
          <g transform="translate(35,35)" opacity="0.25">
            <g transform="rotate(0)"><ellipse cx="0" cy="-8" rx="4" ry="8" fill="currentColor"/></g>
            <g transform="rotate(72)"><ellipse cx="0" cy="-8" rx="4" ry="8" fill="currentColor"/></g>
            <g transform="rotate(144)"><ellipse cx="0" cy="-8" rx="4" ry="8" fill="currentColor"/></g>
            <g transform="rotate(216)"><ellipse cx="0" cy="-8" rx="4" ry="8" fill="currentColor"/></g>
            <g transform="rotate(288)"><ellipse cx="0" cy="-8" rx="4" ry="8" fill="currentColor"/></g>
            <circle cx="0" cy="0" r="3" fill="currentColor"/>
          </g>
        </pattern>
      </defs>
    ),
    
    music_notes: (
      <defs>
        <pattern id="music_notes" patternUnits="userSpaceOnUse" width="80" height="80">
          <g transform="translate(20,40)" opacity="0.2">
            <circle cx="0" cy="0" r="4" fill="currentColor"/>
            <rect x="3" y="-15" width="2" height="15" fill="currentColor"/>
          </g>
          <g transform="translate(60,40)" opacity="0.2">
            <path d="M0,0 Q5,-10 0,-20 Q-5,-15 0,-10 Q3,-5 0,0 Q-3,5 0,10" 
                  fill="none" stroke="currentColor" strokeWidth="2"/>
          </g>
        </pattern>
      </defs>
    ),

    picture_book: (
      <defs>
        <pattern id="picture_book" patternUnits="userSpaceOnUse" width="100" height="100">
          <g transform="translate(25,25)" opacity="0.25">
            <rect x="-15" y="-10" width="30" height="20" fill="none" stroke="currentColor" strokeWidth="2" rx="2"/>
            <line x1="-10" y1="-5" x2="10" y2="-5" stroke="currentColor" strokeWidth="1"/>
            <line x1="-10" y1="0" x2="10" y2="0" stroke="currentColor" strokeWidth="1"/>
            <line x1="-10" y1="5" x2="5" y2="5" stroke="currentColor" strokeWidth="1"/>
          </g>
          <g transform="translate(75,75)" opacity="0.2">
            <polygon points="0,-8 6,0 0,8 -6,0" fill="currentColor"/>
          </g>
        </pattern>
      </defs>
    ),

    love_hearts: (
      <defs>
        <pattern id="love_hearts" patternUnits="userSpaceOnUse" width="80" height="80">
          <g transform="translate(20,25)" opacity="0.3">
            <path d="M0,8 C-3,0 -10,0 -10,6 C-10,12 0,18 0,18 C0,18 10,12 10,6 C10,0 3,0 0,8 Z" 
                  fill="currentColor"/>
          </g>
          <g transform="translate(60,55)" opacity="0.25">
            <path d="M0,6 C-2,0 -7,0 -7,4 C-7,8 0,12 0,12 C0,12 7,8 7,4 C7,0 2,0 0,6 Z" 
                  fill="currentColor"/>
          </g>
        </pattern>
      </defs>
    ),

    center_heart: (
      <defs>
        <pattern id="center_heart" patternUnits="userSpaceOnUse" width="120" height="120">
          <g transform="translate(60,60)" opacity="0.4">
            <path d="M0,15 C-6,0 -20,0 -20,12 C-20,24 0,36 0,36 C0,36 20,24 20,12 C20,0 6,0 0,15 Z" 
                  fill="currentColor"/>
          </g>
          <g transform="translate(20,20)" opacity="0.2">
            <circle cx="0" cy="0" r="3" fill="currentColor"/>
          </g>
          <g transform="translate(100,100)" opacity="0.2">
            <circle cx="0" cy="0" r="3" fill="currentColor"/>
          </g>
        </pattern>
      </defs>
    ),

    lace_pattern: (
      <defs>
        <pattern id="lace_pattern" patternUnits="userSpaceOnUse" width="60" height="60">
          <g transform="translate(30,30)" opacity="0.25">
            <circle cx="0" cy="0" r="8" fill="none" stroke="currentColor" strokeWidth="1"/>
            <circle cx="0" cy="0" r="4" fill="none" stroke="currentColor" strokeWidth="1"/>
            <g transform="rotate(0)"><circle cx="0" cy="-12" r="2" fill="currentColor"/></g>
            <g transform="rotate(60)"><circle cx="0" cy="-12" r="2" fill="currentColor"/></g>
            <g transform="rotate(120)"><circle cx="0" cy="-12" r="2" fill="currentColor"/></g>
            <g transform="rotate(180)"><circle cx="0" cy="-12" r="2" fill="currentColor"/></g>
            <g transform="rotate(240)"><circle cx="0" cy="-12" r="2" fill="currentColor"/></g>
            <g transform="rotate(300)"><circle cx="0" cy="-12" r="2" fill="currentColor"/></g>
          </g>
        </pattern>
      </defs>
    ),

    magic_elements: (
      <defs>
        <pattern id="magic_elements" patternUnits="userSpaceOnUse" width="90" height="90">
          <g transform="translate(25,25)" opacity="0.3">
            <polygon points="0,-10 3,-3 10,-3 5,2 7,9 0,5 -7,9 -5,2 -10,-3 -3,-3" fill="currentColor"/>
          </g>
          <g transform="translate(65,65)" opacity="0.25">
            <circle cx="0" cy="0" r="6" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M0,-8 L0,8 M-8,0 L8,0" stroke="currentColor" strokeWidth="1"/>
          </g>
          <g transform="translate(45,75)" opacity="0.2">
            <path d="M0,0 Q3,-6 6,0 Q3,6 0,0" fill="currentColor"/>
          </g>
        </pattern>
      </defs>
    ),

    sweets_pattern: (
      <defs>
        <pattern id="sweets_pattern" patternUnits="userSpaceOnUse" width="100" height="100">
          <g transform="translate(25,25)" opacity="0.25">
            <ellipse cx="0" cy="-5" rx="8" ry="12" fill="currentColor"/>
            <circle cx="0" cy="-15" r="6" fill="currentColor"/>
            <circle cx="-3" cy="-18" r="2" fill="none" stroke="currentColor" strokeWidth="1"/>
            <circle cx="3" cy="-12" r="2" fill="none" stroke="currentColor" strokeWidth="1"/>
          </g>
          <g transform="translate(75,75)" opacity="0.2">
            <circle cx="0" cy="0" r="8" fill="currentColor"/>
            <circle cx="0" cy="0" r="5" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M-6,-2 Q0,4 6,-2" stroke="currentColor" strokeWidth="1" fill="none"/>
          </g>
        </pattern>
      </defs>
    ),

    hug_hearts: (
      <defs>
        <pattern id="hug_hearts" patternUnits="userSpaceOnUse" width="90" height="90">
          <g transform="translate(30,30)" opacity="0.3">
            <path d="M0,12 C-4,2 -12,2 -12,8 C-12,14 0,22 0,22 C0,22 12,14 12,8 C12,2 4,2 0,12 Z" 
                  fill="currentColor"/>
            <circle cx="0" cy="12" r="2" fill="rgba(255,255,255,0.8)"/>
          </g>
          <g transform="translate(70,60)" opacity="0.25">
            <path d="M0,8 C-3,0 -8,0 -8,5 C-8,10 0,15 0,15 C0,15 8,10 8,5 C8,0 3,0 0,8 Z" 
                  fill="currentColor"/>
          </g>
        </pattern>
      </defs>
    ),

    cosmic_stars: (
      <defs>
        <pattern id="cosmic_stars" patternUnits="userSpaceOnUse" width="120" height="120">
          <g transform="translate(30,30)" opacity="0.4">
            <polygon points="0,-12 4,-4 12,-4 6,2 8,10 0,6 -8,10 -6,2 -12,-4 -4,-4" fill="currentColor"/>
            <circle cx="0" cy="0" r="2" fill="rgba(255,255,255,0.9)"/>
          </g>
          <g transform="translate(90,60)" opacity="0.3">
            <polygon points="0,-8 2,-2 8,-2 4,1 5,7 0,4 -5,7 -4,1 -8,-2 -2,-2" fill="currentColor"/>
          </g>
          <g transform="translate(60,90)" opacity="0.2">
            <circle cx="0" cy="0" r="3" fill="currentColor"/>
            <circle cx="0" cy="0" r="1" fill="rgba(255,255,255,0.8)"/>
          </g>
        </pattern>
      </defs>
    ),

    healing_elements: (
      <defs>
        <pattern id="healing_elements" patternUnits="userSpaceOnUse" width="100" height="100">
          <g transform="translate(25,25)" opacity="0.25">
            <circle cx="0" cy="0" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M0,-6 L0,6 M-6,0 L6,0" stroke="currentColor" strokeWidth="3"/>
            <circle cx="0" cy="0" r="3" fill="currentColor"/>
          </g>
          <g transform="translate(75,75)" opacity="0.2">
            <path d="M0,0 L-6,-10 Q0,-15 6,-10 L0,0 Q-4,8 0,12 Q4,8 0,0" fill="currentColor"/>
          </g>
          <g transform="translate(50,75)" opacity="0.15">
            <circle cx="0" cy="0" r="4" fill="currentColor"/>
            <circle cx="0" cy="0" r="7" fill="none" stroke="currentColor" strokeWidth="1"/>
          </g>
        </pattern>
      </defs>
    ),

    tropical_summer: (
      <defs>
        <pattern id="tropical_summer" patternUnits="userSpaceOnUse" width="110" height="110">
          <g transform="translate(25,25)" opacity="0.3">
            <circle cx="0" cy="0" r="10" fill="currentColor"/>
            <g transform="rotate(0)"><ellipse cx="0" cy="-15" rx="3" ry="10" fill="currentColor"/></g>
            <g transform="rotate(45)"><ellipse cx="0" cy="-15" rx="3" ry="10" fill="currentColor"/></g>
            <g transform="rotate(90)"><ellipse cx="0" cy="-15" rx="3" ry="10" fill="currentColor"/></g>
            <g transform="rotate(135)"><ellipse cx="0" cy="-15" rx="3" ry="10" fill="currentColor"/></g>
            <g transform="rotate(180)"><ellipse cx="0" cy="-15" rx="3" ry="10" fill="currentColor"/></g>
            <g transform="rotate(225)"><ellipse cx="0" cy="-15" rx="3" ry="10" fill="currentColor"/></g>
            <g transform="rotate(270)"><ellipse cx="0" cy="-15" rx="3" ry="10" fill="currentColor"/></g>
            <g transform="rotate(315)"><ellipse cx="0" cy="-15" rx="3" ry="10" fill="currentColor"/></g>
          </g>
          <g transform="translate(85,85)" opacity="0.2">
            <path d="M0,0 Q-8,-6 -12,0 Q-8,6 0,0 Q8,-6 12,0 Q8,6 0,0" fill="currentColor"/>
          </g>
        </pattern>
      </defs>
    ),

    food_elements: (
      <defs>
        <pattern id="food_elements" patternUnits="userSpaceOnUse" width="90" height="90">
          <g transform="translate(25,25)" opacity="0.25">
            <ellipse cx="0" cy="2" rx="10" ry="6" fill="currentColor"/>
            <rect x="-8" y="-6" width="16" height="8" rx="2" fill="currentColor"/>
            <circle cx="-3" cy="-2" r="1" fill="rgba(255,255,255,0.8)"/>
            <circle cx="3" cy="-2" r="1" fill="rgba(255,255,255,0.8)"/>
          </g>
          <g transform="translate(65,65)" opacity="0.2">
            <circle cx="0" cy="0" r="8" fill="currentColor"/>
            <rect x="-2" y="-8" width="4" height="16" fill="rgba(255,255,255,0.8)"/>
            <rect x="-8" y="-2" width="16" height="4" fill="rgba(255,255,255,0.8)"/>
          </g>
        </pattern>
      </defs>
    ),

    sky_clouds: (
      <defs>
        <pattern id="sky_clouds" patternUnits="userSpaceOnUse" width="120" height="120">
          <g transform="translate(30,30)" opacity="0.3">
            <path d="M-15,0 Q-15,-8 -8,-8 Q-3,-12 3,-8 Q8,-10 12,-6 Q15,-2 12,2 Q8,4 3,2 Q-3,4 -8,2 Q-15,4 -15,0" 
                  fill="currentColor"/>
          </g>
          <g transform="translate(90,70)" opacity="0.2">
            <path d="M-10,0 Q-10,-6 -5,-6 Q-2,-8 2,-6 Q6,-7 8,-4 Q10,-1 8,1 Q6,3 2,1 Q-2,3 -5,1 Q-10,3 -10,0" 
                  fill="currentColor"/>
          </g>
          <g transform="translate(60,90)" opacity="0.15">
            <circle cx="0" cy="0" r="3" fill="currentColor"/>
            <circle cx="5" cy="-2" r="2" fill="currentColor"/>
            <circle cx="-4" cy="-1" r="2" fill="currentColor"/>
          </g>
        </pattern>
      </defs>
    ),

    animal_paws: (
      <defs>
        <pattern id="animal_paws" patternUnits="userSpaceOnUse" width="80" height="80">
          <g transform="translate(25,25)" opacity="0.25">
            <ellipse cx="0" cy="3" rx="6" ry="8" fill="currentColor"/>
            <circle cx="-4" cy="-6" r="3" fill="currentColor"/>
            <circle cx="0" cy="-8" r="3" fill="currentColor"/>
            <circle cx="4" cy="-6" r="3" fill="currentColor"/>
            <circle cx="6" cy="-2" r="2" fill="currentColor"/>
          </g>
          <g transform="translate(60,60)" opacity="0.2">
            <circle cx="0" cy="0" r="4" fill="currentColor"/>
            <circle cx="-3" cy="-5" r="2" fill="currentColor"/>
            <circle cx="3" cy="-5" r="2" fill="currentColor"/>
            <circle cx="0" cy="-7" r="2" fill="currentColor"/>
          </g>
        </pattern>
      </defs>
    )
  }

  // プリキュア作品別テンプレート（新版）
  const cardTemplates = {
    // ふたりはプリキュア MaxHeart
    max_heart: {
      name: 'ふたりはプリキュア MaxHeart',
      background: `linear-gradient(135deg, 
        #ff69b4 0%,    /* ピンク */
        #000000 25%,   /* 黒 */
        #ffd700 50%,   /* 黄色 */
        #ffffff 75%,   /* 白 */
        #ff1493 100%   /* 濃いピンク */
      )`,
      textColor: '#ffffff',
      accentColor: '#ffd700',
      decorativeElements: {
        pattern: 'hearts',
        opacity: 0.15
      }
    },

    // ふたりはプリキュア SplashStar
    splash_star: {
      name: 'ふたりはプリキュア SplashStar',
      background: `conic-gradient(
        from 0deg at 50% 50%,
        #ff8c42 0deg 90deg,     /* 橙 */
        #faf0e6 90deg 180deg,   /* 乳白色 */
        #9acd32 180deg 270deg,  /* 黄緑 */
        #87ceeb 270deg 360deg   /* 水色 */
      )`,
      textColor: '#2c3e50',
      accentColor: '#ff8c42',
      decorativeElements: {
        pattern: 'stars',
        opacity: 0.2
      }
    },

    // Yes！プリキュア5 GoGo
    yes_precure5_gogo: {
      name: 'Yes！プリキュア5 GoGo',
      background: `radial-gradient(circle at 30% 20%, 
        rgba(50, 205, 50, 0.8) 0%, transparent 50%),
      radial-gradient(circle at 80% 30%, 
        rgba(220, 20, 60, 0.8) 0%, transparent 50%),
      radial-gradient(circle at 20% 80%, 
        rgba(255, 182, 193, 0.8) 0%, transparent 50%),
      radial-gradient(circle at 70% 70%, 
        rgba(138, 43, 226, 0.8) 0%, transparent 50%),
      radial-gradient(circle at 40% 60%, 
        rgba(255, 215, 0, 0.8) 0%, transparent 50%),
      linear-gradient(135deg, 
        #4169e1 0%, #dda0dd 100%)`,
      textColor: '#ffffff',
      accentColor: '#ffd700',
      decorativeElements: {
        pattern: 'butterflies_roses',
        opacity: 0.25
      }
    },

    // フレッシュプリキュア！
    fresh_precure: {
      name: 'フレッシュプリキュア！',
      background: `linear-gradient(45deg, 
        #4682b4 0%,      /* 青 */
        #ff69b4 25%,     /* 桃 */
        #ffd700 50%,     /* 黄 */
        #dc143c 75%,     /* 赤 */
        #4682b4 100%     /* 青に戻る */
      ),
      radial-gradient(circle at 20% 30%, 
        rgba(255, 165, 0, 0.3) 0%, transparent 40%),
      radial-gradient(circle at 80% 70%, 
        rgba(255, 192, 203, 0.3) 0%, transparent 40%)`,
      textColor: '#ffffff',
      accentColor: '#ffd700',
      decorativeElements: {
        pattern: 'fruits',
        opacity: 0.2
      }
    },

    // ハートキャッチプリキュア！
    heartcatch_precure: {
      name: 'ハートキャッチプリキュア！',
      background: `radial-gradient(ellipse at 25% 25%, 
        rgba(255, 182, 193, 0.9) 0%, transparent 60%),
      radial-gradient(ellipse at 75% 30%, 
        rgba(135, 206, 235, 0.9) 0%, transparent 60%),
      radial-gradient(ellipse at 30% 75%, 
        rgba(255, 255, 0, 0.7) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 80%, 
        rgba(221, 160, 221, 0.9) 0%, transparent 60%),
      linear-gradient(135deg, 
        #ff69b4 0%, #87ceeb 50%, #dda0dd 100%)`,
      textColor: '#2c3e50',
      accentColor: '#ff1493',
      decorativeElements: {
        pattern: 'flowers',
        opacity: 0.25
      }
    },

    // スイートプリキュア♪
    suite_precure: {
      name: 'スイートプリキュア♪',
      background: `linear-gradient(0deg, 
        #ff69b4 0%,      /* 桃 */
        #ffffff 25%,     /* 白 */
        #4169e1 50%,     /* 青 */
        #ffd700 75%,     /* 黄 */
        #ff69b4 100%     /* 桃に戻る */
      ),
      repeating-linear-gradient(45deg,
        transparent 0px, transparent 10px,
        rgba(255, 255, 255, 0.1) 10px, rgba(255, 255, 255, 0.1) 20px
      )`,
      textColor: '#2c3e50',
      accentColor: '#ff1493',
      decorativeElements: {
        pattern: 'music_notes',
        opacity: 0.2
      }
    },

    // スマイルプリキュア!
    smile_precure: {
      name: 'スマイルプリキュア!',
      background: `linear-gradient(45deg,
        #4169e1 0%,      /* 青 */
        #ffd700 20%,     /* 黄 */
        #ff69b4 40%,     /* 桃 */
        #dc143c 60%,     /* 赤 */
        #32cd32 80%,     /* 緑 */
        #4169e1 100%     /* 青に戻る */
      ),
      radial-gradient(circle at 20% 30%, 
        rgba(255, 255, 255, 0.4) 0%, transparent 30%),
      radial-gradient(circle at 80% 70%, 
        rgba(255, 255, 255, 0.3) 0%, transparent 25%)`,
      textColor: '#2c3e50',
      accentColor: '#ffd700',
      decorativeElements: {
        pattern: 'picture_book',
        opacity: 0.25
      }
    },

    // ドキドキ!プリキュア
    dokidoki_precure: {
      name: 'ドキドキ!プリキュア',
      background: `radial-gradient(circle at 50% 20%, 
        rgba(255, 215, 0, 0.9) 0%, transparent 40%),
      radial-gradient(circle at 20% 60%, 
        rgba(138, 43, 226, 0.8) 0%, transparent 45%),
      radial-gradient(circle at 80% 60%, 
        rgba(255, 182, 193, 0.9) 0%, transparent 45%),
      radial-gradient(circle at 30% 80%, 
        rgba(70, 130, 180, 0.8) 0%, transparent 40%),
      radial-gradient(circle at 70% 20%, 
        rgba(220, 20, 60, 0.8) 0%, transparent 40%),
      linear-gradient(135deg, 
        #ff1493 0%, #dda0dd 50%, #ff69b4 100%)`,
      textColor: '#ffffff',
      accentColor: '#ffd700',
      decorativeElements: {
        pattern: 'love_hearts',
        opacity: 0.3
      }
    },

    // ハピネスチャージプリキュア!
    happiness_charge_precure: {
      name: 'ハピネスチャージプリキュア!',
      background: `conic-gradient(
        from 0deg at 50% 50%,
        #ff69b4 0deg 90deg,     /* 桃 */
        #4169e1 90deg 180deg,   /* 青 */
        #ffd700 180deg 270deg,  /* 黄 */
        #9932cc 270deg 360deg   /* 紫 */
      ),
      radial-gradient(circle at 50% 50%, 
        rgba(255, 20, 147, 0.6) 0%, transparent 30%)`,
      textColor: '#ffffff',
      accentColor: '#ffd700',
      decorativeElements: {
        pattern: 'center_heart',
        opacity: 0.4
      }
    },

    // Go!プリンセスプリキュア
    go_princess_precure: {
      name: 'Go!プリンセスプリキュア',
      background: `linear-gradient(135deg,
        #ff69b4 0%,      /* 桃 */
        #4169e1 25%,     /* 青 */
        #ffd700 50%,     /* 黄 */
        #dc143c 75%,     /* 赤 */
        #ff69b4 100%     /* 桃に戻る */
      ),
      repeating-linear-gradient(0deg,
        transparent 0px, transparent 8px,
        rgba(255, 255, 255, 0.15) 8px, rgba(255, 255, 255, 0.15) 16px
      ),
      repeating-linear-gradient(90deg,
        transparent 0px, transparent 8px,
        rgba(255, 255, 255, 0.1) 8px, rgba(255, 255, 255, 0.1) 16px
      )`,
      textColor: '#ffffff',
      accentColor: '#ffd700',
      decorativeElements: {
        pattern: 'lace_pattern',
        opacity: 0.25
      }
    },

    // 魔法つかいプリキュア!
    maho_girls_precure: {
      name: '魔法つかいプリキュア!',
      background: `radial-gradient(circle at 25% 25%, 
        rgba(220, 20, 60, 0.8) 0%, transparent 50%),
      radial-gradient(circle at 75% 30%, 
        rgba(70, 130, 180, 0.8) 0%, transparent 50%),
      radial-gradient(circle at 30% 75%, 
        rgba(255, 182, 193, 0.8) 0%, transparent 50%),
      radial-gradient(circle at 70% 70%, 
        rgba(255, 215, 0, 0.8) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, 
        rgba(50, 205, 50, 0.7) 0%, transparent 60%),
      linear-gradient(45deg, 
        #4b0082 0%, #191970 50%, #2f4f4f 100%)`,
      textColor: '#ffffff',
      accentColor: '#ffd700',
      decorativeElements: {
        pattern: 'magic_elements',
        opacity: 0.3
      }
    },

    // キラキラ☆プリキュアアラモード
    kirakira_precure_alamode: {
      name: 'キラキラ☆プリキュアアラモード',
      background: `linear-gradient(60deg,
        #dc143c 0%,      /* 赤 */
        #4169e1 16.6%,   /* 青 */
        #32cd32 33.2%,   /* 緑 */
        #ff69b4 49.8%,   /* 桃 */
        #ffd700 66.4%,   /* 黄 */
        #9932cc 83%,     /* 紫 */
        #dc143c 100%     /* 赤に戻る */
      ),
      radial-gradient(circle at 30% 30%, 
        rgba(255, 255, 255, 0.3) 0%, transparent 25%),
      radial-gradient(circle at 70% 70%, 
        rgba(255, 255, 255, 0.2) 0%, transparent 20%)`,
      textColor: '#2c3e50',
      accentColor: '#ff1493',
      decorativeElements: {
        pattern: 'sweets_pattern',
        opacity: 0.25
      }
    },

    // HUGっと!プリキュア
    hugtto_precure: {
      name: 'HUGっと!プリキュア',
      background: `radial-gradient(ellipse at 30% 30%, 
        rgba(255, 182, 193, 0.9) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 25%, 
        rgba(70, 130, 180, 0.8) 0%, transparent 50%),
      radial-gradient(ellipse at 25% 70%, 
        rgba(255, 215, 0, 0.8) 0%, transparent 45%),
      radial-gradient(ellipse at 75% 75%, 
        rgba(147, 112, 219, 0.8) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, 
        rgba(220, 20, 60, 0.7) 0%, transparent 60%),
      linear-gradient(135deg, 
        #ff69b4 0%, #87ceeb 50%, #dda0dd 100%)`,
      textColor: '#2c3e50',
      accentColor: '#ff1493',
      decorativeElements: {
        pattern: 'hug_hearts',
        opacity: 0.3
      }
    },

    // スター☆トゥインクルプリキュア
    star_twinkle_precure: {
      name: 'スター☆トゥインクルプリキュア',
      background: `radial-gradient(circle at 25% 25%, 
        rgba(147, 112, 219, 0.9) 0%, transparent 50%),
      radial-gradient(circle at 75% 30%, 
        rgba(64, 224, 208, 0.8) 0%, transparent 50%),
      radial-gradient(circle at 30% 75%, 
        rgba(255, 182, 193, 0.8) 0%, transparent 50%),
      radial-gradient(circle at 70% 70%, 
        rgba(70, 130, 180, 0.9) 0%, transparent 50%),
      radial-gradient(circle at 50% 20%, 
        rgba(255, 215, 0, 0.8) 0%, transparent 45%),
      linear-gradient(45deg, 
        #191970 0%, #2f4f4f 50%, #4b0082 100%)`,
      textColor: '#ffffff',
      accentColor: '#ffd700',
      decorativeElements: {
        pattern: 'cosmic_stars',
        opacity: 0.4
      }
    },

    // ヒーリングっど♥プリキュア
    healin_good_precure: {
      name: 'ヒーリングっど♥プリキュア',
      background: `radial-gradient(ellipse at 30% 30%, 
        rgba(70, 130, 180, 0.9) 0%, transparent 60%),
      radial-gradient(ellipse at 70% 25%, 
        rgba(255, 182, 193, 0.8) 0%, transparent 55%),
      radial-gradient(ellipse at 25% 75%, 
        rgba(255, 215, 0, 0.8) 0%, transparent 50%),
      radial-gradient(ellipse at 75% 70%, 
        rgba(147, 112, 219, 0.8) 0%, transparent 55%),
      linear-gradient(135deg, 
        #e0f6ff 0%, #b3e5fc 50%, #81c784 100%)`,
      textColor: '#2c3e50',
      accentColor: '#4169e1',
      decorativeElements: {
        pattern: 'healing_elements',
        opacity: 0.25
      }
    },

    // トロピカル～ジュ！プリキュア
    tropical_rouge_precure: {
      name: 'トロピカル～ジュ！プリキュア',
      background: `linear-gradient(45deg,
        #ff6b9d 0%,      /* 桃 */
        #ff8c42 14.3%,   /* オレンジ */
        #ffd700 28.6%,   /* 黄 */
        #32cd32 42.9%,   /* 緑 */
        #00bcd4 57.1%,   /* 水色 */
        #4169e1 71.4%,   /* 青 */
        #9932cc 85.7%,   /* 紫 */
        #ff6b9d 100%     /* 桃に戻る */
      ),
      radial-gradient(circle at 20% 30%, 
        rgba(255, 255, 255, 0.4) 0%, transparent 30%),
      radial-gradient(circle at 80% 70%, 
        rgba(255, 255, 255, 0.3) 0%, transparent 25%)`,
      textColor: '#2c3e50',
      accentColor: '#ff6b9d',
      decorativeElements: {
        pattern: 'tropical_summer',
        opacity: 0.3
      }
    },

    // デリシャスパーティ♡プリキュア
    delicious_party_precure: {
      name: 'デリシャスパーティ♡プリキュア',
      background: `radial-gradient(circle at 30% 30%, 
        rgba(70, 130, 180, 0.9) 0%, transparent 50%),
      radial-gradient(circle at 70% 25%, 
        rgba(255, 215, 0, 0.8) 0%, transparent 50%),
      radial-gradient(circle at 25% 75%, 
        rgba(255, 182, 193, 0.8) 0%, transparent 50%),
      radial-gradient(circle at 75% 70%, 
        rgba(147, 112, 219, 0.8) 0%, transparent 50%),
      linear-gradient(135deg, 
        #fff8dc 0%, #ffe4b5 50%, #ffd1dc 100%)`,
      textColor: '#2c3e50',
      accentColor: '#4169e1',
      decorativeElements: {
        pattern: 'food_elements',
        opacity: 0.25
      }
    },

    // ひろがるスカイ！プリキュア
    hirogaru_sky_precure: {
      name: 'ひろがるスカイ！プリキュア',
      background: `radial-gradient(ellipse at 30% 20%, 
        rgba(147, 112, 219, 0.8) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 30%, 
        rgba(255, 215, 0, 0.8) 0%, transparent 45%),
      radial-gradient(ellipse at 25% 70%, 
        rgba(70, 130, 180, 0.9) 0%, transparent 55%),
      radial-gradient(ellipse at 75% 75%, 
        rgba(255, 255, 255, 0.9) 0%, transparent 40%),
      radial-gradient(ellipse at 50% 80%, 
        rgba(255, 182, 193, 0.7) 0%, transparent 50%),
      linear-gradient(180deg, 
        #87ceeb 0%, #b0e0e6 50%, #f0f8ff 100%)`,
      textColor: '#2c3e50',
      accentColor: '#4169e1',
      decorativeElements: {
        pattern: 'sky_clouds',
        opacity: 0.3
      }
    },

    // わんだふるぷりきゅあ！
    wonderful_precure: {
      name: 'わんだふるぷりきゅあ！',
      background: `radial-gradient(circle at 30% 30%, 
        rgba(255, 182, 193, 0.9) 0%, transparent 50%),
      radial-gradient(circle at 70% 25%, 
        rgba(147, 112, 219, 0.8) 0%, transparent 50%),
      radial-gradient(circle at 25% 75%, 
        rgba(230, 245, 255, 0.9) 0%, transparent 55%),
      radial-gradient(circle at 75% 70%, 
        rgba(64, 224, 208, 0.8) 0%, transparent 50%),
      linear-gradient(135deg, 
        #ffeef8 0%, #e8f5e8 50%, #f0f8ff 100%)`,
      textColor: '#2c3e50',
      accentColor: '#ff69b4',
      decorativeElements: {
        pattern: 'animal_paws',
        opacity: 0.25
      }
    },

    // 従来のテンプレート（後方互換性のため残す）
    precure_classic: {
      name: 'クラシックプリキュア',
      background: 'linear-gradient(135deg, #ff6b9d 0%, #c44cd9 50%, #6fa7ff 100%)',
      textColor: '#ffffff',
      accentColor: '#ffffff'
    }
  }

  const currentTemplate = cardTemplates[cardData.templateId] || cardTemplates.max_heart

  // 初期化処理
  useEffect(() => {
    if (session?.user?.id) {
      loadSavedCardData()
      loadImages()
    }
  }, [session])

  // QRコード生成（プロフィールURL変更時）
  useEffect(() => {
    if (cardData.profileUrl) {
      generateQRCode()
    }
  }, [cardData.profileUrl])

  // 画像読み込み
  const loadImages = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('user-images')
        .list(`${session.user.id}/`, {
          limit: 50,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) throw error

      const imageUrls = await Promise.all(
        data.map(async (file) => {
          const { data: { publicUrl } } = supabase.storage
            .from('user-images')
            .getPublicUrl(`${session.user.id}/${file.name}`)
          
          return {
            name: file.name,
            url: publicUrl,
            size: file.metadata?.size || 0,
            uploaded_at: file.created_at
          }
        })
      )

      setImages(imageUrls)
    } catch (error) {
      console.error('画像読み込みエラー:', error)
    }
  }

  // 保存されたカードデータを読み込み
  const loadSavedCardData = async () => {
    try {
      const { data: savedData, error } = await supabase
        .from('digital_cards')
        .select('card_data')
        .eq('user_id', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('カードデータ読み込みエラー:', error)
        return
      }

      if (savedData?.card_data) {
        setCardData(prev => ({
          ...prev,
          ...savedData.card_data,
          name: profile?.display_name || savedData.card_data.name || prev.name,
          favoriteCharacter: Array.isArray(profile?.favorite_character) && profile.favorite_character.length > 0 
            ? profile.favorite_character[0] 
            : savedData.card_data.favoriteCharacter || prev.favoriteCharacter,
          profileUrl: `${window.location.origin}/?profile=${session.user.id}`
        }))
      } else {
        // 新しいユーザーの場合
        setCardData(prev => ({
          ...prev,
          name: profile?.display_name || prev.name,
          favoriteCharacter: Array.isArray(profile?.favorite_character) && profile.favorite_character.length > 0 
            ? profile.favorite_character[0] 
            : prev.favoriteCharacter,
          profileUrl: `${window.location.origin}/?profile=${session.user.id}`
        }))
      }
    } catch (error) {
      console.error('保存データ読み込みエラー:', error)
    }
  }

  // QRコード生成
  const generateQRCode = async () => {
    try {
      if (!cardData.profileUrl) return
      
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cardData.profileUrl)}&bgcolor=ffffff&color=000000`
      
      const response = await fetch(qrUrl)
      const blob = await response.blob()
      
      const reader = new FileReader()
      reader.onload = () => {
        setQrCodeDataUrl(reader.result)
      }
      reader.readAsDataURL(blob)
    } catch (error) {
      console.error('QRコード生成エラー:', error)
    }
  }

  // 名刺をシェア
  const shareCard = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${cardData.name}のプリキュア名刺`,
          text: `プリキュアファンの${cardData.name}です！最推しは${cardData.favoriteCharacter}です✨`,
          url: cardData.profileUrl
        })
      } else {
        await navigator.clipboard.writeText(cardData.profileUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (error) {
      console.error('シェアエラー:', error)
    }
  }

  // カードデータ更新
  const updateCardData = (updates) => {
    setCardData(prev => ({
      ...prev,
      ...updates
    }))
  }

  // カードデータを保存
  const saveCardData = async () => {
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('digital_cards')
        .upsert({
          user_id: session.user.id,
          card_data: cardData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('保存エラー:', error)
        throw error
      }

      setEditing(false)
      alert('名刺デザインを保存しました！✨')
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 画像編集モーダルを開く
  const openImageEditor = (imageUrl) => {
    setSelectedImageForEdit(imageUrl)
    setTempImageSettings({ ...cardData.imageSettings })
    setShowImageEditor(true)
  }

  // 画像編集を適用
  const applyImageEdit = () => {
    setCardData(prev => ({
      ...prev,
      backgroundImage: selectedImageForEdit,
      backgroundType: 'image',
      imageSettings: { ...tempImageSettings }
    }))
    setShowImageEditor(false)
  }

  // 画像編集をキャンセル
  const cancelImageEdit = () => {
    setTempImageSettings({ ...cardData.imageSettings })
    setShowImageEditor(false)
  }

  // ドラッグ操作
  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    e.preventDefault()
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    
    const container = imageEditorRef.current
    if (container) {
      const rect = container.getBoundingClientRect()
      const moveX = (deltaX / rect.width) * 20
      const moveY = (deltaY / rect.height) * 20

      setTempImageSettings(prev => ({
        ...prev,
        positionX: Math.max(0, Math.min(100, prev.positionX + moveX)),
        positionY: Math.max(0, Math.min(100, prev.positionY + moveY))
      }))
      
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // マウスイベントの登録/解除
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  // プレビュー用の背景スタイル（エディター）
  const getEditorPreviewStyle = () => {
    const { scale, positionX, positionY, opacity, rotation } = tempImageSettings
    return {
      backgroundImage: `url(${selectedImageForEdit})`,
      backgroundSize: `${scale * 100}% auto`,
      backgroundPosition: `${positionX}% ${positionY}%`,
      backgroundRepeat: 'no-repeat',
      transform: `rotate(${rotation}deg)`,
      opacity: opacity,
      transition: isDragging ? 'none' : 'all 0.2s ease'
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">デジタル名刺</h1>
            <p className="text-gray-600">あなたのプリキュア愛を込めた名刺を作成しましょう ✨</p>
          </div>
          <div className="flex space-x-2">
            {!editing && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Edit size={16} />
                  <span>編集</span>
                </button>
                <button
                  onClick={shareCard}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  {copied ? <Check size={16} /> : <Share size={16} />}
                  <span>{copied ? 'コピー済み' : 'シェア'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 名刺プレビュー */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">プレビュー</h2>
        
        <div className="flex justify-center mb-6">
          <div 
            ref={cardRef}
            className="relative rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300"
            style={{
              width: 'min(600px, calc(100vw - 3rem))',
              aspectRatio: '91/55',
              background: currentTemplate.background
            }}
          >
            {/* 装飾パターンのSVGオーバーレイ */}
            {currentTemplate.decorativeElements && (
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none z-5"
                style={{ color: currentTemplate.accentColor }}
              >
                {decorativePatterns[currentTemplate.decorativeElements.pattern]}
                <rect 
                  width="100%" 
                  height="100%" 
                  fill={`url(#${currentTemplate.decorativeElements.pattern})`}
                />
              </svg>
            )}

            {/* 背景画像レイヤー */}
            {cardData.backgroundType === 'image' && cardData.backgroundImage && (
              <div 
                className="absolute inset-0 z-10"
                style={{
                  backgroundImage: `url(${cardData.backgroundImage})`,
                  backgroundSize: `${cardData.imageSettings.scale * 100}% auto`,
                  backgroundPosition: `${cardData.imageSettings.positionX}% ${cardData.imageSettings.positionY}%`,
                  backgroundRepeat: 'no-repeat',
                  transform: `rotate(${cardData.imageSettings.rotation}deg)`,
                  opacity: cardData.imageSettings.opacity,
                  mixBlendMode: cardData.useImageEffect ? 'overlay' : 'normal'
                }}
              ></div>
            )}

            {/* 装飾要素（アイコン） */}
            <div className="absolute top-4 right-4 opacity-20 z-15">
              <Sparkles size={32} color={currentTemplate.accentColor} />
            </div>
            <div className="absolute bottom-4 left-4 opacity-20 z-15">
              <Heart size={24} color={currentTemplate.accentColor} />
            </div>
            <div className="absolute top-6 left-6 opacity-20 z-15">
              <Star size={20} color={currentTemplate.accentColor} />
            </div>

            {/* メインコンテンツ */}
            <div className="relative z-20 h-full flex flex-col justify-between p-6">
              <div>
                <h3 
                  className="text-2xl font-bold mb-2"
                  style={{ 
                    color: cardData.customTextColor || currentTemplate.textColor,
                    textShadow: cardData.backgroundType === 'image' && !cardData.useImageEffect ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
                  }}
                >
                  {cardData.name}
                </h3>
                <p 
                  className="text-sm opacity-90"
                  style={{ 
                    color: cardData.customTextColor || currentTemplate.textColor,
                    textShadow: cardData.backgroundType === 'image' && !cardData.useImageEffect ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
                  }}
                >
                  最推し: {cardData.favoriteCharacter}
                </p>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p 
                    className="text-lg font-bold"
                    style={{ 
                      color: cardData.customAccentColor || currentTemplate.accentColor,
                      textShadow: cardData.backgroundType === 'image' && !cardData.useImageEffect ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
                    }}
                  >
                    プリキュアファン
                  </p>
                </div>

                {/* QRコードを常時表示 */}
                <div className="bg-white p-1 rounded shadow-sm">
                  {qrCodeDataUrl ? (
                    <img 
                      src={qrCodeDataUrl} 
                      alt="QRコード" 
                      className="w-12 h-12"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <QrCode size={16} className="text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 編集パネル */}
      {editing && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">名刺編集</h2>
            <div className="flex space-x-2">
              <button
                onClick={saveCardData}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Save size={16} />
                <span>{loading ? '保存中...' : '保存'}</span>
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">名前</label>
                <input
                  type="text"
                  value={cardData.name}
                  onChange={(e) => updateCardData({name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="あなたの名前"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">最推しプリキュア</label>
                <input
                  type="text"
                  value={cardData.favoriteCharacter}
                  onChange={(e) => updateCardData({favoriteCharacter: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="例：キュアブラック"
                />
              </div>
            </div>

            {/* 背景テンプレート */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">背景テンプレート</label>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {Object.entries(cardTemplates).map(([id, template]) => (
                  <button
                    key={id}
                    onClick={() => updateCardData({templateId: id, backgroundType: 'template'})}
                    className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      cardData.templateId === id && cardData.backgroundType === 'template'
                        ? 'border-pink-500 ring-2 ring-pink-200 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ background: template.background }}
                  >
                    {/* 装飾パターンの小さなプレビュー */}
                    {template.decorativeElements && (
                      <svg 
                        className="absolute inset-0 w-full h-full pointer-events-none opacity-50"
                        style={{ color: template.accentColor }}
                      >
                        {decorativePatterns[template.decorativeElements.pattern]}
                        <rect 
                          width="100%" 
                          height="100%" 
                          fill={`url(#${template.decorativeElements.pattern})`}
                        />
                      </svg>
                    )}
                    
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                      <span 
                        className="text-xs font-medium text-center px-2 py-1 bg-black bg-opacity-50 rounded"
                        style={{ color: template.textColor }}
                      >
                        {template.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* アップロード画像から選択 */}
              {images.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Crop size={16} className="mr-2" />
                    アップロード済み画像から選択
                  </h4>
                  
                  <div className="space-y-2 mb-4">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className={`flex items-center p-3 border-2 rounded-lg transition-all cursor-pointer hover:bg-gray-50 ${
                          cardData.backgroundImage === image.url && cardData.backgroundType === 'image'
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => openImageEditor(image.url)}
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 mr-4 border border-gray-200">
                          <img
                            src={image.url}
                            alt={`画像 ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextElementSibling.style.display = 'flex'
                            }}
                          />
                          <div className="w-full h-full hidden items-center justify-center text-xs text-gray-500">
                            読み込みエラー
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {image.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {cardData.backgroundImage === image.url && cardData.backgroundType === 'image' ? 
                                  '✅ 選択中' : 'クリックして編集'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {(image.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 文字色設定 */}
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">文字色設定</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">メイン文字色</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={cardData.customTextColor || currentTemplate.textColor}
                        onChange={(e) => updateCardData({ customTextColor: e.target.value })}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                      />
                      <span className="text-xs text-gray-500 flex-1">
                        {cardData.customTextColor || currentTemplate.textColor}
                      </span>
                      <button
                        onClick={() => updateCardData({ customTextColor: null })}
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >
                        リセット
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">アクセント色</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={cardData.customAccentColor || currentTemplate.accentColor}
                        onChange={(e) => updateCardData({ customAccentColor: e.target.value })}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                      />
                      <span className="text-xs text-gray-500 flex-1">
                        {cardData.customAccentColor || currentTemplate.accentColor}
                      </span>
                      <button
                        onClick={() => updateCardData({ customAccentColor: null })}
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >
                        リセット
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Twitter風画像編集モーダル */}
      {showImageEditor && selectedImageForEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full h-full sm:max-w-6xl sm:max-h-[95vh] flex flex-col overflow-hidden">
            {/* モーダルヘッダー */}
            <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-3">
                <button
                  onClick={cancelImageEdit}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X size={20} />
                </button>
                <h3 className="text-lg font-semibold text-gray-800">メディアを編集</h3>
              </div>
              <button
                onClick={applyImageEdit}
                className="bg-black text-white px-4 sm:px-6 py-2 rounded-full hover:bg-gray-800 transition-colors font-medium text-sm sm:text-base"
              >
                適用
              </button>
            </div>

            {/* 編集エリア */}
            <div className="flex-1 flex flex-col sm:flex-row min-h-0">
              {/* プレビューエリア */}
              <div className="flex-1 bg-gray-100 relative min-h-0 flex items-center justify-center p-4">
                <div className="w-full h-full max-w-none max-h-none flex items-center justify-center">
                  {/* 名刺フレーム */}
                  <div 
                    className="relative bg-white rounded-lg shadow-xl overflow-hidden border-4 border-blue-400"
                    style={{
                      width: 'min(calc(100vw - 2rem), calc(100vh - 12rem), 520px)',
                      aspectRatio: '91/55',
                    }}
                  >
                    {/* 装飾パターンの背景 */}
                    {currentTemplate.decorativeElements && (
                      <div 
                        className="absolute inset-0 z-0"
                        style={{ background: currentTemplate.background }}
                      >
                        <svg 
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          style={{ color: currentTemplate.accentColor }}
                        >
                          {decorativePatterns[currentTemplate.decorativeElements.pattern]}
                          <rect 
                            width="100%" 
                            height="100%" 
                            fill={`url(#${currentTemplate.decorativeElements.pattern})`}
                          />
                        </svg>
                      </div>
                    )}

                    {/* 背景プレビュー */}
                    <div 
                      ref={imageEditorRef}
                      className="absolute inset-0 cursor-move z-10"
                      style={getEditorPreviewStyle()}
                      onMouseDown={handleMouseDown}
                    >
                      {/* グリッドオーバーレイ */}
                      <div className="absolute inset-0 pointer-events-none opacity-30">
                        <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                          {[...Array(9)].map((_, i) => (
                            <div key={i} className="border border-white/50"></div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* テンプレート背景オーバーレイ */}
                    <div 
                      className="absolute inset-0 pointer-events-none z-15"
                      style={{ 
                        background: currentTemplate.background,
                        opacity: 0.3,
                        mixBlendMode: 'multiply'
                      }}
                    ></div>

                    {/* 名刺コンテンツオーバーレイ */}
                    <div className="absolute inset-0 pointer-events-none z-20">
                      <div className="relative h-full flex flex-col justify-between p-3 sm:p-4">
                        <div>
                          <h3 
                            className="text-sm sm:text-lg font-bold drop-shadow-lg"
                            style={{ 
                              color: cardData.customTextColor || currentTemplate.textColor,
                              textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
                            }}
                          >
                            {cardData.name}
                          </h3>
                          <p 
                            className="text-xs sm:text-sm opacity-90 drop-shadow-lg"
                            style={{ 
                              color: cardData.customTextColor || currentTemplate.textColor,
                              textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
                            }}
                          >
                            最推し: {cardData.favoriteCharacter}
                          </p>
                        </div>

                        <div className="flex items-end justify-between">
                          <p 
                            className="text-xs sm:text-sm font-bold drop-shadow-lg"
                            style={{ 
                              color: cardData.customAccentColor || currentTemplate.accentColor,
                              textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
                            }}
                          >
                            プリキュアファン
                          </p>
                          
                          {/* 画像エディターでもQRコードプレビュー */}
                          <div className="bg-white p-1 rounded shadow-sm">
                            {qrCodeDataUrl ? (
                              <img 
                                src={qrCodeDataUrl} 
                                alt="QRコード" 
                                className="w-8 h-8 sm:w-10 sm:h-10"
                              />
                            ) : (
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded flex items-center justify-center">
                                <QrCode size={12} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* コントロールパネル */}
              <div className="w-full sm:w-80 bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto">
                <div className="p-4 sm:p-6 space-y-6">
                  {/* ズーム */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <ZoomIn size={16} className="mr-2" />
                      ズーム ({(tempImageSettings.scale * 100).toFixed(0)}%)
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={tempImageSettings.scale}
                      onChange={(e) => setTempImageSettings(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* 位置調整 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <Move size={16} className="mr-2" />
                      位置調整
                    </label>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">水平位置 ({tempImageSettings.positionX.toFixed(0)}%)</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={tempImageSettings.positionX}
                        onChange={(e) => setTempImageSettings(prev => ({ ...prev, positionX: parseFloat(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">垂直位置 ({tempImageSettings.positionY.toFixed(0)}%)</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={tempImageSettings.positionY}
                        onChange={(e) => setTempImageSettings(prev => ({ ...prev, positionY: parseFloat(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* 透明度 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      透明度 ({(tempImageSettings.opacity * 100).toFixed(0)}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={tempImageSettings.opacity}
                      onChange={(e) => setTempImageSettings(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* 回転 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <RotateCcw size={16} className="mr-2" />
                      回転 ({tempImageSettings.rotation}°)
                    </label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={tempImageSettings.rotation}
                      onChange={(e) => setTempImageSettings(prev => ({ ...prev, rotation: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* プリセットボタン */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">クイック設定</label>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => setTempImageSettings(prev => ({
                          ...prev,
                          scale: 1,
                          positionX: 50,
                          positionY: 50,
                          opacity: 0.8
                        }))}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 sm:px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                      >
                        メイン
                      </button>
                      <button
                        onClick={() => setTempImageSettings(prev => ({
                          ...prev,
                          scale: 0.7,
                          positionX: 80,
                          positionY: 20,
                          opacity: 0.6
                        }))}
                        className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-2 sm:px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                      >
                        アクセント
                      </button>
                      <button
                        onClick={() => setTempImageSettings(prev => ({
                          ...prev,
                          scale: 2,
                          positionX: 30,
                          positionY: 30,
                          opacity: 0.4
                        }))}
                        className="bg-green-100 hover:bg-green-200 text-green-800 px-2 sm:px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                      >
                        背景風
                      </button>
                    </div>
                  </div>

                  {/* リセットボタン */}
                  <div className="pt-3 sm:pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setTempImageSettings({
                        scale: 1,
                        positionX: 50,
                        positionY: 50,
                        opacity: 0.3,
                        rotation: 0
                      })}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      リセット
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 使用方法ガイド */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">💳 デジタル名刺の使い方</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-pink-600 mb-2">✨ 作成</h4>
            <ul className="space-y-1">
              <li>• 名前と最推しプリキュアを設定</li>
              <li>• プリキュア作品別テンプレートを選択</li>
              <li>• Twitter風エディターで画像を調整</li>
              <li>• ドラッグ&ドロップで直感的な編集</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-600 mb-2">🎨 新機能</h4>
            <ul className="space-y-1">
              <li>• 6作品分の専用テンプレート</li>
              <li>• 各作品のモチーフ装飾パターン</li>
              <li>• 作品カラーに最適化された配色</li>
              <li>• プロフィールURLでシェア</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}