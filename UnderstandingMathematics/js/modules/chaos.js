/* Module: Chaos Theory & Fractals */

export class ChaosModule {
    constructor(canvas, controlsContainer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = controlsContainer;

        // Submode: 'lorenz' or 'mandelbrot'
        this.mode = 'lorenz';

        // Lorenz Attractor Parameters
        this.sigma = 10;
        this.rho = 28;
        this.beta = 8 / 3;
        
        // Multi-particle butterfly effect
        this.particles = [];
        this.numParticles = 3;
        this.trailLength = 400;

        // Rotation angles for 3D view
        this.angleX = 0.4;
        this.angleY = 0;

        // Mandelbrot / Julia parameters
        this.zoom = 1.0;
        this.offsetX = -0.5;
        this.offsetY = 0;
        this.maxIter = 60;
        this.juliaC = { re: -0.7, im: 0.27015 };

        this.initLorenzParticles();
        this.initControls();
        this.bindEvents();
    }

    initLorenzParticles() {
        this.particles = [];
        const base = { x: 0.1, y: 0, z: 0 };
        const colors = ['#00f3ff', '#ff007f', '#00ff88', '#9d4edd', '#ffb703'];

        for (let i = 0; i < this.numParticles; i++) {
            this.particles.push({
                x: base.x + i * 0.0001, // Slight initial difference!
                y: base.y,
                z: base.z,
                trail: [],
                color: colors[i % colors.length]
            });
        }
    }

    initControls() {
        this.container.innerHTML = `
            <div class="panel-section">
                <h3>システム選択</h3>
                <select class="select-input" id="chaos-mode-select">
                    <option value="lorenz">ローレンツ・アトラクタ (3D Chaos)</option>
                    <option value="mandelbrot">マンデルブロ & ジュリア集合 (Fractal)</option>
                </select>
            </div>

            <div id="chaos-lorenz-controls">
                <div class="panel-section">
                    <h3>ローレンツ方程式 パラメータ</h3>
                    <div class="control-group">
                        <div class="control-label">σ (Sigma) <span class="value" id="chaos-sigma-val">10.0</span></div>
                        <input type="range" class="range-slider" id="chaos-sigma" min="1" max="30" step="0.5" value="10">
                    </div>
                    <div class="control-group">
                        <div class="control-label">ρ (Rho) <span class="value" id="chaos-rho-val">28.0</span></div>
                        <input type="range" class="range-slider" id="chaos-rho" min="5" max="50" step="0.5" value="28">
                    </div>
                    <div class="control-group">
                        <div class="control-label">粒子数 (バタフライ効果比較) <span class="value" id="chaos-particles-val">3</span></div>
                        <input type="range" class="range-slider" id="chaos-particles" min="1" max="5" step="1" value="3">
                    </div>
                </div>
            </div>

            <div id="chaos-mandelbrot-controls" style="display:none;">
                <div class="panel-section">
                    <h3>フラクタル計算</h3>
                    <div class="control-group">
                        <div class="control-label">最大反復回数 (Precision) <span class="value" id="chaos-iter-val">60</span></div>
                        <input type="range" class="range-slider" id="chaos-iter" min="20" max="150" step="5" value="60">
                    </div>
                </div>
            </div>

            <div class="panel-section">
                <div class="btn-group">
                    <button class="btn btn-primary" id="chaos-reset">🔄 リセット</button>
                </div>
            </div>

            <div class="math-card">
                <h4>🌀 カオス理論と初期値敏感性</h4>
                <div class="math-formula-box">
                    \\frac{dx}{dt} = \\sigma(y - x), \\; \\frac{dy}{dt} = x(\\rho - z) - y
                </div>
                わずか <b>0.0001</b> の初期値の差が、時間の経過とともに蝶の羽ばたきのように全く異なる無秩序な未来（バタフライ効果）を引き起こします。
            </div>
        `;

        document.getElementById('chaos-mode-select').addEventListener('change', (e) => {
            this.mode = e.target.value;
            document.getElementById('chaos-lorenz-controls').style.display = this.mode === 'lorenz' ? 'block' : 'none';
            document.getElementById('chaos-mandelbrot-controls').style.display = this.mode === 'mandelbrot' ? 'block' : 'none';
        });

        document.getElementById('chaos-sigma').addEventListener('input', (e) => {
            this.sigma = parseFloat(e.target.value);
            document.getElementById('chaos-sigma-val').textContent = this.sigma.toFixed(1);
        });
        document.getElementById('chaos-rho').addEventListener('input', (e) => {
            this.rho = parseFloat(e.target.value);
            document.getElementById('chaos-rho-val').textContent = this.rho.toFixed(1);
        });
        document.getElementById('chaos-particles').addEventListener('input', (e) => {
            this.numParticles = parseInt(e.target.value);
            document.getElementById('chaos-particles-val').textContent = this.numParticles;
            this.initLorenzParticles();
        });
        document.getElementById('chaos-iter').addEventListener('input', (e) => {
            this.maxIter = parseInt(e.target.value);
            document.getElementById('chaos-iter-val').textContent = this.maxIter;
        });

        document.getElementById('chaos-reset').addEventListener('click', () => {
            this.initLorenzParticles();
        });
    }

