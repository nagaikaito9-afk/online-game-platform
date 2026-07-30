/* Module: Probability & Monte Carlo Simulation */

export class ProbabilityModule {
    constructor(canvas, controlsContainer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = controlsContainer;

        this.submode = 'galton'; // 'galton' or 'montecarlo'

        // Galton Board State
        this.balls = [];
        this.pins = [];
        this.bins = [];
        this.numRows = 9;
        this.spawnRate = 4; // balls per frame
        this.isSpawning = true;

        // Monte Carlo State
        this.mcTotal = 0;
        this.mcInside = 0;
        this.mcDots = [];
        this.maxDots = 1000;

        this.initGalton();
        this.initControls();
    }

    initGalton() {
        this.balls = [];
        const numBins = this.numRows + 1;
        this.bins = new Array(numBins).fill(0);
    }

    initControls() {
        this.container.innerHTML = `
            <div class="panel-section">
                <h3>シミュレーション選択</h3>
                <select class="select-input" id="prob-mode-select">
                    <option value="galton">ガルトンボード (正規分布への収束)</option>
                    <option value="montecarlo">モンテカルロ法 (確率による π 近似)</option>
                </select>
            </div>

            <div id="prob-galton-controls">
                <div class="panel-section">
                    <h3>ガルトンボード 設定</h3>
                    <div class="control-group">
                        <div class="control-label">ピンの段数 <span class="value" id="prob-rows-val">9</span></div>
                        <input type="range" class="range-slider" id="prob-rows" min="5" max="14" step="1" value="9">
                    </div>
                </div>
            </div>

            <div id="prob-montecarlo-controls" style="display:none;">
                <div class="panel-section">
                    <h3>モンテカルロ法 設定</h3>
                    <div class="control-group">
                        <div class="control-label">打点スピード (dots/frame)</div>
                        <input type="range" class="range-slider" id="prob-mc-speed" min="10" max="500" step="10" value="100">
                    </div>
                </div>
            </div>

            <div class="panel-section">
                <div class="btn-group">
                    <button class="btn btn-primary" id="prob-reset">🔄 リセット</button>
                </div>
            </div>

            <div class="math-card">
                <h4>🎲 中心極限定理 & モンテカルロ</h4>
                <b>ガルトンボード</b>: パチンコのようにピンで左右（各50%）に分岐したボールの集積は、二項分布 $B(n, 0.5)$ を通じて美しく<b>正規分布（ガウス分布）</b>に収束します。
                <div class="math-formula-box">
                    f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}
                </div>
                <b>モンテカルロ $\\pi$</b>: 円内に入る確率 $P = \\frac{\\pi}{4}$ から $\\pi \\approx 4 \\times \\frac{N_{\\text{in}}}{N_{\\text{total}}}$ を算出。
            </div>
        `;

        document.getElementById('prob-mode-select').addEventListener('change', (e) => {
            this.submode = e.target.value;
            document.getElementById('prob-galton-controls').style.display = this.submode === 'galton' ? 'block' : 'none';
            document.getElementById('prob-montecarlo-controls').style.display = this.submode === 'montecarlo' ? 'block' : 'none';
            this.reset();
        });

        document.getElementById('prob-rows').addEventListener('input', (e) => {
            this.numRows = parseInt(e.target.value);
            document.getElementById('prob-rows-val').textContent = this.numRows;
            this.reset();
        });

        document.getElementById('prob-reset').addEventListener('click', () => this.reset());
    }

    reset() {
        if (this.submode === 'galton') {
            this.initGalton();
        } else {
            this.mcTotal = 0;
            this.mcInside = 0;
            this.mcDots = [];
        }
    }

    update(dt) {
        if (this.submode === 'galton') {
            this.updateGalton();
        } else {
            this.updateMonteCarlo();
        }
    }

    updateGalton() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const startX = width / 2;
        const startY = 60;
        const rowSpacing = 35;
        const pinSpacing = 35;

        // Spawn new balls
        if (this.isSpawning && this.balls.length < 500) {
            for (let i = 0; i < this.spawnRate; i++) {
                this.balls.push({
                    x: startX + (Math.random() - 0.5) * 4,
                    y: startY,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: 2 + Math.random(),
                    row: 0
                });
            }
        }

        // Update physics
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const b = this.balls[i];
            b.vy += 0.25; // gravity
            b.x += b.vx;
            b.y += b.vy;

            // Check pin collisions
            const currentRow = Math.floor((b.y - startY) / rowSpacing);
            if (currentRow >= 0 && currentRow < this.numRows && currentRow !== b.row) {
                b.row = currentRow;
                // Random bounce left or right (50/50)
                const dir = Math.random() < 0.5 ? -1 : 1;
                b.vx = dir * (1.5 + Math.random() * 0.8);
                b.vy *= 0.6;
            }

