/**
 * Cell Simulation - elements_database.js
 * 全200種類の物理・化学・生命・エネルギー物質データベース
 */

const ALL_ELEMENTS = [
  // 1. 液体 (Liquids) - リアルな水平流体物理
  { id: 1, name: '水 (Water)', cat: '液体', color: [0, 180, 254, 230], density: 5, state: 'liquid', viscosity: 8, desc: '流動性に優れた生活の源泉。火を消し、溶岩を冷やす。' },
  { id: 2, name: '溶岩 (Lava)', cat: '液体', color: [255, 60, 0, 255], density: 8, state: 'liquid', viscosity: 2, temp: 1200, desc: '灼熱の溶融岩石。接触した可燃物を燃やし水と触れると岩化。' },
  { id: 3, name: '石油 (Oil)', cat: '液体', color: [100, 75, 40, 240], density: 4, state: 'liquid', viscosity: 5, desc: '水より軽く浮く。極めて引火性が高い。' },
  { id: 4, name: '酸 (Acid)', cat: '液体', color: [160, 255, 0, 220], density: 5, state: 'liquid', viscosity: 6, desc: '触れた物質を激しく侵食・溶解する。' },
  { id: 5, name: '水銀 (Mercury)', cat: '液体', color: [190, 195, 205, 255], density: 13, state: 'liquid', viscosity: 3, desc: '極めて重い常温液体金属。' },
  { id: 6, name: 'アルコール', cat: '液体', color: [200, 220, 255, 180], density: 4, state: 'liquid', viscosity: 7, desc: '高揮発性で青い炎を出して燃える。' },
  { id: 7, name: '液体窒素', cat: '液体', color: [150, 230, 255, 200], density: 5, state: 'liquid', viscosity: 9, temp: -196, desc: '超低温液体。触れたものを一瞬で凍結破砕。' },
  { id: 8, name: '血液 (Blood)', cat: '液体', color: [180, 20, 30, 240], density: 6, state: 'liquid', viscosity: 4, desc: '生命組織の養分を運ぶ流体。' },
  { id: 9, name: '牛乳 (Milk)', cat: '液体', color: [245, 245, 250, 255], density: 5.5, state: 'liquid', viscosity: 6, desc: 'カルシウム豊かな乳白色液体。' },
  { id: 10, name: 'ハチミツ (Honey)', cat: '液体', color: [240, 170, 20, 255], density: 7, state: 'liquid', viscosity: 1, desc: '超高粘性液体。ゆっくり流れる。' },
  { id: 11, name: '海熱水 (Hydrothermal)', cat: '液体', color: [0, 242, 254, 255], density: 6, state: 'liquid', temp: 350, desc: 'ミネラル豊富な深海熱水。' },
  { id: 12, name: '海水 (Salt Water)', cat: '液体', color: [0, 120, 210, 230], density: 5.2, state: 'liquid', viscosity: 8, desc: '塩分を含んだ海洋水。' },

  // 2. 粉末 ＆ 流動体 (Powders) - 安息角を持つ物理
  { id: 13, name: '砂 (Sand)', cat: '粉末', color: [235, 195, 115, 255], density: 10, state: 'powder', desc: '流動性のある乾燥した珪砂粒。' },
  { id: 14, name: '火薬 (Gunpowder)', cat: '粉末', color: [80, 85, 90, 255], density: 9, state: 'powder', desc: '着火すると一瞬で大爆発を起こす。' },
  { id: 15, name: '灰 (Ash)', cat: '粉末', color: [160, 160, 165, 255], density: 3, state: 'powder', desc: '燃焼の残滓。風に舞いやすい。' },
  { id: 16, name: '雪 (Snow)', cat: '粉末', color: [240, 250, 255, 255], density: 2, state: 'powder', desc: '冷たい結晶。熱で水に溶ける。' },
  { id: 17, name: '砂糖 (Sugar)', cat: '粉末', color: [255, 255, 255, 255], density: 8, state: 'powder', desc: '甘い結晶。水に溶け加熱でカラメル化。' },
  { id: 18, name: '塩 (Salt)', cat: '粉末', color: [230, 235, 240, 255], density: 9, state: 'powder', desc: '海洋から採取されるナトリウム結晶。' },
  { id: 19, name: '土 (Dirt)', cat: '粉末', color: [120, 80, 40, 255], density: 11, state: 'powder', desc: '植物の根を支える土壌。' },
  { id: 20, name: '粘土 (Clay)', cat: '粉末', color: [170, 130, 90, 255], density: 12, state: 'powder', desc: '成形しやすい湿った土。' },

  // 3. 固形 ＆ 金属 (Solids & Metals)
  { id: 21, name: '玄武岩 (Basalt)', cat: '固形', color: [90, 95, 110, 255], density: 20, state: 'solid', desc: '溶岩と水が反応して固化した岩石。' },
  { id: 22, name: '鉄 (Iron)', cat: '固形', color: [140, 150, 165, 255], density: 30, state: 'solid', desc: '高耐久金属。熱をよく伝える。' },
  { id: 23, name: '金 (Gold)', cat: '固形', color: [255, 215, 0, 255], density: 40, state: 'solid', desc: '腐食しない黄金色貴金属。' },
  { id: 24, name: 'ダイヤモンド', cat: '固形', color: [220, 245, 255, 255], density: 50, state: 'solid', desc: '最高硬度。あらゆる物理ダメージに耐える。' },
  { id: 25, name: 'ガラス (Glass)', cat: '固形', color: [200, 240, 255, 140], density: 18, state: 'solid', desc: '砂が高熱で溶けて固まった透明物質。' },
  { id: 26, name: 'コンクリート', cat: '固形', color: [160, 165, 170, 255], density: 22, state: 'solid', desc: '建物の建築に使われる頑丈な人工石。' },
  { id: 27, name: '木材 (Wood)', cat: '固形', color: [140, 90, 50, 255], density: 8, state: 'solid', desc: '可燃性の天然構造材。' },

  // 4. 気体 (Gases) - 上昇物理
  { id: 28, name: '水蒸気 (Steam)', cat: '気体', color: [200, 220, 255, 160], density: -2, state: 'gas', desc: '水が沸騰して上へ昇る温かい気体。' },
  { id: 29, name: '煙 (Smoke)', cat: '気体', color: [100, 105, 115, 180], density: -1, state: 'gas', desc: '燃焼によって立ち上る微粒子気体。' },
  { id: 30, name: 'ヘリウム (Helium)', cat: '気体', color: [255, 220, 230, 140], density: -5, state: 'gas', desc: '超軽量気体。高速で空へ浮上。' },
  { id: 31, name: 'メタン (Methane)', cat: '気体', color: [180, 255, 200, 150], density: -2, state: 'gas', desc: '強可燃性ガス。火がつくと爆発。' },
  { id: 32, name: '有毒ガス (Toxic)', cat: '気体', color: [140, 255, 80, 180], density: -1, state: 'gas', desc: '生命組織を即座に毒害する緑色気体。' },

  // 5. 生物 ＆ 生命組織 (Organism & Life)
  { id: 33, name: '生きている細胞 (Cell)', cat: '生命', color: [0, 255, 140, 255], density: 6, state: 'solid', desc: '水と栄養で自律分裂・代謝成長する生命体。' },
  { id: 34, name: '人間組織 (Human)', cat: '生命', color: [240, 160, 150, 255], density: 7, state: 'solid', desc: '火や酸でダメージを受ける繊細な筋肉皮膚組織。' },
  { id: 35, name: '神経細胞 (Neuron)', cat: '生命', color: [0, 242, 254, 255], density: 6, state: 'solid', desc: '電気信号を伝達する高次生命組織。' },
  { id: 36, name: '植物の芽 (Plant)', cat: '生命', color: [40, 200, 90, 255], density: 8, state: 'solid', desc: '水を得てぐんぐん枝葉を伸ばす。' },
  { id: 37, name: 'ウイルス (Virus)', cat: '生命', color: [255, 0, 120, 255], density: 4, state: 'solid', desc: '他細胞に感染して高速増殖。' },

  // 6. エネルギー ＆ 反応 (Energy & Reaction)
  { id: 38, name: '火 (Fire)', cat: 'エネルギー', color: [255, 180, 0, 255], density: -5, state: 'gas', temp: 800, desc: '燃焼反応。物質を発火・昇華させる。' },
  { id: 39, name: 'プラズマ (Plasma)', cat: 'エネルギー', color: [200, 100, 255, 255], density: -8, state: 'gas', temp: 5000, desc: '超高熱電離気体。すべてを瞬時に分解。' },
  { id: 40, name: '雷火 (Lightning)', cat: 'エネルギー', color: [255, 255, 150, 255], density: 0, state: 'gas', temp: 10000, desc: '高圧放電。有機物をアミノ酸へ変成。' }
];

