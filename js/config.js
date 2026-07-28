/**
 * config.js - ゲーム一覧、ランク(200種類)、称号(300種類)データ定義
 */

// ゲーム一覧
const GAMES_LIST = [
  { id: 'tictactoe', name: '〇✕ゲーム', icon: '❌⭕', desc: 'シンプルかつ奥深い定番頭脳ゲーム' },
  { id: 'reversi', name: 'オセロ (リバーシ)', icon: '⚪⚫', desc: '挟んで裏返す！最後の最後まで油断できない名作' },
  { id: 'gomoku', name: '五目並べ', icon: '碁', desc: '縦横斜めに5つの石を先に並べた者が勝利' },
  {
    id: 'go',
    name: '囲碁',
    icon: '⚫⚪',
    desc: '陣地を競う最古の頭脳格闘技。盤面サイズと置石ルールを選択可能！',
    hasSubOptions: true,
    options: {
      boardSize: [
        { label: '9路盤', value: 9 },
        { label: '13路盤', value: 13 },
        { label: '19路盤', value: 19 }
      ],
      handicap: [
        { label: '置石なし (互先)', value: 0 },
        { label: '置石あり (ハンデ)', value: 2 }
      ]
    }
  },
  { id: 'chess', name: 'チェス', icon: '♟️', desc: '世界中で愛される王道のチェス' },
  { id: 'shogi', name: '将棋', icon: '☖', desc: '取った駒を活用する日本伝統の将棋' },
  {
    id: 'cards_daifugo',
    name: 'トランプ：大富豪',
    icon: '🃏',
    desc: '革命、8切り、流し！富豪を目指す大人気カードゲーム'
  },
  {
    id: 'cards_sevens',
    name: 'トランプ：7ならべ',
    icon: '🂠',
    desc: '7を中心にしてカードを繋げる駆け引きゲーム'
  },
  {
    id: 'cards_speed',
    name: 'トランプ：スピード',
    icon: '⚡',
    desc: '反射神経と判断力が命！カードを素早く重ねろ'
  },
  {
    id: 'cards_oldmaid',
    name: 'トランプ：ババ抜き',
    icon: '🤡',
    desc: 'ジョーカーを引かずに最後の1人にならないよう抜け出せ'
  },
  {
    id: 'cards_jijinuki',
    name: 'トランプ：ジジ抜き',
    icon: '❓',
    desc: '伏せられた1枚が何か分からないスリリングな心理戦'
  }
];

// 階級名のリスト (全20階級 × 10サブランク = 200ランク)
const RANK_TIERS = [
  'ブロンズ', 'シルバー', 'ゴールド', 'プラチナ', 'ダイヤモンド',
  'エメラルド', 'サファイア', 'ルビー', 'アメジスト', 'トパーズ',
  'チタン', 'クリスタル', 'コバルト', 'ミシック', 'レジェンド',
  'グランドマスター', 'チャンピオン', 'オーバーロード', 'ゴッド', 'マスター'
];

const ROMAN_NUMS = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ'];

// 200ランクの全リスト生成
function generate200Ranks() {
  const ranks = [];
  let id = 1;
  for (let i = 0; i < RANK_TIERS.length; i++) {
    for (let j = 0; j < ROMAN_NUMS.length; j++) {
      ranks.push({
        id: id,
        name: `${RANK_TIERS[i]} ${ROMAN_NUMS[j]}`,
        tier: RANK_TIERS[i],
        tierIndex: i,
        subIndex: j + 1,
        minExp: (id - 1) * 100
      });
      id++;
    }
  }
  return ranks;
}

const ALL_RANKS = generate200Ranks(); // 1 to 200

// 300個の称号定義を生成
function generate300Titles() {
  const titles = [];

  // 特定の代表的特別称号
  const specialTitles = [
    { id: 1, name: '初めの一歩', desc: '初めて対戦に参加した証', condition: { type: 'play', count: 1 } },
    { id: 2, name: '初勝利の喜び', desc: '初めて対戦で勝利した', condition: { type: 'win', count: 1 } },
    { id: 3, name: '囲碁名人', desc: '囲碁でマスターⅩ（ランク200）に到達した', condition: { game: 'go', rank: 200 } },
    { id: 4, name: '将棋達人', desc: '将棋でマスターⅩ（ランク200）に到達した', condition: { game: 'shogi', rank: 200 } },
    { id: 5, name: 'チェスマスター', desc: 'チェスでマスターⅩ（ランク200）に到達した', condition: { game: 'chess', rank: 200 } },
    { id: 6, name: '大富豪の帝王', desc: 'トランプ大富豪でマスターⅩ（ランク200）に到達した', condition: { game: 'cards_daifugo', rank: 200 } },
    { id: 7, name: 'オセロ王', desc: 'オセロでマスターⅩ（ランク200）に到達した', condition: { game: 'reversi', rank: 200 } },
    { id: 8, name: '五目並べの神', desc: '五目並べでマスターⅩ（ランク200）に到達した', condition: { game: 'gomoku', rank: 200 } },
    { id: 9, name: 'AIハンター', desc: 'AI対戦でレベル20に勝利した', condition: { type: 'ai_win', level: 20 } },
    { id: 10, name: '常勝無敗', desc: '対戦で10連勝を達成した', condition: { type: 'streak', count: 10 } }
  ];

  specialTitles.forEach(t => titles.push(t));

  // 各ゲームごと・条件ごとに称号を拡張生成して計300種類にする
  let idCounter = 11;
  const categories = ['対戦数', '勝利数', 'AI撃破', 'ランク昇格'];
  
  GAMES_LIST.forEach((game) => {
    // ランク称号
    [10, 30, 50, 100, 150, 180, 190, 199].forEach((rVal) => {
      const rObj = ALL_RANKS[rVal - 1];
      titles.push({
        id: idCounter++,
        name: `${game.name}の${rObj.tier}プレイヤー`,
        desc: `${game.name}でランク「${rObj.name}」以上に到達した`,
        condition: { game: game.id, rank: rVal }
      });
    });

    // 勝利数称号
    [5, 10, 25, 50, 100, 200, 500].forEach((wCount) => {
      titles.push({
        id: idCounter++,
        name: `${game.name} ${wCount}勝達成`,
        desc: `${game.name}で通算${wCount}回勝利を収めた`,
        condition: { game: game.id, winCount: wCount }
      });
    });

    // AIレベル到達称号
    [5, 10, 15, 20].forEach((lvl) => {
      titles.push({
        id: idCounter++,
        name: `${game.name} AI Level ${lvl} 破り`,
        desc: `${game.name}のAI強さレベル ${lvl} を撃破した`,
        condition: { game: game.id, aiLevel: lvl }
      });
    });
  });

  // 残りを全般系称号で埋めてちょうど300個にする
  while (titles.length < 300) {
    const num = titles.length + 1;
    titles.push({
      id: idCounter++,
      name: `ゲーム探求者 No.${num}`,
      desc: `プラットフォームで様々な挑戦を行い、通算${num * 2}回のプレイを記録した`,
      condition: { type: 'play', count: num * 2 }
    });
  }

  return titles.slice(0, 300);
}

const ALL_TITLES = generate300Titles();
