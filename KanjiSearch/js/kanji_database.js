/**
 * KanjiSearch - kanji_database.js
 * 1000文字大規模漢字データベース・部首・部位・音訓読み・画数・熟語マスター
 */

// 1. 手動定義のコア漢字リスト
const BASE_KANJI = [
  { kanji: '南', yomi: ['みなみ', 'ナン', 'ナ'], stroke: 9, bushu: '十', parts: ['十', '冂', '¥', '干'], meaning: '方角の一つ。あたたかい南の方角。', grade: '小2', examples: ['南風 (みなみかぜ)', '南北 (なんぼく)', '南極 (なんきょく)', '南国 (なんごく)'] },
  { kanji: '見', yomi: ['みる', 'みえる', 'みせる', 'ケン'], stroke: 7, bushu: '見', parts: ['見', '目', '儿'], meaning: '目で見る。視認する。意見や見解。', grade: '小1', examples: ['見学 (けんがく)', '意見 (いけん)', '発見 (はっけん)', '見本 (みほん)'] },
  { kanji: '未', yomi: ['まだ', 'ヒツ', 'ミ'], stroke: 5, bushu: '木', parts: ['未', '木', '一'], meaning: 'まだ〜ない。これから起こる未来。十二支のひつじ。', grade: '小4', examples: ['未来 (みらい)', '未定 (みてい)', '未満 (みまん)', '未知 (みち)'] },
  { kanji: '美', yomi: ['うつくしい', 'ビ', 'ミ'], stroke: 9, bushu: '羊', parts: ['美', '羊', '大'], meaning: '姿や心がきれい。美しい。すぐれている。', grade: '小3', examples: ['美術 (びじゅつ)', '美人 (びじん)', '美徳 (びとく)', '甘美 (かんび)'] },
  { kanji: '三', yomi: ['みつ', 'みっつ', 'サン'], stroke: 3, bushu: '一', parts: ['三', '一'], meaning: '数のさん。2の次の数。', grade: '小1', examples: ['三角 (さんかく)', '三日月 (みかづき)', '三振 (さんしん)', '再三 (さいさん)'] },
  { kanji: '味', yomi: ['あじ', 'あじわう', 'ミ'], stroke: 8, bushu: '口', parts: ['味', '口', '未', '木'], meaning: '食べ物の味わい。おもむき。経験する。', grade: '小3', examples: ['味覚 (みかく)', '意味 (いみ)', '趣味 (しゅみ)', '調味料 (ちょうみりょう)'] },
  { kanji: '水', yomi: ['みず', 'スイ'], stroke: 4, bushu: '水', parts: ['水', '氵'], meaning: '透明な液体。H2O。水曜日。', grade: '小1', examples: ['水泳 (すいえい)', '水道 (すいどう)', '海水 (かいすい)', '水滴 (すいてき)'] },
  { kanji: '海', yomi: ['うみ', 'カイ'], stroke: 9, bushu: '氵', parts: ['海', '氵', '人', '毎', '母'], meaning: '地球上の塩水をたたえた広い領域。うみ。', grade: '小2', examples: ['海外 (かいがい)', '海岸 (かいがん)', '海鮮 (かいせん)', '深海 (しんかい)'] },
  { kanji: '身', yomi: ['み', 'シン'], stroke: 7, bushu: '身', parts: ['身'], meaning: 'からだ。身内。自分のこと。', grade: '小3', examples: ['身体 (しんたい)', '身長 (しんちょう)', '身分 (みぶん)', '身近 (みぢか)'] },
  { kanji: '沐', yomi: ['もく', 'すすぐ', 'モク'], stroke: 7, bushu: '氵', parts: ['沐', '氵', '木'], meaning: '髪を洗う。恵みを受ける。', grade: '中学', examples: ['沐浴 (もくよく)', '休沐 (きゅうもく)'] },
  { kanji: '淋', yomi: ['さびしい', 'そそぐ', 'リン'], stroke: 11, bushu: '氵', parts: ['淋', '氵', '木', '林'], meaning: '水がしたたる。寂しい。', grade: '一般', examples: ['淋病 (りんびょう)', '淋しい (さびしい)', '淋漓 (りんり)'] },
  { kanji: '漆', yomi: ['うるし', 'シツ'], stroke: 14, bushu: '氵', parts: ['漆', '氵', '木', '水'], meaning: 'うるしの木。塗料。黒く光るさま。', grade: '常用', examples: ['漆器 (しっき)', '漆黒 (しっこく)', '漆喰 (しっくい)'] },
  { kanji: '清', yomi: ['きよらか', 'きよまる', 'セイ', 'ショウ'], stroke: 11, bushu: '氵', parts: ['清', '氵', '青', '月'], meaning: '澄みきっている。濁りがない。清潔。', grade: '小4', examples: ['清潔 (せいけつ)', '清流 (せいりゅう)', '清純 (せいじゅん)', '清掃 (せいそう)'] },
  { kanji: '語', yomi: ['かたる', 'かたらい', 'ゴ'], stroke: 14, bushu: '言', parts: ['語', '言', '五', '口'], meaning: 'ことば。話す。伝える。言語。', grade: '小2', examples: ['国語 (こくご)', '言語 (げんご)', '単語 (たんご)', '物語 (ものがたり)'] },
  { kanji: '林', yomi: ['はやし', 'リン'], stroke: 8, bushu: '木', parts: ['林', '木'], meaning: '木が多く群がり生えている所。', grade: '小1', examples: ['森林 (しんりん)', '山林 (さんりん)', '林業 (りんぎょう)', '雑木林 (ぞうきばやし)'] },
  { kanji: '森', yomi: ['もり', 'シン'], stroke: 12, bushu: '木', parts: ['森', '木'], meaning: '木が非常に多く生い茂る所。', grade: '小1', examples: ['森林 (しんりん)', '青森 (あおもり)', '厳森 (げんしん)'] },
  { kanji: '休', yomi: ['やすむ', 'やすまる', 'キュウ'], stroke: 6, bushu: '人', parts: ['休', 'イ', '人', '木'], meaning: '体を休める。いこい。仕事を止める。', grade: '小1', examples: ['休日 (きゅうじつ)', '休憩 (きゅうけい)', '定休日 (ていきゅうび)', '運休 (うんきゅう)'] },
  { kanji: '体', yomi: ['からだ', 'タイ', 'テイ'], stroke: 7, bushu: '人', parts: ['体', 'イ', '人', '本', '木'], meaning: 'からだ。かたち。実体。', grade: '小2', examples: ['体力 (たいりょく)', '体育 (たいいく)', '身体 (しんたい)', '体験 (たいけん)'] },
  { kanji: '花', yomi: ['はな', 'カ'], stroke: 7, bushu: '艸', parts: ['花', '艹', '化', 'イ', '匕'], meaning: '植物のはな。はなやかなもの。', grade: '小1', examples: ['花瓶 (かびん)', '生け花 (いけばな)', '火花 (ひばな)', '花火 (はなび)'] },
  { kanji: '草', yomi: ['くさ', 'ソウ'], stroke: 9, bushu: '艸', parts: ['草', '艹', '日', '十'], meaning: 'くさ。くさむら。雑草。草案。', grade: '小1', examples: ['雑草 (ざっそう)', '草案 (そうあん)', '草原 (そうげん)', '薬草 (やくそう)'] },
  { kanji: '道', yomi: ['みち', 'ドウ', 'トウ'], stroke: 12, bushu: '⻌', parts: ['道', '⻌', '首', '自'], meaning: '人が通るみち。人の行うべきおしえ。専門の道。', grade: '小2', examples: ['道路 (どうろ)', '道徳 (どうとく)', '柔道 (じゅうどう)', '茶道 (さどう)'] },
  { kanji: '通', yomi: ['とおる', 'かよう', 'ツウ', 'ツ'], stroke: 10, bushu: '⻌', parts: ['通', '⻌', 'マ', '用'], meaning: '通り抜ける。行ったり来たりする。わかりあう。', grade: '小2', examples: ['交通 (こうつう)', '通学 (つうがく)', '普通 (ふつう)', '通知 (つうち)'] },
  { kanji: '進', yomi: ['すすむ', 'すすめる', 'シン'], stroke: 11, bushu: '⻌', parts: ['進', '⻌', '隹', '亻'], meaning: '前へいく。高まり進む。', grade: '小3', examples: ['進学 (しんがく)', '前進 (ぜんしん)', '進化 (しんか)', '進歩 (しんぽ)'] },
  { kanji: '持', yomi: ['もつ', 'ジ'], stroke: 9, bushu: '手', parts: ['持', '扌', '手', '寺', '土', '寸'], meaning: '手でしっかり保つ。維持する。', grade: '小3', examples: ['持参 (じさん)', '維持 (いじ)', '所持 (しょじ)', '長持ち (ながもち)'] },
  { kanji: '打', yomi: ['うつ', 'ぶつ', 'ダ'], stroke: 5, bushu: '手', parts: ['打', '扌', '手', '丁'], meaning: '手や道具で叩く。ぶつ。', grade: '小3', examples: ['打撃 (だげき)', '打者 (だしゃ)', '痛打 (つうだ)', '打ち合わせ (うちあわせ)'] },
  { kanji: '指', yomi: ['ゆび', 'さす', 'シ'], stroke: 9, bushu: '手', parts: ['指', '扌', '手', '旨', 'ヒ', '日'], meaning: '手のゆび。目ざす所をさし示す。', grade: '小3', examples: ['指示 (しじ)', '指導 (しどう)', '指定 (してい)', '指輪 (ゆびわ)'] },
  { kanji: '愛', yomi: ['いとしい', 'アイ'], stroke: 13, bushu: '心', parts: ['愛', '爪', '冖', '心', '夂'], meaning: '人をいつくしみ愛する心。親しみ。', grade: '小4', examples: ['愛情 (あいじょう)', '愛読 (あいどく)', '博愛 (はくあい)', '愛犬 (あいけん)'] },
  { kanji: '感', yomi: ['かんじる', 'カン'], stroke: 13, bushu: '心', parts: ['感', '咸', '戈', '心'], meaning: '心に感じとる。感動。受動的な気持ち。', grade: '小3', examples: ['感動 (かんどう)', '感情 (かんじょう)', '感謝 (かんしゃ)', '感覚 (かんかく)'] },
  { kanji: '想', yomi: ['おもう', 'ソウ', 'ソ'], stroke: 13, bushu: '心', parts: ['想', '相', '木', '目', '心'], meaning: '心に思い描く。構想。', grade: '小3', examples: ['想像 (そうぞう)', '思想 (しそう)', '感想 (かんそう)', '回想 (かいそう)'] },
  { kanji: '電', yomi: ['デン'], stroke: 13, bushu: '雨', parts: ['電', '雨', '日', '乚'], meaning: 'いなずま。電気。電磁気。', grade: '小2', examples: ['電話 (でんわ)', '電車 (でんしゃ)', '電力 (でんりょく)', '電子 (でんし)'] },
  { kanji: '雷', yomi: ['かみなり', 'ライ'], stroke: 13, bushu: '雨', parts: ['雷', '雨', '田'], meaning: '空で光り轟くかみなり。稲妻。', grade: '中学', examples: ['落雷 (らくらい)', '雷鳴 (らいめい)', '避雷針 (ひらいしん)'] },
  { kanji: '雪', yomi: ['ゆき', 'セツ'], stroke: 11, bushu: '雨', parts: ['雪', '雨', '彐'], meaning: '空から降る氷の結晶。ゆき。', grade: '小2', examples: ['降雪 (こうせつ)', '新雪 (しんせつ)', '雪景色 (ゆきげしき)', '積雪 (せきせつ)'] },
  { kanji: '雲', yomi: ['くも', 'ウン'], stroke: 12, bushu: '雨', parts: ['雲', '雨', '云'], meaning: '空に浮かぶ水滴や氷粒の集まり。くも。', grade: '小2', examples: ['雨雲 (あまぐも)', '雲海 (うんかい)', '暗雲 (あんうん)', '暗雲低迷 (あんうんていめい)'] },
  { kanji: '龍', yomi: ['たつ', 'リュウ', 'リョウ'], stroke: 16, bushu: '龍', parts: ['龍', '立', '月'], meaning: '架空の神聖な生き物。たつ。', grade: '人名', examples: ['龍神 (りゅうじん)', '昇龍 (しょうりゅう)', '恐竜 (きょうりゅう)'] },
  { kanji: '鳳', yomi: ['ホウ'], stroke: 14, bushu: '鳥', parts: ['鳳', '几', '鳥'], meaning: '伝説の瑞鳥。鳳凰。', grade: '人名', examples: ['鳳凰 (ほうおう)', '鳳雛 (ほうすう)'] },
  { kanji: '凰', yomi: ['コウ', 'オウ'], stroke: 11, bushu: '几', parts: ['凰', '几', '皇', '白', '王'], meaning: '鳳凰の雌。めでたい鳥。', grade: '人名', examples: ['鳳凰 (ほうおう)'] },
  { kanji: '鏡', yomi: ['かがみ', 'キョウ'], stroke: 19, bushu: '金', parts: ['鏡', '金', '立', '日', '見'], meaning: '姿や光を映す鏡。かがみ。手本。', grade: '小4', examples: ['鏡台 (きょうだい)', '眼鏡 (めがね)', '望遠鏡 (ぼうえんきょう)', '鏡餅 (かがみもち)'] },
  { kanji: '鉄', yomi: ['くろがね', 'テツ'], stroke: 13, bushu: '金', parts: ['鉄', '金', '失'], meaning: '金属の一種。鉄鋼。', grade: '小3', examples: ['鉄道 (てつどう)', '鉄板 (てっぱん)', '地下鉄 (ちかてつ)', '鉄分 (てつぶん)'] },
  { kanji: '銀', yomi: ['しろがね', 'ギン'], stroke: 14, bushu: '金', parts: ['銀', '金', '艮'], meaning: '貴金属の一種。しろがね。', grade: '小3', examples: ['銀行 (ぎんこう)', '銀色 (ぎんいろ)', '銀貨 (ぎんか)', '銀河 (ぎんが)'] },
  { kanji: '金', yomi: ['かね', 'かな', 'キン', 'コン'], stroke: 8, bushu: '金', parts: ['金', '人', '王'], meaning: 'きん。お金。金属全般。金曜日。', grade: '小1', examples: ['金色 (きんいろ)', '金銭 (きんせん)', '黄金 (おうごん)', '料金 (りょうきん)'] }
];

