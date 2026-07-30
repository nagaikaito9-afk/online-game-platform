/* Module: Quantum Mechanics & Wave Function Simulator */

export class QuantumSimulatorModule {
    constructor(canvas, controlsContainer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = controlsContainer;

        // Simulator parameters
        this.numGrid = 200;
        this.psiReal = new Float32Array(this.numGrid);
        this.psiImag = new Float32Array(this.numGrid);
        this.potential = new Float32Array(this.numGrid);

        this.scenario = 'tunneling'; // 'tunneling', 'double-well', 'harmonic'
        this.barrierHeight = 12.0;
        this.barrierWidth = 15;
        this.particleEnergy = 8.0;
        this.simSpeed = 1.0;
        this.isPaused = false;

        this.time = 0;

        this.resetState();
        this.initControls();
        this.bindEvents();
    }

    resetState() {
        const N = this.numGrid;
        this.psiReal.fill(0);
        this.psiImag.fill(0);
        this.potential.fill(0);

        const mid = Math.floor(N / 2);

        if (this.scenario === 'tunneling') {
            const w = Math.floor(this.barrierWidth / 2);
            for (let i = mid - w; i <= mid + w; i++) {
                if (i >= 0 && i < N) {
                    this.potential[i] = this.barrierHeight;
                }
            }
            const x0 = Math.floor(N * 0.22);
            const sigma = 12.0;
            const k0 = Math.sqrt(2 * Math.max(0.1, this.particleEnergy));

            for (let i = 0; i < N; i++) {
                const dx = i - x0;
                const env = Math.exp(-(dx * dx) / (2 * sigma * sigma));
                this.psiReal[i] = env * Math.cos(k0 * dx);
                this.psiImag[i] = env * Math.sin(k0 * dx);
            }
        } else if (this.scenario === 'double-well') {
            for (let i = 0; i < N; i++) {
                const x = (i - mid) / 20;
                this.potential[i] = 0.5 * (x * x - 3) * (x * x - 3);
            }
            const x0 = Math.floor(N * 0.35);
            for (let i = 0; i < N; i++) {
                const dx = i - x0;
                const env = Math.exp(-(dx * dx) / 50);
                this.psiReal[i] = env;
                this.psiImag[i] = 0;
            }
        } else if (this.scenario === 'harmonic') {
            for (let i = 0; i < N; i++) {
                const x = (i - mid) / 15;
                this.potential[i] = 0.5 * x * x;
            }
            const x0 = Math.floor(N * 0.35);
            for (let i = 0; i < N; i++) {
                const dx = i - x0;
                const env = Math.exp(-(dx * dx) / 40);
                this.psiReal[i] = env * Math.cos(0.5 * dx);
                this.psiImag[i] = env * Math.sin(0.5 * dx);
            }
        }

        this.normalizeWavefunction();
    }

    normalizeWavefunction() {
        let norm = 0;
        for (let i = 0; i < this.numGrid; i++) {
            norm += this.psiReal[i] * this.psiReal[i] + this.psiImag[i] * this.psiImag[i];
        }
        if (norm > 1e-9) {
            const factor = 1.0 / Math.sqrt(norm);
            for (let i = 0; i < this.numGrid; i++) {
                this.psiReal[i] *= factor;
                this.psiImag[i] *= factor;
            }
        }
    }

    initControls() {
        this.container.innerHTML = `
            <div class="panel-section">
                <h3>⚛️ 量子実験シナリオ</h3>
                <select class="select-input" id="quantum-scenario-select">
                    <option value="tunneling" ${this.scenario === 'tunneling' ? 'selected' : ''}>ポテンシャル障壁 (量子トンネル効果)</option>
                    <option value="double-well" ${this.scenario === 'double-well' ? 'selected' : ''}>二重の井戸 (Double Well Potential)</option>
                    <option value="harmonic" ${this.scenario === 'harmonic' ? 'selected' : ''}>調和振動子 (Harmonic Oscillator)</option>
                </select>
            </div>

            <div class="panel-section">
                <h3>🎛️ 障壁 ＆ 粒子エネルギー</h3>
                <div class="control-group">
                    <label>障壁の高さ $V_0$: <span id="barrier-val">${this.barrierHeight}</span></label>
                    <input type="range" id="barrier-slider" min="0" max="30" step="0.5" value="${this.barrierHeight}">
                </div>
                <div class="control-group">
                    <label>障壁の幅 $W$: <span id="width-val">${this.barrierWidth}</span></label>
                    <input type="range" id="width-slider" min="4" max="40" step="1" value="${this.barrierWidth}">
                </div>
                <div class="control-group">
                    <label>運動エネルギー $E$: <span id="energy-val">${this.particleEnergy}</span></label>
                    <input type="range" id="energy-slider" min="1" max="20" step="0.5" value="${this.particleEnergy}">
                </div>
            </div>

            <div class="panel-section">
                <h3>⚙️ シミュレーション制御</h3>
                <div class="btn-grid">
                    <button class="btn-action" id="quantum-reset-btn">🔄 波束リセット</button>
                    <button class="btn-action primary" id="quantum-pause-btn">${this.isPaused ? '▶️ 再生' : '⏸️ 停止'}</button>
                </div>
            </div>

            <div class="panel-section info-box">
                <h4>💡 量子力学のワンポイント解説</h4>
                <p>シュレディンガー方程式:</p>
                <p>$$i \\hbar \\frac{\\partial}{\\partial t}\\psi(x,t) = -\\frac{\\hbar^2}{2m}\\frac{\\partial^2}{\\partial x^2}\\psi(x,t) + V(x)\\psi(x,t)$$</p>
                <p>古典力学では越えられない障壁 $V_0 > E$ でも、波動関数の確率密度 $|\psi|^2$ の一部が壁の向こうに浸み出し透過する<strong>「量子トンネル効果」</strong>を観察できます。</p>
            </div>
        `;
    }

