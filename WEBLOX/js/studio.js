/**
 * WEBLOX - studio.js
 * ブラウザ完結型 3Dゲーム制作エンジン (WEBLOX Studio)
 */

class WebloxStudio {
  constructor(canvas) {
    this.canvas = canvas;
    this.objects = [];
    this.selectedObject = null;
    this.currentTool = 'select'; // select, move, scale, delete
    this.myPublishedGames = JSON.parse(localStorage.getItem('weblox_my_games') || '[]');

    this.initThree();
    this.setupGrid();
    this.bindEvents();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e1e2e);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(15, 15, 20);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    // ライト
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // レイキャスター
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  setupGrid() {
    const grid = new THREE.GridHelper(60, 30, 0x00f2fe, 0x444466);
    grid.position.y = 0;
    this.scene.add(grid);

    // 床
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x282a36, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  addPart(type) {
    let geo;
    let color = 0x00f2fe;
    let isKill = false;

    if (type === 'block') {
      geo = new THREE.BoxGeometry(2, 2, 2);
    } else if (type === 'sphere') {
      geo = new THREE.SphereGeometry(1.2, 16, 16);
      color = 0xffb703;
    } else if (type === 'cylinder') {
      geo = new THREE.CylinderGeometry(1, 1, 3, 16);
      color = 0x00ff87;
    } else if (type === 'spawn') {
      geo = new THREE.CylinderGeometry(2, 2, 0.2, 16);
      color = 0x38b000;
    } else if (type === 'killblock') {
      geo = new THREE.BoxGeometry(3, 1, 3);
      color = 0xd90429;
      isKill = true;
    }

    const mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: isKill ? 0xd90429 : 0x000000,
      emissiveIntensity: isKill ? 0.6 : 0,
      roughness: 0.3
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 2, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { type, isKill };

    this.scene.add(mesh);
    this.objects.push(mesh);
    this.selectObject(mesh);
    audioEngine.playSE('click');
  }

  selectObject(mesh) {
    this.selectedObject = mesh;
    this.updateExplorerUI();
  }

  bindEvents() {
    this.canvas.addEventListener('click', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.objects);

      if (intersects.length > 0) {
        if (this.currentTool === 'delete') {
          const target = intersects[0].object;
          this.scene.remove(target);
          this.objects = this.objects.filter(o => o !== target);
          this.selectedObject = null;
          audioEngine.playSE('hit');
        } else {
          this.selectObject(intersects[0].object);
          audioEngine.playSE('click');
        }
      }
    });
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  changeSelectedColor(hexColor) {
    if (this.selectedObject) {
      this.selectedObject.material.color.set(hexColor);
      audioEngine.playSE('click');
    }
  }

  updateExplorerUI() {
    const infoEl = document.getElementById('studio-selected-info');
    if (!infoEl) return;

    if (this.selectedObject) {
      infoEl.innerHTML = `
        <div style="font-weight:bold; color:var(--accent-cyan);">選択中パーツ: ${this.selectedObject.userData.type}</div>
        <div style="font-size:0.8rem; margin-top:0.3rem;">位置: (${this.selectedObject.position.x.toFixed(1)}, ${this.selectedObject.position.y.toFixed(1)}, ${this.selectedObject.position.z.toFixed(1)})</div>
      `;
    } else {
      infoEl.textContent = 'パーツを選択していません';
    }
  }

  // 作成したゲームを保存・Webloxポータルへ公開 (Publish)
  publishGame(gameName, description) {
    const gameData = {
      id: 'custom_' + Date.now(),
      name: gameName || 'マイオリジナルゲーム',
      category: '自作',
      author: localStorage.getItem('weblox_username') || 'クリエイター',
      likes: '100%',
      playing: '1',
      desc: description || 'WEBLOX Studioで作成されたゲームワールド！',
      icon: '🎮',
      bg: '#7209b7',
      isCustom: true
    };

    this.myPublishedGames.push(gameData);
    localStorage.setItem('weblox_my_games', JSON.stringify(this.myPublishedGames));
    WEBLOX_WORLDS.unshift(gameData);
    audioEngine.playSE('coin');
    alert(`🎉 ゲーム「${gameData.name}」を公開(Publish)しました！\nゲーム一覧からプレイできます！`);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

window.WebloxStudio = WebloxStudio;
