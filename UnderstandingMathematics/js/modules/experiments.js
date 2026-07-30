/* Module: Visual Physics & Math Experiments */

export class ExperimentsModule {
    constructor(canvas, controlsContainer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = controlsContainer;

        // Experiment Submode: 'pythagoras', 'circle-area', 'brachistochrone'
        this.expType = 'pythagoras';

        // Pythagoras State
        this.pythAngle = 0; // wheel rotation angle
        this.pythAutoRotate = true;

        // Circle Area Slices State
        this.slices = 12;
        this.unfoldProgress = 0.0; // 0 to 1
        this.isUnfolding = false;

        // Brachistochrone Race State
        this.raceTime = 0;
        this.isRacing = false;
        this.raceFinished = false;

        this.initControls();
    }

    initControls() {
        this.container.innerHTML = `
            <div class="panel-section">
                <h3>実験モデル選択</h3>
                <select class="select-input" id="exp-type-select">
                    <option value="pythagoras">1. ピタゴラスの定理の水流物理証明 (a² + b² = c²)</option>
                    <option value="circle-area">2. 円の面積 πr² の扇形展開長方形証明</option>
                    <option value="brachistochrone">3. 最速降下線レース (サイクロイド vs 直線)</option>
                </select>
            </div>

            <div id="exp-pyth-controls">
                <div class="panel-section">
                    <h3>水車回転コントロール</h3>
                    <div class="btn-group">
                        <button class="btn btn-primary" id="exp-pyth-rotate">🔄 水車を回転 (180°)</button>
                    </div>
                </div>
            </div>

            <div id="exp-circle-controls" style="display:none;">
                <div class="panel-section">
                    <h3>円の切断パラメータ</h3>
                    <div class="control-group">
                        <div class="control-label">扇形の分割数 (N) <span class="value" id="exp-slices-val">12</span></div>
                        <input type="range" class="range-slider" id="exp-slices" min="4" max="64" step="2" value="12">
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-primary" id="exp-unfold-btn">✂️ 長方形へ展開 / 復元</button>
                    </div>
                </div>
            </div>

            <div id="exp-race-controls" style="display:none;">
                <div class="panel-section">
                    <h3>最速降下線物理レース</h3>
                    <div class="btn-group">
                        <button class="btn btn-primary" id="exp-race-start">▶ レーススタート</button>
                        <button class="btn btn-secondary" id="exp-race-reset">🔄 リセット</button>
                    </div>
                </div>
            </div>

            <div class="math-card">
                <h4>🧪 直感で解き明かす物理と数学</h4>
                数式や理論だけでなく、水流の動きや極限の並べ替え、重力加速度による運動方程式を視覚的に観察・納得できるインタラクティブ実験室です。
            </div>
        `;

        document.getElementById('exp-type-select').addEventListener('change', (e) => {
            this.expType = e.target.value;
            document.getElementById('exp-pyth-controls').style.display = this.expType === 'pythagoras' ? 'block' : 'none';
            document.getElementById('exp-circle-controls').style.display = this.expType === 'circle-area' ? 'block' : 'none';
            document.getElementById('exp-race-controls').style.display = this.expType === 'brachistochrone' ? 'block' : 'none';
        });

        document.getElementById('exp-pyth-rotate').addEventListener('click', () => {
            this.pythTargetAngle = this.pythAngle + Math.PI;
        });

        document.getElementById('exp-slices').addEventListener('input', (e) => {
            this.slices = parseInt(e.target.value);
            document.getElementById('exp-slices-val').textContent = this.slices;
        });

        document.getElementById('exp-unfold-btn').addEventListener('click', () => {
            this.isUnfolding = !this.isUnfolding;
        });

        document.getElementById('exp-race-start').addEventListener('click', () => {
            this.raceTime = 0;
            this.isRacing = true;
            this.raceFinished = false;
        });

        document.getElementById('exp-race-reset').addEventListener('click', () => {
            this.raceTime = 0;
            this.isRacing = false;
            this.raceFinished = false;
        });
    }