    bindEvents() {
        const scenarioSelect = document.getElementById('quantum-scenario-select');
        const barrierSlider = document.getElementById('barrier-slider');
        const widthSlider = document.getElementById('width-slider');
        const energySlider = document.getElementById('energy-slider');
        const resetBtn = document.getElementById('quantum-reset-btn');
        const pauseBtn = document.getElementById('quantum-pause-btn');

        if (scenarioSelect) {
            scenarioSelect.addEventListener('change', (e) => {
                this.scenario = e.target.value;
                this.resetState();
            });
        }

        if (barrierSlider) {
            barrierSlider.addEventListener('input', (e) => {
                this.barrierHeight = parseFloat(e.target.value);
                document.getElementById('barrier-val').textContent = this.barrierHeight.toFixed(1);
                this.resetState();
            });
        }

        if (widthSlider) {
            widthSlider.addEventListener('input', (e) => {
                this.barrierWidth = parseInt(e.target.value);
                document.getElementById('width-val').textContent = this.barrierWidth;
                this.resetState();
            });
        }

        if (energySlider) {
            energySlider.addEventListener('input', (e) => {
                this.particleEnergy = parseFloat(e.target.value);
                document.getElementById('energy-val').textContent = this.particleEnergy.toFixed(1);
                this.resetState();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetState());
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.isPaused = !this.isPaused;
                pauseBtn.textContent = this.isPaused ? '▶️ 再生' : '⏸️ 停止';
            });
        }
    }

    update(dt) {
        if (this.isPaused) return;

        const N = this.numGrid;
        const dtSim = 0.04;
        const dx = 1.0;
        const c2 = dtSim / (2 * dx * dx);

        for (let i = 1; i < N - 1; i++) {
            const lapReal = this.psiReal[i + 1] - 2 * this.psiReal[i] + this.psiReal[i - 1];
            const V = this.potential[i];
            this.psiImag[i] += c2 * lapReal - dtSim * V * this.psiReal[i];
        }

        for (let i = 1; i < N - 1; i++) {
            const lapImag = this.psiImag[i + 1] - 2 * this.psiImag[i] + this.psiImag[i - 1];
            const V = this.potential[i];
            this.psiReal[i] -= c2 * lapImag - dtSim * V * this.psiImag[i];
        }

        this.psiReal[0] = this.psiReal[N - 1] = 0;
        this.psiImag[0] = this.psiImag[N - 1] = 0;
    }

    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.fillStyle = '#060913';
        ctx.fillRect(0, 0, width, height);

        const N = this.numGrid;
        const margin = 50;
        const plotWidth = width - margin * 2;
        const plotHeight = height - margin * 2;
        const baseline = height - margin - 40;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin, baseline);
        ctx.lineTo(width - margin, baseline);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 0, 90, 0.25)';
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
            const x = margin + (i / (N - 1)) * plotWidth;
            const y = baseline - (this.potential[i] / 30) * (plotHeight * 0.6);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.lineTo(width - margin, baseline);
        ctx.lineTo(margin, baseline);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f3ff';
        ctx.fillStyle = 'rgba(0, 243, 255, 0.2)';
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 3;

        ctx.beginPath();
        for (let i = 0; i < N; i++) {
            const x = margin + (i / (N - 1)) * plotWidth;
            const prob = this.psiReal[i] * this.psiReal[i] + this.psiImag[i] * this.psiImag[i];
            const y = baseline - prob * (plotHeight * 2.5);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.lineTo(width - margin, baseline);
        ctx.lineTo(margin, baseline);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.strokeStyle = 'rgba(255, 200, 0, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
            const x = margin + (i / (N - 1)) * plotWidth;
            const y = baseline - this.psiReal[i] * (plotHeight * 0.8);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.strokeStyle = 'rgba(180, 0, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
            const x = margin + (i / (N - 1)) * plotWidth;
            const y = baseline - this.psiImag[i] * (plotHeight * 0.8);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.font = '13px Inter, sans-serif';
        ctx.fillStyle = '#ff0055';
        ctx.fillText('■ ポテンシャル V(x)', margin + 20, margin + 20);

        ctx.fillStyle = '#00f3ff';
        ctx.fillText('■ 確率密度 |Ψ(x,t)|²', margin + 170, margin + 20);

        ctx.fillStyle = '#ffc800';
        ctx.fillText('― 実部 Re(Ψ)', margin + 350, margin + 20);

        ctx.fillStyle = '#b400ff';
        ctx.fillText('― 虚部 Im(Ψ)', margin + 470, margin + 20);
    }
}
