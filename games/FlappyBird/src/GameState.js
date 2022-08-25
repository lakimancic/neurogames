import Bird from "./Bird.js";
import Pipe from "./Pipe.js";
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

        this.scale = this.canvas.width / this.sprites.background.width;

        this.saveObj = JSON.parse(localStorage.getItem('flappybird')) || {};
    }

    init() {
        this.bird = new Bird(this.canvas, this.ctx, this.sprites, this.pressedKeys, 50, (this.sprites.background.height - this.sprites.ground.height) / 2);

        this.pipes = [];
        
        for(let i=0;i<3;i++) this.pipes.push(new Pipe(this.canvas, this.ctx, this.sprites, this.sprites.background.width + (this.sprites.pipes.width / 2 + 10) / 2 + i * consts.PIPES_GAP));

        this.ground1_x = 0;
        this.ground2_x = this.sprites.ground.width;

        this.gameOn = false;
        this.gameOver = false;

        this.flash = 999;
    }

    render() {
        this.ctx.globalAlpha = 1;

        this.ctx.drawImage(this.sprites.background,
            0, 0, this.sprites.background.width, this.sprites.background.height,
            0, 0, this.canvas.width, this.canvas.height
        );

        this.pipes.forEach(i => i.render(this.scale));

        this.ctx.drawImage(
            this.sprites.ground,
            0, 0, this.sprites.ground.width, this.sprites.ground.height,
            this.ground1_x * this.scale, this.canvas.height - this.sprites.ground.height * this.scale, this.sprites.ground.width * this.scale, this.sprites.ground.height * this.scale
        );

        this.ctx.drawImage(
            this.sprites.ground,
            0, 0, this.sprites.ground.width, this.sprites.ground.height,
            this.ground2_x * this.scale, this.canvas.height - this.sprites.ground.height * this.scale, this.sprites.ground.width * this.scale, this.sprites.ground.height * this.scale
        );

        this.bird.render(this.scale);

        // Score

        if(!this.gameOver) {
            let digits = [];
            let score = this.bird.score;
            
            if(score === 0) digits.push(0);
            while(score > 0) {
                digits.unshift(score % 10);
                score = Math.floor(score / 10);
            }

            let frameWidth = this.sprites.bignums.width / 10;
            let width = digits.length * frameWidth + (digits.length - 1) * consts.BIGNUM_GAP;

            digits.forEach((i, ind) => {
                this.ctx.drawImage(
                    this.sprites.bignums,
                    frameWidth * i, 0, frameWidth - 0.5, this.sprites.bignums.height,
                    (this.sprites.background.width / 2 - width / 2 + (frameWidth + consts.BIGNUM_GAP) * ind) * this.scale, 15 * this.scale, frameWidth * this.scale, this.sprites.bignums.height * this.scale
                );
            });
        }

        // White flash on bird death

        if(this.flash < consts.FLASH_DUR) {
            let color = 1 - Math.abs( this.flash - consts.FLASH_DUR / 2 ) * 2 / consts.FLASH_DUR;

            this.ctx.fillStyle = `rgb(255, 255, 255)`;
            this.ctx.globalAlpha = color;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Render get ready

        if(!this.gameOn) {
            this.ctx.drawImage(
                this.sprites.tap,
                0, 0, this.sprites.tap.width, this.sprites.tap.height,
                (this.sprites.background.width - this.sprites.tap.width) * this.scale / 2, (this.sprites.background.height - this.sprites.tap.height) * this.scale / 2, this.sprites.tap.width * this.scale, this.sprites.tap.height * this.scale
            );

            this.ctx.drawImage(
                this.sprites.getready,
                0, 0, this.sprites.getready.width, this.sprites.getready.height,
                (this.sprites.background.width - this.sprites.getready.width) * this.scale / 2, (this.sprites.background.height - this.sprites.getready.height) * this.scale / 2 - 60 * this.scale, this.sprites.getready.width * this.scale, this.sprites.getready.height * this.scale
            );
        }

        // Render game over 
        if(this.gameOver && this.bird.y >= this.sprites.background.height - this.sprites.ground.height) {
            this.ctx.drawImage(
                this.sprites.gameover,
                0, 0, this.sprites.gameover.width, this.sprites.gameover.height,
                (this.sprites.background.width - this.sprites.gameover.width) * this.scale / 2, (this.sprites.background.height - this.sprites.gameover.height) * this.scale / 2 - 60 * this.scale, this.sprites.gameover.width * this.scale, this.sprites.gameover.height * this.scale
            );

            this.ctx.drawImage(
                this.sprites.panel,
                0, 0, this.sprites.panel.width, this.sprites.panel.height,
                (this.sprites.background.width - this.sprites.panel.width) * this.scale / 2, (this.sprites.background.height - this.sprites.panel.height) * this.scale / 2, this.sprites.panel.width * this.scale, this.sprites.panel.height * this.scale
            );

            if(this.bird.score >= 10) {
                let medal = Math.floor(Math.min(this.bird.score - 10, 30) / 10);
                let medalWidth = this.sprites.medals.width / 4;

                // 15, 22
                this.ctx.drawImage(
                    this.sprites.medals,
                    medal * medalWidth, 0, medalWidth, this.sprites.medals.height,
                    (this.sprites.background.width - this.sprites.panel.width) * this.scale / 2 + 13 * this.scale, (this.sprites.background.height - this.sprites.panel.height) * this.scale / 2 + 21 * this.scale, medalWidth * this.scale, this.sprites.medals.height * this.scale
                );
            }

            let scoreDigits = [];
            let score = this.bird.score;
            if(score === 0) scoreDigits.push(0);
            while(score > 0) {
                scoreDigits.unshift(score % 10);
                score = Math.floor(score / 10);
            }

            let frameWidth = this.sprites.smallnums.width / 10;
            let width = scoreDigits.length * frameWidth + (scoreDigits.length - 1);

            scoreDigits.forEach((i, ind) => {
                this.ctx.drawImage(
                    this.sprites.smallnums,
                    i * frameWidth, 0, frameWidth - 0.5, this.sprites.smallnums.height,
                    (this.sprites.background.width + this.sprites.panel.width - 21) * this.scale / 2 - width * this.scale + ind * frameWidth * this.scale, (this.sprites.background.height - this.sprites.panel.height) * this.scale / 2 + 17 * this.scale,
                    frameWidth * this.scale, this.sprites.smallnums.height * this.scale
                );
            });

            scoreDigits = [];
            score = this.saveObj.highscore || 0;
            if(score === 0) scoreDigits.push(0);
            while(score > 0) {
                scoreDigits.unshift(score % 10);
                score = Math.floor(score / 10);
            }

            width = scoreDigits.length * frameWidth + (scoreDigits.length - 1);

            scoreDigits.forEach((i, ind) => {
                this.ctx.drawImage(
                    this.sprites.smallnums,
                    i * frameWidth, 0, frameWidth - 0.5, this.sprites.smallnums.height,
                    (this.sprites.background.width + this.sprites.panel.width - 21) * this.scale / 2 - width * this.scale + ind * frameWidth * this.scale, (this.sprites.background.height - this.sprites.panel.height) * this.scale / 2 + 38 * this.scale,
                    frameWidth * this.scale, this.sprites.smallnums.height * this.scale
                );
            });
        }
    }

    update(dt) {
        this.scale = this.canvas.width / this.sprites.background.width;

        if(this.flash < consts.FLASH_DUR) {
            this.flash += dt * 1000;
        }

        if(( 
            (this.pressedKeys[' '] && !this.prevPressedKeys[' ']) || 
            (this.pressedKeys['Mouse'] && !this.prevPressedKeys['Mouse']) || 
            (this.pressedKeys['Touch'] && !this.prevPressedKeys['Touch']) 
        )) {
            if(!this.gameOn) this.gameOn = true;

            if(this.gameOver && this.bird.y >= this.sprites.background.height - this.sprites.ground.height)
                this.init();
        }

        this.bird.update(dt, this.gameOn);
        // this.bird.y < this.sprites.background.height - this.sprites.ground.height
        if(this.bird.alive) {
            this.ground1_x -= dt * consts.GROUND_SPEED;
            this.ground2_x -= dt * consts.GROUND_SPEED;

            if(this.ground1_x < -this.sprites.ground.width) this.ground1_x = this.ground2_x + this.sprites.ground.width;
            if(this.ground2_x < -this.sprites.ground.width) this.ground2_x = this.ground1_x + this.sprites.ground.width;

            if(this.gameOn) {
                this.pipes.forEach(i => i.update(dt));

                if(this.pipes[0].x < -this.sprites.pipes.width / 4) {
                    this.pipes.shift();

                    this.pipes.push(new Pipe(this.canvas, this.ctx, this.sprites, this.pipes[this.pipes.length - 1].x + consts.PIPES_GAP));
                }
            }
        }

        if(this.bird.alive) {
            this.pipes.forEach(i => {
                if(this.bird.collision(i)) {
                    this.bird.alive = false;
    
                    this.bird.vy = -consts.JUMP_SPEED * 0.7;

                    this.flash = 0;

                    this.gameOver = true;

                    if(this.bird.score > (this.saveObj.highscore || 0)) {
                        this.saveObj.highscore = this.bird.score;

                        localStorage.setItem('flappybird', JSON.stringify(this.saveObj));
                    }
                }
            });

            if(this.bird.y >= this.sprites.background.height - this.sprites.ground.height - this.sprites.bird.height / 2) {
                this.bird.alive = false;

                this.flash = 0;

                this.gameOver = true;

                if(this.bird.score > (this.saveObj.highscore || 0)) {
                    this.saveObj.highscore = this.bird.score;

                    localStorage.setItem('flappybird', JSON.stringify(this.saveObj));
                }
            }
        }

        this.prevPressedKeys = { ...this.pressedKeys };
    }
}