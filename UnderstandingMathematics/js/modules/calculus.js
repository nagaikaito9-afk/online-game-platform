/* Module: Calculus (Derivatives & Integrals) */

export class CalculusModule {
    constructor(canvas, controlsContainer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = controlsContainer;

        // State & Settings
        this.funcType = 'cubic'; // 'polynomial', 'sin', 'cubic', 'gaussian'
        this.mode = 'both'; // 'derivative', 'integral', 'both'
        this.cursorX = 1.0;
        
        // Integral settings
        this.intA = -2.0;
        this.intB = 2.0;
        this.rectCount = 12; // Riemann N
        this.riemannType = 'mid'; // 'left', 'right', 'mid', 'trapezoid'

        // Scale & Origin
        this.scaleX = 60; // px per unit
        this.scaleY = 60;

        this.initControls();
        this.bindEvents();
    }

    getFunc(x) {
        switch (this.funcType) {
            case 'cubic': return 0.25 * (x * x * x - 3 * x);
            case 'sin': return Math.sin(x);
            case 'quadratic': return 0.4 * (x * x) - 1.5;
            case 'gaussian': return 2 * Math.exp(-x * x);
            default: return x;
        }
    }

    getDerivative(x) {
        const h = 0.0001;
        return (this.getFunc(x + h) - this.getFunc(x - h)) / (2 * h);
    }

    getExactIntegral(a, b) {
        // Numerical exact integral with high N Simpson
        const N = 1000;
        const dx = (b - a) / N;
        let sum = this.getFunc(a) + this.getFunc(b);
        for (let i = 1; i < N; i++) {
            const x = a + i * dx;
            sum += this.getFunc(x) * (i % 2 === 0 ? 2 : 4);
        }
        return (sum * dx) / 3;
    }

    initControls() {
        this.container.innerHTML = `
            <div class="panel-section">
                <h3>関数の選択</h3>
                <select class="select-input" id="calc-func-select">
                    <option value="cubic">3次関数 f(x) = 0.25(x³ - 3x)</option>
                    <option value="sin">三角関数 f(x) = sin(x)</option>
                    <option value="quadratic">2次関数 f(x) = 0.4x² - 1.5</option>
                    <option value="gaussian">ガウス関数 f(x) = 2e^(-x²)</option>
                </select>
            </div>

            <div class="panel-section">
                <h3>微分モード (Derivatives)</h3>
                <div class="control-group">
                    <div class="control-label">接点の位置 (x) <span class="value" id="calc-pos-val">1.00</span></div>
                    <input type="range" class="range-slider" id="calc-pos" min="-4" max="4" step="0.05" value="1.0">
                </div>
            </div>

            <div class="panel-section">
                <h3>積分モード (Integrals & Riemann Sum)</h3>
                <div class="control-group">
                    <div class="control-label">分割数 (N) <span class="value" id="calc-n-val">12</span></div>
                    <input type="range" class="range-slider" id="calc-n" min="2" max="100" step="1" value="12">
                </div>
                <div class="control-group">
                    <div class="control-label">積分範囲 [a, b]</div>
                    <div class="btn-group">
                        <input type="number" class="text-input" id="calc-a" value="-2.0" step="0.5">
                        <input type="number" class="text-input" id="calc-b" value="2.0" step="0.5">
                    </div>
                </div>
                <div class="control-group">
                    <div class="control-label">近似手法</div>
                    <select class="select-input" id="calc-riemann-type">
                        <option value="mid">中点求積法 (Midpoint)</option>
                        <option value="left">左端求積法 (Left)</option>
                        <option value="right">右端求積法 (Right)</option>
                        <option value="trapezoid">台形公式 (Trapezoidal)</option>
                    </select>
                </div>
            </div>

            <div class="math-card">
                <h4>📈 微積分学の基本定理</h4>
                <div class="math-formula-box">
                    f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}
                </div>
                <div class="math-formula-box">
                    \\int_{a}^{b} f(x) dx = \\lim_{N \\to \\infty} \\sum_{i=1}^{N} f(x_i^*) \\Delta x
                </div>
                微分は瞬間の「変化率（接線の傾き）」を表し、積分は極小長方形の極限和による「累積面積」を表します。
            </div>
        `;

        document.getElementById('calc-func-select').addEventListener('change', (e) => {
            this.funcType = e.target.value;
        });
        document.getElementById('calc-pos').addEventListener('input', (e) => {
            this.cursorX = parseFloat(e.target.value);
            document.getElementById('calc-pos-val').textContent = this.cursorX.toFixed(2);
        });
        document.getElementById('calc-n').addEventListener('input', (e) => {
            this.rectCount = parseInt(e.target.value);
            document.getElementById('calc-n-val').textContent = this.rectCount;
        });
        document.getElementById('calc-a').addEventListener('change', (e) => {
            this.intA = parseFloat(e.target.value);
        });
        document.getElementById('calc-b').addEventListener('change', (e) => {
            this.intB = parseFloat(e.target.value);
        });
        document.getElementById('calc-riemann-type').addEventListener('change', (e) => {
            this.riemannType = e.target.value;
        });
    }