    bindEvents() {
        let isDragging = false;
        let lastX = 0, lastY = 0;

        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
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
    }

    update(dt) {
        if (this.mode === 'lorenz') {
            const dtStep = 0.008;
            for (let p of this.particles) {
                const dx = this.sigma * (p.y - p.x) * dtStep;
                const dy = (p.x * (this.rho - p.z) - p.y) * dtStep;
                const dz = (p.x * p.y - this.beta * p.z) * dtStep;

                p.x += dx;
                p.y += dy;
                p.z += dz;

                p.trail.push({ x: p.x, y: p.y, z: p.z });
                if (p.trail.length > this.trailLength) p.trail.shift();
            }
            this.angleY += dt * 0.2;
        }
    }

    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        if (this.mode === 'lorenz') {
            this.renderLorenz(ctx, width, height);
        } else {
            this.renderMandelbrot(ctx, width, height);
        }
    }

    renderLorenz(ctx, width, height) {
        const scale = 14;
        const originX = width / 2;
        const originY = height / 2 + 100;

        const project = (x, y, z) => {
            // 3D rotation matrix (X and Y axis)
            let cosY = Math.cos(this.angleY), sinY = Math.sin(this.angleY);
            let x1 = x * cosY - z * sinY;
            let z1 = x * sinY + z * cosY;

            let cosX = Math.cos(this.angleX), sinX = Math.sin(this.angleX);
            let y2 = y * cosX - z1 * sinX;
            let z2 = y * sinX + z1 * cosX;

            return {
                x: originX + x1 * scale,
                y: originY - y2 * scale
            };
        };

        for (let p of this.particles) {
            if (p.trail.length < 2) continue;

            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1.8;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();

            for (let i = 0; i < p.trail.length; i++) {
                const pt = p.trail[i];
                const proj = project(pt.x, pt.y, pt.z);
                if (i === 0) ctx.moveTo(proj.x, proj.y);
                else ctx.lineTo(proj.x, proj.y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Head particle
            const head = p.trail[p.trail.length - 1];
            const headProj = project(head.x, head.y, head.z);
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(headProj.x, headProj.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Fira Code", monospace';
        ctx.fillText(`3D Lorenz Attractor (Rotate with Drag)`, 20, 30);
    }

    renderMandelbrot(ctx, width, height) {
        const imgData = ctx.createImageData(width, height);
        const data = imgData.data;

        for (let py = 0; py < height; py += 2) {
            for (let px = 0; px < width; px += 2) {
                let x0 = (px - width / 2) / (0.3 * this.zoom * width) + this.offsetX;
                let y0 = (py - height / 2) / (0.3 * this.zoom * height) + this.offsetY;

                let x = 0, y = 0;
                let iter = 0;

                while (x * x + y * y <= 4 && iter < this.maxIter) {
                    let xtemp = x * x - y * y + x0;
                    y = 2 * x * y + y0;
                    x = xtemp;
                    iter++;
                }

                const color = iter === this.maxIter ? [0, 0, 0] : [
                    (iter * 12) % 255,
                    (iter * 5) % 255,
                    (iter * 20) % 255
                ];

                for (let dx = 0; dx < 2; dx++) {
                    for (let dy = 0; dy < 2; dy++) {
                        const index = 4 * ((py + dy) * width + (px + dx));
                        data[index] = color[0];
                        data[index + 1] = color[1];
                        data[index + 2] = color[2];
                        data[index + 3] = 255;
                    }
                }
            }
        }
        ctx.putImageData(imgData, 0, 0);

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Fira Code", monospace';
        ctx.fillText(`Mandelbrot Set z_{n+1} = z_n^2 + c`, 20, 30);
    }
}
