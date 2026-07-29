/**
 * Nature 3D - nature_engine.js
 * Three.js による高精細 3D 地球 ＆ 4段階視点モード (地球/地形/詳細生物/細胞) エンジン
 */

class Nature3DEngine {
  constructor(canvas) {
    this.canvas = canvas;

    // WebGL レンダラー (高画質 ＆ キャプチャ対応)
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

    // OrbitControls
    if (window.THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.minDistance = 4.8;
      this.controls.maxDistance = 80;
    }

    // 照明
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.sunLight.position.set(20, 10, 15);
    this.scene.add(this.sunLight);

    this.ambientLight = new THREE.AmbientLight(0x333344, 0.8);
    this.scene.add(this.ambientLight);

    // 3D 地球グループ
    this.earthGroup = new THREE.Group();
    this.scene.add(this.earthGroup);

    // 地球本体
    const earthGeo = new THREE.SphereGeometry(5, 64, 64);
    this.earthMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      roughness: 0.7,
      metalness: 0.2
    });
    this.earthMesh = new THREE.Mesh(earthGeo, this.earthMat);
    this.earthGroup.add(this.earthMesh);

    // 大気圏・雲レイヤー
    const cloudGeo = new THREE.SphereGeometry(5.12, 64, 64);
    this.cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending
    });
    this.cloudMesh = new THREE.Mesh(cloudGeo, this.cloudMat);
    this.earthGroup.add(this.cloudMesh);

    // 未来宇宙軌道リング (Space Ring)
    const ringGeo = new THREE.TorusGeometry(7.5, 0.08, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0 });
    this.spaceRing = new THREE.Mesh(ringGeo, ringMat);
    this.spaceRing.rotation.x = Math.PI / 2.5;
    this.scene.add(this.spaceRing);

    // 月グループ
    const moonGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.9 });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonGroup = new THREE.Group();
    this.moonGroup.add(this.moonMesh);
    this.moonMesh.position.set(14, 0, 0);
    this.scene.add(this.moonGroup);

    // ----------------------------------------------------
    // モード 3: 詳細観察用 3D マクロ層 (Organism & Building Models)
    // ----------------------------------------------------
    this.macroGroup = new THREE.Group();
    const dinoGeo = new THREE.ConeGeometry(0.5, 1.2, 5);
    const dinoMat = new THREE.MeshStandardMaterial({ color: 0x22c55e });
    this.dinoMesh = new THREE.Mesh(dinoGeo, dinoMat);
    this.dinoMesh.position.set(0, 5.3, 0);
    this.macroGroup.add(this.dinoMesh);
    this.earthGroup.add(this.macroGroup);
    this.macroGroup.visible = false;

    // ----------------------------------------------------
    // モード 4: 細胞規模観察用 3D ミクロ層 (DNA & Cell Micro Particles)
    // ----------------------------------------------------
    this.microGroup = new THREE.Group();
    this.createDnaHelixParticles();
    this.earthGroup.add(this.microGroup);
    this.microGroup.visible = false;

    // 宇宙星空
    this.createStarfield();

    // 視点モード変数 (1:地球, 2:地形, 3:詳細, 4:細胞)
    this.currentViewMode = 1;
    this.targetCameraDistance = 25.0;

    this.timeScale = 1.0;
    this.currentStageId = 1;

    // リサイズハンドラ
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.startRenderLoop();
  }

  // 3D DNA二重螺旋 ＆ 微生物ミクロ粒子構造
  createDnaHelixParticles() {
    const count = 400;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const t = (i - count / 2) * 0.08;
      const strand = i % 2 === 0 ? 1 : -1;
      const r = 1.2;

      pos[i * 3]     = Math.cos(t) * r * strand;
      pos[i * 3 + 1] = t * 1.5;
      pos[i * 3 + 2] = Math.sin(t) * r * strand;

      col[i * 3]     = strand === 1 ? 0.2 : 0.9;
      col[i * 3 + 1] = 0.8;
      col[i * 3 + 2] = strand === 1 ? 0.9 : 0.3;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.9
    });

    const dnaPoints = new THREE.Points(geo, mat);
    dnaPoints.position.set(0, 5.2, 0);
    this.microGroup.add(dnaPoints);
  }

  // 星空
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
    this.scene.add(new THREE.Points(geo, mat));
  }

  // 👁️ 4段階 視点モード切り替え処理
  setViewMode(mode) {
    this.currentViewMode = mode;

    if (mode === 1) {
      // 1: 地球観察モード (Global View)
      this.targetCameraDistance = 25.0;
      this.macroGroup.visible = false;
      this.microGroup.visible = false;
    } else if (mode === 2) {
      // 2: 地形観察モード (Terrain View)
      this.targetCameraDistance = 8.2;
      this.macroGroup.visible = false;
      this.microGroup.visible = false;
    } else if (mode === 3) {
      // 3: 詳細観察モード (Macro Organism / Detail View)
      this.targetCameraDistance = 6.2;
      this.macroGroup.visible = true;
      this.microGroup.visible = false;
    } else if (mode === 4) {
      // 4: 細胞規模観察モード (Microscopic Cell View)
      this.targetCameraDistance = 5.25;
      this.macroGroup.visible = false;
      this.microGroup.visible = true;
    }
  }

  // ステージごとの 3D グラフィック更新
  setStageVisuals(stageId) {
    this.currentStageId = stageId;

    if (stageId <= 3) {
      this.earthMat.color.setHex(0xff2200);
      this.earthMat.roughness = 0.4;
      this.cloudMat.opacity = 0.4;
      this.cloudMat.color.setHex(0xffaa44);
      this.spaceRing.material.opacity = 0;
    } else if (stageId <= 7) {
      this.earthMat.color.setHex(0x0284c7);
      this.earthMat.roughness = 0.2;
      this.cloudMat.opacity = 0.3;
      this.cloudMat.color.setHex(0xffffff);
      this.spaceRing.material.opacity = 0;
    } else if (stageId === 8) {
      this.earthMat.color.setHex(0xe2e8f0);
      this.earthMat.roughness = 0.9;
      this.cloudMat.opacity = 0.1;
      this.spaceRing.material.opacity = 0;
    } else if (stageId <= 20) {
      this.earthMat.color.setHex(0x15803d);
      this.earthMat.roughness = 0.5;
      this.cloudMat.opacity = 0.35;
      this.cloudMat.color.setHex(0xffffff);
      this.spaceRing.material.opacity = 0;
    } else if (stageId <= 35) {
      this.earthMat.color.setHex(0x16a34a);
      this.earthMat.roughness = 0.6;
      this.cloudMat.opacity = 0.25;
      this.spaceRing.material.opacity = 0;
    } else if (stageId <= 43) {
      this.earthMat.color.setHex(0x0d9488);
      this.earthMat.roughness = 0.4;
      this.cloudMat.opacity = 0.2;
      this.spaceRing.material.opacity = 0;
    } else {
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

      // カメラ距離の smooth lerp アニメーション
      const currentDist = this.camera.position.length();
      if (Math.abs(currentDist - this.targetCameraDistance) > 0.05) {
        const newDist = THREE.MathUtils.lerp(currentDist, this.targetCameraDistance, 0.08);
        this.camera.position.setLength(newDist);
      }

      if (this.timeScale > 0) {
        const speed = Math.min(100, 0.003 * Math.sqrt(this.timeScale));
        this.earthGroup.rotation.y += speed;
        this.cloudMesh.rotation.y += speed * 1.2;
        this.moonGroup.rotation.y += speed * 0.4;
        this.spaceRing.rotation.z += speed * 0.8;

        if (this.microGroup.visible) {
          this.microGroup.rotation.y += 0.02;
        }
      }

      if (this.controls) this.controls.update();

      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }
}

window.Nature3DEngine = Nature3DEngine;