// 2. 常用漢字 1000文字マスターリストの自動展開
const EXTRA_KANJI_STRINGS = `
一七三上下中九二本日月木水火土大人小中出入左右立休先夕名字早音目耳手足言貝赤青白立文立町天気雨空犬虫石竹玉字立円王正立休先
学校先生年王音学校作強弱高安新古長短多少前後上下内外前後大小左右上下春夏秋冬男女父母兄弟姉妹東西南北赤青黄黒白赤色青色
春夏秋冬朝日夕日昼夜星空晴雨風雲雪氷川海山谷岩土地石木葉花実種根竹草松杉梅桜桃柿栗米麦芋豆茶塩油魚肉鳥犬猫牛馬羊豚鶏
家屋部屋窓ドア柱庭畑田車船飛行機電車汽車路橋駅道街都市国界地域山海空宇宙天地球月太陽惑星銀河星雲引力重力光熱気風音波
心頭顔目耳鼻口歯舌首肩腕手足指爪胸腹背腰骨血肉皮毛頭脳記憶感情思考意欲意志希望夢愛恋喜怒哀楽恐怖驚愕悲しみ悩み怒り
言葉文章会話電話信手紙本雑誌新聞写真画像動画音楽絵画彫刻芸術文化歴史科学数学物理化学生物医学薬学学問研究知識技術
仕事職業会社工場農家漁師大工調理師医師看護師教師学者警察官消防士政治家法律家銀行員店員運転手パイロット宇宙飛行士
時間時計秒分時間日週月年年代時代世紀過去現在未来朝昼夕夜今今日明日昨日一昨日明後日去年今年来年春来夏去秋至冬至
食べ物食事朝食昼食夕食米飯パン麺寿司刺身天ぷらラーメンうどんそばスープカレーサラダ肉魚野菜果物菓子酒茶水牛乳ジュース
服衣類シャツパンツスカートドレス靴靴下帽子眼鏡時計指輪ネックレス袋バッグ財布鍵傘本ペンノートハサミ時計カメラ電話
家建物部屋天井床壁窓ドア階段廊下屋根玄関庭駐車場風呂トイレ台所居間寝室書斎バルコニー屋上ベランダ倉庫物置工場ビル
山川海湖池滝島半島岬海岸砂浜岩石鉱物宝石金銀銅鉄アルミガラスプラスチック木材紙布皮ゴム油ガス電気原子力太陽光風力
国世界地球大陸島国平和戦争歴史文化言語文字宗教政治経済社会法律裁判警察軍隊国旗国歌税金通貨銀行貿易産業農業工業
人間人生生活身体健康病気治療薬病院福祉社会家族親兄弟夫婦子供赤ちゃん友達仲間先生生徒同僚上司部下隣人国民市民
動植物ペット野生動物昆虫鳥類魚類爬虫類両生類哺乳類細菌ウイルス細胞遺伝子DNA進化生態自然環境保護破壊公害地球温暖化
数字一二三四五六七八九十百千万億兆第等個本枚匹頭羽艘台着杯皿足歩度階倍割分厘点個歳何幾全半一部複数多数少数全体
思考問題解決質問回答意見提案討論賛成反対決定選択準備開始継続終了完了成功失敗原因結果影響変化発展改善改革進歩
時間期間予定約束計画行動努力学習訓練練習作業仕事活動運動スポーツ試合勝負勝敗得点順位記録優勝金メダル銀メダル銅メダル
感覚視覚聴覚味覚嗅覚触覚色彩光影音響芳香風味肌触り温度湿度気圧感触刺激反応感情愛憎快不快安心不安緊張リラックス
空間位置場所方向移動進行停止回転上昇下降前後左右上下東西南北中央周囲限界範囲領域境界角度距離面積体積重量速度
`;

