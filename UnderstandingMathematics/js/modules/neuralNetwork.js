/* Module: AI Deep Learning & Neural Network Math Simulator */

export class NeuralNetworkModule {
    constructor(canvas, controlsContainer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = controlsContainer;

        // Neural Net Architecture: 2 inputs -> 4 hidden -> 1 output
        this.lr = 0.1; // Learning rate
        this.activation = 'sigmoid'; // 'sigmoid', 'relu', 'tanh'

        // Data points (XOR problem or Circular decision boundary)
        this.problemType = 'xor'; // 'xor', 'circle'
        this.dataPoints = [];
        this.epoch = 0;
        this.isTraining = false;

        // Network weights & biases
        this.initNetwork();
        this.generateData();

        this.initControls();
        this.bindEvents();
    }

    initNetwork() {
        // W1: 2x4, b1: 4
        this.W1 = [
            [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5],
            [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]
        ];
        this.b1 = [0, 0, 0, 0];

        // W2: 4x1, b2: 1
        this.W2 = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
        this.b2 = 0;
    }

    generateData() {
        this.dataPoints = [];
        if (this.problemType === 'xor') {
            for (let i = 0; i < 80; i++) {
                let x = Math.random() * 2 - 1;
                let y = Math.random() * 2 - 1;
                let label = (x * y > 0) ? 1 : 0;
                this.dataPoints.push({ x, y, label });
            }
        } else if (this.problemType === 'circle') {
            for (let i = 0; i < 80; i++) {
                let x = Math.random() * 2 - 1;
                let y = Math.random() * 2 - 1;
                let label = (x * x + y * y < 0.45) ? 1 : 0;
                this.dataPoints.push({ x, y, label });
            }
        }
    }

    act(x) {
        if (this.activation === 'sigmoid') return 1 / (1 + Math.exp(-x));
        if (this.activation === 'relu') return Math.max(0, x);
        if (this.activation === 'tanh') return Math.tanh(x);
        return x;
    }

    actDeriv(y) {
        if (this.activation === 'sigmoid') return y * (1 - y);
        if (this.activation === 'relu') return y > 0 ? 1 : 0;
        if (this.activation === 'tanh') return 1 - y * y;
        return 1;
    }

    forward(x, y) {
        let h = [0, 0, 0, 0];
        for (let j = 0; j < 4; j++) {
            let sum = x * this.W1[0][j] + y * this.W1[1][j] + this.b1[j];
            h[j] = this.act(sum);
        }
        let outSum = this.b2;
        for (let j = 0; j < 4; j++) {
            outSum += h[j] * this.W2[j];
        }
        let out = this.act(outSum);
        return { h, out };
    }

    trainStep() {
        let totalLoss = 0;
        for (let pt of this.dataPoints) {
            let { h, out } = this.forward(pt.x, pt.y);
            let error = pt.label - out;
            totalLoss += error * error;

            // Backprop output layer
            let dOut = error * this.actDeriv(out);

            // Backprop hidden layer
            let dH = [0, 0, 0, 0];
            for (let j = 0; j < 4; j++) {
                dH[j] = dOut * this.W2[j] * this.actDeriv(h[j]);
                this.W2[j] += this.lr * dOut * h[j];
            }
            this.b2 += this.lr * dOut;

            // Update W1 & b1
            for (let j = 0; j < 4; j++) {
                this.W1[0][j] += this.lr * dH[j] * pt.x;
                this.W1[1][j] += this.lr * dH[j] * pt.y;
                this.b1[j] += this.lr * dH[j];
            }
        }
        this.epoch++;
        this.loss = totalLoss / this.dataPoints.length;
    }

