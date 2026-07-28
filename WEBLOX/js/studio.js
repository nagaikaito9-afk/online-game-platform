/**
 * WEBLOX - studio.js
 * ブラウザ完全再現型 3Dゲーム制作エンジン (WEBLOX Studio)
 * パーツ配置、ドラッグ移動、スクリプト付与、ゲーム公開
 */

class WebloxStudio {
  constructor(canvas) {
    this.canvas = canvas;
    this.workspaceObjects = [];
    this.selectedObject = null;
    this.currentTool = 'select'; // select, move, scale, delete
    this.isDragging = false;

    this.initThree();
    this.setupWorkspace();
    this.bindEvents();
    this.updateExplorer();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x181920);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(20, 20, 25);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.position.set(30, 60, 30);
    sun.castShadow = true;
    this.scene.add(sun);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  }

  setupWorkspace() {
    const grid = new THREE.GridHelper(100, 50, 0x00a2ff, 0x333344);
    grid.position.y = 0.01;
    this.scene.add(grid);

    const baseGeo = new THREE.BoxGeometry(100, 1, 100);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x222431, roughness: 0.8 });
    const baseplate = new THREE.Mesh(baseGeo, baseMat);
    baseplate.position.y = -0.5;
    baseplate.receiveShadow = true;
    baseplate.name = 'Baseplate';
    baseplate.userData = { id: 'baseplate', type: 'Baseplate', anchored: true };
    this.scene.add(baseplate);

    this.addPart('spawn', 0, 0.1, 0, 'SpawnLocation');
  }

  addPart(type, x = 0, y = 2, z = 0, customName = null) {
    let geo;
    let color = 0x00a2ff;
    let name = customName || `Part_${this.workspaceObjects.length + 1}`;
    let scriptType = 'none';

    if (type === 'block') {
      geo = new THREE.BoxGeometry(3, 3, 3);
    } else if (type === 'sphere') {
      geo = new THREE.SphereGeometry(2, 24, 24);
      color = 0xffb703;
    } else if (type === 'cylinder') {
      geo = new THREE.CylinderGeometry(1.5, 1.5, 4, 24);
      color = 0x00e676;
    } else if (type === 'spawn') {
      geo = new THREE.CylinderGeometry(3, 3, 0.3, 24);
      color = 0x00e676;
      name = 'SpawnLocation';
    } else if (type === 'killblock') {
      geo = new THREE.BoxGeometry(4, 1.5, 4);
      color = 0xff3366;
      name = 'KillBlock';
      scriptType = 'kill';
    }

    const mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: scriptType === 'kill' ? 0xff3366 : 0x000000,
      emissiveIntensity: scriptType === 'kill' ? 0.5 : 0,
      roughness: 0.3
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = name;
    mesh.userData = {
      id: 'part_' + Date.now() + Math.random().toString(36).substr(2, 4),
      type: type,
      scriptType: scriptType,
      scriptCode: scriptType === 'kill' ? 'function onTouch()\n  script.Parent.Humanoid:TakeDamage(100)\nend' : ''
    };

    this.scene.add(mesh);
    this.workspaceObjects.push(mesh);
    this.selectObject(mesh);
    this.updateExplorer();
    if (window.audioEngine) window.audioEngine.playSE('click');
  }

  selectObject(mesh) {
    this.selectedObject = mesh;
    this.updateExplorer();
    this.updatePropertiesPanel();
  }

  bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.workspaceObjects);

      if (intersects.length > 0) {
        const obj = intersects[0].object;
        if (this.currentTool === 'delete') {
          this.scene.remove(obj);
          this.workspaceObjects = this.workspaceObjects.filter(o => o !== obj);
          this.selectedObject = null;
          this.updateExplorer();
          this.updatePropertiesPanel();
          if (window.audioEngine) window.audioEngine.playSE('hit');
        } else {
          this.selectObject(obj);
          this.isDragging = true;
        }
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging && this.selectedObject && this.currentTool === 'move') {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersectPoint = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.plane, intersectPoint);
        if (intersectPoint) {
          this.selectedObject.position.x = Math.round(intersectPoint.x);
          this.selectedObject.position.z = Math.round(intersectPoint.z);
          this.updatePropertiesPanel();
        }
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  updateExplorer() {
    const treeEl = document.getElementById('studio-explorer-tree');
    if (!treeEl) return;

    treeEl.innerHTML = `
      <div class="tree-node" style="font-weight:bold; color:var(--rbx-primary);">📁 Workspace</div>
    `;

    this.workspaceObjects.forEach(obj => {
      const isSel = this.selectedObject === obj;
      const node = document.createElement('div');
      node.className = `tree-node ${isSel ? 'selected' : ''}`;
      node.style.paddingLeft = '1.5rem';
      node.innerHTML = `🧊 ${obj.name}`;
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectObject(obj);
      });
      treeEl.appendChild(node);
    });
  }

  updatePropertiesPanel() {
    const propEl = document.getElementById('studio-properties-content');
    if (!propEl) return;

    if (!this.selectedObject) {
      propEl.innerHTML = '<div style="color:var(--rbx-text-sub);">オブジェクトが選択されていません</div>';
      return;
    }

    const obj = this.selectedObject;
    propEl.innerHTML = `
      <div style="font-weight:bold; color:#fff; margin-bottom:0.5rem;">${obj.name} のプロパティ</div>
      <table style="width:100%; font-size:0.8rem; color:var(--rbx-text-sub);">
        <tr><td style="padding:0.2rem;">Name</td><td><input type="text" id="prop-name-input" value="${obj.name}" style="background:#111216; color:#fff; border:1px solid #333; width:100%;"></td></tr>
        <tr><td style="padding:0.2rem;">PosX</td><td><input type="number" id="prop-pos-x" value="${obj.position.x.toFixed(1)}" step="1" style="background:#111216; color:#fff; border:1px solid #333; width:100%;"></td></tr>
        <tr><td style="padding:0.2rem;">PosY</td><td><input type="number" id="prop-pos-y" value="${obj.position.y.toFixed(1)}" step="1" style="background:#111216; color:#fff; border:1px solid #333; width:100%;"></td></tr>
        <tr><td style="padding:0.2rem;">PosZ</td><td><input type="number" id="prop-pos-z" value="${obj.position.z.toFixed(1)}" step="1" style="background:#111216; color:#fff; border:1px solid #333; width:100%;"></td></tr>
        <tr><td style="padding:0.2rem;">Script</td><td>
          <button id="btn-edit-script" style="background:var(--rbx-primary); color:#fff; border:none; padding:0.3rem 0.6rem; border-radius:4px; cursor:pointer; width:100%;">📝 スクリプト編集 (Lua)</button>
        </td></tr>
      </table>
    `;

    document.getElementById('prop-name-input').addEventListener('change', (e) => {
      obj.name = e.target.value.trim() || obj.name;
      this.updateExplorer();
    });
    document.getElementById('prop-pos-x').addEventListener('change', (e) => { obj.position.x = parseFloat(e.target.value) || 0; });
    document.getElementById('prop-pos-y').addEventListener('change', (e) => { obj.position.y = parseFloat(e.target.value) || 0; });
    document.getElementById('prop-pos-z').addEventListener('change', (e) => { obj.position.z = parseFloat(e.target.value) || 0; });

    document.getElementById('btn-edit-script').addEventListener('click', () => {
      const code = prompt('Luaスクリプトを入力・編集:', obj.userData.scriptCode || 'function onTouch()\n  print("Touched!")\nend');
      if (code !== null) {
        obj.userData.scriptCode = code;
        if (code.includes('Damage') || code.includes('Kill')) {
          obj.userData.scriptType = 'kill';
          obj.material.color.setHex(0xff3366);
          obj.material.emissive.setHex(0xff3366);
          obj.material.emissiveIntensity = 0.5;
        }
      }
    });
  }

  publishCurrentGame(title, desc) {
    const myGames = JSON.parse(localStorage.getItem('weblox_my_games') || '[]');
    const newGame = {
      id: 'custom_game_' + Date.now(),
      name: title || '自作Robloxワールド',
      category: 'WEBLOX Studio作品',
      author: localStorage.getItem('weblox_username') || 'RobloxStudioPro',
      likes: '100%',
      playing: '1',
      desc: desc || 'WEBLOX Studioでフル制作されたオリジナルワールド！',
      icon: '🎮',
      bg: '#00a2ff',
      objects: this.workspaceObjects.map(o => ({
        type: o.userData.type,
        name: o.name,
        x: o.position.x,
        y: o.position.y,
        z: o.position.z,
        color: o.material.color.getHex(),
        scriptType: o.userData.scriptType
      }))
    };

    myGames.unshift(newGame);
    localStorage.setItem('weblox_my_games', JSON.stringify(myGames));
    if (window.WEBLOX_WORLDS) window.WEBLOX_WORLDS.unshift(newGame);

    if (window.audioEngine) window.audioEngine.playSE('coin');
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

window.WebloxStudio = WebloxStudio;
