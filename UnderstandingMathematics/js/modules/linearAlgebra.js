/* Module: Linear Algebra & Matrix Transformations */

export class LinearAlgebraModule {
    constructor(canvas, controlsContainer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = controlsContainer;

        // Current Transformation Matrix A = [[a, b], [c, d]]
        this.matrix = { a: 1, b: 0, c: 0, d: 1 };
        this.targetMatrix = { a: 1, b: 0, c: 0, d: 1 };
        
        this.scale = 50; // pixels per unit
        this.showEigen = true;
        this.showGrid = true;
        this.showArea = true;

        this.initControls();
    }

    initControls() {
        this.container.innerHTML = `
            <div class="panel-section">
                <h3>変換行列 A [2x2]</h3>
                <div class="matrix-grid">
                    <div class="matrix-cell">
                        <label>a (i_x)</label>
                        <input type="number" id="mat-a" value="1" step="0.1">
                    </div>
                    <div class="matrix-cell">
                        <label>b (j_x)</label>
                        <input type="number" id="mat-b" value="0" step="0.1">
                    </div>
                    <div class="matrix-cell">
                        <label>c (i_y)</label>
                        <input type="number" id="mat-c" value="0" step="0.1">
                    </div>
                    <div class="matrix-cell">
                        <label>d (j_y)</label>
                        <input type="number" id="mat-d" value="1" step="0.1">
                    </div>
                </div>
            </div>

            <div class="panel-section">
                <h3>プリセット変換</h3>
                <div class="btn-group">
                    <button class="btn btn-secondary" id="mat-preset-identity">単位行列 (Identity)</button>
                    <button class="btn btn-secondary" id="mat-preset-rotate">回転 (Rotation 45°)</button>
                    <button class="btn btn-secondary" id="mat-preset-shear">シアー (Shear)</button>
                    <button class="btn btn-secondary" id="mat-preset-scale">拡大縮小 (Scale)</button>
                    <button class="btn btn-secondary" id="mat-preset-reflect">Y軸反射 (Reflect)</button>
                    <button class="btn btn-secondary" id="mat-preset-proj">射影 (Projection)</button>
                </div>
            </div>

            <div class="panel-section">
                <h3>ビジュアル設定</h3>
                <div class="toggle-group">
                    <span>固有値・固有ベクトル表示</span>
                    <label class="switch">
                        <input type="checkbox" id="mat-toggle-eigen" checked>
                        <span class="slider-round"></span>
                    </label>
                </div>
                <div class="toggle-group">
                    <span>行列式 det(A) 面積表示</span>
                    <label class="switch">
                        <input type="checkbox" id="mat-toggle-area" checked>
                        <span class="slider-round"></span>
                    </label>
                </div>
            </div>

            <div class="math-card">
                <h4>🔳 線形変換と行列</h4>
                ベクトル $\\vec{v}$ の行列変換 $A\\vec{v}$ は空間全体の歪みを引き起こします。
                <div class="math-formula-box">
                    \\begin{pmatrix} x' \\\\ y' \\end{pmatrix} = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix}
                </div>
                <b>行列式 $\\det(A)$</b> は変換後の面積拡大率を示し、<b>固有ベクトル</b> $A\\vec{v} = \\lambda \\vec{v}$ は変換後も方向が変わらない軸を示します。
            </div>
        `;

        const updateInputs = () => {
            document.getElementById('mat-a').value = this.targetMatrix.a.toFixed(2);
            document.getElementById('mat-b').value = this.targetMatrix.b.toFixed(2);
            document.getElementById('mat-c').value = this.targetMatrix.c.toFixed(2);
            document.getElementById('mat-d').value = this.targetMatrix.d.toFixed(2);
        };

        const setMatrix = (a, b, c, d) => {
            this.targetMatrix = { a, b, c, d };
            updateInputs();
        };

        document.getElementById('mat-a').addEventListener('input', (e) => this.targetMatrix.a = parseFloat(e.target.value) || 0);
        document.getElementById('mat-b').addEventListener('input', (e) => this.targetMatrix.b = parseFloat(e.target.value) || 0);
        document.getElementById('mat-c').addEventListener('input', (e) => this.targetMatrix.c = parseFloat(e.target.value) || 0);
        document.getElementById('mat-d').addEventListener('input', (e) => this.targetMatrix.d = parseFloat(e.target.value) || 0);

        document.getElementById('mat-preset-identity').addEventListener('click', () => setMatrix(1, 0, 0, 1));
        document.getElementById('mat-preset-rotate').addEventListener('click', () => {
            const rad = Math.PI / 4;
            setMatrix(Math.cos(rad), -Math.sin(rad), Math.sin(rad), Math.cos(rad));
        });
        document.getElementById('mat-preset-shear').addEventListener('click', () => setMatrix(1, 1, 0, 1));
        document.getElementById('mat-preset-scale').addEventListener('click', () => setMatrix(1.5, 0, 0, 0.8));
        document.getElementById('mat-preset-reflect').addEventListener('click', () => setMatrix(-1, 0, 0, 1));
        document.getElementById('mat-preset-proj').addEventListener('click', () => setMatrix(1, 0.5, 0.5, 0.25));

        document.getElementById('mat-toggle-eigen').addEventListener('change', (e) => this.showEigen = e.target.checked);
        document.getElementById('mat-toggle-area').addEventListener('change', (e) => this.showArea = e.target.checked);
    }

