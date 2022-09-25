import * as consts from './constants.js';

export default class GameState {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} sprites
     */
     constructor(canvas, ctx, sprites, pressedKeys) {
        this.canvas = canvas;
        this.ctx = ctx;

        this.sprites = sprites;

        this.pressedKeys = pressedKeys;
        this.prevPressedKeys = pressedKeys;

        this.init();

        this.scale = this.canvas.width / this.sprites.ground.width;

        this.saveObj = JSON.parse(localStorage.getItem('dino')) || {};
    }

    init() {

        this.gameOn = false;
        this.gameOver = false;

        this.colorState = 0;
        this.colorTimer = 0.7;
        this.colorBg = '';

        this.spikeTimer = 0;
    }

    render() {
        this.ctx.globalAlpha = 1;

        this.canvas.style.backgroundColor = this.colorBg;
    }

    update(dt) {
        this.scale = this.canvas.width / this.sprites.border.width;

        this.prevPressedKeys = {...this.pressedKeys};
    }

    colorTransition(color1, color2, alpha) {
        let hex1 = parseInt(color1.slice(1), 16);
        let hex2 = parseInt(color2.slice(1), 16);

        let r1 = Math.floor(hex1 / 65536);
        let g1 = Math.floor(Math.floor(hex1 / 256) % 256);
        let b1 = hex1 % 256;

        let r2 = Math.floor(hex2 / 65536);
        let g2 = Math.floor(Math.floor(hex2 / 256) % 256);
        let b2 = hex2 % 256;

        let rn = Math.floor(r1 + alpha * (r2 - r1) );
        let gn = Math.floor(g1 + alpha * (g2 - g1) );
        let bn = Math.floor(b1 + alpha * (b2 - b1) );

        let nhex = rn * 65536 + gn * 256 + bn;

        return `#${'0'.repeat(6 - nhex.toString(16).length)}${nhex.toString(16)}`;
    }
};