    initControls() {
        this.container.innerHTML = `
            <div class="panel-section">
                <h3>🧠 学習タスク (問題)</h3>
                <select class="select-input" id="nn-task-select">
                    <option value="xor" ${this.problemType === 'xor' ? 'selected' : ''}>XOR問題 (非線形分類)</option>
                    <option value="circle" ${this.problemType === 'circle' ? 'selected' : ''}>円形決定境界 (Concentric Circle)</option>
                </select>
            </div>

            <div class="panel-section">
                <h3>⚡ ハイパーパラメータ</h3>
                <div class="control-group">
                    <label>学習率 $\\eta$: <span id="nn-lr-val">${this.lr}</span></label>
                    <input type="range" id="nn-lr-slider" min="0.01" max="0.5" step="0.01" value="${this.lr}">
                </div>
                <div class="control-group">
                    <label>活性化関数 $\\sigma(x)$:</label>
                    <select class="select-input" id="nn-act-select">
                        <option value="sigmoid" ${this.activation === 'sigmoid' ? 'selected' : ''}>Sigmoid</option>
                        <option value="relu" ${this.activation === 'relu' ? 'selected' : ''}>ReLU</option>
                        <option value="tanh" ${this.activation === 'tanh' ? 'selected' : ''}>Tanh</option>
                    </select>
                </div>
            </div>

            <div class="panel-section">
                <h3>🚀 学習コントロール</h3>
                <div class="btn-grid">
                    <button class="btn-action primary" id="nn-train-btn">${this.isTraining ? '⏸️ 学習一時停止' : '▶️ リアルタイム学習開始'}</button>
                    <button class="btn-action" id="nn-reset-btn">🔄 重み初期化</button>
                </div>
            </div>

            <div class="panel-section info-box">
                <h4>💡 ディープラーニングと逆伝播法</h4>
                <p>誤差逆伝播 (Backpropagation):</p>
                <p>$$\\frac{\\partial L}{\\partial w_{ij}} = \\frac{\\partial L}{\\partial a_j} \\cdot \\frac{\\partial a_j}{\\partial z_j} \\cdot \\frac{\\partial z_j}{\\partial w_{ij}}$$</p>
                <p>多層ニューラルネットワークが勾配降下法によって非線形な決定境界を自律的に学習・獲得する様子を可視化しています。</p>
            </div>
        `;
    }

    bindEvents() {
        const taskSelect = document.getElementById('nn-task-select');
        const lrSlider = document.getElementById('nn-lr-slider');
        const actSelect = document.getElementById('nn-act-select');
        const trainBtn = document.getElementById('nn-train-btn');
        const resetBtn = document.getElementById('nn-reset-btn');

        if (taskSelect) {
            taskSelect.addEventListener('change', (e) => {
                this.problemType = e.target.value;
                this.generateData();
                this.initNetwork();
                this.epoch = 0;
            });
        }

        if (lrSlider) {
            lrSlider.addEventListener('input', (e) => {
                this.lr = parseFloat(e.target.value);
                document.getElementById('nn-lr-val').textContent = this.lr.toFixed(2);
            });
        }

        if (actSelect) {
            actSelect.addEventListener('change', (e) => {
                this.activation = e.target.value;
            });
        }

        if (trainBtn) {
            trainBtn.addEventListener('click', () => {
                this.isTraining = !this.isTraining;
                trainBtn.textContent = this.isTraining ? '⏸️ 学習一時停止' : '▶️ リアルタイム学習開始';
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.initNetwork();
                this.epoch = 0;
            });
        }
    }

    update(dt) {
        if (this.isTraining) {
            for (let i = 0; i < 5; i++) {
                this.trainStep();
            }
        }
    }

    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.fillStyle = '#080a14';
        ctx.fillRect(0, 0, width, height);

        // Left half: Decision Boundary Plot
        const plotWidth = width * 0.5;
        const plotHeight = height;

        const imgData = ctx.createImageData(plotWidth, plotHeight);
        const data = imgData.data;

