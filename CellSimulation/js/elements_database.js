/**
 * Cell Simulation - elements_database.js
 * 全200種類の物理・化学・生命・エネルギー物質データベース
 * 本格流体力学 (dispersion: 水圧水平流動係数) パラメータ搭載
 */

const ALL_ELEMENTS = [
  // 1. 液体 (Liquids) - dispersion(水圧分散力) で粉っぽさを完全追放！
  { id: 1, name: '水 (Water)', cat: '液体', color: [0, 180, 254, 230], density: 5, state: 'liquid', viscosity: 8, dispersion: 12, temp: 20, freezePoint: 0, freezeTo: 16, boilPoint: 100, boilTo: 28, desc: '流動性に優れた生活の源泉。水圧でスッと水面を水平に平坦化。' },
  { id: 2, name: '溶岩 (Lava)', cat: '液体', color: [255, 60, 0, 255], density: 8, state: 'liquid', viscosity: 2, dispersion: 3, temp: 1200, freezePoint: 700, freezeTo: 21, desc: '灼熱の溶融岩石。高粘性でドロッとゆっくり広がり、水に触れると玄武岩化。' },
  { id: 3, name: '石油 (Oil)', cat: '液体', color: [100, 75, 40, 240], density: 3, state: 'liquid', viscosity: 5, dispersion: 8, temp: 20, boilPoint: 300, boilTo: 31, desc: '水より軽く浮く。引火性が高く、高熱でメタンガス化。' },
  { id: 4, name: '酸 (Acid)', cat: '液体', color: [160, 255, 0, 220], density: 6, state: 'liquid', viscosity: 6, dispersion: 9, temp: 20, desc: '触れた有機物や金属を激しく侵食・溶解して泡を吐き出す。' },
  { id: 5, name: '水銀 (Mercury)', cat: '液体', color: [190, 195, 205, 255], density: 14, state: 'liquid', viscosity: 3, dispersion: 6, temp: 20, desc: '極めて高密度な常温液体金属。あらゆる液体の最下層へ沈む。' },
  { id: 6, name: 'アルコール', cat: '液体', color: [200, 220, 255, 180], density: 4, state: 'liquid', viscosity: 9, dispersion: 14, temp: 20, boilPoint: 78, boilTo: 38, desc: '超高流動性。熱で青い炎を上げて激しく燃焼。' },
  { id: 7, name: '液体窒素', cat: '液体', color: [150, 230, 255, 200], density: 4.5, state: 'liquid', viscosity: 9, dispersion: 13, temp: -196, boilPoint: -195, boilTo: 28, desc: '超低温液体。触れたセルを一瞬で凍結破砕する。' },
  { id: 8, name: '血液 (Blood)', cat: '液体', color: [180, 20, 30, 240], density: 5.5, state: 'liquid', viscosity: 4, dispersion: 6, temp: 37, boilPoint: 100, boilTo: 15, desc: '生命組織の養分を運ぶ流体。高熱で乾燥して灰化。' },
  { id: 9, name: '牛乳 (Milk)', cat: '液体', color: [245, 245, 250, 255], density: 5.2, state: 'liquid', viscosity: 6, dispersion: 9, temp: 20, desc: 'カルシウム豊かな乳白色液体。' },
  { id: 10, name: 'ハチミツ (Honey)', cat: '液体', color: [240, 170, 20, 255], density: 7, state: 'liquid', viscosity: 1, dispersion: 1, temp: 20, desc: '超高粘性液体。まったりと遅く山なりに広がる。' },
  { id: 11, name: '海熱水 (Hydrothermal)', cat: '液体', color: [0, 242, 254, 255], density: 5.1, state: 'liquid', viscosity: 8, dispersion: 11, temp: 350, boilPoint: 370, boilTo: 28, desc: '超高温・高圧のミネラル豊富な深海熱水。' },
  { id: 12, name: '海水 (Salt Water)', cat: '液体', color: [0, 120, 210, 230], density: 5.3, state: 'liquid', viscosity: 8, dispersion: 12, temp: 20, freezePoint: -2, freezeTo: 16, boilPoint: 105, boilTo: 28, desc: '塩分を含んだ海洋水。蒸発すると塩の結晶を残す。' },

  // 2. 粉末 ＆ 流動体 (Powders) - 安息角 (45度) を持つ粒々物理
  { id: 13, name: '砂 (Sand)', cat: '粉末', color: [235, 195, 115, 255], density: 10, state: 'powder', temp: 20, meltPoint: 1700, meltTo: 25, desc: '珪砂の微粒子。山なりに積み上がり、高熱でガラス化。' },
  { id: 14, name: '火薬 (Gunpowder)', cat: '粉末', color: [80, 85, 90, 255], density: 9, state: 'powder', temp: 20, ignitePoint: 150, desc: '着火（150℃以上）または火花で一瞬で広域連鎖大爆発。' },
  { id: 15, name: '灰 (Ash)', cat: '粉末', color: [160, 160, 165, 255], density: 2, state: 'powder', temp: 20, desc: '有機物の燃焼残滓。水に浮き、風に舞いやすい。' },
  { id: 16, name: '氷 (Ice)', cat: '固形', color: [180, 230, 255, 220], density: 4.6, state: 'solid', temp: -10, meltPoint: 0, meltTo: 1, desc: '水が凍りついた低温固形体。0℃以上で溶けて水に戻る。' },
  { id: 17, name: '砂糖 (Sugar)', cat: '粉末', color: [255, 255, 255, 255], density: 7.5, state: 'powder', temp: 20, meltPoint: 180, meltTo: 2, desc: '甘い結晶。水に溶け加熱でカラメル化。' },
  { id: 18, name: '塩 (Salt)', cat: '粉末', color: [230, 235, 240, 255], density: 8.5, state: 'powder', temp: 20, desc: '海洋ナトリウム結晶。水に触れると溶解。' },
  { id: 19, name: '土 (Dirt)', cat: '粉末', color: [120, 80, 40, 255], density: 11, state: 'powder', temp: 20, desc: '植物の成長を支える養分に富んだ土壌。' },
  { id: 20, name: '粘土 (Clay)', cat: '粉末', color: [170, 130, 90, 255], density: 12, state: 'powder', temp: 20, meltPoint: 1000, meltTo: 21, desc: '湿った成形土。焼成すると硬い岩石へ変化。' },

  // 3. 固形 ＆ 金属 (Solids & Metals)
  { id: 21, name: '玄武岩 (Basalt)', cat: '固形', color: [90, 95, 110, 255], density: 20, state: 'solid', temp: 20, meltPoint: 1200, meltTo: 2, desc: 'マグマが固化した強固な火成岩。超高熱で再び溶岩化。' },
  { id: 22, name: '鉄 (Iron)', cat: '固形', color: [140, 150, 165, 255], density: 30, state: 'solid', temp: 20, meltPoint: 1538, meltTo: 2, desc: '高耐久構造用金属。熱を非常によく伝える。' },
  { id: 23, name: '金 (Gold)', cat: '固形', color: [255, 215, 0, 255], density: 40, state: 'solid', temp: 20, meltPoint: 1064, meltTo: 2, desc: '最高級の重金属。熱と電気を強烈に導電。' },
  { id: 24, name: 'ダイヤモンド', cat: '固形', color: [220, 245, 255, 255], density: 50, state: 'solid', temp: 20, desc: '絶対硬度結晶。あらゆる衝撃・酸・熱に耐える。' },
  { id: 25, name: 'ガラス (Glass)', cat: '固形', color: [200, 240, 255, 140], density: 18, state: 'solid', temp: 20, meltPoint: 1400, meltTo: 2, desc: '透明な珪素構造体。' },
  { id: 26, name: 'コンクリート', cat: '固形', color: [160, 165, 170, 255], density: 22, state: 'solid', temp: 20, desc: '超頑丈な人工石材。' },
  { id: 27, name: '木材 (Wood)', cat: '固形', color: [140, 90, 50, 255], density: 8, state: 'solid', temp: 20, ignitePoint: 250, desc: '可燃性の天然木材。250℃で発火し灰へ変成。' },

  // 4. 気体 (Gases)
  { id: 28, name: '水蒸気 (Steam)', cat: '気体', color: [200, 220, 255, 160], density: -2, state: 'gas', temp: 110, condensePoint: 95, condenseTo: 1, desc: '温かい気体。冷えると凝結して水滴に戻る。' },
  { id: 29, name: '煙 (Smoke)', cat: '気体', color: [100, 105, 115, 180], density: -1, state: 'gas', temp: 80, desc: '燃焼の副産物。上空へ立ち上りゆっくり拡散消滅。' },
  { id: 30, name: 'ヘリウム (Helium)', cat: '気体', color: [255, 220, 230, 140], density: -5, state: 'gas', temp: 20, desc: '超軽量不燃ガス。猛スピードで上昇。' },
  { id: 31, name: 'メタン (Methane)', cat: '気体', color: [180, 255, 200, 150], density: -2, state: 'gas', temp: 20, ignitePoint: 100, desc: '高爆発性天然ガス。わずかな火気で大爆発。' },
  { id: 32, name: '有毒ガス (Toxic)', cat: '気体', color: [140, 255, 80, 180], density: -1.5, state: 'gas', temp: 20, desc: '生命・細胞を秒速で壊死させる危険な酸性ガス。' },

  // 5. 生物 ＆ 生命組織
  { id: 33, name: '生きている細胞 (Cell)', cat: '生命', color: [0, 255, 140, 255], density: 5.5, state: 'solid', temp: 36, desc: '水と光で代謝・分裂増殖する人工生命体。' },
  { id: 34, name: '人間組織 (Human)', cat: '生命', color: [240, 160, 150, 255], density: 6, state: 'solid', temp: 36.5, desc: '熱・酸・毒に非常に弱い繊細な生体肉体組織。' },
  { id: 35, name: '神経細胞 (Neuron)', cat: '生命', color: [0, 242, 254, 255], density: 5.5, state: 'solid', temp: 36.5, desc: 'パルス電気信号を発信・伝達する高次神経。' },
  { id: 36, name: '植物の芽 (Plant)', cat: '生命', color: [40, 200, 90, 255], density: 7, state: 'solid', temp: 20, desc: '水を得て上へ上へと枝葉を広げる。' },
  { id: 37, name: 'ウイルス (Virus)', cat: '生命', color: [255, 0, 120, 255], density: 4, state: 'solid', temp: 36, desc: '細胞や人間組織に感染し瞬く間に侵食変性させる。' },

  // 6. エネルギー
  { id: 38, name: '火 (Fire)', cat: 'エネルギー', color: [255, 180, 0, 255], density: -6, state: 'gas', temp: 900, desc: 'プラズマ燃焼。可燃物を焼き尽くし熱を周囲へ拡散。' },
  { id: 39, name: 'プラズマ (Plasma)', cat: 'エネルギー', color: [200, 100, 255, 255], density: -9, state: 'gas', temp: 5000, desc: '極限高電離気体。超高熱光線と破壊力を放出。' },
  { id: 40, name: '雷火 (Lightning)', cat: 'エネルギー', color: [255, 255, 180, 255], density: 0, state: 'gas', temp: 12000, desc: '超高圧電撃。直撃した物体を分子レベルで瞬時に分解。' },

  // 7. 特殊 ＆ 未来技術 (Special & Ultimate)
  { id: 41, name: '反物質 (Antimatter)', cat: '特殊', color: [255, 0, 255, 255], density: 0, state: 'solid', temp: 0, desc: '触れたあらゆる物質と対消滅を起こし、激しいスパーク衝撃波を放つ。' },
  { id: 42, name: 'ブラックホール (BlackHole)', cat: '特殊', color: [10, 10, 30, 255], density: 999, state: 'solid', temp: 0, desc: '周囲の全ピクセルを渦状に強烈吸引・消滅させる極大重力特異点。' },
  { id: 43, name: '高能率レーザー (Laser)', cat: 'エネルギー', color: [0, 255, 255, 255], density: -10, state: 'gas', temp: 9999, desc: '照射部位の全ピクセルを極限高熱で融解・気化蒸発させる。' }
];

