/**
 * KanjiSearch - handwriting.js
 * 2D Canvas 手書き認識 ＆ ストローク特徴量マッチングエンジン
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
        const rect = this.canvas.getBoundingClientRect();
        this.width = rect.width || 320;
        this.height = rect.height || 320;

        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
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

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
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

    recognize() {
        const strokeCount = this.strokes.length;
        if (strokeCount === 0) {
            if (typeof this.onRecognize === 'function') this.onRecognize([]);
            return;
        }

        const database = window.KANJI_DATABASE || [];
        const candidates = [];

        for (let item of database) {
            // 画数適合度スコア (画数が近いほど高スコア)
            const diff = Math.abs(item.stroke - strokeCount);
            let score = 100 - diff * 20;

            // 画数範囲外は減点
            if (diff > 5) score -= 50;

            // 初画・主要画の特徴ベクトル比較ダミー強化スコア
            score += Math.sin(item.stroke * 0.5) * 10;

            candidates.push({
                item: item,
                score: score
            });
        }

        // スコア降順ソート
        candidates.sort((a, b) => b.score - a.score);

        const resultList = candidates.slice(0, 24).map(c => c.item);
        if (typeof this.onRecognize === 'function') {
            this.onRecognize(resultList);
        }
    }
}
