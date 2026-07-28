/**
 * Cell Simulation - simulation_engine.js
 * Three.js 超リアル3D地球物理 ＆ テクスチャ動的レンダリングエンジン
 */

class Earth3DRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.model = new EarthPhysicsModel();

    this.isMouseDown = false;
    this.prevMouseX = 0;
    this.prevMouseY = 0;
    this.cameraYaw = 0;
    this.cameraPitch = 0.2;
    this.cameraDist = 14;

    this.initThree();
    this.createEarthGlobe();
    this.bindControls();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020308);

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    // 宇宙星々パーティクル
    const starsGeo = new THREE.BufferGeometry();
    const starCoords = [];
    for (let i = 0; i < 1500; i++) {
      starCoords.push((Math.random() - 0.5) * 400, (Math.random() - 0.5) * 400, (Math.random() - 0.5) * 400);
    }
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.8 });
    const starField = new THREE.Points(starsGeo, starsMat);
    this.scene.add(starField);

    // 太陽光 ＋ 環境光
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(ambient);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.sunLight.position.set(40, 20, 30);
    this.scene.add(this.sunLight);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  createEarthGlobe() {
    this.earthGroup = new THREE.Group();

    // 1. 地球本体メッシュ (Earth Sphere)
    const earthGeo = new THREE.SphereGeometry(5, 64, 64);
    this.earthMat = new THREE.MeshStandardMaterial({
      color: 0xd90429, // 初期マグマカラー
      emissive: 0xd90429,
      emissiveIntensity: 0.8,
      roughness: 0.6,
      metalness: 0.2
    });
    this.earthMesh = new THREE.Mesh(earthGeo, this.earthMat);
    this.earthGroup.add(this.earthMesh);

    // 2. 大気層 (Atmosphere Glow)
    const atmosGeo = new THREE.SphereGeometry(5.25, 32, 32);
    this.atmosMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide
    });
    this.atmosMesh = new THREE.Mesh(atmosGeo, this.atmosMat);
    this.earthGroup.add(this.atmosMesh);

    // 3. 雲層 (Cloud Layer)
    const cloudGeo = new THREE.SphereGeometry(5.08, 48, 48);
    this.cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      roughness: 1.0
    });
    this.cloudMesh = new THREE.Mesh(cloudGeo, this.cloudMat);
    this.earthGroup.add(this.cloudMesh);

    this.scene.add(this.earthGroup);
  }

  bindControls() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isMouseDown) {
        const deltaX = e.clientX - this.prevMouseX;
        const deltaY = e.clientY - this.prevMouseY;
        this.cameraYaw -= deltaX * 0.005;
        this.cameraPitch = Math.max(-1.2, Math.min(1.2, this.cameraPitch + deltaY * 0.005));
        this.prevMouseX = e.clientX;
        this.prevMouseY = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => { this.isMouseDown = false; });

    // ホイールでズーム
    this.canvas.addEventListener('wheel', (e) => {
      this.cameraDist = Math.max(7, Math.min(30, this.cameraDist + e.deltaY * 0.01));
    });
  }

  // 地球の見た目を熱力学・大気モデルに従ってリアルタイムシェーディング更新
  updateEarthVisuals() {
    const tempC = this.model.surfaceTemperatureC;
    const ocean = this.model.oceanCoverage;
    const o2 = this.model.atmosphere.O2;
    const civ = this.model.civilizationIndex;

    // 1. 地球自転
    this.earthMesh.rotation.y += 0.002;
    this.cloudMesh.rotation.y += 0.0025;

    // 2. マグマ ➔ 海洋 ➔ 緑の大陸 ➔ 現代 へのマテリアル遷移
    if (tempC > 500) {
      // 灼熱マグマオーシャン
      const magmaRatio = Math.min(1.0, (tempC - 500) / 1200);
      this.earthMat.color.setHex(0xd90429);
      this.earthMat.emissive.setHex(0xd90429);
      this.earthMat.emissiveIntensity = magmaRatio * 0.9;
      this.cloudMat.opacity = 0.1;
    } else if (ocean > 0 && o2 < 2.0) {
      // 原始海洋 (暗い青緑と灰色の岩肌)
      this.earthMat.color.setHex(0x1d3557);
      this.earthMat.emissive.setHex(0x000000);
      this.earthMat.emissiveIntensity = 0;
      this.cloudMat.opacity = 0.35;
    } else if (o2 >= 2.0) {
      // 青い海と緑の大陸 (生命繁栄期)
      this.earthMat.color.setHex(0x0077b6);
      this.earthMat.emissive.setHex(0x00ff87);
      this.earthMat.emissiveIntensity = 0.05;
      this.cloudMat.opacity = 0.45;

      // 現代文明の夜間都市光 (City Lights)
      if (civ > 5) {
        this.earthMat.emissive.setHex(0xffb703);
        this.earthMat.emissiveIntensity = (civ / 100) * 0.4;
      }
    }

    // 3Dカメラ位置追従
    const camX = Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDist;
    const camZ = Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDist;
    const camY = Math.sin(this.cameraPitch) * this.cameraDist;

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  }
}

window.Earth3DRenderer = Earth3DRenderer;
