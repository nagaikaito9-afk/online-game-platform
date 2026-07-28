/**
 * WEBLOX - world.js
 * 3Dゲームシステム・Pointer Lock(マウスロック)・物理判定・HP・チェックポイント
 */

class World3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.currentWorldId = 'lobby';

    this.coins = [];
    this.sandboxBlocks = [];
    this.colliders = [];
    this.portals = [];
    this.checkpointPos = new THREE.Vector3(0, 3, 0);

    this.score = 0;
    this.playerHp = 100;
    this.maxHp = 100;
    this.isDead = false;
    this.timer = 60;

    // Pointer Lock (マウスロック) 制御変数
    this.isPointerLocked = false;
    this.cameraYaw = 0;
    this.cameraPitch = 0.3;
    this.cameraDist = 12;

    this.initThree();
    this.setupLights();
    this.setupPointerLock();
    this.buildWorld('lobby');
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.005);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
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

  // 🎯 Roblox仕様 Pointer Lock (マウスロック) の実装
  setupPointerLock() {
    this.canvas.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        this.canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === this.canvas) {
        this.isPointerLocked = true;
        const hint = document.getElementById('pointer-lock-hint');
        if (hint) hint.style.display = 'none';
      } else {
        this.isPointerLocked = false;
        const hint = document.getElementById('pointer-lock-hint');
        if (hint) hint.style.display = 'block';
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        const sensitivity = 0.003;
        this.cameraYaw -= e.movementX * sensitivity;
        this.cameraPitch += e.movementY * sensitivity;
        this.cameraPitch = Math.max(0.05, Math.min(1.4, this.cameraPitch));
      }
    });
  }

  setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambient);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    this.dirLight.position.set(40, 80, 40);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.scene.add(this.dirLight);
  }

  buildWorld(worldId, customData = null) {
    this.currentWorldId = worldId;
    this.clearWorld();

    this.playerHp = 100;
    this.isDead = false;
    this.checkpointPos.set(0, 3, 0);

    if (customData) {
      this.buildCustomWorld(customData);
    } else if (worldId === 'lobby') {
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
    while (this.scene.children.length > 0) {
      const obj = this.scene.children[0];
      this.scene.remove(obj);
    }
    this.setupLights();
    this.coins = [];
    this.colliders = [];
    this.portals = [];
  }

  // 自作Studioワールドの読み込み＆再現
  buildCustomWorld(customData) {
    this.scene.background = new THREE.Color(0x1a1a2e);

    const baseGeo = new THREE.BoxGeometry(100, 1, 100);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x222431 });
    const baseplate = new THREE.Mesh(baseGeo, baseMat);
    baseplate.position.y = -0.5;
    baseplate.receiveShadow = true;
    this.scene.add(baseplate);

    if (customData.objects) {
      customData.objects.forEach(obj => {
        let geo;
        if (obj.type === 'sphere') geo = new THREE.SphereGeometry(2, 16, 16);
        else if (obj.type === 'cylinder') geo = new THREE.CylinderGeometry(1.5, 1.5, 4, 16);
        else geo = new THREE.BoxGeometry(3, 3, 3);

        const mat = new THREE.MeshStandardMaterial({
          color: obj.color || 0x00a2ff,
          emissive: obj.scriptType === 'kill' ? 0xff3366 : 0x000000,
          emissiveIntensity: obj.scriptType === 'kill' ? 0.6 : 0
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(obj.x, obj.y, obj.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { scriptType: obj.scriptType };

        this.scene.add(mesh);
        this.colliders.push(mesh);
      });
    }
  }

  // 🏙️ 1. セントラルロビー
  buildLobby() {
    this.scene.background = new THREE.Color(0x87ceeb);

    const floorGeo = new THREE.PlaneGeometry(120, 120);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x38b000, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const towerGeo = new THREE.CylinderGeometry(4, 6, 12, 8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x00a2ff, roughness: 0.2, metalness: 0.5 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(0, 6, 0);
    tower.castShadow = true;
    this.scene.add(tower);

    const portalPositions = [
      { x: -18, z: -18, id: 'obby', label: 'Mega Obby', color: 0xffb703 },
      { x: 18, z: -18, id: 'coindash', label: 'Coin Dash', color: 0x00ff87 },
      { x: -18, z: 18, id: 'arena', label: 'Battle Arena', color: 0xff3366 },
      { x: 18, z: 18, id: 'sandbox', label: 'Creative Sandbox', color: 0x7209b7 }
    ];

    portalPositions.forEach(p => {
      const gateGeo = new THREE.TorusGeometry(3.5, 0.5, 8, 24);
      const gateMat = new THREE.MeshStandardMaterial({ color: p.color, emissive: p.color, emissiveIntensity: 0.6 });
      const gate = new THREE.Mesh(gateGeo, gateMat);
      gate.position.set(p.x, 4, p.z);
      this.scene.add(gate);
      this.portals.push({ mesh: gate, targetWorld: p.id });
    });
  }

  // 🟩 2. Mega Obby (アスレチック & チェックポイント & マグマ判定)
  buildObby() {
    this.scene.background = new THREE.Color(0x0f111a);

    // スタート地点
    const startGeo = new THREE.BoxGeometry(12, 1, 12);
    const startMat = new THREE.MeshStandardMaterial({ color: 0x00a2ff });
    const startIsland = new THREE.Mesh(startGeo, startMat);
    startIsland.position.set(0, 0, 0);
    startIsland.receiveShadow = true;
    this.scene.add(startIsland);

    // マグマ床 (触れると即死)
    const magmaGeo = new THREE.PlaneGeometry(300, 300);
    const magmaMat = new THREE.MeshStandardMaterial({ color: 0xff3366, emissive: 0xff3366, emissiveIntensity: 0.8 });
    const magma = new THREE.Mesh(magmaGeo, magmaMat);
    magma.rotation.x = -Math.PI / 2;
    magma.position.y = -10;
    this.scene.add(magma);

    const colors = [0xffb703, 0x00ff87, 0x7209b7, 0x00a2ff, 0xff3366];
    for (let i = 1; i <= 20; i++) {
      const blockGeo = new THREE.BoxGeometry(3.5, 0.8, 3.5);
      const isKillBlock = (i % 5 === 0);
      const blockMat = new THREE.MeshStandardMaterial({
        color: isKillBlock ? 0xff3366 : colors[i % colors.length],
        emissive: isKillBlock ? 0xff3366 : 0x000000,
        emissiveIntensity: isKillBlock ? 0.7 : 0
      });

      const block = new THREE.Mesh(blockGeo, blockMat);
      const offsetZ = -i * 7;
      const offsetX = Math.sin(i * 0.9) * 6;
      const offsetY = i * 1.0;

      block.position.set(offsetX, offsetY, offsetZ);
      block.receiveShadow = true;
      block.castShadow = true;
      block.userData = { isKill: isKillBlock };

      this.scene.add(block);
      this.colliders.push(block);

      // 5ステージごとのチェックポイントフラグ
      if (i % 5 === 0 && !isKillBlock) {
        const flagGeo = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
        const flagMat = new THREE.MeshStandardMaterial({ color: 0x00ff87 });
        const flag = new THREE.Mesh(flagGeo, flagMat);
        flag.position.set(offsetX, offsetY + 2.4, offsetZ);
        flag.userData = { isCheckpoint: true, checkpointIndex: i };
        this.scene.add(flag);
        this.colliders.push(flag);
      }
    }
  }

  // 🪙 3. Coin Dash (3Dコイン集め & 制限時間)
  buildCoinDash() {
    this.scene.background = new THREE.Color(0x2a9d8f);

    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xe9c46a });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const coinGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.25, 16);
    const coinMat = new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.9, roughness: 0.1 });

    for (let i = 0; i < 30; i++) {
      const coin = new THREE.Mesh(coinGeo, coinMat);
      const cx = (Math.random() - 0.5) * 100;
      const cz = (Math.random() - 0.5) * 100;
      coin.position.set(cx, 1.3, cz);
      coin.rotation.x = Math.PI / 2;
      this.scene.add(coin);
      this.coins.push(coin);
    }
  }

  // ⚔️ 4. Battle Arena
  buildArena() {
    this.scene.background = new THREE.Color(0x3a0ca3);
    const arenaGeo = new THREE.CylinderGeometry(30, 30, 1, 32);
    const arenaMat = new THREE.MeshStandardMaterial({ color: 0x4361ee });
    const arena = new THREE.Mesh(arenaGeo, arenaMat);
    arena.position.set(0, 0, 0);
    arena.receiveShadow = true;
    this.scene.add(arena);
  }

  // 🏗️ 5. Creative Sandbox
  buildSandbox() {
    this.scene.background = new THREE.Color(0x90e0ef);
    const gridFloor = new THREE.GridHelper(100, 50, 0x00a2ff, 0xffffff);
    gridFloor.position.y = 0.01;
    this.scene.add(gridFloor);

    const floorGeo = new THREE.PlaneGeometry(100, 100);
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
    if (window.audioEngine) window.audioEngine.playSE('click');
  }

  update(playerPos) {
    // 3DカメラをPointer Lockと完全連動追従
    const camX = playerPos.x + Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDist;
    const camZ = playerPos.z + Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDist;
    const camY = playerPos.y + Math.sin(this.cameraPitch) * this.cameraDist;

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(playerPos.x, playerPos.y + 1.2, playerPos.z);

    // コイン収集判定
    this.coins.forEach(coin => {
      if (!coin.visible) return;
      coin.rotation.z += 0.06;
      if (coin.position.distanceTo(playerPos) < 2.0) {
        coin.visible = false;
        this.score += 10;
        if (window.audioEngine) window.audioEngine.playSE('coin');
      }
    });

    // 衝突判定 (マグマキルブロック・チェックポイント)
    this.colliders.forEach(obj => {
      const dist = obj.position.distanceTo(playerPos);
      if (dist < 2.2) {
        if (obj.userData.isKill || obj.userData.scriptType === 'kill') {
          this.takeDamage(100, playerPos);
        } else if (obj.userData.isCheckpoint) {
          this.checkpointPos.copy(obj.position);
          this.checkpointPos.y += 1.0;
          if (window.audioEngine) window.audioEngine.playSE('unlock');
        }
      }
    });

    // 落下死亡判定
    if (playerPos.y < -8 && !this.isDead) {
      this.takeDamage(100, playerPos);
    }

    // ポータルチェック
    this.portals.forEach(p => {
      p.mesh.rotation.z += 0.02;
      if (p.mesh.position.distanceTo(playerPos) < 3.2 && this.onPortalTouch) {
        this.onPortalTouch(p.targetWorld);
      }
    });

    // UI状態更新
    const hpBar = document.getElementById('hud-hp-bar-inner');
    if (hpBar) hpBar.style.width = `${Math.max(0, this.playerHp)}%`;
    const scoreEl = document.getElementById('hud-score-text');
    if (scoreEl) scoreEl.textContent = `🪙 スコア: ${this.score}`;

    this.renderer.render(this.scene, this.camera);
  }

  takeDamage(amount, playerPos) {
    if (this.isDead) return;
    this.playerHp -= amount;

    if (this.playerHp <= 0) {
      this.isDead = true;
      if (window.audioEngine) window.audioEngine.playSE('hit');
      setTimeout(() => {
        playerPos.copy(this.checkpointPos);
        this.playerHp = 100;
        this.isDead = false;
        if (window.audioEngine) window.audioEngine.playSE('respawn');
      }, 600);
    }
  }
}

window.World3D = World3D;