    bindEvents() {
        let isDragging = false;
        const handleDrag = (e) => {
            if (!isDragging) return;
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = (e.clientX || e.touches[0].clientX) - rect.left;
            const originX = this.canvas.width / 2;
            const xVal = (mouseX - originX) / this.scaleX;
            this.cursorX = Math.max(-5, Math.min(5, xVal));
            document.getElementById('calc-pos').value = this.cursorX;
            document.getElementById('calc-pos-val').textContent = this.cursorX.toFixed(2);
        };

        this.canvas.addEventListener('mousedown', (e) => { isDragging = true; handleDrag(e); });
        this.canvas.addEventListener('mousemove', handleDrag);
        window.addEventListener('mouseup', () => isDragging = false);
    }

    update(dt) {
        // Animation smoothly
    }

    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        const originX = width / 2;
        const originY = height / 2;

        // Draw Coordinate Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        for (let x = originX % this.scaleX; x < width; x += this.scaleX) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = originY % this.scaleY; y < height; y += this.scaleY) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        // Axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, originY); ctx.lineTo(width, originY);
        ctx.moveTo(originX, 0); ctx.lineTo(originX, height);
        ctx.stroke();

        // 1. Draw Riemann Sum Integral Rectangles
        const a = Math.min(this.intA, this.intB);
        const b = Math.max(this.intA, this.intB);
        const N = this.rectCount;
        const dx = (b - a) / N;

        let riemannSum = 0;

        ctx.fillStyle = 'rgba(0, 243, 255, 0.15)';
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)';
        ctx.lineWidth = 1;

        for (let i = 0; i < N; i++) {
            const xLeft = a + i * dx;
            const xRight = xLeft + dx;
            let evalX = xLeft;
            if (this.riemannType === 'right') evalX = xRight;
            else if (this.riemannType === 'mid') evalX = xLeft + dx / 2;
            
            const hVal = this.getFunc(evalX);
            riemannSum += hVal * dx;

            const rectPxLeft = originX + xLeft * this.scaleX;
            const rectPxWidth = dx * this.scaleX;
            const rectPxBaseY = originY;
            const rectPxHeight = -hVal * this.scaleY;

            ctx.fillRect(rectPxLeft, rectPxBaseY, rectPxWidth, rectPxHeight);
            ctx.strokeRect(rectPxLeft, rectPxBaseY, rectPxWidth, rectPxHeight);
        }

        // 2. Draw Function Curve
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10;
        ctx.beginPath();

        let started = false;
        for (let px = 0; px < width; px += 2) {
            const x = (px - originX) / this.scaleX;
            const y = this.getFunc(x);
            const py = originY - y * this.scaleY;

            if (!started) {
                ctx.moveTo(px, py);
                started = true;
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 3. Tangent Line & Derivative at cursorX
        const curX = this.cursorX;
        const curY = this.getFunc(curX);
        const slope = this.getDerivative(curX);

        const curPxX = originX + curX * this.scaleX;
        const curPxY = originY - curY * this.scaleY;

        // Tangent line endpoints
        const tanLen = 3.0; // units
        const x1 = curX - tanLen;
        const y1 = curY - slope * tanLen;
        const x2 = curX + tanLen;
        const y2 = curY + slope * tanLen;

        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(originX + x1 * this.scaleX, originY - y1 * this.scaleY);
        ctx.lineTo(originX + x2 * this.scaleX, originY - y2 * this.scaleY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Tangent Point Dot
        ctx.fillStyle = '#ff007f';
        ctx.beginPath();
        ctx.arc(curPxX, curPxY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Overlay Text Information
        const exactIntegral = this.getExactIntegral(a, b);
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Fira Code", monospace';
        
        ctx.fillStyle = '#ff007f';
        ctx.fillText(`接点: (${curX.toFixed(2)}, ${curY.toFixed(2)}) | 傾き f'(${curX.toFixed(2)}) = ${slope.toFixed(3)}`, 20, 30);

        ctx.fillStyle = '#00f3ff';
        ctx.fillText(`リーマン和 (N=${N}): ${riemannSum.toFixed(4)} | 理論定積分: ${exactIntegral.toFixed(4)}`, 20, 60);
    }
}