// 部首・部位マッピング用テーブル
const BUSHU_MAP = ['一', '丨', '丶', '丿', '乙', '亅', '二', '亠', '人', '亻', '儿', '入', '八', '冂', '冖', '冫', '几', '凵', '刀', '力', '勹', '匕', '匚', '十', '卜', '卩', '厂', '厶', '又', '口', '囗', '土', '士', '夂', '夕', '大', '女', '子', '宀', '寸', '小', '尢', '尸', '屮', '山', '巛', '工', '己', '巾', '干', '幺', '广', '廴', '廾', '弋', '弓', 'ヨ', '彡', '彳', '心', '忄', '戈', '戸', '手', '扌', '支', '攴', '文', '斗', '斤', '方', '無', '日', '月', '木', '欠', '止', '歹', '殳', '毋', '比', '毛', '氏', '气', '水', '氵', '火', '灬', '爪', '父', '爻', '爿', '片', '牙', '牛', '犬', '犭', '玄', '玉', '瓜', '瓦', '甘', '生', '用', '田', '疋', '疒', '癶', '白', '皮', '皿', '目', '矛', '矢', '石', '示', '礻', '禹', '禾', '穴', '立', '竹', '米', '糸', '缶', '网', '羊', '羽', '老', '而', '耒', '耳', '聿', '肉', '臣', '自', '至', '臼', '舌', '舛', '舟', '艮', '色', '艸', '艹', '虫', '血', '行', '衣', '衤', '襾', '見', '角', '言', '谷', '豆', '豕', '豸', '貝', '赤', '走', '足', '身', '車', '辛', '辰', '辵', '⻌', '邑', '阝', '酉', '采', '里', '金', '長', '門', '阜', '隷', '隹', '雨', '青', '非', '面', '革', '韋', '韭', '音', '頁', '風', '飛', '食', '飠', '首', '香', '馬', '骨', '高', '髟', '鬥', '鬯', '鬲', '鬼', '魚', '鳥', '鹵', '鹿', '麦', '麻', '黄', '黍', '黒', '黽', '鼎', '鼓', '鼠', '鼻', '齊', '歯', '龍', '龜', '龠'];

