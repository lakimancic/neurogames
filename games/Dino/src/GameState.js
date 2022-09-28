import * as consts from './constants.js';
import Dino from './Dino.js';

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

        this.scale = this.canvas.width * 2 / this.sprites.ground.width;

        this.saveObj = JSON.parse(localStorage.getItem('dino')) || {};
    }

    init() {
        this.dino = new Dino(this.canvas, this.ctx, this.sprites, this.pressedKeys, 50, consts.GROUND_Y - this.sprites.dino.height * 0.15, 'player');
        this.obstacles = [];

        // for(let i=0;i<3;i++) {
        //     this.obstacles.push({ x: this.sprites.ground.width / 2 + 50 + i * 3 * consts.START_SPEED, type: Math.floor(Math.random() * 3), subtype: Math.floor(Math.random() * 3) });
        // }
        for(let i=0;i<3;i++) {
            this.obstacles.push({ x: this.sprites.ground.width / 4 + 50 + i * 3 * consts.START_SPEED, type: 2, subtype: 2 });
        }
        console.log(this.obstacles);

        this.gameOn = false;
        this.gameOver = false;

        this.birdTimer = 0;

        this.colorState = 0;
        this.colorTimer = 0.7;
        this.colorBg = consts.COLORS[this.colorState % 2].bg;
        this.colorOver = consts.COLORS[this.colorState % 2].over;

        this.ground1x = 0;
        this.ground2x = this.sprites.ground.width - 1;

        this.vx = 0;

        this.firstJump = false;
    }

    render() {
        this.ctx.globalAlpha = 1;

        this.canvas.style.backgroundColor = this.colorOver;

        this.ctx.fillStyle = this.colorBg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.globalCompositeOperation = 'xor';
        this.ctx.drawImage(
            this.sprites.ground,
            0, 0, this.sprites.ground.width, this.sprites.ground.height,
            this.ground1x * this.scale, consts.GROUND_Y * this.scale, this.sprites.ground.width * this.scale, this.sprites.ground.height * this.scale 
        );
        this.ctx.drawImage(
            this.sprites.ground,
            0, 0, this.sprites.ground.width, this.sprites.ground.height,
            this.ground2x * this.scale, consts.GROUND_Y * this.scale, this.sprites.ground.width * this.scale, this.sprites.ground.height * this.scale 
        );

        this.obstacles.forEach(i => this.renderObstacle(i));

        this.dino.render(this.scale, this.gameOn);

        this.ctx.globalCompositeOperation = 'source-over';
    }

    update(dt) {
        this.scale = this.canvas.width * 2 / this.sprites.ground.width;

        if(this.gameOn) this.birdTimer += dt;

        this.ground1x -= this.vx * dt;
        this.ground2x -= this.vx * dt;

        if(this.ground1x < -this.sprites.ground.width) {
            this.ground1x = this.ground2x + this.sprites.ground.width - 1;
        }
        if(this.ground2x < -this.sprites.ground.width) {
            this.ground2x = this.ground1x + this.sprites.ground.width - 1;
        }

        this.obstacles.forEach(ob => {
            ob.x -= this.vx * dt;
        });

        let prevY = this.dino.y;
        this.dino.update(dt, this.gameOn);

        if(prevY != this.dino.y && this.dino.y == consts.GROUND_Y - this.sprites.dino.height * 0.15 && !this.firstJump) {
            this.dino.state = 'run';
            this.vx = consts.START_SPEED;
            this.gameOn = true;
        }

        this.prevPressedKeys = {...this.pressedKeys};
    }

    renderObstacle(ob) {
        if(ob.type === 0) {
            const frameWidth = this.sprites.small_cactus.width / 6 - 1;
            const frameHeight = this.sprites.small_cactus.height;

            const mul = Math.floor((ob.subtype + 1) * ob.subtype / 2);

            const width = (frameWidth * (ob.subtype + 1) + 2) * this.scale;
            const height = frameHeight * this.scale;

            this.ctx.drawImage(
                this.sprites.small_cactus,
                frameWidth * mul + 2 * ob.subtype, 0, (frameWidth * (ob.subtype + 1) + 2), frameHeight,
                ob.x * this.scale - width / 2, (consts.GROUND_Y + 10) * this.scale - height, width, height
            );
        }
        else if(ob.type === 1) {
            const frameWidth = this.sprites.big_cactus.width / 6 - 1;
            const frameHeight = this.sprites.big_cactus.height;

            const mul = Math.floor((ob.subtype + 1) * ob.subtype / 2);

            const width = (frameWidth * (ob.subtype + 1) + 2) * this.scale;
            const height = frameHeight * this.scale;

            this.ctx.drawImage(
                this.sprites.big_cactus,
                frameWidth * mul + 2 * ob.subtype, 0, (frameWidth * (ob.subtype + 1) + 2), frameHeight,
                ob.x * this.scale - width / 2, (consts.GROUND_Y + 10) * this.scale - height, width, height
            );
        }
        else {
            const frameWidth = this.sprites.bird.width / 2;
            const frameHeight = this.sprites.bird.height;

            const width = frameWidth * this.scale;
            const height = frameHeight * this.scale;

            if(Math.floor(this.birdTimer / 0.2) % 2 == 0) {
                this.ctx.drawImage(
                    this.sprites.bird,
                    0, 0, frameWidth, frameHeight,
                    ob.x * this.scale - width / 2, (consts.GROUND_Y + 10 - 30 * ob.subtype) * this.scale - height, width, height
                );
            } else {
                this.ctx.drawImage(
                    this.sprites.bird,
                    frameWidth, 0, frameWidth, frameHeight,
                    ob.x * this.scale - width / 2, (consts.GROUND_Y + 10 - 30 * ob.subtype) * this.scale - height, width, height
                );
            }
        }
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