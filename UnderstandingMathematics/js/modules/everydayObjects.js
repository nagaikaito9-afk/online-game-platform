/* Module: 3D Everyday Objects Math Observer */

export class EverydayObjectsModule {
    constructor(canvas, controlsContainer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = controlsContainer;

        // Object Type: 'can', 'dice', 'donut', 'pyramid', 'rugby'
        this.objType = 'can';

        // Dimension Parameters (in cm or meters)
        this.param1 = 6.6; // radius / width (cm)
        this.param2 = 12.2; // height (cm)
        this.param3 = 3.0; // inner radius for torus (cm)

        // 3D View
        this.angleX = 0.4;
        this.angleY = 0.6;
        this.zoom = 1.0;
        this.autoRotate = true;

        this.initControls();
        this.bindEvents();
    }

    initControls() {
        this.container.innerHTML = `
            <div class="panel-section">
                <h3>身近な立体物の選択</h3>
                <select class="select-input" id="obj-type-select">
                    <option value="can">🥤 ジュース缶 (円柱 - Cylinder)</option>
                    <option value="dice">🎲 サイコロ (正六面体 - Cube)</option>
                    <option value="donut">🍩 ドーナツ (トーラス - Torus)</option>
                    <option value="pyramid">🏛️ ピラミッド (四角錐 - Pyramid)</option>
                    <option value="rugby">🏉 ラグビーボール (回転楕円体 - Ellipsoid)</option>
                </select>
            </div>

            <div class="panel-section">
                <h3>寸法パラメータの調整 (cm)</h3>
                <div class="control-group" id="obj-p1-group">
                    <div class="control-label"><span id="obj-p1-label">半径 r (cm)</span> <span class="value" id="obj-p1-val">6.6 cm</span></div>
                    <input type="range" class="range-slider" id="obj-p1" min="1" max="25" step="0.1" value="6.6">
                </div>
                <div class="control-group" id="obj-p2-group">
                    <div class="control-label"><span id="obj-p2-label">高さ h (cm)</span> <span class="value" id="obj-p2-val">12.2 cm</span></div>
                    <input type="range" class="range-slider" id="obj-p2" min="1" max="35" step="0.1" value="12.2">
                </div>
                <div class="control-group" id="obj-p3-group" style="display:none;">
                    <div class="control-label">チューブ半径 r_tube (cm) <span class="value" id="obj-p3-val">3.0 cm</span></div>
                    <input type="range" class="range-slider" id="obj-p3" min="0.5" max="10" step="0.1" value="3.0">
                </div>
                <div class="toggle-group">
                    <span>3D 自動回転</span>
                    <label class="switch">
                        <input type="checkbox" id="obj-rotate-toggle" checked>
                        <span class="slider-round"></span>
                    </label>
                </div>
            </div>

            <div class="math-card" id="obj-math-info">
                <!-- Math calculations dynamically updated -->
            </div>
        `;

        document.getElementById('obj-type-select').addEventListener('change', (e) => {
            this.objType = e.target.value;
            this.updateControlLabels();
        });

        document.getElementById('obj-p1').addEventListener('input', (e) => {
            this.param1 = parseFloat(e.target.value);
            document.getElementById('obj-p1-val').textContent = `${this.param1.toFixed(1)} cm`;
        });
        document.getElementById('obj-p2').addEventListener('input', (e) => {
            this.param2 = parseFloat(e.target.value);
            document.getElementById('obj-p2-val').textContent = `${this.param2.toFixed(1)} cm`;
        });
        document.getElementById('obj-p3').addEventListener('input', (e) => {
            this.param3 = parseFloat(e.target.value);
            document.getElementById('obj-p3-val').textContent = `${this.param3.toFixed(1)} cm`;
        });
        document.getElementById('obj-rotate-toggle').addEventListener('change', (e) => {
            this.autoRotate = e.target.checked;
        });

        this.updateControlLabels();
    }

    updateControlLabels() {
        const p1Group = document.getElementById('obj-p1-group');
        const p2Group = document.getElementById('obj-p2-group');
        const p3Group = document.getElementById('obj-p3-group');

        const p1Label = document.getElementById('obj-p1-label');
        const p2Label = document.getElementById('obj-p2-label');

        if (this.objType === 'can') {
            p1Label.textContent = '底面半径 r (cm)';
            p2Label.textContent = '高さ h (cm)';
            p3Group.style.display = 'none';
        } else if (this.objType === 'dice') {
            p1Label.textContent = '一辺の長さ a (cm)';
            p2Group.style.display = 'none';
            p3Group.style.display = 'none';
        } else if (this.objType === 'donut') {
            p1Label.textContent = '中心半径 R (cm)';
            p2Group.style.display = 'none';
            p3Group.style.display = 'block';
        } else if (this.objType === 'pyramid') {
            p1Label.textContent = '底辺の一辺 a (cm)';
            p2Label.textContent = '高さ h (cm)';
            p2Group.style.display = 'block';
            p3Group.style.display = 'none';
        } else if (this.objType === 'rugby') {
            p1Label.textContent = '長半径 a (cm)';
            p2Label.textContent = '短半径 b (cm)';
            p2Group.style.display = 'block';
            p3Group.style.display = 'none';
        }
    }

