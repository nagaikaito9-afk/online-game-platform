/**
 * Nature 3D - app.js
 * 全50ステージDB ＆ 視点モード(1:地球, 2:地形, 3:詳細, 4:細胞) ＆ 写真/動画保存
 */

const STAGES_DATA = [
  { id: 1, era: "46億年前", title: "地球誕生 ＆ マグマオーシャン", desc: "微惑星の衝突エネルギーにより、誕生直後の地球全表層が灼熱のマグマの海で覆われていた時代。大気は二酸化炭素と水蒸気で満ちている。" },
  { id: 2, era: "45億年前", title: "微惑星の大衝突 ＆ 月の誕生", desc: "原始地球に火星サイズの天体「テイア」が衝突。飛び散った破片が集まり、地球の伴天体である「月」が形成された。" },
  { id: 3, era: "40億年前", title: "地球の冷却 ＆ 原始海洋の形成", desc: "マグマが冷えて岩石の地殻が形成され、上空の巨大な雲から激しい雨が何千年も降り注ぎ、温かい原始海洋が生まれた。" },
  { id: 4, era: "38億年前", title: "海底熱水噴出孔 ＆ 有機分子の合成", desc: "光の届かない海底の熱水噴出孔付近で、アミノ酸や核酸などの複雑な有機分子が化学合成された。" },
  { id: 5, era: "35億年前", title: "最初の単細胞生命（RNA/DNA）誕生", desc: "自我を持たない自己複製システムが完成し、地球上に奇跡の生命（単細胞原核生物）が初めて誕生した。" },
  { id: 6, era: "27億年前", title: "シアノバクテリア ＆ 酸素革命", desc: "太陽光を利用して光合成を行うシアノバクテリアが大繁殖。海洋と大気に大量の酸素が放出され始めた。" },
  { id: 7, era: "21億年前", title: "真核生物の登場 ＆ 細胞の進化", desc: "細胞内に核やミトコンドリアを持つ複雑な「真核生物」が登場。生命の多様化が加速する。" },
  { id: 8, era: "7億年前", title: "スノーボールアース（全球凍結）", desc: "温室効果ガスの減少により、赤道に至る地球全体が分厚い氷床で覆われた極限の氷河時代。" },
  { id: 9, era: "6億年前", title: "全球凍結の解凍 ＆ エディアカラ生物群", desc: "火山活動で二酸化炭素が増加し氷が融解。浅瀬に柔らかい大型多細胞生物（エディアカラ生物群）が出現。" },
  { id: 10, era: "5.4億年前", title: "カンブリア爆発（アノマロカリス）", desc: "眼や殻を持つ多様な無脊椎動物が爆発的に進化。最強の捕食者アノマロカリスが海を支配した。" },
  { id: 11, era: "4.8億年前", title: "最初の魚類 ＆ 甲冑魚の台頭", desc: "背骨を持つ脊椎動物の祖先（魚類）が登場。外骨格で身を守る甲冑魚が海を泳ぎ回る。" },
  { id: 12, era: "4.3億年前", title: "植物の陸上進出（クックソニア）", desc: "オゾン層が形成され有害な紫外線が遮断されたことで、植物が初めて上陸を果たした。" },
  { id: 13, era: "3.7億年前", title: "両生類の登場（イクチオステガ）", desc: "ヒレが脚へと進化し、魚類から枝分かれした両生類が陸地を踏みしめた。" },
  { id: 14, era: "3.5億年前", title: "石炭紀の超巨大昆虫（メガネウラ）", desc: "大気中の酸素濃度が35%に達し、翼長70cmの巨大トンボや大森林が広がる。" },
  { id: 15, era: "3.1億年前", title: "爬虫類の分岐 ＆ 卵の進化", desc: "乾燥に強い殻を持つ卵を産む爬虫類が登場し、水辺から離れた内陸部へ進出。" },
  { id: 16, era: "2.5億年前", title: "ペルム紀大絶滅（P-T境界）", desc: "シベリアの超大規模噴火により、全地球生命の96%が死滅した史上最大の絶滅イベント。" },
  { id: 17, era: "2.3億年前", title: "三畳紀・恐竜の誕生", desc: "大絶滅を生き延びた爬虫類から、直立歩行を可能にした素早い恐竜たちが誕生した。" },
  { id: 18, era: "1.5億年前", title: "ジュラ紀の巨大竜脚類（ブラキオサウルス）", desc: "温暖な気候と豊かな森林のもと、体長30mを超える超巨大草食恐竜たちが地球を闊歩した。" },
  { id: 19, era: "7000万年前", title: "白亜紀の覇者（ティラノサウルス）", desc: "最強の肉食恐竜ティラノサウルスやトリケラトプスが進化の頂点を極めた時代。" },
  { id: 20, era: "6600万年前", title: "巨大隕石衝突 ＆ 恐竜の絶滅", desc: "ユカタン半島に直径10kmの巨大隕石が激突。津波と暗黒の冬により恐竜時代が終焉を迎えた。" },
  { id: 21, era: "6000万年前", title: "哺乳類の爆発的適応放散", desc: "恐竜がいなくなった生態系の空白を埋めるように、小型哺乳類が多様な姿へと急速進化。" },
  { id: 22, era: "5000万年前", title: "原始霊長類の登場 ＆ 樹上生活", desc: "立体視と器用な手先を持つ原始的なサル（霊長類）が熱帯雨林の木の上で栄えた。" },
  { id: 23, era: "4000万年前", title: "古代クジラ（バシロサウルス）の海洋進出", desc: "陸上にいた四足哺乳類の一部が再び海へと戻り、大型の海洋クジラ類へと進化した。" },
  { id: 24, era: "3000万年前", title: "ヒマラヤ山脈の隆起 ＆ 気候変動", desc: "インド大陸がユーラシア大陸に激突。世界最高峰ヒマラヤ山脈が形成され大気循環が一変。" },
  { id: 25, era: "250万年前", title: "氷河期の到来 ＆ マンモスの闊歩", desc: "北半球に巨大な氷床が発達。寒冷な草原を毛深く巨大なマンモスやセイバーツースが歩いた。" },
  { id: 26, era: "400万年前", title: "直立二足歩行（アウストラロピテクス）", desc: "アフリカの乾燥化に伴い、樹上から草原に降りた人類の祖先が両手を自由にする二足歩行を始めた。" },
  { id: 27, era: "150万年前", title: "火の使用（ホモ・エレクトス）", desc: "人類が自然界の「火」をコントロールし、暖を取り調理を行うことで脳容量が飛躍的に増大した。" },
  { id: 28, era: "30万年前", title: "ホモ・サピエンスの誕生", desc: "高い知能と複雑な言語コミュニケーション機能を持つ現代人類（ホモ・サピエンス）が誕生。" },
  { id: 29, era: "1.2万年前", title: "最後の氷河期終息 ＆ 温暖化", desc: "約10万年続いた最終氷期が終わりを迎え、海水面が上昇し世界各地に豊かな森林が復活した。" },
  { id: 30, era: "紀元前1万年", title: "農業革命 ＆ 最初の定住集落", desc: "狩猟採集から小麦や米の栽培、家畜の飼育へ移行。人類が土地に定住し集落を形成した。" },
  { id: 31, era: "紀元前3500年", title: "メソポタミア・エジプト古代文明", desc: "大河の流域に文字、青銅器、大規模な都市国家が誕生。人類最古の文明が幕を開けた。" },
  { id: 32, era: "紀元前2500年", title: "ピラミッド建設 ＆ 建築の隆盛", desc: "古代エジプトで巨石建築ピラミッドが建設され、天文学と数学が発展した。" },
  { id: 33, era: "紀元前500年", title: "ギリシャ哲学 ＆ ローマ帝国の拡大", desc: "民主主義や哲学が花開き、地中海全体を覆う巨大な網の目のような都市インフラ国家が成立。" },
  { id: 34, era: "2世紀", title: "シルクロード交易 ＆ 東西文明の交差", desc: "ユーラシア大陸を東西に貫く交易路「絹の道」を通じて、技術、宗教、文化が世界を駆け巡った。" },
  { id: 35, era: "15世紀", title: "大航海時代 ＆ 世界地図の完成", desc: "帆船に乗った探検家たちが大海原へ乗り出し、未知の大陸を発見。全地球がつながった。" },
  { id: 36, era: "18世紀", title: "産業革命 ＆ 蒸気機関の発明", desc: "石炭と蒸気機関の発明により手作業から工場大量生産へシフト。近代社会が急加速した。" },
  { id: 37, era: "19世紀末", title: "電化の時代 ＆ 自動車の普及", desc: "電力網が都市を照らし、ガソリン自動車が馬車に代わって世界中の道路を走り始めた。" },
  { id: 38, era: "20世紀初頭", title: "飛行機の発明 ＆ 空の開拓", desc: "ライト兄弟の初飛行からわずか数十年で、大空を飛ぶ巨大旅客機が人類の距離感をなくした。" },
  { id: 39, era: "1945年", title: "原子力時代 ＆ 宇宙競争の幕開け", desc: "原子のエネルギーが解き放たれ、米ソによる弾道ミサイルと宇宙開発の猛烈な競争が始まった。" },
  { id: 40, era: "1969年", title: "人類初の月面着陸（アポロ11号）", desc: "「一人の人間にとっては小さな一歩だが、人類にとっては偉大な飛躍である」人類が他の天体に足跡を記した。" },
  { id: 41, era: "1990年代", title: "インターネット ＆ デジタル情報革命", desc: "世界中のコンピュータがネットワークで結ばれ、情報が光の速さで交響するデジタル時代が到来。" },
  { id: 42, era: "21世紀現在", title: "メガシティ ＆ グローバル高度文明", desc: "80億の人類が高層ビル群メガシティに暮らし、人工知能とスマートフォンで世界がリアルタイム接続。" },
  { id: 43, era: "2040年代", title: "再生可能エネルギー ＆ グリーン地球", desc: "脱炭素社会が結実し、核融合発電とクリーンテクノロジーによって地球の美しい環境が再生。" },
  { id: 44, era: "2080年代", title: "火星テラフォーミング計画の始動", desc: "赤い惑星「火星」に大気と水を注ぎ込み、第二の地球へと変貌させる壮大な惑星改造が開始。" },
  { id: 45, era: "2150年", title: "軌道エレベータ ＆ 地球圏宇宙都市", desc: "赤道から宇宙空間へ伸びる静止軌道エレベータが完成。何百万人もが宇宙ステーションシティに居住。" },
  { id: 46, era: "2200年", title: "月面永久都市 BASE 誕生", desc: "月の地下ドーム内に人口100万人規模の自給自足型永久都市が建設され、宇宙拠点が完成。" },
  { id: 47, era: "2300年", title: "木星圏コロニー開拓 ＆ ガニメデ基地", desc: "木星の巨大な衛星群（ガニメデ、エウロパ）に大規模な資源掘削ドームと空中都市が展開。" },
  { id: 48, era: "2500年", title: "恒星間宇宙船 ＆ ダイソン球の構築", desc: "太陽の全エネルギーを回収するメガストラクチャー「ダイソン球」の建設が太陽系で開始。" },
  { id: 49, era: "3000年", title: "銀河文明（Type II シヴィライゼーション）", desc: "人類は光速を超えた超空間航法を獲得し、天の川銀河の何千もの星系へコロニーを拡大。" },
  { id: 50, era: "5000年未来", title: "宇宙意識統合 ＆ 全知の地球神話", desc: "物質を超越した超知能意識体が宇宙の真理と融合。全宇宙の輝きを見守る伝説の母なる地球へ。" }
];