    update(dt) {
        if (this.expType === 'pythagoras') {
            if (this.pythTargetAngle !== undefined && this.pythAngle < this.pythTargetAngle) {
                this.pythAngle += dt * 1.5;
                if (this.pythAngle >= this.pythTargetAngle) this.pythAngle = this.pythTargetAngle;
            }
        } else if (this.expType === 'circle-area') {
            if (this.isUnfolding && this.unfoldProgress < 1.0) {
                this.unfoldProgress += dt * 0.8;
                if (this.unfoldProgress > 1.0) this.unfoldProgress = 1.0;
            } else if (!this.isUnfolding && this.unfoldProgress > 0.0) {
                this.unfoldProgress -= dt * 0.8;
                if (this.unfoldProgress < 0.0) this.unfoldProgress = 0.0;
            }
        } else if (this.expType === 'brachistochrone') {
            if (this.isRacing && !this.raceFinished) {
                this.raceTime += dt;
                if (this.raceTime > 4.0) this.raceFinished = true;
            }
        }
    }

    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        if (this.expType === 'pythagoras') {
            this.renderPythagorasWater(ctx, width, height);
        } else if (this.expType === 'circle-area') {
            this.renderCircleAreaSlices(ctx, width, height);
        } else {
            this.renderBrachistochroneRace(ctx, width, height);
        }
    }

    // Experiment 1: Pythagorean Theorem Water Flow Simulation
    renderPythagorasWater(ctx, width, height) {
        const centerX = width / 2;
        const centerY = height / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.pythAngle);

        const a = 90, b = 120;
        const c = Math.hypot(a, b);

        // Draw Right Triangle
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(a, 0);
        ctx.lineTo(0, -b);
        ctx.closePath();
        ctx.stroke();

        // Calculate Water Levels based on orientation
        const rotMod = (this.pythAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const fillC = Math.abs(Math.sin(rotMod));
        const fillAB = 1 - fillC;

        // Square A (a x a)
        ctx.fillStyle = `rgba(0, 243, 255, ${0.1 + fillAB * 0.5})`;
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2;
        ctx.fillRect(0, 0, a, a);
        ctx.strokeRect(0, 0, a, a);

        // Square B (b x b)
        ctx.fillStyle = `rgba(157, 78, 221, ${0.1 + fillAB * 0.5})`;
        ctx.strokeStyle = '#9d4edd';
        ctx.fillRect(-b, -b, b, b);
        ctx.strokeRect(-b, -b, b, b);

        // Square C (c x c) on hypotenuse
        const angleC = Math.atan2(b, a);
        ctx.save();
        ctx.translate(a, 0);
        ctx.rotate(-angleC);

        ctx.fillStyle = `rgba(0, 255, 136, ${0.1 + fillC * 0.5})`;
        ctx.strokeStyle = '#00ff88';
        ctx.fillRect(0, 0, c, c);
        ctx.strokeRect(0, 0, c, c);
        ctx.restore();

        ctx.restore();

        // Formula Overlay Text
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px "Fira Code", monospace';
        ctx.fillText(`Pythagorean Theorem: a² + b² = c² (${a}² + ${b}² = ${Math.round(c)}²)`, 20, 30);
    }

    // Experiment 2: Circle Area Slices to Rectangle Unfold
    renderCircleAreaSlices(ctx, width, height) {
        const R = 110;
        const centerX = width / 2;
        const centerY = height / 2;
        const N = this.slices;
        const anglePerSlice = (Math.PI * 2) / N;

        const p = this.unfoldProgress; // 0 = Circle, 1 = Rectangle

        for (let i = 0; i < N; i++) {
            const isTop = i % 2 === 0;

            // Target rectangle positions
            const rectBaseX = centerX - (Math.PI * R) / 2 + (i * (Math.PI * R) / N);
            const rectBaseY = isTop ? centerY - R / 2 : centerY + R / 2;
            const rectAngle = isTop ? Math.PI / 2 : -Math.PI / 2;

            // Circle target positions
            const circAngle = i * anglePerSlice + anglePerSlice / 2;
            const circBaseX = centerX;
            const circBaseY = centerY;

            // Lerp Position & Rotation
            const curX = circBaseX + (rectBaseX - circBaseX) * p;
            const curY = circBaseY + (rectBaseY - circBaseY) * p;
            const curRot = (circAngle - Math.PI / 2) + (rectAngle - (circAngle - Math.PI / 2)) * p;

            ctx.save();
            ctx.translate(curX, curY);
            ctx.rotate(curRot);

            // Draw Sector Slice
            ctx.fillStyle = isTop ? 'rgba(0, 243, 255, 0.7)' : 'rgba(255, 0, 127, 0.7)';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, R, -anglePerSlice / 2, anglePerSlice / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.restore();
        }

        // Formula Overlay Text
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px "Fira Code", monospace';
        ctx.fillText(`円の極限切片展開: 底辺 πr × 高さ r = 円の面積 (S = πr²)`, 20, 30);
    }

    // Experiment 3: Brachistochrone Race
    renderBrachistochroneRace(ctx, width, height) {
        const startX = 120, startY = 120;
        const endX = width - 180, endY = height - 140;

        // 1. Straight Line Path
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // 2. Cycloid Curve Path (Brachistochrone)
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let t = 0; t <= 1; t += 0.02) {
            // Cycloid parametric approx
            const theta = t * Math.PI;
            const cx = startX + (endX - startX) * (theta - Math.sin(theta)) / (Math.PI);
            const cy = startY + (endY - startY) * (1 - Math.cos(theta)) / 2;
            if (t === 0) ctx.moveTo(cx, cy);
            else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Ball Animation Logic
        const t = Math.min(1.0, this.raceTime / 2.5);

        // Straight Ball
        const ballStraightX = startX + (endX - startX) * (t * t); // Gravity acceleration
        const ballStraightY = startY + (endY - startY) * (t * t);

        // Cycloid Ball (Faster arrival!)
        const cycT = Math.min(1.0, this.raceTime / 1.8);
        const theta = cycT * Math.PI;
        const ballCycX = startX + (endX - startX) * (theta - Math.sin(theta)) / Math.PI;
        const ballCycY = startY + (endY - startY) * (1 - Math.cos(theta)) / 2;

        // Render Balls
        ctx.fillStyle = '#ff007f';
        ctx.beginPath(); ctx.arc(ballStraightX, ballStraightY, 8, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#00ff88';
        ctx.beginPath(); ctx.arc(ballCycX, ballCycY, 8, 0, Math.PI * 2); ctx.fill();

        // Text & Legend
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Fira Code", monospace';
        ctx.fillText(`最速降下線 (Brachistochrone Curve): 重力下で最も速く滑り降りる曲線`, 20, 30);
        ctx.fillStyle = '#00ff88';
        ctx.fillText(`● サイクロイド曲線 (最速ボール)`, 20, 60);
        ctx.fillStyle = '#ff007f';
        ctx.fillText(`● 直線斜面`, 20, 85);
    }
}