    bindEvents() {
        let isDragging = false;
        let lastX = 0, lastY = 0;

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                isDragging = true;
                lastX = e.clientX;
                lastY = e.clientY;
            }
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            this.angleY += (e.clientX - lastX) * 0.01;
            this.angleX += (e.clientY - lastY) * 0.01;
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

    update(dt) {
        if (this.autoRotate) {
            this.angleY += dt * 0.3;
        }
    }

    // Mathematical calculations for volume and surface area
    calculateStats() {
        let volCm3 = 0, surfaceCm2 = 0;
        let formulaVol = '', formulaSurf = '';

        const r = this.param1, h = this.param2, rTube = this.param3;

        if (this.objType === 'can') {
            volCm3 = Math.PI * r * r * h;
            surfaceCm2 = 2 * Math.PI * r * h + 2 * Math.PI * r * r;
            formulaVol = 'V = \\pi r^2 h';
            formulaSurf = 'S = 2\\pi r h + 2\\pi r^2';
        } else if (this.objType === 'dice') {
            const a = r;
            volCm3 = a * a * a;
            surfaceCm2 = 6 * a * a;
            formulaVol = 'V = a^3';
            formulaSurf = 'S = 6a^2';
        } else if (this.objType === 'donut') {
            const R = r;
            volCm3 = 2 * Math.PI * Math.PI * R * rTube * rTube;
            surfaceCm2 = 4 * Math.PI * Math.PI * R * rTube;
            formulaVol = 'V = 2\\pi^2 R r^2';
            formulaSurf = 'S = 4\\pi^2 R r';
        } else if (this.objType === 'pyramid') {
            const a = r;
            volCm3 = (a * a * h) / 3;
            const slantH = Math.hypot(a / 2, h);
            surfaceCm2 = a * a + 2 * a * slantH;
            formulaVol = 'V = \\frac{1}{3} a^2 h';
            formulaSurf = 'S = a^2 + 2a \\sqrt{(a/2)^2 + h^2}';
        } else if (this.objType === 'rugby') {
            const a = r, b = h;
            volCm3 = (4 / 3) * Math.PI * a * b * b;
            surfaceCm2 = 4 * Math.PI * ((a * a + b * b) / 2); // Approximate
            formulaVol = 'V = \\frac{4}{3} \\pi a b^2';
            formulaSurf = 'S \\approx 4\\pi \\left( \\frac{a^2 + b^2}{2} \\right)';
        }

        const volLiters = volCm3 / 1000;
        const volM3 = volCm3 / 1000000;

        return { volCm3, volLiters, volM3, surfaceCm2, formulaVol, formulaSurf };
    }

    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        const stats = this.calculateStats();
        const mathInfoBox = document.getElementById('obj-math-info');
        if (mathInfoBox) {
            mathInfoBox.innerHTML = `
                <h4>📦 3D幾何計算結果</h4>
                <div class="math-formula-box">${stats.formulaVol}</div>
                ・<b>体積 (Volume)</b>:<br>
                　<b>${stats.volCm3.toFixed(1)} cm³</b><br>
                　<b>${stats.volLiters.toFixed(3)} L (リットル)</b><br>
                　<b>${stats.volM3.toFixed(6)} m³</b><br><br>
                ・<b>表面積 (Surface Area)</b>:<br>
                　<b>${stats.surfaceCm2.toFixed(1)} cm²</b> (${(stats.surfaceCm2 / 10000).toFixed(4)} m²)
            `;

            if (window.renderMathInElement) {
                window.renderMathInElement(mathInfoBox, {
                    delimiters: [
                        { left: "$$", right: "$$", display: true },
                        { left: "$", right: "$", display: false }
                    ]
                });
            }
        }

        // Render 3D Model with Dimensions
        const originX = width / 2;
        const originY = height / 2;
        const scale = 12 * this.zoom;

        const cosX = Math.cos(this.angleX), sinX = Math.sin(this.angleX);
        const cosY = Math.cos(this.angleY), sinY = Math.sin(this.angleY);

        const project = (x, y, z) => {
            let x1 = x * cosY - z * sinY;
            let z1 = x * sinY + z * cosY;
            let y2 = y * cosX - z1 * sinX;
            return {
                sx: originX + x1 * scale,
                sy: originY - y2 * scale
            };
        };

        // Draw Object 3D Wireframe / Shading
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 1.5;

        if (this.objType === 'can') {
            const r = this.param1, h = this.param2;
            // Draw Cylinder
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
                const px = r * Math.cos(angle);
                const pz = r * Math.sin(angle);
                const topP = project(px, h / 2, pz);
                const botP = project(px, -h / 2, pz);
                ctx.beginPath(); ctx.moveTo(topP.sx, topP.sy); ctx.lineTo(botP.sx, botP.sy); ctx.stroke();
            }
        } else if (this.objType === 'dice') {
            const a = this.param1 / 2;
            const vertices = [
                [-a, -a, -a], [a, -a, -a], [a, a, -a], [-a, a, -a],
                [-a, -a, a], [a, -a, a], [a, a, a], [-a, a, a]
            ];
            const edges = [
                [0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]
            ];
            ctx.strokeStyle = '#ff007f';
            for (let edge of edges) {
                const p1 = project(...vertices[edge[0]]);
                const p2 = project(...vertices[edge[1]]);
                ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy); ctx.stroke();
            }
        }

        // Overlay Text
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Fira Code", monospace';
        ctx.fillText(`3D Everyday Object Observer (Volume m³, L, Surface Area)`, 20, 30);
    }
}
