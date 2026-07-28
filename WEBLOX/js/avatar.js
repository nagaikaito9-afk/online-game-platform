/**
 * WEBLOX - avatar.js
 * Three.js による3Dブロックアバター構築・制御
 */

class Avatar3D {
  constructor(scene, isLocal = true) {
    this.scene = scene;
    this.isLocal = isLocal;

    this.position = new THREE.Vector3(0, 2, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotationY = 0;
    this.isGrounded = false;
    this.moveSpeed = 0.22;
    this.jumpForce = 0.45;
    this.gravity = -0.025;

    this.bodyColor = '#ffd166';
    this.hatType = 'none';
    this.hatMesh = null;
    this.emoteAnimation = null;
    this.animTime = 0;

    this.createMesh();
  }

  createMesh() {
    this.group = new THREE.Group();

    // マテリアル
    const mainMat = new THREE.MeshStandardMaterial({
      color: this.bodyColor,
      roughness: 0.3,
      metalness: 0.1
    });

    const blueMat = new THREE.MeshStandardMaterial({ color: 0x0077b6, roughness: 0.4 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.5 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

    // 頭部 (Head - Blocky/Rounded Cube)
    const headGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    this.head = new THREE.Mesh(headGeo, mainMat);
    this.head.position.y = 1.6;
    this.head.castShadow = true;
    this.group.add(this.head);

    // 目 (Eyes)
    const eyeGeo = new THREE.BoxGeometry(0.15, 0.15, 0.05);
    const leftEye = new THREE.Mesh(eyeGeo, blackMat);
    leftEye.position.set(-0.2, 1.7, 0.46);
    const rightEye = new THREE.Mesh(eyeGeo, blackMat);
    rightEye.position.set(0.2, 1.7, 0.46);
    this.group.add(leftEye);
    this.group.add(rightEye);

    // 胴体 (Torso)
    const torsoGeo = new THREE.BoxGeometry(1.2, 1.3, 0.6);
    this.torso = new THREE.Mesh(torsoGeo, blueMat);
    this.torso.position.y = 0.65;
    this.torso.castShadow = true;
    this.group.add(this.torso);

    // 腕 (Left & Right Arms)
    const armGeo = new THREE.BoxGeometry(0.4, 1.2, 0.4);
    this.leftArm = new THREE.Mesh(armGeo, mainMat);
    this.leftArm.position.set(-0.85, 0.65, 0);
    this.leftArm.castShadow = true;
    this.group.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, mainMat);
    this.rightArm.position.set(0.85, 0.65, 0);
    this.rightArm.castShadow = true;
    this.group.add(this.rightArm);

    // 脚 (Left & Right Legs)
    const legGeo = new THREE.BoxGeometry(0.55, 1.1, 0.55);
    this.leftLeg = new THREE.Mesh(legGeo, darkMat);
    this.leftLeg.position.set(-0.3, -0.55, 0);
    this.leftLeg.castShadow = true;
    this.group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, darkMat);
    this.rightLeg.position.set(0.3, -0.55, 0);
    this.rightLeg.castShadow = true;
    this.group.add(this.rightLeg);

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  setCustomization(colorHex, hatType) {
    this.bodyColor = colorHex;
    this.hatType = hatType;

    const newMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3 });
    this.head.material = newMat;
    this.leftArm.material = newMat;
    this.rightArm.material = newMat;

    // 帽子メッシュ付け替え
    if (this.hatMesh) {
      this.head.remove(this.hatMesh);
      this.hatMesh = null;
    }

    if (hatType === 'cap') {
      const hatGeo = new THREE.BoxGeometry(1.0, 0.25, 1.0);
      const visorGeo = new THREE.BoxGeometry(0.8, 0.05, 0.4);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xd90429 });
      this.hatMesh = new THREE.Mesh(hatGeo, capMat);
      const visor = new THREE.Mesh(visorGeo, capMat);
      visor.position.set(0, -0.1, 0.6);
      this.hatMesh.add(visor);
      this.hatMesh.position.set(0, 0.5, 0);
      this.head.add(this.hatMesh);
    } else if (hatType === 'crown') {
      const crownGeo = new THREE.CylinderGeometry(0.55, 0.45, 0.35, 6);
      const crownMat = new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.8, roughness: 0.2 });
      this.hatMesh = new THREE.Mesh(crownGeo, crownMat);
      this.hatMesh.position.set(0, 0.55, 0);
      this.head.add(this.hatMesh);
    } else if (hatType === 'cat') {
      const earGeo = new THREE.ConeGeometry(0.2, 0.4, 4);
      const catMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      this.hatMesh = new THREE.Group();
      const earL = new THREE.Mesh(earGeo, catMat);
      earL.position.set(-0.3, 0.6, 0);
      const earR = new THREE.Mesh(earGeo, catMat);
      earR.position.set(0.3, 0.6, 0);
      this.hatMesh.add(earL);
      this.hatMesh.add(earR);
      this.head.add(this.hatMesh);
    }
  }

  update(input, delta) {
    if (!this.isLocal) return;

    this.animTime += 0.1;

    // 水平移動判定
    let moveX = 0;
    let moveZ = 0;

    if (input.forward) moveZ -= 1;
    if (input.backward) moveZ += 1;
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;

    const moveVec = new THREE.Vector3(moveX, 0, moveZ);
    if (moveVec.length() > 0) {
      moveVec.normalize();
      
      // カメラ相対移動
      const camYaw = input.cameraYaw || 0;
      moveVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), camYaw);

      this.position.x += moveVec.x * this.moveSpeed;
      this.position.z += moveVec.z * this.moveSpeed;

      // 移動方向に向く
      this.rotationY = Math.atan2(moveVec.x, moveVec.z);
      this.group.rotation.y = this.rotationY;

      // 歩行アニメーション (腕と脚のスイング)
      const swing = Math.sin(this.animTime * 1.8) * 0.6;
      this.leftArm.rotation.x = swing;
      this.rightArm.rotation.x = -swing;
      this.leftLeg.rotation.x = -swing;
      this.rightLeg.rotation.x = swing;
    } else {
      // 停止時リセット
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
    }

    // ジャンプ＆重力
    if (input.jump && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      audioEngine.playSE('jump');
    }

    this.velocity.y += this.gravity;
    this.position.y += this.velocity.y;

    // 床判定 (Y = 0)
    if (this.position.y <= 1.0) {
      this.position.y = 1.0;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // エモート再生処理
    if (this.emoteAnimation) {
      if (this.emoteAnimation === 'dance') {
        this.group.rotation.y += 0.15;
        this.leftArm.rotation.z = Math.sin(this.animTime * 3) * 0.8 + 0.5;
        this.rightArm.rotation.z = -Math.sin(this.animTime * 3) * 0.8 - 0.5;
      } else if (this.emoteAnimation === 'wave') {
        this.rightArm.rotation.z = 2.5 + Math.sin(this.animTime * 4) * 0.4;
      } else if (this.emoteAnimation === 'backflip') {
        this.group.rotation.x += 0.2;
      }
    } else if (moveVec.length() === 0) {
      this.group.rotation.x = 0;
      this.leftArm.rotation.z = 0;
      this.rightArm.rotation.z = 0;
    }

    this.group.position.copy(this.position);
  }

  playEmote(type) {
    this.emoteAnimation = type;
    setTimeout(() => {
      this.emoteAnimation = null;
      this.group.rotation.x = 0;
    }, 2500);
  }

  destroy() {
    this.scene.remove(this.group);
  }
}

window.Avatar3D = Avatar3D;
