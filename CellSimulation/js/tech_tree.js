/**
 * Cell Simulation - tech_tree.js
 * 宇宙・地球・化学進化・細胞・文明のツリー ＆ 発見図鑑定義
 */

const ERA_PHASES = [
  {
    id: 'cosmic',
    name: '🌌 宇宙創世期 (Cosmic Era)',
    reqEnergy: 0,
    desc: '無のゆらぎから素粒子が誕生。重力により原子が凝集し星雲が形成される。',
    color: '#7209b7'
  },
  {
    id: 'earth',
    name: '🌍 原始地球期 (Hadean Earth Era)',
    reqEnergy: 500,
    desc: 'マグマの海が冷え、激しい雷雨と熱水噴出孔を持つ原始海洋が誕生。',
    color: '#ffb703'
  },
  {
    id: 'chemical',
    name: '🧪 化学進化期 (Chemical Evolution)',
    reqEnergy: 2500,
    desc: '熱水噴出孔周辺で無機物からアミノ酸・ヌクレオチドが合成される。',
    color: '#00f2fe'
  },
  {
    id: 'cellular',
    name: '🦠 細胞誕生期 (Cellular Life Era)',
    reqEnergy: 10000,
    desc: '脂質二重膜を獲得！自己複製を行う奇跡の「単細胞生物(細胞)」が誕生。',
    color: '#00ff87'
  },
  {
    id: 'civilization',
    name: '🏛️ 文明 ＆ 意識開花期 (Civilization Era)',
    reqEnergy: 50000,
    desc: '多細胞化を経て知恵を獲得。宇宙の理を解き明かす知的文明へと発展。',
    color: '#d90429'
  }
];

const DISCOVERY_ITEMS = [
  { id: 'quantum', era: 'cosmic', name: '量子ゆらぎ', icon: '✨', desc: 'すべての存在の源泉となるエネルギーの波立ち。', req: 10 },
  { id: 'hydrogen', era: 'cosmic', name: '水素原子 (H)', icon: '⚛️', desc: '宇宙で最も単純かつ豊富な元素。', req: 50 },
  { id: 'nebula', era: 'cosmic', name: '星雲', icon: '🌌', desc: 'ガスの濃縮によって巨大な星々が芽生える。', req: 200 },
  
  { id: 'ocean', era: 'earth', name: '原始海洋', icon: '🌊', desc: '生命のスープとなる水とミネラルの貯蔵庫。', req: 800 },
  { id: 'vent', era: 'earth', name: '熱水噴出孔', icon: '🌋', desc: '海底の裂け目から熱と各種金属イオンが供給される。', req: 1500 },

  { id: 'amino', era: 'chemical', name: 'アミノ酸', icon: '🧪', desc: 'タンパク質を構成する有機化合物。生命の建材。', req: 4000 },
  { id: 'rna', era: 'chemical', name: 'RNA (自己複製分子)', icon: '🧬', desc: '自らを複製し遺伝情報を伝える高分子。', req: 7000 },

  { id: 'membrane', era: 'cellular', name: '脂質二重膜', icon: '🔴', desc: '外部と内部を隔て、代謝を維持する保護膜。', req: 15000 },
  { id: 'first_cell', era: 'cellular', name: '最初の細胞 (LUCA)', icon: '🦠', desc: '全地球生命の共通祖先。代謝と自己複製を両立！', req: 25000 },
  { id: 'mitochondria', era: 'cellular', name: 'ミトコンドリア共生', icon: '⚡', desc: '爆発的なATPエネルギー生成能力を獲得。', req: 40000 },

  { id: 'multicell', era: 'civilization', name: '多細胞生物', icon: '🐟', desc: '細胞同士が役割分担し、複雑な個体を形成。', req: 80000 },
  { id: 'intelligence', era: 'civilization', name: '知的生命 ＆ 文明', icon: '🏛️', desc: '宇宙の歴史を自ら観察・検証する主体の誕生！', req: 150000 }
];
