/* Module: Klein Bottle 3D Visualizer */

export class KleinBottleModule {
    constructor(canvas, controlsContainer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = controlsContainer;

        // 3D Parameters
        this.angleX = 0.5;
        this.angleY = 0.8;
        this.zoom = 1.0;
        this.autoRotate = true;
        
        // Render settings
        this.renderMode = 'shaded'; // 'shaded', 'wireframe', 'points'
        this.bottleType = 'figure8'; // 'figure8' or 'classical'
        this.gridU = 32;
        this.gridV = 32;
        this.sliceCut = 1.0; // 0 to 1

        this.initControls();
        this.bindEvents();
    }

    initControls() {
        this.container.innerHTML = `
            <div class="panel-section">
                <h3>形状モデル選択</h3>
                <select class="select-input" id="klein-type-select">
                    <option value="figure8">Figure-8 クラインの壺 (8の字型)</option>
                    <option value="classical">Classical クラインの壺 (瓶首貫通型)</option>
                </select>
            </div>

            <div class="panel-section">
                <h3>描画スタイル</h3>
                <select class="select-input" id="klein-mode-select">
                    <option value="shaded">3D スムースシェーディング (Shaded)</option>
                    <option value="wireframe">ワイヤーフレーム (Wireframe)</option>
                    <option value="points">3D クラウドパーティクル (Points)</option>
                </select>
            </div>

            <div class="panel-section">
                <h3>コントロール</h3>
                <div class="control-group">
                    <div class="control-label">メッシュ解像度 <span class="value" id="klein-res-val">32x32</span></div>
                    <input type="range" class="range-slider" id="klein-res" min="16" max="50" step="2" value="32">
                </div>
                <div class="control-group">
                    <div class="control-label">断面スライス <span class="value" id="klein-slice-val">100%</span></div>
                    <input type="range" class="range-slider" id="klein-slice" min="0.2" max="1.0" step="0.05" value="1.0">
                </div>
                <div class="toggle-group">
                    <span>3D 自動回転</span>
                    <label class="switch">
                        <input type="checkbox" id="klein-rotate-toggle" checked>
                        <span class="slider-round"></span>
                    </label>
                </div>
            </div>

            <div class="math-card">
                <h4>🍶 クラインの壺 (Klein Bottle) とは？</h4>
                表と裏の区別が存在しない<b>「1向き可能性を持たない閉曲面」</b>です。
                4次元空間では自己交差せずに存在しますが、3D（3次元）空間に射影すると瓶の首が側面を突き抜ける形状として表現されます。
                <div class="math-formula-box">
                    \\chi = 0 \\quad (\\text{オイラー標数})
                </div>
                内部に閉じ込められた水は、境界を通過することなくいつの間にか外側へと染み出します。
            </div>
        `;

        document.getElementById('klein-type-select').addEventListener('change', (e) => {
            this.bottleType = e.target.value;
        });
        document.getElementById('klein-mode-select').addEventListener('change', (e) => {
            this.renderMode = e.target.value;
        });
        document.getElementById('klein-res').addEventListener('input', (e) => {
            this.gridU = parseInt(e.target.value);
            this.gridV = parseInt(e.target.value);
            document.getElementById('klein-res-val').textContent = `${this.gridU}x${this.gridV}`;
        });
        document.getElementById('klein-slice').addEventListener('input', (e) => {
            this.sliceCut = parseFloat(e.target.value);
            document.getElementById('klein-slice-val').textContent = `${Math.round(this.sliceCut * 100)}%`;
        });
        document.getElementById('klein-rotate-toggle').addEventListener('change', (e) => {
            this.autoRotate = e.target.checked;
        });
    }