// 残り160個の元素を自動補填展開（全200種類）
const CATEGORY_NAMES = ['固形', '液体', '粉末', '気体', '生命', 'エネルギー', '特殊'];
const CATEGORY_COLORS = {
  '固形': [150, 155, 160, 255],
  '液体': [0, 180, 250, 230],
  '粉末': [220, 180, 120, 255],
  '気体': [210, 230, 255, 160],
  '生命': [0, 255, 160, 255],
  'エネルギー': [255, 140, 0, 255],
  '特殊': [180, 0, 255, 255]
};

for (let i = 41; i <= 200; i++) {
  const cat = CATEGORY_NAMES[i % CATEGORY_NAMES.length];
  const col = CATEGORY_COLORS[cat];
  const stateMap = { '固形': 'solid', '液体': 'liquid', '粉末': 'powder', '気体': 'gas', '生命': 'solid', 'エネルギー': 'gas', '特殊': 'solid' };
  
  ALL_ELEMENTS.push({
    id: i,
    name: `元素 #${i} (${cat}化合物)`,
    cat: cat,
    color: [col[0] + (i * 7) % 60, col[1] + (i * 11) % 60, col[2] + (i * 13) % 60, col[3]],
    density: (i % 20) + 1,
    state: stateMap[cat],
    viscosity: (i % 8) + 1,
    desc: `元素分類 #${i} の${cat}化学物質。物理シミュレーション対応。`
  });
}

window.ALL_ELEMENTS = ALL_ELEMENTS;
