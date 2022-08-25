import * as consts from './constants.js';

export default class Pipe {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} ctx
     */
    constructor(canvas, ctx, sprites, x) {
        this.canvas = canvas;
        this.ctx = ctx;

        this.sprites = sprites;

        this.x = x;
        this.y = ( consts.DIFF + consts.GAP / 2) + Math.floor(Math.random() * ( this.sprites.background.height - ( this.sprites.ground.height + consts.DIFF + consts.GAP / 2 ) - ( consts.DIFF + consts.GAP / 2) ) );
    }

    render(scale) {
        const frameWidth = this.sprites.pipes.width / 2;
        const frameHeight = this.sprites.pipes.height;

        const width = frameWidth * scale;
        const height = frameHeight * scale;

        this.ctx.drawImage(
            this.sprites.pipes,
            0, 0, frameWidth, frameHeight,
            this.x * scale - width / 2, this.y * scale - height - consts.GAP * scale / 2, width, height
        );

        this.ctx.drawImage(
            this.sprites.pipes,
            frameWidth, 0, frameWidth, frameHeight,
            this.x * scale - width / 2, this.y * scale + consts.GAP * scale / 2, width, height
        );
    }

    update(dt) {
        this.x -= dt * consts.GROUND_SPEED;
    }
}