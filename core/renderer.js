const Renderer = {
    canvas: null,
    ctx: null,
    width: 1280,
    height: 720,

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx.imageSmoothingEnabled = true;
    },

    clear() {
        this.ctx.fillStyle = '#0a0a12';
        this.ctx.fillRect(0, 0, this.width, this.height);
    },

    get w() { return this.width; },
    get h() { return this.height; },
    get cx() { return this.width / 2; },
    get cy() { return this.height / 2; }
};
