/**
 * Cell Simulation - earth_physics.js
 * 天文学・地球物理学・化学熱力学に基づく科学計算エンジン
 */

class EarthPhysicsModel {
  constructor() {
    this.ageYears = 0; // 経過年数 (0年 = 46億年前の地球誕生)
    this.maxAgeYears = 4600000000; // 46億年

    // 現実の物理・環境パラメーター
    this.surfaceTemperatureK = 4000; // 表面温度 (Kelvin). 初期マグマオーシャン: 4000K (1726℃)
    this.surfaceTemperatureC = 1726; // 摂氏℃
    this.atmosphericPressureBar = 100; // 大気圧 (bar). 初期超高圧CO2/H2O大気
    this.oceanCoverage = 0; // 海洋被覆率 (0% -> 71%)
    this.oceanPH = 4.5; // 初期酸性海洋
    this.ozoneLayerDensity = 0; // オゾン層密度 (0% -> 100%)

    // 大気組成比率 (%)
    this.atmosphere = {
      CO2: 90.0,
      H2O: 8.0,
      N2: 1.8,
      CH4: 0.15,
      O2: 0.0001,
      Ar: 0.05
    };

    // 主要元素構成 (地球全体, wt%)
    this.elements = {
      Fe: 32.1,
      O: 30.1,
      Si: 15.1,
      Mg: 13.9,
      S: 2.9,
      Ni: 1.8,
      Ca: 1.5,
      Al: 1.4,
      C: 0.1,
      N: 0.05,
      P: 0.02
    };

    // 生物・化学進化ステージ量
    this.aminoAcidConcentration = 0; // アミノ酸濃度 (ppm)
    this.rnaMoleculeCount = 0; // RNA自己複製分子
    this.singleCellBiomass = 0; // 単細胞生物(シアノバクテリア等)バイオマス
    this.multiCellBiomass = 0; // 多細胞生命
    this.civilizationIndex = 0; // 文明指数 (0% -> 100%: 夜間の都市光)

    // 人為的・外因実験パラメーター
    this.solarLuminosity = 0.7; // 46億年前の太陽は現代の70%の光度
    this.volcanicActivity = 1.0; // 火山活動乗数
  }

  // 1ステップ時間を進行 (yearsDelta: 進行年数)
  step(yearsDelta) {
    this.ageYears += yearsDelta;
    if (this.ageYears > this.maxAgeYears) this.ageYears = this.maxAgeYears;

    const timeRatio = this.ageYears / this.maxAgeYears; // 0.0 -> 1.0

    // 1. 冷却物理モデル (Stefan-Boltzmann 放熱 ＋ 太陽光度上昇)
    this.solarLuminosity = 0.7 + 0.3 * timeRatio;
    
    // マグマから冷却 ➔ 海洋形成 (約44億年前 / timeRatio ≈ 0.04)
    if (this.surfaceTemperatureK > 288) {
      const coolRate = (this.surfaceTemperatureK - 288) * 0.00000005 * Math.max(1, yearsDelta / 1000000);
      this.surfaceTemperatureK = Math.max(288, this.surfaceTemperatureK - coolRate);
    }
    this.surfaceTemperatureC = Math.round(this.surfaceTemperatureK - 273.15);

    // 海洋形成
    if (this.surfaceTemperatureC < 300 && this.oceanCoverage < 71) {
      this.oceanCoverage = Math.min(71, (300 - this.surfaceTemperatureC) * 0.28);
    }

    // 2. 大気組成の科学推移
    // 初期CO2の大半が海水に溶け込み石灰岩として固定化
    if (this.oceanCoverage > 10 && this.atmosphere.CO2 > 0.04) {
      const fixCO2 = 0.002 * Math.max(1, yearsDelta / 1000000);
      this.atmosphere.CO2 = Math.max(0.04, this.atmosphere.CO2 - fixCO2);
      this.atmosphere.N2 = Math.min(78.0, this.atmosphere.N2 + fixCO2 * 0.85);
    }

    // 3. 化学進化 (Miller-Urey / 熱水噴出孔モデル)
    // 条件: 海水が存在 + CH4 + N2 + 熱源 ➔ アミノ酸
    if (this.oceanCoverage > 20 && this.surfaceTemperatureC < 100 && this.surfaceTemperatureC > 10) {
      this.aminoAcidConcentration += 0.01 * (yearsDelta / 1000000);

      // RNA分子 ➔ 最初の細胞 (LUCA) 約38億年前 (timeRatio >= 0.17)
      if (this.aminoAcidConcentration > 50 && this.singleCellBiomass === 0) {
        this.singleCellBiomass = 1.0; // 奇跡の単細胞生命発生！
      }
    }

    // 4. 大酸化イベント (Great Oxidation Event: 約24億年前 / timeRatio >= 0.478)
    if (this.singleCellBiomass > 0) {
      this.singleCellBiomass += 0.05 * (yearsDelta / 1000000);
      
      // シアノバクテリアの光合成: CO2 + H2O ➔ O2
      if (this.atmosphere.CO2 > 0.04) {
        const o2Produced = 0.003 * (yearsDelta / 1000000);
        this.atmosphere.O2 = Math.min(21.0, this.atmosphere.O2 + o2Produced);
      }

      // オゾン層 (O3) 形成
      if (this.atmosphere.O2 > 5.0) {
        this.ozoneLayerDensity = Math.min(100, (this.atmosphere.O2 / 21.0) * 100);
      }
    }

    // 5. 多細胞 ＆ 文明の誕生 (約5億年前〜現代 / timeRatio >= 0.89)
    if (this.ozoneLayerDensity > 80) {
      if (this.multiCellBiomass < 100) {
        this.multiCellBiomass += 0.1 * (yearsDelta / 1000000);
      }

      // 現代〜文明都市光 (約1万年前〜 / timeRatio >= 0.9999)
      if (timeRatio >= 0.999) {
        this.civilizationIndex = Math.min(100, this.civilizationIndex + 1.0 * (yearsDelta / 10000));
      }
    }

    // 大気圧調整
    this.atmosphericPressureBar = Math.max(1.0, 100 - (100 - 1.0) * Math.min(1, timeRatio * 1.5));
    // 海洋pH
    this.oceanPH = Math.min(8.1, 4.5 + (8.1 - 4.5) * Math.min(1, timeRatio * 2.0));
  }

  // 小惑星衝突実験
  triggerAsteroidImpact() {
    this.surfaceTemperatureK += 300;
    this.atmosphere.CO2 += 5.0;
    this.singleCellBiomass = Math.max(0.1, this.singleCellBiomass * 0.5);
  }
}

window.EarthPhysicsModel = EarthPhysicsModel;