    update(dt) {
        // Smoothly interpolate current matrix to target matrix
        const lerpRate = 0.1;
        this.matrix.a += (this.targetMatrix.a - this.matrix.a) * lerpRate;
        this.matrix.b += (this.targetMatrix.b - this.matrix.b) * lerpRate;
        this.matrix.c += (this.targetMatrix.c - this.matrix.c) * lerpRate;
        this.matrix.d += (this.targetMatrix.d - this.matrix.d) * lerpRate;
    }

    transformPoint(x, y) {
        const { a, b, c, d } = this.matrix;
        return {
            x: a * x + b * y,
            y: c * x + d * y
        };
    }

    calculateEigen() {
        const { a, b, c, d } = this.matrix;
        const trace = a + d;
        const det = a * d - b * c;
        const disc = trace * trace - 4 * det;

        if (disc < 0) return null; // Complex eigenvalues

        const l1 = (trace + Math.sqrt(disc)) / 2;
        const l2 = (trace - Math.sqrt(disc)) / 2;

        let v1 = { x: 1, y: 0 };
        let v2 = { x: 0, y: 1 };

        if (Math.abs(b) > 1e-5) {
            v1 = { x: l1 - d, y: c };
            v2 = { x: l2 - d, y: c };
        } else if (Math.abs(c) > 1e-5) {
            v1 = { x: b, y: l1 - a };
            v2 = { x: b, y: l2 - a };
        }

        // Normalize
        const len1 = Math.hypot(v1.x, v1.y) || 1;
        const len2 = Math.hypot(v2.x, v2.y) || 1;

        return {
            l1, v1: { x: v1.x / len1, y: v1.y / len1 },
            l2, v2: { x: v2.x / len2, y: v2.y / len2 }
        };
    }

    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        const originX = width / 2;
        const originY = height / 2;

        const toScreen = (x, y) => ({
            x: originX + x * this.scale,
            y: originY - y * this.scale
        });

        // 1. Draw Transformed Grid Lines
        ctx.lineWidth = 1;
        const range = 10;

        for (let i = -range; i <= range; i++) {
            // Horizontal lines
            ctx.strokeStyle = i === 0 ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 243, 255, 0.1)';
            ctx.beginPath();
            const pStartH = this.transformPoint(-range, i);
            const pEndH = this.transformPoint(range, i);
            const sStartH = toScreen(pStartH.x, pStartH.y);
            const sEndH = toScreen(pEndH.x, pEndH.y);
            ctx.moveTo(sStartH.x, sStartH.y);
            ctx.lineTo(sEndH.x, sEndH.y);
            ctx.stroke();

            // Vertical lines
            ctx.strokeStyle = i === 0 ? 'rgba(255, 255, 255, 0.3)' : 'rgba(157, 78, 221, 0.1)';
            ctx.beginPath();
            const pStartV = this.transformPoint(i, -range);
            const pEndV = this.transformPoint(i, range);
            const sStartV = toScreen(pStartV.x, pStartV.y);
            const sEndV = toScreen(pEndV.x, pEndV.y);
            ctx.moveTo(sStartV.x, sStartV.y);
            ctx.lineTo(sEndV.x, sEndV.y);
            ctx.stroke();
        }

        // 2. Transformed Unit Area (Determinant visual)
        const det = this.matrix.a * this.matrix.d - this.matrix.b * this.matrix.c;
        if (this.showArea) {
            const p0 = toScreen(0, 0);
            const p1 = toScreen(...Object.values(this.transformPoint(1, 0)));
            const p2 = toScreen(...Object.values(this.transformPoint(1, 1)));
            const p3 = toScreen(...Object.values(this.transformPoint(0, 1)));

            ctx.fillStyle = det >= 0 ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 0, 127, 0.15)';
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.closePath();
            ctx.fill();
        }

        // 3. Eigenvalues & Eigenvectors Axis
        if (this.showEigen) {
            const eigen = this.calculateEigen();
            if (eigen) {
                const drawEigenLine = (v, color, label) => {
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([6, 4]);
                    const p1 = toScreen(v.x * 6, v.y * 6);
                    const p2 = toScreen(-v.x * 6, -v.y * 6);
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                };

                drawEigenLine(eigen.v1, '#ffb703', 'v1');
                drawEigenLine(eigen.v2, '#ff007f', 'v2');
            }
        }

        // 4. Basis Vectors i_hat (1,0) and j_hat (0,1)
        const iHatTrans = this.transformPoint(1, 0);
        const jHatTrans = this.transformPoint(0, 1);

        const drawVector = (vec, color, label) => {
            const origin = toScreen(0, 0);
            const target = toScreen(vec.x, vec.y);

            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = 3.5;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;

            // Line
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();

            // Arrow head
            const angle = Math.atan2(target.y - origin.y, target.x - origin.x);
            const headLen = 12;
            ctx.beginPath();
            ctx.moveTo(target.x, target.y);
            ctx.lineTo(target.x - headLen * Math.cos(angle - Math.PI / 6), target.y - headLen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(target.x - headLen * Math.cos(angle + Math.PI / 6), target.y - headLen * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fill();

            ctx.shadowBlur = 0;

            // Label
            ctx.font = '14px "Fira Code", monospace';
            ctx.fillText(label, target.x + 10, target.y - 10);
        };

        drawVector(iHatTrans, '#00f3ff', 'î');
        drawVector(jHatTrans, '#9d4edd', 'ĵ');

        // Overlay Text
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Fira Code", monospace';
        ctx.fillText(`det(A) = ${det.toFixed(3)} ${det === 0 ? '(空間崩壊 / ランク1)' : ''}`, 20, 30);
    }
}
