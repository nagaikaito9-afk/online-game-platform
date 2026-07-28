/**
 * WEBLOX - world.js
 * Three.js 3Dワールド描画・マップ物理・インタラクション
 */

class World3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.currentWorldId = 'lobby';

    this.coins = [];
    this.sandboxBlocks = [];
    this.colliders = [];
    this.portals = [];
    this.score = 0;

    this.initThree();
    this.setupLights();
    this.buildWorld('lobby');
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.008);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.cameraYaw = 0;
    this.cameraPitch = 0.3;
    this.cameraDist = 12;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.dirLight.position.set(50, 80, 40);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.scene.add(this.dirLight);
  }

  buildWorld(worldId) {
    this.currentWorldId = worldId;
    this.clearWorld();

    if (worldId === 'lobby') {
      this.buildLobby();
    } else if (worldId === 'obby') {
      this.buildObby();
    } else if (worldId === 'coindash') {
      this.buildCoinDash();
    } else if (worldId === 'arena') {
      this.buildArena();
    } else if (worldId === 'sandbox') {
      this.buildSandbox();
    }
  }

  clearWorld() {
    // 既存メッシュ削除
    while (this.scene.children.length > 0) {
      const obj = this.scene.children[0];
      this.scene.remove(obj);
    }
    this.setupLights();
    this.coins = [];
    this.colliders = [];
    this.portals = [];
  }

  // 🏙️ 1. セントラルロビー
  buildLobby() {
    this.scene.background = new THREE.Color(0x87ceeb);

    // 地面 (Floor)
    const floorGeo = new THREE.PlaneGeometry(120, 120);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x38b000, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 中央噴水/タワー
    const towerGeo = new THREE.CylinderGeometry(4, 6, 12, 8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, roughness: 0.2, metalness: 0.5 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(0, 6, 0);
    tower.castShadow = true;
    this.scene.add(tower);

    // ポータルゲート群 (他の世界へワープ)
    const portalPositions = [
      { x: -18, z: -18, id: 'obby', label: 'アスレチック (Obby)', color: 0xffb703 },
      { x: 18, z: -18, id: 'coindash', label: 'コインレース', color: 0x00ff87 },
      { x: -18, z: 18, id: 'arena', label: 'バトルアリーナ', color: 0xd90429 },
      { x: 18, z: 18, id: 'sandbox', label: '建築サンドボックス', color: 0x7209b7 }
    ];

    portalPositions.forEach(p => {
      const gateGeo = new THREE.TorusGeometry(3, 0.4, 8, 24);
      const gateMat = new THREE.MeshStandardMaterial({ color: p.color, emissive: p.color, emissiveIntensity: 0.5 });
      const gate = new THREE.Mesh(gateGeo, gateMat);
      gate.position.set(p.x, 3.5, p.z);
      this.scene.add(gate);
      this.portals.push({ mesh: gate, targetWorld: p.id });
    });
  }

  // 🟩 2. Mega Obby (アスレチック)
  buildObby() {
    this.scene.background = new THREE.Color(0x1a1a2e);

    // スタート島
    const startGeo = new THREE.BoxGeometry(10, 1, 10);
    const startMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe });
    const startIsland = new THREE.Mesh(startGeo, startMat);
    startIsland.position.set(0, 0, 0);
    startIsland.receiveShadow = true;
    this.scene.add(startIsland);

    // 浮かぶブロックコース
    const colors = [0xff758f, 0xffb703, 0x00ff87, 0x7209b7, 0x00b4d8];
    for (let i = 1; i <= 15; i++) {
      const blockGeo = new THREE.BoxGeometry(3, 0.8, 3);
      const blockMat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length] });
      const block = new THREE.Mesh(blockGeo, blockMat);

      const offsetZ = -i * 6;
      const offsetX = Math.sin(i * 0.8) * 5;
      const offsetY = i * 0.8;

      block.position.set(offsetX, offsetY, offsetZ);
      block.receiveShadow = true;
      block.castShadow = true;
      this.scene.add(block);
    }

    // ゴール巨大スター
    const starGeo = new THREE.OctahedronGeometry(2);
    const starMat = new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffb703, emissiveIntensity: 0.8 });
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.set(0, 15, -96);
    this.scene.add(star);
  }

  // 🪙 3. Coin Dash (コイン収集)
  buildCoinDash() {
    this.scene.background = new THREE.Color(0x2a9d8f);

    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xe9c46a });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 金コインを25個ランダム配置
    const coinGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16);
    const coinMat = new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.8, roughness: 0.2 });

    for (let i = 0; i < 25; i++) {
      const coin = new THREE.Mesh(coinGeo, coinMat);
      const cx = (Math.random() - 0.5) * 80;
      const cz = (Math.random() - 0.5) * 80;
      coin.position.set(cx, 1.2, cz);
      coin.rotation.x = Math.PI / 2;
      this.scene.add(coin);
      this.coins.push(coin);
    }
  }

  // ⚔️ 4. Battle Arena
  buildArena() {
    this.scene.background = new THREE.Color(0x3a0ca3);

    const arenaGeo = new THREE.CylinderGeometry(25, 25, 1, 32);
    const arenaMat = new THREE.MeshStandardMaterial({ color: 0x4361ee, roughness: 0.3 });
    const arena = new THREE.Mesh(arenaGeo, arenaMat);
    arena.position.set(0, 0, 0);
    arena.receiveShadow = true;
    this.scene.add(arena);

    // 柱障害物
    for (let i = 0; i < 6; i++) {
      const pillarGeo = new THREE.BoxGeometry(2, 8, 2);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0xf72585 });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      const angle = (i / 6) * Math.PI * 2;
      pillar.position.set(Math.cos(angle) * 14, 4, Math.sin(angle) * 14);
      pillar.castShadow = true;
      this.scene.add(pillar);
    }
  }

  // 🏗️ 5. Creative Sandbox
  buildSandbox() {
    this.scene.background = new THREE.Color(0x90e0ef);

    const gridFloor = new THREE.GridHelper(80, 40, 0x00f2fe, 0xffffff);
    gridFloor.position.y = 0.01;
    this.scene.add(gridFloor);

    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);
  }

  addSandboxBlock(x, y, z, colorHex = 0xffb703) {
    const geo = new THREE.BoxGeometry(2, 2, 2);
    const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3 });
    const block = new THREE.Mesh(geo, mat);
    block.position.set(Math.round(x / 2) * 2, Math.max(1, Math.round(y / 2) * 2), Math.round(z / 2) * 2);
    block.castShadow = true;
    block.receiveShadow = true;
    this.scene.add(block);
    this.sandboxBlocks.push(block);
    audioEngine.playSE('click');
  }

  update(playerPos) {
    // 3Dカメラを追従
    const camX = playerPos.x + Math.sin(this.cameraYaw) * this.cameraDist;
    const camZ = playerPos.z + Math.cos(this.cameraYaw) * this.cameraDist;
    const camY = playerPos.y + Math.sin(this.cameraPitch) * this.cameraDist;

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(playerPos.x, playerPos.y + 1.2, playerPos.z);

    // コイン回転 & 判定 (Coin Dash)
    this.coins.forEach((coin, idx) => {
      if (!coin.visible) return;
      coin.rotation.z += 0.05;

      const dist = coin.position.distanceTo(playerPos);
      if (dist < 1.8) {
        coin.visible = false;
        this.score += 10;
        audioEngine.playSE('coin');
      }
    });

    // ポータル判定 (Lobby)
    this.portals.forEach(p => {
      p.mesh.rotation.z += 0.02;
      const dist = p.mesh.position.distanceTo(playerPos);
      if (dist < 3.0 && this.onPortalTouch) {
        this.onPortalTouch(p.targetWorld);
      }
    });

    // アスレチック落下判定 (Obby)
    if (this.currentWorldId === 'obby' && playerPos.y < -10) {
      audioEngine.playSE('respawn');
      playerPos.set(0, 3, 0);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.World3D = World3D;