class Nature3DApp {
  constructor() {
    this.canvas = document.getElementById('nature-canvas');
    this.engine = new Nature3DEngine(this.canvas);

    this.currentStageId = 1;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;

    this.bindEvents();
    this.renderStagesGrid();
    this.setStage(1);
    this.startEvolutionLoop();
  }

  showToast(msg) {
    const toast = document.getElementById('custom-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  setStage(stageId) {
    if (stageId < 1) stageId = 1;
    if (stageId > 50) stageId = 50;

    this.currentStageId = stageId;
    const stage = STAGES_DATA[stageId - 1];

    document.getElementById('stage-number-badge').textContent = `Stage ${stage.id} / 50`;
    document.getElementById('stage-era-text').textContent = stage.era;
    document.getElementById('stage-title-text').textContent = stage.title;
    document.getElementById('stage-desc-text').textContent = stage.desc;
    document.getElementById('stage-range-slider').value = stage.id;

    this.engine.setStageVisuals(stage.id);

    if (window.natureAudioEngine) window.natureAudioEngine.playSE('click');
  }

  // 👁️ 視点モード切り替え
  switchViewMode(mode) {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.view-btn[data-view="${mode}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    this.engine.setViewMode(mode);

    const modeNames = {
      1: "🌍 1: 地球観察モード (Global Orbit)",
      2: "🏔️ 2: 地形観察モード (Terrain View)",
      3: "🧍 3: 詳細観察モード (Macro Detail)",
      4: "🔬 4: 細胞規模観察モード (Micro Cell)"
    };

    this.showToast(`👁️ 視点切替: 【${modeNames[mode]}】`);
    if (window.natureAudioEngine) window.natureAudioEngine.playSE('click');
  }

  bindEvents() {
    // 👁️ 視点モードボタン
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = parseInt(e.target.dataset.view);
        this.switchViewMode(mode);
      });
    });

    // キーボードショートカット (キー 1, 2, 3, 4)
    window.addEventListener('keydown', (e) => {
      if (['1', '2', '3', '4'].includes(e.key)) {
        this.switchViewMode(parseInt(e.key));
      }
    });

    // スライダー操作
    document.getElementById('stage-range-slider').addEventListener('input', (e) => {
      this.setStage(parseInt(e.target.value));
    });

    // 前/次 ボタン
    document.getElementById('btn-prev-stage').addEventListener('click', () => {
      this.setStage(this.currentStageId - 1);
    });

    document.getElementById('btn-next-stage').addEventListener('click', () => {
      this.setStage(this.currentStageId + 1);
    });

    // 倍速ボタン
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (window.natureAudioEngine) window.natureAudioEngine.playSE('click');
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const speed = parseFloat(btn.dataset.speed);
        this.engine.timeScale = speed;
        this.showToast(`⏱️ 進行速度: 【${speed}x】`);
      });
    });

    // 📸 写真保存
    document.getElementById('btn-snapshot').addEventListener('click', () => {
      try {
        const dataURL = this.canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Nature3D_ViewMode${this.engine.currentViewMode}_Stage${this.currentStageId}.png`;
        link.href = dataURL;
        link.click();
        this.showToast('📸 視点モード画面をPNGで保存しました！');
      } catch (e) {
        console.error(e);
        this.showToast('⚠️ キャプチャエラーが発生しました');
      }
    });

    // 🎥 動画録画保存
    const recordBtn = document.getElementById('btn-record');
    recordBtn.addEventListener('click', () => {
      if (!this.isRecording) {
        this.startRecording();
        recordBtn.textContent = '⏹️ 録画を停止して保存';
        recordBtn.classList.add('recording');
        this.showToast('🎥 視点画面の録画を開始しました...');
      } else {
        this.stopRecording();
        recordBtn.textContent = '🎥 動画録画';
        recordBtn.classList.remove('recording');
      }
    });

    // 全50ステージモーダル
    document.getElementById('btn-open-stage-modal').addEventListener('click', () => {
      document.getElementById('modal-stages').classList.add('active');
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('modal-stages').classList.remove('active');
      });
    });
  }

  // 🎥 録画開始
  startRecording() {
    this.recordedChunks = [];
    try {
      const stream = this.canvas.captureStream(30);
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Nature3D_Video_ViewMode${this.engine.currentViewMode}_Stage${this.currentStageId}.webm`;
        a.click();
        this.showToast('🎥 観察動画 (.webm) を正常に保存しました！');
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (e) {
      console.error(e);
      this.showToast('⚠️ 録画APIエラー');
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  renderStagesGrid() {
    const grid = document.getElementById('stages-grid');
    if (!grid) return;
    grid.innerHTML = '';

    STAGES_DATA.forEach(s => {
      const card = document.createElement('div');
      card.className = `stage-card ${s.id === this.currentStageId ? 'active' : ''}`;
      card.innerHTML = `
        <div style="font-size:0.75rem; color:var(--accent-gold); font-weight:bold;">${s.era}</div>
        <div style="font-weight:bold; font-size:0.95rem; margin:0.2rem 0; color:#fff;">#${s.id} ${s.title}</div>
        <div style="font-size:0.75rem; color:var(--text-sub); overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${s.desc}</div>
      `;

      card.addEventListener('click', () => {
        this.setStage(s.id);
        document.getElementById('modal-stages').classList.remove('active');
        this.renderStagesGrid();
      });

      grid.appendChild(card);
    });
  }

  startEvolutionLoop() {
    let tickCount = 0;
    setInterval(() => {
      if (this.engine.timeScale > 0) {
        tickCount += this.engine.timeScale;
        if (tickCount >= 500) {
          tickCount = 0;
          if (this.currentStageId < 50) {
            this.setStage(this.currentStageId + 1);
          }
        }
      }
    }, 100);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.nature3DApp = new Nature3DApp();
});