    bindEvents() {
        let isDragging = false;
        let lastX = 0, lastY = 0;

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                isDragging = true;
                lastX = e.clientX;
                lastY = e.clientY;
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            this.angleY += dx * 0.01;
            this.angleX += dy * 0.01;
            lastX = e.clientX;
            lastY = e.clientY;
        });

        window.addEventListener('mouseup', () => isDragging = false);

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoom *= e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom = Math.max(0.3, Math.min(3.0, this.zoom));
        }, { passive: false });
    }

    getPoint(u, v) {
        let x, y, z;

        if (this.bottleType === 'figure8') {
            // Figure-8 Klein Bottle Parametric Equations
            const r = 2.0;
            const cosU = Math.cos(u), sinU = Math.sin(u);
            const cosV = Math.cos(v), sinV = Math.sin(v);
            const sinHalfU = Math.sin(u / 2), cosHalfU = Math.cos(u / 2);

            x = (r + cosHalfU * sinV - sinHalfU * Math.sin(2 * v)) * cosU;
            y = (r + cosHalfU * sinV - sinHalfU * Math.sin(2 * v)) * sinU;
            z = sinHalfU * sinV + cosHalfU * Math.sin(2 * v);
        } else {
            // Classical Lawson / Bottle Parametric Equations
            const cosU = Math.cos(u), sinU = Math.sin(u);
            const cosV = Math.cos(v), sinV = Math.sin(v);

            if (u < Math.PI) {
                x = 3 * cosU * (1 + sinU) + (2 * (1 - cosU / 2)) * cosU * cosV;
                z = -8 * sinU - (2 * (1 - cosU / 2)) * sinU * cosV;
            } else {
                x = 3 * cosU * (1 + sinU) + (2 * (1 - cosU / 2)) * Math.cos(v + Math.PI);
                z = -8 * sinU;
            }
            y = (2 * (1 - cosU / 2)) * sinV;

            // Scale factor for classical
            x *= 0.35; y *= 0.35; z *= 0.35;
        }

        return { x, y, z };
    }

    update(dt) {
        if (this.autoRotate) {
            this.angleY += dt * 0.4;
        }
    }

    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        const originX = width / 2;
        const originY = height / 2;
        const scale = 50 * this.zoom;

        const cosX = Math.cos(this.angleX), sinX = Math.sin(this.angleX);
        const cosY = Math.cos(this.angleY), sinY = Math.sin(this.angleY);

        const project = (p) => {
            // 3D Rotation Matrix
            let x1 = p.x * cosY - p.z * sinY;
            let z1 = p.x * sinY + p.z * cosY;

            let y2 = p.y * cosX - z1 * sinX;
            let z2 = p.y * sinX + z1 * cosX;

            return {
                sx: originX + x1 * scale,
                sy: originY - y2 * scale,
                depth: z2,
                rawX: x1, rawY: y2, rawZ: z2
            };
        };

        // Generate Mesh Grid
        const mesh = [];
        const nu = this.gridU;
        const nv = this.gridV;
        const maxU = Math.PI * 2 * this.sliceCut;

        for (let i = 0; i <= nu; i++) {
            const u = (i / nu) * maxU;
            const row = [];
            for (let j = 0; j <= nv; j++) {
                const v = (j / nv) * Math.PI * 2;
                const pt = this.getPoint(u, v);
                row.push(project(pt));
            }
            mesh.push(row);
        }

        // Draw Polygons or Lines
        if (this.renderMode === 'shaded') {
            // Collect Quads for Depth Sorting (Painters Algorithm)
            const quads = [];

            for (let i = 0; i < mesh.length - 1; i++) {
                for (let j = 0; j < nv; j++) {
                    const p1 = mesh[i][j];
                    const p2 = mesh[i + 1][j];
                    const p3 = mesh[i + 1][j + 1];
                    const p4 = mesh[i][j + 1];

                    const avgDepth = (p1.depth + p2.depth + p3.depth + p4.depth) / 4;
                    const uRatio = i / nu;

                    quads.push({ p1, p2, p3, p4, depth: avgDepth, uRatio });
                }
            }

            // Sort quads back-to-front
            quads.sort((a, b) => a.depth - b.depth);

            for (let q of quads) {
                // Color Gradient based on uRatio (topology flow)
                const hue = (q.uRatio * 280 + 180) % 360;
                const lightness = 40 + Math.max(0, Math.min(40, (q.depth + 3) * 8));

                ctx.fillStyle = `hsla(${hue}, 85%, ${lightness}%, 0.75)`;
                ctx.strokeStyle = `hsla(${hue}, 90%, 75%, 0.3)`;
                ctx.lineWidth = 0.5;

                ctx.beginPath();
                ctx.moveTo(q.p1.sx, q.p1.sy);
                ctx.lineTo(q.p2.sx, q.p2.sy);
                ctx.lineTo(q.p3.sx, q.p3.sy);
                ctx.lineTo(q.p4.sx, q.p4.sy);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        } else if (this.renderMode === 'wireframe') {
            ctx.strokeStyle = '#00f3ff';
            ctx.lineWidth = 1;

            for (let i = 0; i < mesh.length; i++) {
                ctx.beginPath();
                for (let j = 0; j <= nv; j++) {
                    const p = mesh[i][j];
                    if (j === 0) ctx.moveTo(p.sx, p.sy);
                    else ctx.lineTo(p.sx, p.sy);
                }
                ctx.stroke();
            }

            for (let j = 0; j <= nv; j++) {
                ctx.beginPath();
                for (let i = 0; i < mesh.length; i++) {
                    const p = mesh[i][j];
                    if (i === 0) ctx.moveTo(p.sx, p.sy);
                    else ctx.lineTo(p.sx, p.sy);
                }
                ctx.stroke();
            }
        } else {
            // Points Mode
            ctx.fillStyle = '#ff007f';
            for (let i = 0; i < mesh.length; i++) {
                for (let j = 0; j <= nv; j++) {
                    const p = mesh[i][j];
                    ctx.beginPath();
                    ctx.arc(p.sx, p.sy, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Overlay text
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Fira Code", monospace';
        ctx.fillText(`3D Klein Bottle Visualizer (Drag to rotate, Scroll to zoom)`, 20, 30);
    }
}
