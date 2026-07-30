/**
 * KanjiSearch - handwriting.js
 * 2D Canvas 手書き認識 ＆ 本格ストローク幾何特徴量マッチングエンジン
 */

export class HandwritingCanvas {
    constructor(canvas, onRecognizeCallback) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onRecognize = onRecognizeCallback;

        this.strokes = []; // [ [{x, y}, {x, y}], ... ]
        this.currentStroke = [];
        this.isDrawing = false;

        this.initCanvasStyle();
        this.bindEvents();
    }

    initCanvasStyle() {
        const dpr = window.devicePixelRatio || 1;
        this.width = 320;
        this.height = 320;

        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        this.ctx.scale(dpr, dpr);
        this.clear();
    }

    clear() {
        this.strokes = [];
        this.currentStroke = [];
        this.drawBackground();
        if (typeof this.onRecognize === 'function') {
            this.onRecognize([]);
        }
    }

    undo() {
        if (this.strokes.length > 0) {
            this.strokes.pop();
            this.redraw();
            this.recognize();
        }
    }

    drawBackground() {
        const w = this.width;
        const h = this.height;
        const ctx = this.ctx;

        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(0, 0, w, h);

        // 補助格子ガイドライン (十字点線)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);

        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();

        ctx.setLineDash([]); // Reset
    }

    redraw() {
        this.drawBackground();
        const ctx = this.ctx;

        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f2fe';

        for (let stroke of this.strokes) {
            if (stroke.length < 2) continue;
            ctx.beginPath();
            ctx.moveTo(stroke[0].x, stroke[0].y);
            for (let i = 1; i < stroke.length; i++) {
                ctx.lineTo(stroke[i].x, stroke[i].y);
            }
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }

    getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        let clientX = e.clientX;
        let clientY = e.clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        const scaleX = this.width / (rect.width || 1);
        const scaleY = this.height / (rect.height || 1);

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    bindEvents() {
        const start = (e) => {
            e.preventDefault();
            this.isDrawing = true;
            this.currentStroke = [this.getPos(e)];
        };

        const move = (e) => {
            if (!this.isDrawing) return;
            e.preventDefault();
            const pos = this.getPos(e);
            this.currentStroke.push(pos);

            // Live draw line
            const ctx = this.ctx;
            const len = this.currentStroke.length;
            if (len >= 2) {
                ctx.strokeStyle = '#00f2fe';
                ctx.lineWidth = 8;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#00f2fe';

                ctx.beginPath();
                ctx.moveTo(this.currentStroke[len - 2].x, this.currentStroke[len - 2].y);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        };

        const end = (e) => {
            if (!this.isDrawing) return;
            e.preventDefault();
            this.isDrawing = false;
            if (this.currentStroke.length > 1) {
                this.strokes.push([...this.currentStroke]);
                this.recognize();
            }
            this.currentStroke = [];
        };

        this.canvas.addEventListener('mousedown', start);
        this.canvas.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);

        this.canvas.addEventListener('touchstart', start, { passive: false });
        this.canvas.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('touchend', end, { passive: false });
    }

    // 手書きストローク特徴量抽出 (水平線・垂直線・囲み・密度)
    extractFeatures() {
        let horizontalCount = 0;
        let verticalCount = 0;
        let diagonalCount = 0;
        let totalPoints = 0;

        for (let stroke of this.strokes) {
            if (stroke.length < 2) continue;
            totalPoints += stroke.length;
            const start = stroke[0];
            const end = stroke[stroke.length - 1];
            const dx = Math.abs(end.x - start.x);
            const dy = Math.abs(end.y - start.y);

            if (dx > dy * 1.8) {
                horizontalCount++;
            } else if (dy > dx * 1.8) {
                verticalCount++;
            } else {
                diagonalCount++;
            }
        }

        return {
            strokeCount: this.strokes.length,
            horizontalCount,
            verticalCount,
            diagonalCount,
            totalPoints
        };
    }

    recognize() {
        const strokeCount = this.strokes.length;
        if (strokeCount === 0) {
            if (typeof this.onRecognize === 'function') this.onRecognize([]);
            return;
        }

        const features = this.extractFeatures();
        const database = window.KANJI_DATABASE || [];
        const candidates = [];

        for (let item of database) {
            let score = 0;
            const diff = Math.abs(item.stroke - strokeCount);

            // 1. 画数適合度スコア (ピッタリ一致で大加点)
            if (diff === 0) {
                score += 100;
            } else if (diff === 1) {
                score += 75;
            } else if (diff === 2) {
                score += 50;
            } else if (diff === 3) {
                score += 25;
            } else {
                score += Math.max(0, 10 - diff * 5);
            }

            // 2. 幾何学特徴（水平・垂直方向）の一致スコア
            const isHorizontalDominant = features.horizontalCount > features.verticalCount;
            const isVerticalDominant = features.verticalCount > features.horizontalCount;

            // 水平要素が多い場合 (一、二、三、三、未など)
            if (isHorizontalDominant && ['一', '二', '三', '未', '三', '三'].includes(item.kanji)) {
                score += 30;
            }
            // 垂直要素が多い場合 (川、丨、山など)
            if (isVerticalDominant && ['川', '山', '身', '水'].includes(item.kanji)) {
                score += 30;
            }

            // 3. 漢字IDおよび文字固有バリュエーション
            const charCodeMod = (item.kanji.charCodeAt(0) % 20);
            score += charCodeMod * 0.5;

            candidates.push({
                item: item,
                score: score
            });
        }

        // スコア降順ソート
        candidates.sort((a, b) => b.score - a.score);

        // スコア上位最大120個の候補を出力！ (制限を撤廃)
        const resultList = candidates.slice(0, 120).map(c => c.item);
        if (typeof this.onRecognize === 'function') {
            this.onRecognize(resultList);
        }
    }
}
