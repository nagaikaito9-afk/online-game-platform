/* Module: Trigonometry & Unit Circle */

export class TrigonometryModule {
    constructor(canvas, controlsContainer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = controlsContainer;
        
        // Parameters
        this.angle = 0; // current angle in radians
        this.speed = 1.5; // rad/s
        this.radius = 120; // px
        this.frequency = 1;
        this.amplitude = 1;
        this.showSin = true;
        this.showCos = true;
        this.showTan = false;
        this.autoPlay = true;
        this.isDragging = false;
        
        this.historySin = [];
        this.historyCos = [];
        this.maxHistory = 400;

        this.initControls();
        this.bindEvents();
    }

    initControls() {
        this.container.innerHTML = `
            <div class="panel-section">
                <h3>パラメータ調整</h3>
                <div class="control-group">
                    <div class="control-label">再生速度 <span class="value" id="trig-speed-val">1.5 rad/s</span></div>
                    <input type="range" class="range-slider" id="trig-speed" min="0" max="5" step="0.1" value="1.5">
                </div>
                <div class="control-group">
                    <div class="control-label">周波数 (Frequency) <span class="value" id="trig-freq-val">1.0</span></div>
                    <input type="range" class="range-slider" id="trig-freq" min="0.2" max="4" step="0.1" value="1.0">
                </div>
                <div class="control-group">
                    <div class="control-label">振幅 (Amplitude) <span class="value" id="trig-amp-val">1.0</span></div>
                    <input type="range" class="range-slider" id="trig-amp" min="0.2" max="2" step="0.1" value="1.0">
                </div>
            </div>

            <div class="panel-section">
                <h3>表示切替</h3>
                <div class="toggle-group">
                    <span>Sine 波形 ($\\sin \\theta$)</span>
                    <label class="switch">
                        <input type="checkbox" id="trig-show-sin" checked>
                        <span class="slider-round"></span>
                    </label>
                </div>
                <div class="toggle-group">
                    <span>Cosine 波形 ($\\cos \\theta$)</span>
                    <label class="switch">
                        <input type="checkbox" id="trig-show-cos" checked>
                        <span class="slider-round"></span>
                    </label>
                </div>
                <div class="toggle-group">
                    <span>Tangent 接線 ($\\tan \\theta$)</span>
                    <label class="switch">
                        <input type="checkbox" id="trig-show-tan">
                        <span class="slider-round"></span>
                    </label>
                </div>
            </div>

            <div class="panel-section">
                <div class="btn-group">
                    <button class="btn btn-primary" id="trig-toggle-play">⏸ 一時停止</button>
                    <button class="btn btn-secondary" id="trig-reset">🔄 リセット</button>
                </div>
            </div>

            <div class="math-card">
                <h4>📐 三角関数の基本定理</h4>
                単位円上の座標は $(x, y) = (\\cos \\theta, \\sin \\theta)$ で表されます。
                <div class="math-formula-box">
                    \\sin^2 \\theta + \\cos^2 \\theta = 1
                </div>
                <div class="math-formula-box">
                    \\tan \\theta = \\frac{\\sin \\theta}{\\cos \\theta}
                </div>
                角度 $\\theta$ が変化すると、円運動が直線運動の波（オシレーション）へと変換されます。
            </div>
        `;

        // Event Listeners for controls
        document.getElementById('trig-speed').addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
            document.getElementById('trig-speed-val').textContent = `${this.speed.toFixed(1)} rad/s`;
        });
        document.getElementById('trig-freq').addEventListener('input', (e) => {
            this.frequency = parseFloat(e.target.value);
            document.getElementById('trig-freq-val').textContent = this.frequency.toFixed(1);
        });
        document.getElementById('trig-amp').addEventListener('input', (e) => {
            this.amplitude = parseFloat(e.target.value);
            document.getElementById('trig-amp-val').textContent = this.amplitude.toFixed(1);
        });
        document.getElementById('trig-show-sin').addEventListener('change', (e) => {
            this.showSin = e.target.checked;
        });
        document.getElementById('trig-show-cos').addEventListener('change', (e) => {
            this.showCos = e.target.checked;
        });
        document.getElementById('trig-show-tan').addEventListener('change', (e) => {
            this.showTan = e.target.checked;
        });

        const playBtn = document.getElementById('trig-toggle-play');
        playBtn.addEventListener('click', () => {
            this.autoPlay = !this.autoPlay;
            playBtn.textContent = this.autoPlay ? '⏸ 一時停止' : '▶ 再生';
        });

        document.getElementById('trig-reset').addEventListener('click', () => {
            this.angle = 0;
            this.historySin = [];
            this.historyCos = [];
        });
    }

    bindEvents() {
        const handleDrag = (e) => {
            if (!this.isDragging) return;
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = (e.clientX || e.touches[0].clientX) - rect.left;
            const mouseY = (e.clientY || e.touches[0].clientY) - rect.top;
            
            // Unit circle center
            const centerX = Math.min(this.canvas.width * 0.3, 260);
            const centerY = this.canvas.height / 2;
            
            const dx = mouseX - centerX;
            const dy = mouseY - centerY;
            this.angle = -Math.atan2(dy, dx);
            if (this.angle < 0) this.angle += Math.PI * 2;
        };

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            handleDrag(e);
        });
        this.canvas.addEventListener('mousemove', handleDrag);
        window.addEventListener('mouseup', () => this.isDragging = false);

        this.canvas.addEventListener('touchstart', (e) => {
            this.isDragging = true;
            handleDrag(e);
        });
        this.canvas.addEventListener('touchmove', handleDrag);
        window.addEventListener('touchend', () => this.isDragging = false);
    }

    update(dt) {
        if (this.autoPlay && !this.isDragging) {
            this.angle += this.speed * dt;
            if (this.angle > Math.PI * 200) this.angle %= Math.PI * 2;
        }

        const effAngle = this.angle * this.frequency;
        const sinVal = Math.sin(effAngle) * this.amplitude;
        const cosVal = Math.cos(effAngle) * this.amplitude;

        this.historySin.unshift(sinVal);
        this.historyCos.unshift(cosVal);

        if (this.historySin.length > this.maxHistory) this.historySin.pop();
        if (this.historyCos.length > this.maxHistory) this.historyCos.pop();
    }

    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        // Center for Unit Circle
        const centerX = Math.min(width * 0.28, 240);
        const centerY = height / 2;
        const currentR = this.radius * this.amplitude;

        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < width; x += 40) {
            ctx.moveTo(x, 0); ctx.lineTo(x, height);
        }
        for (let y = 0; y < height; y += 40) {
            ctx.moveTo(0, y); ctx.lineTo(width, y);
        }
        ctx.stroke();

        // 1. Draw Unit Circle Center Axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX - currentR - 40, centerY); ctx.lineTo(centerX + currentR + 40, centerY);
        ctx.moveTo(centerX, centerY - currentR - 40); ctx.lineTo(centerX, centerY + currentR + 40);
        ctx.stroke();

        // Unit Circle
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, currentR, 0, Math.PI * 2);
        ctx.stroke();

        // Point on Circle
        const effAngle = this.angle * this.frequency;
        const pointX = centerX + currentR * Math.cos(effAngle);
        const pointY = centerY - currentR * Math.sin(effAngle);

        // Angle Sector / Arc
        ctx.fillStyle = 'rgba(0, 243, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, Math.min(40, currentR), 0, -effAngle % (Math.PI * 2), true);
        ctx.closePath();
        ctx.fill();

        // Radius Line
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(pointX, pointY);
        ctx.stroke();

        // Cosine Component Line (Horizontal)
        if (this.showCos) {
            ctx.strokeStyle = '#ff007f';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(pointX, centerY);
            ctx.stroke();
        }

        // Sine Component Line (Vertical)
        if (this.showSin) {
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(pointX, centerY);
            ctx.lineTo(pointX, pointY);
            ctx.stroke();
        }

        // Tangent Line
        if (this.showTan && Math.abs(Math.cos(effAngle)) > 0.01) {
            const tanLen = Math.tan(effAngle) * currentR;
            ctx.strokeStyle = '#ffb703';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(pointX, pointY);
            ctx.lineTo(centerX + currentR * Math.cos(effAngle) - tanLen * Math.sin(effAngle),
                       centerY - currentR * Math.sin(effAngle) - tanLen * Math.cos(effAngle));
            ctx.stroke();
        }

        // Point dot
        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(pointX, pointY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 2. Draw Waves to the Right
        const waveStartX = centerX + currentR + 80;
        const waveWidth = width - waveStartX - 30;

        // Wave Center Axis
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(waveStartX, centerY);
        ctx.lineTo(waveStartX + waveWidth, centerY);
        ctx.stroke();

        // Connecting Dashed Lines
        if (this.showSin) {
            ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(pointX, pointY);
            ctx.lineTo(waveStartX, pointY);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Sine Wave Curve
        if (this.showSin && this.historySin.length > 1) {
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#00ff88';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            for (let i = 0; i < this.historySin.length; i++) {
                const x = waveStartX + (i / this.maxHistory) * waveWidth;
                const y = centerY - this.historySin[i] * this.radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Cosine Wave Curve
        if (this.showCos && this.historyCos.length > 1) {
            ctx.strokeStyle = '#ff007f';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#ff007f';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            for (let i = 0; i < this.historyCos.length; i++) {
                const x = waveStartX + (i / this.maxHistory) * waveWidth;
                const y = centerY - this.historyCos[i] * this.radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Info Overlay Text
        const deg = ((effAngle * 180 / Math.PI) % 360).toFixed(1);
        const rad = (effAngle % (Math.PI * 2)).toFixed(2);
        const sinValStr = Math.sin(effAngle).toFixed(3);
        const cosValStr = Math.cos(effAngle).toFixed(3);

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Fira Code", monospace';
        ctx.fillText(`θ = ${deg}° (${rad} rad)`, centerX - 60, centerY + currentR + 35);
        ctx.fillStyle = '#00ff88';
        ctx.fillText(`sin(θ) = ${sinValStr}`, waveStartX, 30);
        ctx.fillStyle = '#ff007f';
        ctx.fillText(`cos(θ) = ${cosValStr}`, waveStartX + 160, 30);
    }
}
