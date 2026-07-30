/* Module: Pascal's Triangle Visualizer */

export class PascalsTriangleModule {
    constructor(canvas, controlsContainer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = controlsContainer;

        // View Transform (Pan & Zoom)
        this.panX = 0;
        this.panY = -120;
        this.zoom = 1.0;

        // Data & Settings
        this.maxRows = 30;
        this.colorPattern = 'sierpinski'; // 'none', 'sierpinski' (even/odd), 'mod3', 'fibonacci'
        this.triangle = [];

        // Interaction
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.selectedCell = null; // { n, k, val }

        this.generateTriangle();
        this.initControls();
        this.bindEvents();
    }

    // BigInt Combinations for Pascal's Triangle
    generateTriangle() {
        this.triangle = [];
        for (let n = 0; n <= this.maxRows; n++) {
            const row = [];
            for (let k = 0; k <= n; k++) {
                if (k === 0 || k === n) {
                    row.push(1n);
                } else {
                    const prevRow = this.triangle[n - 1];
                    row.push(prevRow[k - 1] + prevRow[k]);
                }
            }
            this.triangle.push(row);
        }
    }

    initControls() {
        this.container.innerHTML = `
            <div class="panel-section">
                <h3>三角形の行数</h3>
                <div class="control-group">
                    <div class="control-label">生成段数 (Rows) <span class="value" id="pascal-rows-val">30</span></div>
                    <input type="range" class="range-slider" id="pascal-rows" min="10" max="60" step="1" value="30">
                </div>
            </div>

            <div class="panel-section">
                <h3>模様・パターンの抽出</h3>
                <select class="select-input" id="pascal-pattern-select">
                    <option value="sierpinski">シェルピンスキーのギャスケット (奇数/偶数)</option>
                    <option value="mod3">素数剰余パターン (mod 3)</option>
                    <option value="fibonacci">フィボナッチ数列の斜めハイライト</option>
                    <option value="none">標準数値のみ</option>
                </select>
            </div>

            <div class="panel-section">
                <div class="btn-group">
                    <button class="btn btn-secondary" id="pascal-reset-view">🔍 ビューリセット</button>
                </div>
            </div>

            <div class="math-card">
                <h4>🔺 パスカルの三角形と二項係数</h4>
                各セルは上の2つの数の和で定義され、二項展開 $(a+b)^n$ の係数 $\\text{C}(n, k)$ を表します。
                <div class="math-formula-box">
                    \\text{C}(n, k) = \\frac{n!}{k!(n-k)!}
                </div>
                <b>操作</b>:<br>
                ・<b>左ドラッグ</b>: 平面移動<br>
                ・<b>ホイール</b>: 拡大・縮小<br>
                ・<b>右クリック</b>: 各セルの詳細・組合せ計算カード表示
            </div>
        `;

        document.getElementById('pascal-rows').addEventListener('input', (e) => {
            this.maxRows = parseInt(e.target.value);
            document.getElementById('pascal-rows-val').textContent = this.maxRows;
            this.generateTriangle();
        });

        document.getElementById('pascal-pattern-select').addEventListener('change', (e) => {
            this.colorPattern = e.target.value;
        });

        document.getElementById('pascal-reset-view').addEventListener('click', () => {
            this.panX = 0;
            this.panY = -120;
            this.zoom = 1.0;
        });
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left drag pan
                this.isDragging = true;
                this.dragStartX = e.clientX - this.panX;
                this.dragStartY = e.clientY - this.panY;
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.panX = e.clientX - this.dragStartX;
                this.panY = e.clientY - this.dragStartY;
            }
        });

        window.addEventListener('mouseup', () => this.isDragging = false);

        // Wheel Zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            
            // Zoom towards mouse position
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            this.panX = mouseX - (mouseX - this.panX) * zoomFactor;
            this.panY = mouseY - (mouseY - this.panY) * zoomFactor;
            this.zoom *= zoomFactor;
            this.zoom = Math.max(0.1, Math.min(10.0, this.zoom));
        }, { passive: false });

        // Right Click Cell Detail Modal Trigger
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const cell = this.getCellAtMouse(e);
            if (cell) {
                this.showCellDetailModal(cell.n, cell.k, cell.val);
            }
        });
    }

    getCellAtMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const cellWidth = 56 * this.zoom;
        const cellHeight = 44 * this.zoom;
        const startX = this.canvas.width / 2 + this.panX;
        const startY = 160 + this.panY;

        for (let n = 0; n <= this.maxRows; n++) {
            const rowY = startY + n * cellHeight;
            if (Math.abs(mouseY - rowY) > cellHeight / 2) continue;

            const rowWidth = n * cellWidth;
            const rowStartX = startX - rowWidth / 2;

            for (let k = 0; k <= n; k++) {
                const cellX = rowStartX + k * cellWidth;
                if (Math.abs(mouseX - cellX) <= cellWidth / 2) {
                    return { n, k, val: this.triangle[n][k] };
                }
            }
        }
        return null;
    }

    showCellDetailModal(n, k, val) {
        const modal = document.getElementById('math-detail-modal');
        const content = document.getElementById('modal-content-area');
        if (!modal || !content) return;

        content.innerHTML = `
            <h3 style="color: var(--accent-cyan); margin-bottom: 12px;">🔺 パスカルの三角形 セル詳細</h3>
            <div style="font-size: 1.1rem; margin-bottom: 10px;">
                行 (Row) <b>n = ${n}</b> , 列 (Column) <b>k = ${k}</b>
            </div>
            <div class="math-formula-box" style="font-size: 1.2rem;">
                \\mathrm{C}(${n}, ${k}) = ${val.toString()}
            </div>
            <div style="margin-top: 14px; font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">
                ・<b>計算式</b>: $${n}! / (${k}! \\times ${n - k}!)$<br>
                ・<b>二項定理の役割</b>: $(a+b)^{${n}}$ を展開した時の第 ${k+1} 項 $a^{${n-k}} b^{${k}}$ の係数。<br>
                ・<b>確率論的意味</b>: ${n} 個の異なる要素から ${k} 個を選ぶ組み合わせの総数。
            </div>
        `;

        modal.style.display = 'flex';

        if (window.renderMathInElement) {
            window.renderMathInElement(content, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false }
                ]
            });
        }
    }

    update(dt) {}

    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        const cellWidth = 56 * this.zoom;
        const cellHeight = 44 * this.zoom;
        const startX = width / 2 + this.panX;
        const startY = 160 + this.panY;

        for (let n = 0; n <= this.maxRows; n++) {
            const rowY = startY + n * cellHeight;
            const rowWidth = n * cellWidth;
            const rowStartX = startX - rowWidth / 2;

            for (let k = 0; k <= n; k++) {
                const cellX = rowStartX + k * cellWidth;
                const val = this.triangle[n][k];

                // Skip if out of canvas viewport bounds
                if (cellX + cellWidth < 0 || cellX - cellWidth > width ||
                    rowY + cellHeight < 0 || rowY - cellHeight > height) continue;

                // Color pattern logic
                let bgColor = 'rgba(17, 25, 40, 0.6)';
                let textColor = '#ffffff';

                if (this.colorPattern === 'sierpinski') {
                    if (val % 2n !== 0n) { // Odd number (Sierpinski triangle)
                        bgColor = 'rgba(0, 243, 255, 0.35)';
                        textColor = '#00f3ff';
                    }
                } else if (this.colorPattern === 'mod3') {
                    const mod = Number(val % 3n);
                    if (mod === 1) bgColor = 'rgba(255, 0, 127, 0.35)';
                    else if (mod === 2) bgColor = 'rgba(157, 78, 221, 0.35)';
                } else if (this.colorPattern === 'fibonacci') {
                    // Fibonacci diagonal highlight
                    if ((n + k) % 3 === 0) {
                        bgColor = 'rgba(0, 255, 136, 0.3)';
                    }
                }

                // Draw hexagon / cell box
                ctx.fillStyle = bgColor;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(cellX - cellWidth / 2 + 2, rowY - cellHeight / 2 + 2, cellWidth - 4, cellHeight - 4, 8 * this.zoom);
                ctx.fill();
                ctx.stroke();

                // Draw Value text if zoom is large enough
                if (this.zoom > 0.4) {
                    ctx.fillStyle = textColor;
                    ctx.font = `${Math.max(9, Math.floor(13 * this.zoom))}px "Fira Code", monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    let valStr = val.toString();
                    if (valStr.length > 5 && this.zoom < 0.8) {
                        valStr = valStr.substring(0, 4) + '…';
                    }
                    ctx.fillText(valStr, cellX, rowY);
                }
            }
        }

        // Overlay Text
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Fira Code", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Pascal's Triangle (Left-drag: Pan | Wheel: Zoom | Right-click: Cell Details)`, 20, 30);
    }
}
