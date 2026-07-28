/**
 * WEBLOX - config.js
 * ゲームワールド定義、アバターカスタマイズパーツ、エモート定義
 */

const WEBLOX_WORLDS = [
  {
    id: 'lobby',
    name: '🏙️ WEBLOX セントラルロビー',
    category: 'ロビー',
    desc: '全プレイヤーが集まる巨大な3Dセントラル広場！ショップやポータルがあるよ。',
    icon: '🏙️',
    bg: '#00b4d8'
  },
  {
    id: 'obby',
    name: '🟩 Mega Obby (アスレチック)',
    category: 'アクション',
    desc: 'マグマを避けてゴールを目指せ！トリッキーな3Dアスレチックコース。',
    icon: '🟩',
    bg: '#ffb703'
  },
  {
    id: 'coindash',
    name: '🪙 Coin Dash (コインレース)',
    category: 'ミニゲーム',
    desc: '制限時間内に3Dマップ上のゴールドコインを集めまくれ！',
    icon: '🪙',
    bg: '#00ff87'
  },
  {
    id: 'arena',
    name: '⚔️ Battle Arena (3Dアリーナ)',
    category: 'バトル',
    desc: 'ライトセーバーでライバルと激突！最後まで生き残れ。',
    icon: '⚔️',
    bg: '#d90429'
  },
  {
    id: 'sandbox',
    name: '🏗️ Creative Sandbox (建築)',
    category: '創作',
    desc: 'ブロックを自由に置いて自分の好きな建物やコースを作ろう！',
    icon: '🏗️',
    bg: '#7209b7'
  }
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
