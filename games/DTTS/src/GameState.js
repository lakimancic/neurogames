import Bird from "./Bird.js";
import * as consts from './constants.js';

const shuffle = (array) => {
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {

        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
};

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

        this.scale = this.canvas.width / this.sprites.border.width;

        this.saveObj = JSON.parse(localStorage.getItem('dtts')) || {};
    }

    init() {
        this.spikes = [];
        this.bird = new Bird(this.canvas, this.ctx, this.sprites, this.pressedKeys, this.sprites.border.width / 2, this.sprites.border.height * 0.45, 'player');

        this.gameOn = false;
        this.gameOver = false;

        this.colorState = 0;
        this.colorTimer = 0.7;
        this.colorBg = '';
        this.colorBorder = '';
        this.prevColorBg = consts.COLORS[this.colorState].bg;
        this.prevColorBorder = consts.COLORS[this.colorState].border;

        this.spikeTimer = 0;
    }

    render() {
        this.ctx.globalAlpha = 1;

        this.canvas.style.backgroundColor = this.colorBg;

        this.ctx.drawImage(
            this.sprites.border,
            0, 0, this.sprites.border.width, this.sprites.border.height,
            0, 0, this.canvas.width, this.canvas.height
        );
        this.ctx.globalCompositeOperation = "source-in";
        this.ctx.fillStyle = this.colorBorder;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.globalCompositeOperation = "source-over";
            
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(
            this.canvas.width / 2, this.canvas.height * 0.45,
            consts.CIRCLE_R * this.scale / 2, 0, 2 * Math.PI
        );
        this.ctx.fill();

        this.renderScore();

        this.ctx.globalCompositeOperation = "source-over";

        // Texts
        if(!this.gameOn && !this.gameOver) {
            this.ctx.fillStyle = this.colorBorder;
            this.ctx.font = `500 ${this.scale * 85}px DTTS_Font`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                "DON\'T TOUCH",
                this.canvas.width / 2,
                150 * this.scale
            );
            this.ctx.fillText(
                "THE SPIKES",
                this.canvas.width / 2,
                230 * this.scale
            );

            this.ctx.fillStyle = consts.COLOR_PINK;
            this.ctx.font = `${this.scale * 40}px DTTS_Font`;
            this.ctx.fillText(
                "TAP",
                this.canvas.width / 2,
                this.canvas.height * 0.45 - consts.CIRCLE_R * this.scale / 2 + 60 * this.scale
            );
            this.ctx.fillText(
                "TO JUMP",
                this.canvas.width / 2,
                this.canvas.height * 0.45 - consts.CIRCLE_R * this.scale / 2 + 100 * this.scale
            );
        }

        if(!this.gameOn || this.gameOver) {
            this.ctx.fillStyle = this.colorBorder;
            this.ctx.font = `${this.scale * 50}px DTTS_Font`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `BEST SCORE : ${this.saveObj.highscore}`,
                this.canvas.width / 2,
                this.canvas.height - 260 * this.scale
            );
        }

        // Render Spikes
        this.ctx.fillStyle = this.colorBorder;
        if(this.spikes) {
            this.spikes.forEach((val, i) => {
                if(val) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(
                        (1 - this.spikeDirection) * this.canvas.width / 2 + ((consts.WALL * this.spikeTimer / consts.SPIKE_TIME - 2) * this.spikeDirection) * this.scale, 
                        (consts.GND_UP - consts.SPIKE_W * 0.9 + (i + 1) * consts.SPIKE_GAP * 0.9 + i * consts.SPIKE_H * 0.9) * this.scale
                    );
                    this.ctx.lineTo(
                        (1 - this.spikeDirection) * this.canvas.width / 2 + (((consts.WALL * this.spikeTimer / consts.SPIKE_TIME - 2) + consts.SPIKE_W * 0.9) * this.spikeDirection - 1) * this.scale, 
                        (consts.GND_UP - consts.SPIKE_W * 0.9 + (i + 1) * consts.SPIKE_GAP * 0.9 + (i + 0.5) * consts.SPIKE_H * 0.9) * this.scale
                    );
                    this.ctx.lineTo(
                        (1 - this.spikeDirection) * this.canvas.width / 2 + ((consts.WALL * this.spikeTimer / consts.SPIKE_TIME - 2) * this.spikeDirection - 1) * this.scale, 
                        (consts.GND_UP - consts.SPIKE_W * 0.9 + (i + 1) * consts.SPIKE_GAP * 0.9 + (i + 1) * consts.SPIKE_H * 0.9) * this.scale
                    );
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            });
        }

        this.bird.render(this.scale, this.gameOn);

        // GameOver render

        if(this.gameOver) {
            this.ctx.fillStyle = consts.COLOR_PINK;

            this.ctx.beginPath();
            this.ctx.moveTo(
                this.canvas.width / 2 - ( consts.GM_BOX_W / 2 - consts.GM_BOX_R ) * this.scale,
                this.canvas.height * 0.45 - ( consts.GM_BOX_H / 2 ) * this.scale
            );
            this.ctx.lineTo(
                this.canvas.width / 2 + ( consts.GM_BOX_W / 2 - consts.GM_BOX_R ) * this.scale,
                this.canvas.height * 0.45 - ( consts.GM_BOX_H / 2 ) * this.scale
            );
            this.ctx.arcTo(
                this.canvas.width / 2 + ( consts.GM_BOX_W / 2 ) * this.scale,
                this.canvas.height * 0.45 - ( consts.GM_BOX_H / 2 ) * this.scale,
                this.canvas.width / 2 + ( consts.GM_BOX_W / 2  ) * this.scale,
                this.canvas.height * 0.45 - ( consts.GM_BOX_H / 2 - consts.GM_BOX_R ) * this.scale,
                consts.GM_BOX_R * this.scale
            );
            this.ctx.lineTo(
                this.canvas.width / 2 + ( consts.GM_BOX_W / 2  ) * this.scale,
                this.canvas.height * 0.45 + ( consts.GM_BOX_H / 2 - consts.GM_BOX_R ) * this.scale
            );
            this.ctx.arcTo(
                this.canvas.width / 2 + ( consts.GM_BOX_W / 2  ) * this.scale,
                this.canvas.height * 0.45 + ( consts.GM_BOX_H / 2 ) * this.scale,
                this.canvas.width / 2 + ( consts.GM_BOX_W / 2 - consts.GM_BOX_R ) * this.scale,
                this.canvas.height * 0.45 + ( consts.GM_BOX_H / 2 ) * this.scale,
                consts.GM_BOX_R * this.scale
            );
            this.ctx.lineTo(
                this.canvas.width / 2 - ( consts.GM_BOX_W / 2 - consts.GM_BOX_R ) * this.scale,
                this.canvas.height * 0.45 + ( consts.GM_BOX_H / 2 ) * this.scale,
            );
            this.ctx.arcTo(
                this.canvas.width / 2 - ( consts.GM_BOX_W / 2  ) * this.scale,
                this.canvas.height * 0.45 + ( consts.GM_BOX_H / 2 ) * this.scale,
                this.canvas.width / 2 - ( consts.GM_BOX_W / 2 ) * this.scale,
                this.canvas.height * 0.45 + ( consts.GM_BOX_H / 2 - consts.GM_BOX_R ) * this.scale,
                consts.GM_BOX_R * this.scale
            );
            this.ctx.lineTo(
                this.canvas.width / 2 - ( consts.GM_BOX_W / 2 ) * this.scale,
                this.canvas.height * 0.45 - ( consts.GM_BOX_H / 2 - consts.GM_BOX_R ) * this.scale,
            );
            this.ctx.arcTo(
                this.canvas.width / 2 - ( consts.GM_BOX_W / 2 ) * this.scale,
                this.canvas.height * 0.45 - ( consts.GM_BOX_H / 2 ) * this.scale,
                this.canvas.width / 2 - ( consts.GM_BOX_W / 2 - consts.GM_BOX_R ) * this.scale,
                this.canvas.height * 0.45 - ( consts.GM_BOX_H / 2 ) * this.scale,
                consts.GM_BOX_R * this.scale
            );
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.fillStyle = 'white';
            this.ctx.font = `${this.scale * 80}px DTTS_Font`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `${this.bird.score}`,
                this.canvas.width / 2,
                this.canvas.height * 0.45 - 5 * this.scale
            );

            this.ctx.font = `${this.scale * 40}px DTTS_Font`;
            this.ctx.fillText(
                `POINTS`,
                this.canvas.width / 2,
                this.canvas.height * 0.45 + 50 * this.scale
            );
        }
    }

    update(dt) {
        this.scale = this.canvas.width / this.sprites.border.width;

        let prevScore = this.bird.score;
        this.bird.update(dt, this.gameOn);

        if(this.spikes) {
            this.spikes.forEach((val, i) => {
                if(val && this.bird.collision(i, this.spikeDirection)) {
                    if(this.bird.alive) {
                        this.bird.alive = false;
                        if(this.vy < 0) this.bird.vy = 0;
                        this.bird.score--;
                    }
                }
            })
        }

        if(this.bird.score !== prevScore) {
            this.generateSpikes(this.getNumberOfSpieks(this.bird.score), this.bird.vx > 0);
        }

        if(Math.min(20, Math.floor(this.bird.score / 5)) !== this.colorState) {
            this.colorTimer = 0;

            this.prevColorBg = consts.COLORS[this.colorState].bg;
            this.prevColorBorder = consts.COLORS[this.colorState].border;
        }
        this.colorState = Math.min(20, Math.floor(this.bird.score / 5));

        if(this.colorTimer < 1) {
            this.colorBg = this.colorTransition(this.prevColorBg, consts.COLORS[this.colorState].bg, this.colorTimer);
            this.colorBorder = this.colorTransition(this.prevColorBorder, consts.COLORS[this.colorState].border, this.colorTimer);

            this.colorTimer += dt;
        }
        else {
            this.colorBg = consts.COLORS[this.colorState].bg;
            this.colorBorder = consts.COLORS[this.colorState].border;
        }

        if(this.spikeTimer < consts.SPIKE_TIME) {
            this.spikeTimer += dt;

            if(this.spikeTimer > consts.SPIKE_TIME) this.spikeTimer = consts.SPIKE_TIME;
        }

        if(!this.gameOn && ( 
            (this.pressedKeys[' '] && !this.prevPressedKeys[' ']) || 
            (this.pressedKeys['Mouse'] && !this.prevPressedKeys['Mouse']) || 
            (this.pressedKeys['Touch'] && !this.prevPressedKeys['Touch']) 
        )) {
            this.gameOn = true;

            this.bird.vx = consts.SPEED_X;
            this.bird.jump();

            this.generateSpikes(this.getNumberOfSpieks(this.bird.score), this.bird.vx > 0);
        }

        if(!this.gameOver && !this.bird.alive && this.bird.y >= this.sprites.border.height - consts.GND_DOWN) {
            this.gameOver = true;

            if(this.bird.score > (this.saveObj.highscore || 0)) {
                this.saveObj.highscore = this.bird.score;

                localStorage.setItem('dtts', JSON.stringify(this.saveObj));
            }
        }

        if(this.gameOver && ( 
            (this.pressedKeys[' '] && !this.prevPressedKeys[' ']) || 
            (this.pressedKeys['Mouse'] && !this.prevPressedKeys['Mouse']) || 
            (this.pressedKeys['Touch'] && !this.prevPressedKeys['Touch']) 
        )) {
            this.init();
        }

        this.prevPressedKeys = {...this.pressedKeys};
    }

    renderScore() {
        let score = this.bird.score;
        let digits = [];

        while(score > 0) {
            digits.unshift(score % 10);
            score = Math.floor(score / 10);
        }

        while(digits.length < 2) digits.unshift(0);
        
        let k = Math.sqrt(consts.CIRCLE_R * consts.CIRCLE_R / (25 + Math.pow(4 * digits.length, 2)));
        let a = 5 * k, b = 4 * k;

        this.ctx.globalCompositeOperation = "xor";
        digits.forEach((num, i) => {
            this.ctx.drawImage(
                this.sprites.numbers,
                this.sprites.numbers.width * num / 10, 0,
                this.sprites.numbers.width / 10 - 4, this.sprites.numbers.height,
                (this.sprites.border.width / 2 - b * digits.length / 2 + (i + 0.05) * b) * this.scale, 
                (this.sprites.border.height * 0.45 - a / 2 + a * 0.05) * this.scale,
                b * this.scale * 0.9, a * this.scale * 0.9
            );
        });
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

    getNumberOfSpieks(score) {
        if(score < 1) return 0;
        else if(score < 2) return 2;
        else if(score < 5) return 3;
        else if(score < 10) return 4;
        else if(score < 15) return 4 + Math.round(Math.random());
        else if(score < 20) return 5;
        else if(score < 25) return 5 + Math.round(Math.random());
        else if(score < 30) return 6;
        else if(score < 35) return 6 + Math.round(Math.random());
        else return 7;
    }

    generateSpikes(num, right) {
        this.spikes = [];
        this.spikeDirection = right ? -1 : 1;

        for(let i=0;i<num;i++) this.spikes.push(true);
        while(this.spikes.length < 12) this.spikes.push(false);
    
        shuffle(this.spikes);

        this.spikeTimer = 0;
    }
};