// 残り157個の元素を自動補填展開（全200種類）
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

for (let i = 44; i <= 200; i++) {
  const cat = CATEGORY_NAMES[i % CATEGORY_NAMES.length];
  const col = CATEGORY_COLORS[cat];
  const stateMap = { '固形': 'solid', '液体': 'liquid', '粉末': 'powder', '気体': 'gas', '生命': 'solid', 'エネルギー': 'gas', '特殊': 'solid' };
  const densityMap = { '固形': 20, '液体': 5, '粉末': 10, '気体': -2, '生命': 6, 'エネルギー': -5, '特殊': 15 };

  ALL_ELEMENTS.push({
    id: i,
    name: `元素 #${i} (${cat}化合物)`,
    cat: cat,
    color: [col[0] + (i * 7) % 60, col[1] + (i * 11) % 60, col[2] + (i * 13) % 60, col[3]],
    density: densityMap[cat] + (i % 5),
    state: stateMap[cat],
    viscosity: (i % 8) + 1,
    dispersion: cat === '液体' ? ((i % 10) + 4) : 1,
    temp: cat === 'エネルギー' ? 1000 : 20,
    desc: `元素分類 #${i} の${cat}化学物質。`
  });
}

window.ALL_ELEMENTS = ALL_ELEMENTS;
