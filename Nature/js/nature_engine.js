/**
 * Nature 3D - nature_engine.js
 * 劇的 4段階視点モード (1:地球, 2:3D立体地形, 3:3D生き物/文明, 4:3D細胞/DNAミクロ) エンジン
 */

class Nature3DEngine {
  constructor(canvas) {
    this.canvas = canvas;

    // WebGL レンダラー
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
      this.controls.minDistance = 2;
      this.controls.maxDistance = 100;
    }

    // ライティング
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.6);
    this.sunLight.position.set(20, 15, 15);
    this.scene.add(this.sunLight);

    this.ambientLight = new THREE.AmbientLight(0x444466, 0.9);
    this.scene.add(this.ambientLight);

    // =========================================================================
    // MODE 1: 🌍 全体地球シーン (Global Earth Group)
    // =========================================================================
    this.earthSceneGroup = new THREE.Group();
    this.scene.add(this.earthSceneGroup);

    const earthGeo = new THREE.SphereGeometry(5, 64, 64);
    this.earthMat = new THREE.MeshStandardMaterial({ color: 0xff3300, roughness: 0.7 });
    this.earthMesh = new THREE.Mesh(earthGeo, this.earthMat);
    this.earthSceneGroup.add(this.earthMesh);

    const cloudGeo = new THREE.SphereGeometry(5.12, 64, 64);
    this.cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending });
    this.cloudMesh = new THREE.Mesh(cloudGeo, this.cloudMat);
    this.earthSceneGroup.add(this.cloudMesh);

    const ringGeo = new THREE.TorusGeometry(7.5, 0.08, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0 });
    this.spaceRing = new THREE.Mesh(ringGeo, ringMat);
    this.spaceRing.rotation.x = Math.PI / 2.5;
    this.earthSceneGroup.add(this.spaceRing);

    const moonGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.9 });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonGroup = new THREE.Group();
    this.moonGroup.add(this.moonMesh);
    this.moonMesh.position.set(14, 0, 0);
    this.earthSceneGroup.add(this.moonGroup);

    // =========================================================================
    // MODE 2: 🏔️ 3D 立体地形シーン (Detailed 3D Terrain Group)
    // =========================================================================
    this.terrainSceneGroup = new THREE.Group();
    this.scene.add(this.terrainSceneGroup);
    this.createDetailed3DTerrain();
    this.terrainSceneGroup.visible = false;

    // =========================================================================
    // MODE 3: 🧍 3D 生き物 ＆ 文明モデルシーン (3D Organisms & Buildings Group)
    // =========================================================================
    this.organismSceneGroup = new THREE.Group();
    this.scene.add(this.organismSceneGroup);
    this.createOrganismsAndBuildings();
    this.organismSceneGroup.visible = false;

    // =========================================================================
    // MODE 4: 🔬 3D 細胞 ＆ DNA二重螺旋ミクロシーン (3D Micro Cell & DNA World Group)
    // =========================================================================
    this.microCellSceneGroup = new THREE.Group();
    this.scene.add(this.microCellSceneGroup);
    this.createMicroscopicWorld();
    this.microCellSceneGroup.visible = false;

    // 宇宙星空
    this.createStarfield();

    // 状態変数
    this.currentViewMode = 1;
    this.currentStageId = 1;
    this.timeScale = 1.0;

    // リサイズ
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.startRenderLoop();
  }

  // 🏔️ MODE 2: 3D 凹凸立体地形モデルの生成
  createDetailed3DTerrain() {
    const geo = new THREE.PlaneGeometry(16, 16, 64, 64);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      // 山脈と谷間の複雑な標高計算
      const z = Math.sin(vx * 0.5) * Math.cos(vy * 0.5) * 1.8 + Math.sin(vx * 1.2) * 0.6;
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();

    this.terrainMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });

    this.terrainMesh = new THREE.Mesh(geo, this.terrainMat);
    this.terrainMesh.rotation.x = -Math.PI / 2.5;
    this.terrainSceneGroup.add(this.terrainMesh);

    // 溶岩・マグマの川 (Magma River / Lava Stream)
    const lavaGeo = new THREE.PlaneGeometry(16, 2, 32, 8);
    this.lavaMat = new THREE.MeshBasicMaterial({ color: 0xff3300, wireframe: true });
    const lavaMesh = new THREE.Mesh(lavaGeo, this.lavaMat);
    lavaMesh.rotation.x = -Math.PI / 2.5;
    lavaMesh.position.set(0, 0.2, 0);
    this.terrainSceneGroup.add(lavaMesh);
  }

  // 🧍 MODE 3: 時代別 3D生き物 ＆ 文明建造物モデルの生成
  createOrganismsAndBuildings() {
    // 1. 3D 恐竜 (3D Dinosaur Model)
    this.dinoGroup = new THREE.Group();
    const bodyGeo = new THREE.ConeGeometry(1.2, 3.5, 8);
    const dinoMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });
    const body = new THREE.Mesh(bodyGeo, dinoMat);
    body.rotation.z = -Math.PI / 3;

    const headGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const head = new THREE.Mesh(headGeo, dinoMat);
    head.position.set(1.8, 1.2, 0);

    this.dinoGroup.add(body);
    this.dinoGroup.add(head);
    this.dinoGroup.position.set(0, -0.5, 0);
    this.organismSceneGroup.add(this.dinoGroup);

    // 2. 3D ピラミッド ＆ 古代文明 (3D Pyramid)
    this.pyramidGroup = new THREE.Group();
    const pyrGeo = new THREE.ConeGeometry(2.5, 2.5, 4);
    const pyrMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.9 });
    const pyr = new THREE.Mesh(pyrGeo, pyrMat);
    this.pyramidGroup.add(pyr);
    this.pyramidGroup.position.set(0, -0.5, 0);
    this.organismSceneGroup.add(this.pyramidGroup);
    this.pyramidGroup.visible = false;

    // 3. 3D アポロ月面着陸船 ＆ 人類 (3D Apollo Lander)
    this.apolloGroup = new THREE.Group();
    const landerGeo = new THREE.BoxGeometry(2, 1.5, 2);
    const landerMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 });
    const lander = new THREE.Mesh(landerGeo, landerMat);
    this.apolloGroup.add(lander);
    this.apolloGroup.position.set(0, -0.5, 0);
    this.organismSceneGroup.add(this.apolloGroup);
    this.apolloGroup.visible = false;
  }

  // 🔬 MODE 4: 3D 細胞 ＆ DNA二重螺旋ミクロ世界の生成
  createMicroscopicWorld() {
    // 1. 光る 3D DNA 二重螺旋構造体 (3D Glowing DNA Helix)
    const count = 250;
    const dnaGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const t = (i - count / 2) * 0.12;
      const strand = i % 2 === 0 ? 1 : -1;
      const r = 2.0;

      pos[i * 3]     = Math.cos(t) * r * strand;
      pos[i * 3 + 1] = t * 0.8;
      pos[i * 3 + 2] = Math.sin(t) * r * strand;

      col[i * 3]     = strand === 1 ? 0.2 : 0.9;
      col[i * 3 + 1] = 0.8;
      col[i * 3 + 2] = strand === 1 ? 1.0 : 0.4;
    }

    dnaGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    dnaGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const dnaMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.95
    });

    this.dnaHelixMesh = new THREE.Points(dnaGeo, dnaMat);
    this.microCellSceneGroup.add(this.dnaHelixMesh);

    // 2. 3D 蠢く単細胞生命 (3D Micro Cells)
    const cellGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const cellMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.1
    });
    this.cellMesh = new THREE.Mesh(cellGeo, cellMat);
    this.cellMesh.position.set(-3, 0, 0);
    this.microCellSceneGroup.add(this.cellMesh);

    // 細胞核
    const nucleusGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const nucleusMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    this.cellMesh.add(nucleus);
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

  // 👁️ 4段階 視点モード切り替え（各モード専用の劇的 3D シーンへのスイッチ）
  setViewMode(mode) {
    this.currentViewMode = mode;

    // 全グループを非表示
    this.earthSceneGroup.visible = false;
    this.terrainSceneGroup.visible = false;
    this.organismSceneGroup.visible = false;
    this.microCellSceneGroup.visible = false;

    if (mode === 1) {
      // 🌍 1: 地球全景観察モード
      this.earthSceneGroup.visible = true;
      this.camera.position.set(0, 5, 25);
      if (this.controls) this.controls.target.set(0, 0, 0);
    } else if (mode === 2) {
      // 🏔️ 2: 3D立体地形観察モード
      this.terrainSceneGroup.visible = true;
      this.camera.position.set(0, 6, 12);
      if (this.controls) this.controls.target.set(0, 0, 0);
    } else if (mode === 3) {
      // 🧍 3: 3D生き物 ＆ 文明詳細観察モード
      this.organismSceneGroup.visible = true;
      this.camera.position.set(0, 2, 6);
      if (this.controls) this.controls.target.set(0, 0, 0);
    } else if (mode === 4) {
      // 🔬 4: 3D細胞 ＆ DNA二重螺旋ミクロ観察モード
      this.microCellSceneGroup.visible = true;
      this.camera.position.set(0, 0, 8);
      if (this.controls) this.controls.target.set(0, 0, 0);
    }
  }

  // ステージに応じた 3D マテリアル・モデルの切替
  setStageVisuals(stageId) {
    this.currentStageId = stageId;

    // 1. 地球マテリアル
    if (stageId <= 3) {
      this.earthMat.color.setHex(0xff2200);
      this.cloudMat.color.setHex(0xffaa44);
      this.terrainMat.color.setHex(0x7f1d1d); // マグマ地形
    } else if (stageId <= 8) {
      this.earthMat.color.setHex(0x0284c7);
      this.cloudMat.color.setHex(0xffffff);
      this.terrainMat.color.setHex(0x0369a1); // 海洋地形
    } else if (stageId <= 20) {
      this.earthMat.color.setHex(0x15803d); // 恐竜緑
      this.terrainMat.color.setHex(0x15803d);
    } else {
      this.earthMat.color.setHex(0x16a34a);
      this.terrainMat.color.setHex(0x16a34a);
    }

    // 2. モード3 (生き物・文明) のモデル切り替え
    this.dinoGroup.visible = false;
    this.pyramidGroup.visible = false;
    this.apolloGroup.visible = false;

    if (stageId >= 10 && stageId <= 20) {
      this.dinoGroup.visible = true; // 恐竜モデル
    } else if (stageId >= 21 && stageId <= 35) {
      this.pyramidGroup.visible = true; // 古代ピラミッド
    } else {
      this.apolloGroup.visible = true; // 宇宙船・月面船
    }
  }

  startRenderLoop() {
    const animate = () => {
      requestAnimationFrame(animate);

      if (this.timeScale > 0) {
        const speed = Math.min(100, 0.003 * Math.sqrt(this.timeScale));

        // モード別回転アニメーション
        if (this.currentViewMode === 1) {
          this.earthMesh.rotation.y += speed;
          this.cloudMesh.rotation.y += speed * 1.2;
          this.moonGroup.rotation.y += speed * 0.4;
        } else if (this.currentViewMode === 2) {
          this.terrainMesh.rotation.z += speed * 0.3;
        } else if (this.currentViewMode === 3) {
          this.organismSceneGroup.rotation.y += 0.01;
          this.dinoGroup.rotation.y += 0.01;
        } else if (this.currentViewMode === 4) {
          this.dnaHelixMesh.rotation.y += 0.025;
          this.cellMesh.rotation.y += 0.015;
        }
      }

      if (this.controls) this.controls.update();

      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }
}

window.Nature3DEngine = Nature3DEngine;
