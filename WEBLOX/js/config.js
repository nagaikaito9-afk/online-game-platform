/**
 * WEBLOX - config.js
 * ゲームワールド定義、アバターパーツ、WEBLOX Studio用オブジェクト定義
 */

const WEBLOX_WORLDS = [
  {
    id: 'lobby',
    name: '🏙️ WEBLOX セントラルロビー',
    category: 'ロビー',
    author: 'WEBLOX Official',
    likes: '98%',
    playing: '1.2k',
    desc: '全プレイヤーが集まる巨大な3Dセントラル広場！ショップやポータルがあるよ。',
    icon: '🏙️',
    bg: '#00b4d8'
  },
  {
    id: 'obby',
    name: '🟩 Mega Obby (999+ Stages)',
    category: 'アクション',
    author: 'ObbyCreator',
    likes: '95%',
    playing: '3.4k',
    desc: 'マグマを避けてゴールを目指せ！トリッキーな3Dアスレチックコース。',
    icon: '🟩',
    bg: '#ffb703'
  },
  {
    id: 'coindash',
    name: '🪙 Coin Dash Simulator',
    category: 'ミニゲーム',
    author: 'DashGames',
    likes: '92%',
    playing: '850',
    desc: '制限時間内に3Dマップ上のゴールドコインを集めまくれ！',
    icon: '🪙',
    bg: '#00ff87'
  },
  {
    id: 'arena',
    name: '⚔️ Sword Fighting Arena',
    category: 'バトル',
    author: 'ArenaMaster',
    likes: '96%',
    playing: '2.1k',
    desc: 'ライトセーバーでライバルと激突！最後まで生き残れ。',
    icon: '⚔️',
    bg: '#d90429'
  },
  {
    id: 'sandbox',
    name: '🏗️ Creative Build & Play',
    category: '創作',
    author: 'WEBLOX Official',
    likes: '94%',
    playing: '620',
    desc: 'ブロックを自由に置いて自分の好きな建物やコースを作ろう！',
    icon: '🏗️',
    bg: '#7209b7'
  }
];

const STUDIO_PARTS = [
  { id: 'block', name: '📦 ブロック (Part)', color: 0x00f2fe, geo: 'box' },
  { id: 'sphere', name: '🔮 球体 (Sphere)', color: 0xffb703, geo: 'sphere' },
  { id: 'cylinder', name: '🛢️ シリンダー (Cylinder)', color: 0x00ff87, geo: 'cylinder' },
  { id: 'spawn', name: '🏁 スポーン地点 (SpawnLocation)', color: 0x38b000, geo: 'spawn' },
  { id: 'killblock', name: '🔥 マグマキルブロック (KillBlock)', color: 0xd90429, geo: 'kill' }
];

const AVATAR_COLORS = [
  { id: 'yellow', name: 'クラシックイエロー', hex: '#ffd166' },
  { id: 'cyan', name: 'ネオンブルー', hex: '#00f2fe' },
  { id: 'pink', name: 'キャンディピンク', hex: '#ff758f' },
  { id: 'green', name: 'ライムグリーン', hex: '#00ff87' },
  { id: 'purple', name: 'サイバーパープル', hex: '#7209b7' },
  { id: 'orange', name: 'サンセットオレンジ', hex: '#fb8500' }
];

const AVATAR_HATS = [
  { id: 'none', name: 'なし', icon: '❌' },
  { id: 'cap', name: 'ベースボールキャップ', icon: '🧢' },
  { id: 'crown', name: 'ゴールデンクラウン', icon: '👑' },
  { id: 'cat', name: 'ネコミミ', icon: '🐱' },
  { id: 'visor', name: 'サイバーバイザー', icon: '🥽' },
  { id: 'tophat', name: 'シルクハット', icon: '🎩' }
];

const EMOTES = [
  { id: 'dance', name: '💃 ダンス', icon: '💃' },
  { id: 'wave', name: '👋 手を振る', icon: '👋' },
  { id: 'cheer', name: '🎉 万歳', icon: '🎉' },
  { id: 'backflip', name: '🤸 バック転', icon: '🤸' }
];
