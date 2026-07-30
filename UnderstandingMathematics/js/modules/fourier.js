/* Module: Fourier Series & Epicycles */

export class FourierModule {
    constructor(canvas, controlsContainer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = controlsContainer;

        // Wave settings
        this.waveType = 'square'; // 'square', 'sawtooth', 'triangle', 'custom'
        this.terms = 5; // N terms
        this.speed = 1.0;
        this.time = 0;
        this.waveHistory = [];
        this.maxHistory = 600;

        // Custom drawing state
        this.isDrawing = false;
        this.customPath = [];
        this.fourierFourier = [];

        this.initControls();
        this.bindEvents();
    }

    initControls() {
        this.container.innerHTML = `
            <div class="panel-section">
                <h3>波形・パターン選択</h3>
                <select class="select-input" id="four-type-select">
                    <option value="square">矩形波 (Square Wave)</option>
                    <option value="sawtooth">鋸波 (Sawtooth Wave)</option>
                    <option value="triangle">三角波 (Triangle Wave)</option>
                    <option value="custom">フリーハンド描画 (Custom Drawing)</option>
                </select>
            </div>

            <div class="panel-section">
                <h3>項数 & 速度コントロール</h3>
                <div class="control-group">
                    <div class="control-label">フーリエ項数 (N) <span class="value" id="four-n-val">5</span></div>
                    <input type="range" class="range-slider" id="four-n" min="1" max="40" step="1" value="5">
                </div>
                <div class="control-group">
                    <div class="control-label">回転速度 <span class="value" id="four-speed-val">1.0</span></div>
                    <input type="range" class="range-slider" id="four-speed" min="0.1" max="3" step="0.1" value="1.0">
                </div>
            </div>

            <div class="panel-section">
                <div class="btn-group">
                    <button class="btn btn-primary" id="four-reset">🔄 波形クリア</button>
                </div>
            </div>

            <div class="math-card">
                <h4>🌊 フーリエ級数の定理</h4>
                どんな複雑な周期関数 $f(t)$ も、無限の正弦波・余弦波の和（回転する円の連鎖）へと分解・再構築できます。
                <div class="math-formula-box">
                    f(t) = \\frac{a_0}{2} + \\sum_{n=1}^{\\infty} \\left( a_n \\cos(n\\omega t) + b_n \\sin(n\\omega t) \\right)
                </div>
                項数 $N$ を増やすほど近似精度が高まり、ギブズ現象（不連続点での波の跳ね上がり）も確認できます。
            </div>
        `;

        document.getElementById('four-type-select').addEventListener('change', (e) => {
            this.waveType = e.target.value;
            this.waveHistory = [];
            this.time = 0;
        });
        document.getElementById('four-n').addEventListener('input', (e) => {
            this.terms = parseInt(e.target.value);
            document.getElementById('four-n-val').textContent = this.terms;
            this.waveHistory = [];
        });
        document.getElementById('four-speed').addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
            document.getElementById('four-speed-val').textContent = this.speed.toFixed(1);
        });
        document.getElementById('four-reset').addEventListener('click', () => {
            this.waveHistory = [];
            this.customPath = [];
            this.time = 0;
        });
    }

    bindEvents() {
        // Custom draw on canvas when waveType === 'custom'
        const getCanvasCoords = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: (e.clientX || e.touches[0].clientX) - rect.left - this.canvas.width / 2,
                y: (e.clientY || e.touches[0].clientY) - rect.top - this.canvas.height / 2
            };
        };

        this.canvas.addEventListener('mousedown', (e) => {
            if (this.waveType === 'custom') {
                this.isDrawing = true;
                this.customPath = [getCanvasCoords(e)];
            }
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDrawing && this.waveType === 'custom') {
                this.customPath.push(getCanvasCoords(e));
            }
        });
        window.addEventListener('mouseup', () => {
            if (this.isDrawing && this.waveType === 'custom') {
                this.isDrawing = false;
                this.computeDFT();
            }
        });
    }

    computeDFT() {
        // Discrete Fourier Transform of customPath
        const N = this.customPath.length;
        if (N === 0) return;
        this.fourierFourier = [];

        for (let k = 0; k < N; k++) {
            let re = 0;
            let im = 0;
            for (let n = 0; n < N; n++) {
                const phi = (Math.PI * 2 * k * n) / N;
                re += this.customPath[n].x * Math.cos(phi) + this.customPath[n].y * Math.sin(phi);
                im += -this.customPath[n].x * Math.sin(phi) + this.customPath[n].y * Math.cos(phi);
            }
            re /= N;
            im /= N;

            const freq = k;
            const amp = Math.hypot(re, im);
            const phase = Math.atan2(im, re);

            this.fourierFourier.push({ freq, amp, phase });
        }

        // Sort by amplitude descending
        this.fourierFourier.sort((a, b) => b.amp - a.amp);
        this.time = 0;
        this.waveHistory = [];
    }

    update(dt) {
        this.time += dt * this.speed * 1.5;
    }

    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        if (this.waveType === 'custom' && this.customPath.length > 0 && !this.isDrawing && this.fourierFourier.length > 0) {
            this.renderCustomEpicycles(ctx, width, height);
            return;
        }

        // Standard 1D wave Epicycles
        const centerX = Math.min(width * 0.28, 240);
        const centerY = height / 2;
        const waveStartX = centerX + 200;
        const waveWidth = width - waveStartX - 40;

        let x = centerX;
        let y = centerY;

        ctx.lineWidth = 1.5;

        // Calculate Harmonics
        for (let i = 0; i < this.terms; i++) {
            const prevX = x;
            const prevY = y;

            let n = i + 1;
            let radius = 0;

            if (this.waveType === 'square') {
                n = i * 2 + 1;
                radius = 100 * (4 / (n * Math.PI));
            } else if (this.waveType === 'sawtooth') {
                radius = 100 * (2 / (n * Math.PI));
            } else if (this.waveType === 'triangle') {
                n = i * 2 + 1;
                radius = 100 * (8 / (n * n * Math.PI * Math.PI)) * (i % 2 === 0 ? 1 : -1);
            }

            x += radius * Math.cos(n * this.time);
            y += radius * Math.sin(n * this.time);

            // Draw Epicycle Circle
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
            ctx.beginPath();
            ctx.arc(prevX, prevY, Math.abs(radius), 0, Math.PI * 2);
            ctx.stroke();

            // Draw Radius Vector Line
            ctx.strokeStyle = '#9d4edd';
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        // Epicycle Tip Point
        ctx.fillStyle = '#00f3ff';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Wave history record
        this.waveHistory.unshift(y);
        if (this.waveHistory.length > this.maxHistory) this.waveHistory.pop();

        // Connecting Line to Wave Graph
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(waveStartX, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Axis line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(waveStartX, centerY);
        ctx.lineTo(waveStartX + waveWidth, centerY);
        ctx.stroke();

        // Draw Synthesized Waveform Curve
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 8;
        ctx.beginPath();

        for (let i = 0; i < this.waveHistory.length; i++) {
            const wx = waveStartX + (i / this.maxHistory) * waveWidth;
            const wy = this.waveHistory[i];
            if (i === 0) ctx.moveTo(wx, wy);
            else ctx.lineTo(wx, wy);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    renderCustomEpicycles(ctx, width, height) {
        const originX = width / 2;
        const originY = height / 2;

        let x = originX;
        let y = originY;

        const maxN = Math.min(this.terms * 2, this.fourierFourier.length);

        for (let i = 0; i < maxN; i++) {
            const prevX = x;
            const prevY = y;
            const { freq, amp, phase } = this.fourierFourier[i];

            x += amp * Math.cos(freq * this.time + phase);
            y += amp * Math.sin(freq * this.time + phase);

            ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
            ctx.beginPath();
            ctx.arc(prevX, prevY, amp, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#9d4edd';
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        this.waveHistory.unshift({ x, y });
        if (this.waveHistory.length > this.customPath.length * 1.5) this.waveHistory.pop();

        // Draw path history
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        for (let i = 0; i < this.waveHistory.length; i++) {
            const p = this.waveHistory[i];
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}