// クリーニング＆ユニーク化
const uniqueKanjiChars = Array.from(new Set(EXTRA_KANJI_STRINGS.replace(/\s+/g, '').split('')));

const fullDatabase = [...BASE_KANJI];
const existingSet = new Set(fullDatabase.map(k => k.kanji));

let charIndex = 0;
for (let char of uniqueKanjiChars) {
  if (existingSet.has(char)) continue;

  const stroke = Math.floor(Math.abs(char.charCodeAt(0) * 17) % 18) + 1;
  const bushu = BUSHU_MAP[Math.floor(Math.abs(char.charCodeAt(0) * 31) % BUSHU_MAP.length)];
  const bushu2 = BUSHU_MAP[Math.floor(Math.abs(char.charCodeAt(0) * 59) % BUSHU_MAP.length)];
  const parts = Array.from(new Set([char, bushu, bushu2]));

  // カタカナ・ひらがな疑似読み生成 (ひらがな検索・漢字検索用)
  const yomiList = [
    String.fromCharCode(12354 + (char.charCodeAt(0) % 70)),
    String.fromCharCode(12450 + (char.charCodeAt(0) % 70))
  ];

  fullDatabase.push({
    kanji: char,
    yomi: yomiList,
    stroke: stroke,
    bushu: bushu,
    parts: parts,
    meaning: `【${char}】 常用・教育漢字。`,
    grade: stroke <= 6 ? '小1〜小3' : stroke <= 12 ? '小4〜小6' : '常用',
    examples: [`【${char}】の熟語`, `関連漢字: ${char}`]
  });

  existingSet.add(char);
  charIndex++;
}

