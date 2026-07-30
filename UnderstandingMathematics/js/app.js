/* Understanding Mathematics - Main Application Manager */

import { TrigonometryModule } from './modules/trigonometry.js';
import { CalculusModule } from './modules/calculus.js';
import { LinearAlgebraModule } from './modules/linearAlgebra.js';
import { FourierModule } from './modules/fourier.js';
import { ChaosModule } from './modules/chaos.js';
import { ProbabilityModule } from './modules/probability.js';
import { KleinBottleModule } from './modules/kleinBottle.js';
import { PascalsTriangleModule } from './modules/pascalsTriangle.js';
import { ExperimentsModule } from './modules/experiments.js';
import { EverydayObjectsModule } from './modules/everydayObjects.js';

class AppManager {
    constructor() {
        this.currentModuleId = 'trigonometry';
        this.modules = {};
        this.activeModule = null;

        // Loop stats
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fps = 60;
        this.fpsElement = document.getElementById('fps-counter');

        this.initDOM();
        this.initCanvas();
        this.initModules();
        this.bindEvents();

        // Start Loop
        requestAnimationFrame((t) => this.loop(t));
    }

    initDOM() {
        this.canvas = document.getElementById('main-canvas');
        this.controlsContainer = document.getElementById('control-panel-content');
        this.moduleTitle = document.getElementById('current-module-title');
        this.moduleBadge = document.getElementById('current-module-badge');
    }

    initCanvas() {
        const resizeCanvas = () => {
            const viewport = this.canvas.parentElement;
            const width = viewport.clientWidth;
            const height = viewport.clientHeight;
            
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;
            
            const ctx = this.canvas.getContext('2d');
            ctx.scale(dpr, dpr);
            
            // Adjust canvas CSS size
            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;

            // Logical dimensions on instance
            this.canvas.logicalWidth = width;
            this.canvas.logicalHeight = height;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
    }

    initModules() {
        // Create canvas wrapper to normalize DPR scale for modules
        const canvasProxy = {
            getContext: (type) => this.canvas.getContext(type),
            getBoundingClientRect: () => this.canvas.getBoundingClientRect(),
            addEventListener: (...args) => this.canvas.addEventListener(...args),
            removeEventListener: (...args) => this.canvas.removeEventListener(...args)
        };

        Object.defineProperty(canvasProxy, 'width', { get: () => this.canvas.logicalWidth || this.canvas.width });
        Object.defineProperty(canvasProxy, 'height', { get: () => this.canvas.logicalHeight || this.canvas.height });

        // Instantiate modules lazy or upfront
        this.moduleFactories = {
            'trigonometry': () => new TrigonometryModule(canvasProxy, this.controlsContainer),
            'calculus': () => new CalculusModule(canvasProxy, this.controlsContainer),
            'linear-algebra': () => new LinearAlgebraModule(canvasProxy, this.controlsContainer),
            'fourier': () => new FourierModule(canvasProxy, this.controlsContainer),
            'chaos': () => new ChaosModule(canvasProxy, this.controlsContainer),
            'probability': () => new ProbabilityModule(canvasProxy, this.controlsContainer),
            'klein-bottle': () => new KleinBottleModule(canvasProxy, this.controlsContainer),
            'pascals-triangle': () => new PascalsTriangleModule(canvasProxy, this.controlsContainer),
            'experiments': () => new ExperimentsModule(canvasProxy, this.controlsContainer),
            'everyday-objects': () => new EverydayObjectsModule(canvasProxy, this.controlsContainer)
        };

        this.moduleMeta = {
            'trigonometry': { title: '📐 三角関数と単位円', badge: 'Trigonometry & Unit Circle' },
            'calculus': { title: '📈 微積分・極限と面積', badge: 'Calculus: Derivatives & Integrals' },
            'linear-algebra': { title: '🔳 線形代数と行列変換', badge: 'Linear Algebra & Matrix' },
            'fourier': { title: '🌊 フーリエ級数と円軌道', badge: 'Fourier Series & Epicycles' },
            'chaos': { title: '🌀 カオス理論とフラクタル', badge: 'Chaos & Fractals' },
            'probability': { title: '🎲 確率・統計とモンテカルロ法', badge: 'Probability & Monte Carlo' },
            'klein-bottle': { title: '🍶 3D クラインの壺', badge: 'Klein Bottle 3D Visualizer' },
            'pascals-triangle': { title: '🔺 パスカルの三角形', badge: "Pascal's Triangle & Sierpinski" },
            'experiments': { title: '🧪 直感物理・視覚実験', badge: 'Visual Physics & Math Experiments' },
            'everyday-objects': { title: '📦 身近なものの3D観察', badge: '3D Everyday Objects Math Observer' }
        };

        this.switchModule('trigonometry');
    }

    switchModule(id) {
        if (!this.moduleFactories[id]) return;

        this.currentModuleId = id;
        if (!this.modules[id]) {
            this.modules[id] = this.moduleFactories[id]();
        }

        this.activeModule = this.modules[id];

        // Re-render controls container
        if (typeof this.activeModule.initControls === 'function') {
            this.activeModule.initControls();
        }

        // Update Title & Badge
        const meta = this.moduleMeta[id];
        this.moduleTitle.textContent = meta.title;
        this.moduleBadge.textContent = meta.badge;

        // Render KaTeX math formulas if available
        if (window.renderMathInElement) {
            window.renderMathInElement(document.body, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false }
                ]
            });
        }
    }

    bindEvents() {
        // Sidebar Navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                const moduleId = item.getAttribute('data-module');
                this.switchModule(moduleId);
            });
        });

        // Mobile Sidebar Toggle
        const toggleBtn = document.getElementById('sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }

        // Modal Close Listener
        const closeBtn = document.getElementById('modal-close-btn');
        const modal = document.getElementById('math-detail-modal');
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => modal.style.display = 'none');
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });
        }
    }

    loop(currentTime) {
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        // Calculate FPS
        this.frameCount++;
        if (this.frameCount % 30 === 0) {
            this.fps = Math.round(1 / dt);
            if (this.fpsElement) this.fpsElement.textContent = `${this.fps} FPS`;
        }

        // Active module update & render
        if (this.activeModule) {
            if (typeof this.activeModule.update === 'function') {
                this.activeModule.update(dt);
            }
            if (typeof this.activeModule.render === 'function') {
                this.activeModule.render();
            }
        }

        requestAnimationFrame((t) => this.loop(t));
    }
}

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppManager();
});
