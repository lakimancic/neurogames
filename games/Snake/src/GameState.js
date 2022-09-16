import * as consts from './constants.js';
import Snake from './Snake.js';

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

        this.snake = new Snake(canvas, ctx, sprites, pressedKeys, 19, 12);

        this.saveObj = JSON.parse(localStorage.getItem('snakegame')) || {};

        this.gameOn = false;
        this.gameOver = false;
    }

    render() {
        this.ctx.fillStyle = consts.COLORS.GREEN;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        let sx = consts.LEFT * this.scale;
        let sy = consts.TOP * this.scale;

        // Score
        let digits = [];
        let score = this.snake.score;
        while(score > 0) {
            digits.push(score % 10);
            score = Math.floor(score / 10);
        }
        for(let i=3;i>=0;i--) {
            if(i < digits.length) {
                this.renderNumber(digits[i], 360 - i * (consts.SEG_W + consts.SEG_H), 10);
            } else {
                this.renderNumber(0, 360 - i * (consts.SEG_W + consts.SEG_H), 10);
            }
        }
        digits = [];
        score = this.saveObj.highscore;
        while(score > 0) {
            digits.push(score % 10);
            score = Math.floor(score / 10);
        }
        for(let i=3;i>=0;i--) {
            if(i < digits.length) {
                this.renderNumber(digits[i], 80 - i * (consts.SEG_W + consts.SEG_H), 10);
            } else {
                this.renderNumber(0, 80 - i * (consts.SEG_W + consts.SEG_H), 10);
            }
        }
        
        // Border
        this.ctx.fillStyle = consts.COLORS.BLACK;
        this.ctx.fillRect(sx, sy, consts.BLOCK_SIZE * this.scale, consts.BLOCK_SIZE * (consts.GRID_HEIGHT * 3 + 2) * this.scale);
        this.ctx.fillRect(sx + consts.BLOCK_SIZE * (consts.GRID_WIDTH * 3 + 1) * this.scale, sy, consts.BLOCK_SIZE * this.scale, consts.BLOCK_SIZE * (consts.GRID_HEIGHT * 3 + 2) * this.scale);
        this.ctx.fillRect(sx, sy, consts.BLOCK_SIZE * (consts.GRID_WIDTH * 3 + 2) * this.scale, consts.BLOCK_SIZE * this.scale);
        this.ctx.fillRect(sx, sy + consts.BLOCK_SIZE * (consts.GRID_HEIGHT * 3 + 1) * this.scale, consts.BLOCK_SIZE * (consts.GRID_WIDTH * 3 + 2) * this.scale, consts.BLOCK_SIZE * this.scale);

        this.snake.render(this.scale);

        // Lines
        this.ctx.strokeStyle = consts.COLORS.GREEN;

        for(let i=0;i<=consts.GRID_WIDTH;i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(
                sx + (i * 3 + 1) * consts.BLOCK_SIZE * this.scale,
                sy + consts.BLOCK_SIZE * this.scale
            );
            this.ctx.lineTo(
                sx + (i * 3 + 1) * consts.BLOCK_SIZE * this.scale,
                sy + consts.BLOCK_SIZE * ( consts.GRID_HEIGHT * 3 + 1) * this.scale
            );
            this.ctx.stroke();
        }

        for(let i=0;i<=consts.GRID_HEIGHT;i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(
                sx + consts.BLOCK_SIZE * this.scale,
                sy + consts.BLOCK_SIZE * ( i*3 + 1) * this.scale
            );
            this.ctx.lineTo(
                sx + consts.BLOCK_SIZE * ( consts.GRID_WIDTH * 3 + 1) * this.scale,
                sy + consts.BLOCK_SIZE * ( i*3 + 1) * this.scale
            );
            this.ctx.stroke();
        }

        this.ctx.font = `${10 * this.scale}px Consolas`;
        this.ctx.fillStyle = consts.COLORS.DARK_GREEN;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        if(this.gameOver) {
            this.ctx.fillText(
                `Press Space to try again!`,
                this.canvas.width / 2,
                100 * this.scale
            );
        } else if(!this.gameOn) {
            this.ctx.fillText(
                `Press any Movement key to start game!`,
                this.canvas.width / 2,
                100 * this.scale
            );
        }
    }

    renderNumber(num, x, y) {
        const segs = consts.NUM_TO_SEGS[num];

        this.ctx.fillStyle = consts.COLORS.BLACK;
        if(segs[0] === '1') this.ctx.fillRect(x * this.scale, y * this.scale, consts.SEG_W * this.scale, consts.SEG_H * this.scale);
        if(segs[1] === '1') this.ctx.fillRect((x + consts.SEG_W - consts.SEG_H) * this.scale, y * this.scale, consts.SEG_H * this.scale, consts.SEG_W * this.scale);
        if(segs[2] === '1') this.ctx.fillRect((x + consts.SEG_W - consts.SEG_H) * this.scale, (y + consts.SEG_W - consts.SEG_H) * this.scale, consts.SEG_H * this.scale, consts.SEG_W * this.scale);
        if(segs[3] === '1') this.ctx.fillRect(x * this.scale, (y + 2*consts.SEG_W - 2*consts.SEG_H) * this.scale, consts.SEG_W * this.scale, consts.SEG_H * this.scale);
        if(segs[4] === '1') this.ctx.fillRect(x * this.scale, (y + consts.SEG_W - consts.SEG_H) * this.scale, consts.SEG_H * this.scale, consts.SEG_W * this.scale);
        if(segs[5] === '1') this.ctx.fillRect(x * this.scale, y * this.scale, consts.SEG_H * this.scale, consts.SEG_W * this.scale);
        if(segs[6] === '1') this.ctx.fillRect(x * this.scale, (y + consts.SEG_W - consts.SEG_H) * this.scale, consts.SEG_W * this.scale, consts.SEG_H * this.scale);
    }

    update(dt) {
        this.scale = this.canvas.width / 400;
        
        this.snake.update(dt, () => {
            if(this.snake.score > (this.saveObj.highscore || 0)) {
                this.saveObj.highscore = this.snake.score;

                localStorage.setItem('snakegame', JSON.stringify(this.saveObj));
            }

            this.gameOver = true;
            this.gameOn = false;

        }, this.gameOn);

        if(this.gameOver) {
            if(
                (this.pressedKeys[' '] && !this.prevPressedKeys[' '])
            ) {
                this.snake = new Snake(this.canvas, this.ctx, this.sprites, this.pressedKeys, 19, 12);
                this.gameOver = false;
            }
        }
        else if(!this.gameOn) {
            if(
                (this.pressedKeys['a'] && !this.prevPressedKeys['a']) ||
                (this.pressedKeys['ArrowLeft'] && !this.prevPressedKeys['ArrowLeft'])
            ) {
                this.gameOn = true;
                this.snake.randomFood();
            }
            else if(
                (this.pressedKeys['d'] && !this.prevPressedKeys['d']) ||
                (this.pressedKeys['ArrowRight'] && !this.prevPressedKeys['ArrowRight'])
            ) {
                this.snake.snake = this.snake.snake.reverse();
                console.log(this.snake)
                this.snake.direction = 'right';
                this.snake.nextDirection = 'right';

                this.gameOn = true;
                this.snake.randomFood();
            }
            else if(
                (this.pressedKeys['w'] && !this.prevPressedKeys['w']) ||
                (this.pressedKeys['ArrowUp'] && !this.prevPressedKeys['ArrowUp'])
            ) {
                this.snake.direction = 'up';
                this.snake.nextDirection = 'up';

                this.gameOn = true;
                this.snake.randomFood();
            }
            else if(
                (this.pressedKeys['s'] && !this.prevPressedKeys['s']) ||
                (this.pressedKeys['ArrowDown'] && !this.prevPressedKeys['ArrowDown'])
            ) {
                this.snake.direction = 'down';
                this.snake.nextDirection = 'down';

                this.gameOn = true;
                this.snake.randomFood();
            }
        }

        this.prevPressedKeys = { ...this.pressedKeys };
    }
}