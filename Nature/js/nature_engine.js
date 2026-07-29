/**
 * Nature 3D - nature_engine.js
 * Three.js による高精細 3D 地球・生命・宇宙文明進化エンジン
 */

class Nature3DEngine {
  constructor(canvas) {
    this.canvas = canvas;

    // レンダラー設定 (キャプチャ用に preserveDrawingBuffer: true)
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // シーン ＆ カメラ
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 5, 25);

    // OrbitControls (自由な3D拡大縮小・回転・パン操作)
    if (window.THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.minDistance = 6;
      this.controls.maxDistance = 80;
    }

    // 照明 (太陽光 ＆ 環境光)
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.sunLight.position.set(20, 10, 15);
    this.scene.add(this.sunLight);

    this.ambientLight = new THREE.AmbientLight(0x333344, 0.8);
    this.scene.add(this.ambientLight);

    // 3D 統合地球グループ
    this.earthGroup = new THREE.Group();
    this.scene.add(this.earthGroup);

    // 地球本体メッシュ
    const earthGeo = new THREE.SphereGeometry(5, 64, 64);
    this.earthMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      roughness: 0.7,
      metalness: 0.2,
      wireframe: false
    });
    this.earthMesh = new THREE.Mesh(earthGeo, this.earthMat);
    this.earthGroup.add(this.earthMesh);

    // 大気圏・雲レイヤーメッシュ
    const cloudGeo = new THREE.SphereGeometry(5.12, 64, 64);
    this.cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending
    });
    this.cloudMesh = new THREE.Mesh(cloudGeo, this.cloudMat);
    this.earthGroup.add(this.cloudMesh);

    // 未来ステージ用 3D 軌道リング (Space Station Ring)
    const ringGeo = new THREE.TorusGeometry(7.5, 0.08, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0 });
    this.spaceRing = new THREE.Mesh(ringGeo, ringMat);
    this.spaceRing.rotation.x = Math.PI / 2.5;
    this.scene.add(this.spaceRing);

    // 周回衛星・月メッシュ
    const moonGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.9 });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonGroup = new THREE.Group();
    this.moonGroup.add(this.moonMesh);
    this.moonMesh.position.set(14, 0, 0);
    this.scene.add(this.moonGroup);

    // 3D 宇宙星空スカイボックス (Starfield)
    this.createStarfield();

    // アニメーション用変数
    this.timeScale = 1.0;
    this.currentStageId = 1;
    this.tick = 0;

    // リサイズハンドラ
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.startRenderLoop();
  }

  // 3D 宇宙星空パーティクルスカイボックス
  createStarfield() {
    const count = 2000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 400;
      pos[i + 1] = (Math.random() - 0.5) * 400;
      pos[i + 2] = (Math.random() - 0.5) * 400;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.8 });
    const stars = new THREE.Points(geo, mat);
    this.scene.add(stars);
  }

  // ステージに応じた 3D マテリアル・エフェクトの動的アップデート
  setStageVisuals(stageId) {
    this.currentStageId = stageId;

    // Stage 1〜50 に応じた3Dカラー ＆ マテリアル設定
    if (stageId <= 3) {
      // 1. マグマオーシャン・地球誕生
      this.earthMat.color.setHex(0xff2200);
      this.earthMat.roughness = 0.4;
      this.cloudMat.opacity = 0.4;
      this.cloudMat.color.setHex(0xffaa44);
      this.spaceRing.material.opacity = 0;
    } else if (stageId <= 7) {
      // 2. 原始海洋 ＆ 単細胞誕生
      this.earthMat.color.setHex(0x0284c7);
      this.earthMat.roughness = 0.2;
      this.cloudMat.opacity = 0.3;
      this.cloudMat.color.setHex(0xffffff);
      this.spaceRing.material.opacity = 0;
    } else if (stageId === 8) {
      // 3. スノーボールアース (全球凍結)
      this.earthMat.color.setHex(0xe2e8f0);
      this.earthMat.roughness = 0.9;
      this.cloudMat.opacity = 0.1;
      this.spaceRing.material.opacity = 0;
    } else if (stageId <= 20) {
      // 4. 古生代・中生代（恐竜の時代）
      this.earthMat.color.setHex(0x15803d); // 濃い緑と海
      this.earthMat.roughness = 0.5;
      this.cloudMat.opacity = 0.35;
      this.cloudMat.color.setHex(0xffffff);
      this.spaceRing.material.opacity = 0;
    } else if (stageId <= 35) {
      // 5. 人類誕生 ＆ 古代〜中世文明
      this.earthMat.color.setHex(0x16a34a);
      this.earthMat.roughness = 0.6;
      this.cloudMat.opacity = 0.25;
      this.spaceRing.material.opacity = 0;
    } else if (stageId <= 43) {
      // 6. 現代〜近未来（メガシティ夜景）
      this.earthMat.color.setHex(0x0d9488);
      this.earthMat.roughness = 0.4;
      this.cloudMat.opacity = 0.2;
      this.spaceRing.material.opacity = 0;
    } else {
      // 7. 未来の宇宙文明 (軌道エレベータ ＆ ダイソンリング)
      this.earthMat.color.setHex(0x0284c7);
      this.earthMat.roughness = 0.3;
      this.cloudMat.opacity = 0.15;
      this.spaceRing.material.opacity = 0.8;
      this.spaceRing.material.color.setHex(0x38bdf8);
    }
  }

  startRenderLoop() {
    const animate = () => {
      requestAnimationFrame(animate);

      if (this.timeScale > 0) {
        const speed = Math.min(100, 0.003 * Math.sqrt(this.timeScale));
        this.earthGroup.rotation.y += speed;
        this.cloudMesh.rotation.y += speed * 1.2;
        this.moonGroup.rotation.y += speed * 0.4;
        this.spaceRing.rotation.z += speed * 0.8;
      }

      if (this.controls) this.controls.update();

      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }
}

window.Nature3DEngine = Nature3DEngine;