            // Bottom bins
            const bottomY = startY + this.numRows * rowSpacing + 40;
            if (b.y >= bottomY) {
                const binWidth = pinSpacing;
                const leftMostX = startX - (this.numRows * pinSpacing) / 2;
                let binIdx = Math.floor((b.x - leftMostX) / binWidth);
                binIdx = Math.max(0, Math.min(this.bins.length - 1, binIdx));

                this.bins[binIdx]++;
                this.balls.splice(i, 1);
            }
        }
    }

    updateMonteCarlo() {
        const speedInput = document.getElementById('prob-mc-speed');
        const batchSize = speedInput ? parseInt(speedInput.value) : 100;

        for (let i = 0; i < batchSize; i++) {
            const rx = (Math.random() - 0.5) * 2; // -1 to 1
            const ry = (Math.random() - 0.5) * 2; // -1 to 1

            const distSq = rx * rx + ry * ry;
            const inside = distSq <= 1.0;

            this.mcTotal++;
            if (inside) this.mcInside++;

            if (this.mcDots.length < this.maxDots) {
                this.mcDots.push({ x: rx, y: ry, inside });
            } else {
                // Replace random dot for performance
                const idx = Math.floor(Math.random() * this.maxDots);
                this.mcDots[idx] = { x: rx, y: ry, inside };
            }
        }
    }

    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        if (this.submode === 'galton') {
            this.renderGalton(ctx, width, height);
        } else {
            this.renderMonteCarlo(ctx, width, height);
        }
    }

    renderGalton(ctx, width, height) {
        const startX = width / 2;
        const startY = 60;
        const rowSpacing = 35;
        const pinSpacing = 35;

        // Draw Pins
        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 6;
        for (let r = 0; r < this.numRows; r++) {
            const numPins = r + 1;
            const rowX = startX - (numPins - 1) * (pinSpacing / 2);
            const rowY = startY + r * rowSpacing;

            for (let p = 0; p < numPins; p++) {
                ctx.beginPath();
                ctx.arc(rowX + p * pinSpacing, rowY, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.shadowBlur = 0;

        // Draw Balls
        ctx.fillStyle = '#ff007f';
        for (let b of this.balls) {
            ctx.beginPath();
            ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Bins Histogram
        const bottomY = startY + this.numRows * rowSpacing + 40;
        const leftMostX = startX - (this.numRows * pinSpacing) / 2;
        const maxBinCount = Math.max(...this.bins, 1);

        for (let i = 0; i < this.bins.length; i++) {
            const count = this.bins[i];
            const binX = leftMostX + i * pinSpacing;
            const barHeight = Math.min(180, (count / maxBinCount) * 160);

            ctx.fillStyle = 'rgba(0, 255, 136, 0.4)';
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 1;
            ctx.fillRect(binX - pinSpacing / 2 + 2, bottomY, pinSpacing - 4, barHeight);
            ctx.strokeRect(binX - pinSpacing / 2 + 2, bottomY, pinSpacing - 4, barHeight);

            // Text count
            ctx.fillStyle = '#fff';
            ctx.font = '11px "Fira Code", monospace';
            ctx.fillText(`${count}`, binX - 8, bottomY + barHeight + 15);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Fira Code", monospace';
        ctx.fillText(`ガルトンボード (二項分布 → 正規分布ベル曲線への収束)`, 20, 30);
    }

    renderMonteCarlo(ctx, width, height) {
        const originX = width / 2;
        const originY = height / 2;
        const size = Math.min(width, height) * 0.35; // Radius

        // Square
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(originX - size, originY - size, size * 2, size * 2);

        // Circle
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(originX, originY, size, 0, Math.PI * 2);
        ctx.stroke();

        // Render Random Dots
        for (let dot of this.mcDots) {
            ctx.fillStyle = dot.inside ? '#00ff88' : '#ff007f';
            ctx.beginPath();
            ctx.arc(originX + dot.x * size, originY + dot.y * size, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Stats Text
        const piApprox = this.mcTotal > 0 ? (4 * this.mcInside / this.mcTotal) : 0;
        const error = Math.abs(piApprox - Math.PI) / Math.PI * 100;

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Fira Code", monospace';
        ctx.fillText(`全試行数 N_total: ${this.mcTotal}`, 20, 30);
        ctx.fillStyle = '#00ff88';
        ctx.fillText(`円内打点 N_in: ${this.mcInside}`, 20, 55);
        ctx.fillStyle = '#00f3ff';
        ctx.font = '18px "Fira Code", monospace';
        ctx.fillText(`推測 π ≈ 4 × (${this.mcInside} / ${this.mcTotal}) = ${piApprox.toFixed(5)} (誤差: ${error.toFixed(2)}%)`, 20, 90);
    }
}