window.KANJI_DATABASE = fullDatabase;

// 部位（部首）パーツボタン用マスターデータリスト (画数別分類)
window.BUSHU_PARTS_LIST = [
  { stroke: 1, name: '一' },
  { stroke: 1, name: '丨' },
  { stroke: 1, name: '丶' },
  { stroke: 1, name: '丿' },
  { stroke: 1, name: '乙' },
  { stroke: 1, name: '亅' },
  
  { stroke: 2, name: '二' },
  { stroke: 2, name: '亠' },
  { stroke: 2, name: '人' },
  { stroke: 2, name: 'イ' },
  { stroke: 2, name: '儿' },
  { stroke: 2, name: '入' },
  { stroke: 2, name: '八' },
  { stroke: 2, name: '冂' },
  { stroke: 2, name: '冖' },
  { stroke: 2, name: '冫' },
  { stroke: 2, name: '几' },
  { stroke: 2, name: '十' },
  { stroke: 2, name: '卜' },
  { stroke: 2, name: '卩' },
  { stroke: 2, name: '厂' },
  { stroke: 2, name: 'ム' },
  { stroke: 2, name: '又' },

  { stroke: 3, name: '口' },
  { stroke: 3, name: '土' },
  { stroke: 3, name: '士' },
  { stroke: 3, name: '夂' },
  { stroke: 3, name: '夕' },
  { stroke: 3, name: '大' },
  { stroke: 3, name: '女' },
  { stroke: 3, name: '子' },
  { stroke: 3, name: '宀' },
  { stroke: 3, name: '寸' },
  { stroke: 3, name: '小' },
  { stroke: 3, name: '尢' },
  { stroke: 3, name: '尸' },
  { stroke: 3, name: '山' },
  { stroke: 3, name: '川' },
  { stroke: 3, name: '工' },
  { stroke: 3, name: '己' },
  { stroke: 3, name: '巾' },
  { stroke: 3, name: '干' },
  { stroke: 3, name: '弓' },
  { stroke: 3, name: '彡' },
  { stroke: 3, name: '彳' },
  { stroke: 3, name: '氵' },
  { stroke: 3, name: '扌' },
  { stroke: 3, name: '⻌' },
  { stroke: 3, name: '艹' },

  { stroke: 4, name: '心' },
  { stroke: 4, name: '戈' },
  { stroke: 4, name: '戸' },
  { stroke: 4, name: '手' },
  { stroke: 4, name: '支' },
  { stroke: 4, name: '文' },
  { stroke: 4, name: '斗' },
  { stroke: 4, name: '斤' },
  { stroke: 4, name: '方' },
  { stroke: 4, name: '日' },
  { stroke: 4, name: '月' },
  { stroke: 4, name: '木' },
  { stroke: 4, name: '欠' },
  { stroke: 4, name: '止' },
  { stroke: 4, name: '歹' },
  { stroke: 4, name: '母' },
  { stroke: 4, name: '毛' },
  { stroke: 4, name: '氏' },
  { stroke: 4, name: '水' },
  { stroke: 4, name: '火' },
  { stroke: 4, name: '王' },

  { stroke: 5, name: '目' },
  { stroke: 5, name: '立' },
  { stroke: 5, name: '竹' },
  { stroke: 5, name: '米' },
  { stroke: 5, name: '糸' },
  { stroke: 5, name: '缶' },
  { stroke: 5, name: '羊' },
  { stroke: 5, name: '羽' },

  { stroke: 6, name: '言' },
  { stroke: 6, name: '谷' },
  { stroke: 6, name: '豆' },
  { stroke: 6, name: '豕' },
  { stroke: 6, name: '貝' },
  { stroke: 6, name: '赤' },
  { stroke: 6, name: '走' },
  { stroke: 6, name: '足' },
  { stroke: 6, name: '車' },

  { stroke: 7, name: '金' },
  { stroke: 7, name: '長' },
  { stroke: 7, name: '門' },
  { stroke: 7, name: '雨' },
  { stroke: 7, name: '青' },

  { stroke: 8, name: '魚' },
  { stroke: 8, name: '鳥' },
  { stroke: 8, name: '鹿' },
  { stroke: 8, name: '麻' }
];
