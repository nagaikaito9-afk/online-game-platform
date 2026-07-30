/* Module: 3D General Relativity & Black Hole Gravitational Spacetime Warp */

export class Relativity3DModule {
    constructor(canvas, controlsContainer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = controlsContainer;

        // Parameters
        this.mass = 4.0; // Mass of celestial body (Black hole / Neutron star)
        this.showLightRays = true;
        this.showAccretionDisk = true;
        this.time = 0;
        this.angleX = 0.5;
        this.angleY = 0.3;

        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };

        this.initControls();
        this.bindEvents();
    }

    initControls() {
        this.container.innerHTML = `
            <div class="panel-section">
                <h3>🌌 天体質量 $M$ 設定</h3>
                <div class="control-group">
                    <label>ブラックホール質量: <span id="rel-mass-val">${this.mass}</span> $M_\\odot$</label>
                    <input type="range" id="rel-mass-slider" min="1" max="10" step="0.5" value="${this.mass}">
                </div>
            </div>

            <div class="panel-section">
                <h3>👁️ 視覚表示オプション</h3>
                <div class="control-group">
                    <label><input type="checkbox" id="rel-rays-check" ${this.showLightRays ? 'checked' : ''}> 重力レンズ光子軌道 (Light Lensing)</label>
                </div>
                <div class="control-group">
                    <label><input type="checkbox" id="rel-disk-check" ${this.showAccretionDisk ? 'checked' : ''}> 降着ディスク (Accretion Disk)</label>
                </div>
            </div>

            <div class="panel-section info-box">
                <h4>💡 一般相対性理論 (アインシュタイン)</h4>
                <p>アインシュタイン方程式:</p>
                <p>$$G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}$$</p>
                <p>質量が存在すると時空 $g_{\\mu\\nu}$ が歪み、光すらも歪んだ時空に沿って曲がります（重力レンズ効果）。</p>
                <p>シュヴァルツシルト半径: $$r_s = \\frac{2GM}{c^2}$$ 内側からは光を含む何者も脱出できません。</p>
            </div>
        `;
    }

    bindEvents() {
        const massSlider = document.getElementById('rel-mass-slider');
        const raysCheck = document.getElementById('rel-rays-check');
        const diskCheck = document.getElementById('rel-disk-check');

        if (massSlider) {
            massSlider.addEventListener('input', (e) => {
                this.mass = parseFloat(e.target.value);
                document.getElementById('rel-mass-val').textContent = this.mass.toFixed(1);
            });
        }

        if (raysCheck) {
            raysCheck.addEventListener('change', (e) => {
                this.showLightRays = e.target.checked;
            });
        }

        if (diskCheck) {
            diskCheck.addEventListener('change', (e) => {
                this.showAccretionDisk = e.target.checked;
            });
        }

        // Drag mouse to rotate 3D view
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouse = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const dx = e.clientX - this.lastMouse.x;
            const dy = e.clientY - this.lastMouse.y;
            this.angleY += dx * 0.008;
            this.angleX += dy * 0.008;
            this.lastMouse = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }

    update(dt) {
        this.time += dt;
    }

    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.fillStyle = '#05060b';
        ctx.fillRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;

        const cosX = Math.cos(this.angleX);
        const sinX = Math.sin(this.angleX);
        const cosY = Math.cos(this.angleY);
        const sinY = Math.sin(this.angleY);

        const project = (x, y, z) => {
            // Rotate Y
            let x1 = x * cosY - z * sinY;
            let z1 = x * sinY + z * cosY;

            // Rotate X
            let y2 = y * cosX - z1 * sinX;
            let z2 = y * sinX + z1 * cosX;

            const fov = 400;
            const dist = 600;
            const scale = fov / (dist + z2);

            return {
                sx: cx + x1 * scale,
                sy: cy + y2 * scale,
                scale: scale,
                z: z2
            };
        };

        // Draw Spacetime Grid Warp
        const gridSize = 16;
        const gridSpacing = 25;
        const rs = this.mass * 12; // Schwarzschild radius in pixels

        ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
        ctx.lineWidth = 1;

        for (let i = -gridSize; i <= gridSize; i++) {
            ctx.beginPath();
            for (let j = -gridSize; j <= gridSize; j++) {
                let x = i * gridSpacing;
                let z = j * gridSpacing;
                let r = Math.sqrt(x * x + z * z);
                
                // Gravitational Potential sag (Flamm's paraboloid / Spacetime curvature)
                let y = - (this.mass * 120) / Math.max(r, rs * 0.8);

                let p = project(x, y, z);
                if (j === -gridSize) ctx.moveTo(p.sx, p.sy);
                else ctx.lineTo(p.sx, p.sy);
            }
            ctx.stroke();
        }

        for (let j = -gridSize; j <= gridSize; j++) {
            ctx.beginPath();
            for (let i = -gridSize; i <= gridSize; i++) {
                let x = i * gridSpacing;
                let z = j * gridSpacing;
                let r = Math.sqrt(x * x + z * z);
                let y = - (this.mass * 120) / Math.max(r, rs * 0.8);

                let p = project(x, y, z);
                if (i === -gridSize) ctx.moveTo(p.sx, p.sy);
                else ctx.lineTo(p.sx, p.sy);
            }
            ctx.stroke();
        }

        // Draw Accretion Disk
        if (this.showAccretionDisk) {
            const diskRInner = rs * 1.2;
            const diskROuter = rs * 3.5;
            const particles = 120;

            for (let k = 0; k < particles; k++) {
                let angle = (k / particles) * Math.PI * 2 + this.time * 1.5;
                let r = diskRInner + (k % 5) * ((diskROuter - diskRInner) / 5);
                let x = Math.cos(angle) * r;
                let z = Math.sin(angle) * r;
                let y = 0;

                let p = project(x, y, z);
                let hue = 30 + (k % 30);
                ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.8)`;
                ctx.beginPath();
                ctx.arc(p.sx, p.sy, p.scale * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw Light Lensing Rays
        if (this.showLightRays) {
            const numRays = 7;
            for (let r = 0; r < numRays; r++) {
                let startY = -150 + r * 50;
                ctx.strokeStyle = 'rgba(255, 235, 59, 0.6)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                for (let step = -300; step <= 300; step += 10) {
                    let lx = step;
                    let lz = 0;
                    let distToBH = Math.sqrt(lx * lx + startY * startY);
                    
                    // Deflection angle delta theta ~ 4GM / (c^2 b)
                    let bend = (this.mass * 2000) / (distToBH * distToBH + 400);
                    let ly = startY + (lx > 0 ? bend : -bend);

                    let p = project(lx, ly, lz);
                    if (step === -300) ctx.moveTo(p.sx, p.sy);
                    else ctx.lineTo(p.sx, p.sy);
                }
                ctx.stroke();
            }
        }

        // Draw Black Hole (Event Horizon)
        let bhPos = project(0, - (this.mass * 120) / (rs * 0.8), 0);
        ctx.save();
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ff0055';

        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(bhPos.sx, bhPos.sy, rs * bhPos.scale * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Overlay Text
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`事象の地平線 (Event Horizon) Radius: ${(rs * 0.5).toFixed(1)} px`, 30, 40);
        ctx.fillText(`ドラッグで3D視点を回転できます`, 30, 65);
    }
}