        for (let py = 0; py < plotHeight; py += 3) {
            for (let px = 0; px < plotWidth; px += 3) {
                let nx = (px / plotWidth) * 2.4 - 1.2;
                let ny = (py / plotHeight) * 2.4 - 1.2;

                let { out } = this.forward(nx, ny);

                let r = Math.floor(out * 0 + (1 - out) * 255);
                let g = Math.floor(out * 243 + (1 - out) * 0);
                let b = Math.floor(out * 255 + (1 - out) * 128);

                for (let dy = 0; dy < 3; dy++) {
                    for (let dx = 0; dx < 3; dx++) {
                        let idx = ((py + dy) * plotWidth + (px + dx)) * 4;
                        data[idx] = r;
                        data[idx + 1] = g;
                        data[idx + 2] = b;
                        data[idx + 3] = 140;
                    }
                }
            }
        }
        ctx.putImageData(imgData, 0, 0);

        // Draw Data Points on left plot
        for (let pt of this.dataPoints) {
            let px = ((pt.x + 1.2) / 2.4) * plotWidth;
            let py = ((pt.y + 1.2) / 2.4) * plotHeight;

            ctx.fillStyle = pt.label === 1 ? '#00f3ff' : '#ff0055';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;

            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Right half: Neural Network Architecture Visualizer
        const netX = plotWidth + 60;
        const netWidth = width - netX - 40;

        ctx.fillStyle = '#ffffff';
        ctx.font = '15px Inter, sans-serif';
        ctx.fillText(`エポック数 (Epoch): ${this.epoch}`, netX, 40);
        ctx.fillText(`損失関数 (Loss): ${this.loss ? this.loss.toFixed(4) : 'N/A'}`, netX, 65);

        // Layers positions
        const layerInputs = [{ x: netX, y: height * 0.35 }, { x: netX, y: height * 0.65 }];
        const layerHidden = [
            { x: netX + netWidth * 0.5, y: height * 0.2 },
            { x: netX + netWidth * 0.5, y: height * 0.4 },
            { x: netX + netWidth * 0.5, y: height * 0.6 },
            { x: netX + netWidth * 0.5, y: height * 0.8 }
        ];
        const layerOutput = [{ x: netX + netWidth, y: height * 0.5 }];

        // Draw W1 connections
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 4; j++) {
                let w = this.W1[i][j];
                ctx.strokeStyle = w > 0 ? 'rgba(0, 243, 255, ' + Math.min(1, Math.abs(w)) + ')' : 'rgba(255, 0, 85, ' + Math.min(1, Math.abs(w)) + ')';
                ctx.lineWidth = Math.abs(w) * 3 + 0.5;
                ctx.beginPath();
                ctx.moveTo(layerInputs[i].x, layerInputs[i].y);
                ctx.lineTo(layerHidden[j].x, layerHidden[j].y);
                ctx.stroke();
            }
        }

        // Draw W2 connections
        for (let j = 0; j < 4; j++) {
            let w = this.W2[j];
            ctx.strokeStyle = w > 0 ? 'rgba(0, 243, 255, ' + Math.min(1, Math.abs(w)) + ')' : 'rgba(255, 0, 85, ' + Math.min(1, Math.abs(w)) + ')';
            ctx.lineWidth = Math.abs(w) * 3 + 0.5;
            ctx.beginPath();
            ctx.moveTo(layerHidden[j].x, layerHidden[j].y);
            ctx.lineTo(layerOutput[0].x, layerOutput[0].y);
            ctx.stroke();
        }

        // Draw Nodes
        const drawNode = (pos, label, color) => {
            ctx.fillStyle = color;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#000';
            ctx.font = 'bold 11px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, pos.x, pos.y);
        };

        drawNode(layerInputs[0], 'X1', '#00f3ff');
        drawNode(layerInputs[1], 'X2', '#00f3ff');

        for (let j = 0; j < 4; j++) {
            drawNode(layerHidden[j], `H${j+1}`, '#ffb703');
        }

        drawNode(layerOutput[0], 'Out', '#00ff87');
        ctx.textAlign = 'start';
    }
}
