import * as consts from './constants.js';
import NeuralNetwork from '../../../js/NeuralNetwork/Network.js';
import Crossover from '../../../js/GeneticAlgorithm/Crossover.js';
import Mutation from '../../../js/GeneticAlgorithm/Mutation.js';

export default class Bird {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLImageElement} sprite
     */
    constructor(canvas, ctx, sprites, pressedKeys, x, y, control = 'player') {
        this.canvas = canvas;
        this.ctx = ctx;

        this.sprites = sprites;

        this.x = x;
        this.y = y;
        this.initY = y;

        this.vx = 0;
        this.vy = 0;

        this.angle = 0;

        this.alive = true;

        this.pressedKeys = pressedKeys;
        this.prevPressedKeys = pressedKeys;
        this.control = control;

        this.fitness = 0;
        this.prevFitness = 0;
        this.score = 0;
        this.jumpAddition = 0;

        this.age = 0;

        this.offTimer = 0;
    }

    setNeuralNet(nn) {
        this.brain = new NeuralNetwork(nn);

        this.nn = nn;
    }

    restart(x, y) {
        this.x = x;
        this.y = y;

        this.vx = 0;
        this.vy = 0;

        this.angle = 0;

        this.alive = true;

        this.fitness = 0;
        this.score = 0;
        this.jumpAddition = 0;
    }

    render(scale, gameOn) {
        const frameWidth = this.sprites.bird.width / 4;
        const frameHeight = this.sprites.bird.height;

        const width = frameWidth * scale;
        const height = frameHeight * scale;

        if(!gameOn) {
            if(Math.cos(this.offTimer * 4) <= 0) {
                this.ctx.drawImage(
                    this.sprites.bird,
                    0, 0, frameWidth, frameHeight,
                    this.x * scale - width / 2, this.y * scale - height / 2,
                    width, height
                );
            } else {
                this.ctx.drawImage(
                    this.sprites.bird,
                    frameWidth, 0, frameWidth, frameHeight,
                    this.x * scale - width / 2, this.y * scale - height / 2,
                    width, height
                );
            }
        } else {
            if(this.alive) {
                this.ctx.save();
                this.ctx.translate(this.x * scale, this.y * scale);
                this.ctx.scale(this.vx < 0 ? -1 : 1, 1);
                this.ctx.translate(-this.x * scale, -this.y * scale);

                let index = this.vy < -consts.JUMP_SPEED * 0.5 ? 2 : 0;

                this.ctx.drawImage(
                    this.sprites.bird,
                    index * frameWidth, 0, frameWidth, frameHeight,
                    this.x * scale - width / 2, this.y * scale - height / 2,
                    width, height
                );
            } else {
                this.ctx.save();
                this.ctx.translate(this.x * scale, this.y * scale);
                this.ctx.scale(this.vx < 0 ? -1 : 1, 1);
                this.ctx.translate(-this.x * scale, -this.y * scale);

                this.ctx.drawImage(
                    this.sprites.bird,
                    3 * frameWidth, 0, frameWidth, frameHeight,
                    this.x * scale - width / 2, this.y * scale - height / 2,
                    width, height
                );
            }
            this.ctx.restore();
        }
    }

    update(dt, gameOn) {
        const frameWidth = this.sprites.bird.width / 4;
        const frameHeight = this.sprites.bird.height;

        if(this.control === 'player') {
            if(this.alive && gameOn && ( 
                (this.pressedKeys[' '] && !this.prevPressedKeys[' ']) || 
                (this.pressedKeys['Mouse'] && !this.prevPressedKeys['Mouse']) || 
                (this.pressedKeys['Touch'] && !this.prevPressedKeys['Touch']) 
                ) 
            ) {
                this.jump();
            }
            if(this.alive && !gameOn) {
                this.offTimer += dt;

                this.y = this.initY + Math.sin(this.offTimer * 4) * 40;
            }
        }

        if(!gameOn) return;
        
        if(this.alive) {
            if(
                this.y >= this.sprites.border.height - consts.GND_DOWN - frameHeight / 2 ||
                this.y <= consts.GND_UP + frameHeight / 2
            ) {
                this.alive = false;
            }
        }

        if(this.y < this.sprites.border.height - consts.GND_DOWN) {
            this.vy += consts.GRAVITY * dt;
            this.x += this.vx * dt;
        }

        this.y += this.vy * dt;

        if(this.y < consts.GND_UP + frameHeight / 3) {
            this.y = consts.GND_UP + frameHeight / 3;
            this.vy = 0;
        }

        if(this.y >= this.sprites.border.height - consts.GND_DOWN) {
            this.y = this.sprites.border.height - consts.GND_DOWN;
        }

        if(this.x < consts.WALL + frameWidth / 2) {
            this.x = consts.WALL + frameWidth / 2;
            this.vx = -this.vx;
            if(this.alive) this.score++;
            if(this.score < 101) {
                this.vx += Math.sign(this.vx) * 2;
                this.jumpAddition++;
            }
        }
        if(this.x > this.sprites.border.width - consts.WALL - frameWidth / 2) {
            this.x = this.sprites.border.width - consts.WALL - frameWidth / 2;
            this.vx = -this.vx;
            if(this.alive) this.score++;
            if(this.score < 101) {
                this.vx += Math.sign(this.vx) * 2;
                this.jumpAddition++;
            }
        }

        this.prevPressedKeys = { ...this.pressedKeys };
    }

    jump() {
        this.vy = -(consts.JUMP_SPEED + this.jumpAddition);
    }

    collision(sy, spikeDirection) {
        const p1 = {
            x: (1 - spikeDirection) * this.sprites.border.width / 2 + (consts.WALL - 2) * spikeDirection,
            y: consts.GND_UP - consts.SPIKE_W * 0.9 + (sy + 1) * consts.SPIKE_GAP * 0.9 + sy * consts.SPIKE_H * 0.9
        };
        const p2 = {
            x: (1 - spikeDirection) * this.sprites.border.width / 2 + (consts.WALL - 2 + consts.SPIKE_W * 0.9) * spikeDirection,
            y: consts.GND_UP - consts.SPIKE_W * 0.9 + (sy + 1) * consts.SPIKE_GAP * 0.9 + (sy + 0.5) * consts.SPIKE_H * 0.9
        };
        const p3 = {
            x: (1 - spikeDirection) * this.sprites.border.width / 2 + (consts.WALL - 2) * spikeDirection,
            y: consts.GND_UP - consts.SPIKE_W * 0.9 + (sy + 1) * consts.SPIKE_GAP * 0.9 + (sy + 1) * consts.SPIKE_H * 0.9
        };

        let right = this.vx >= 0 ? 0 : 1;

        let rectX = this.x - this.sprites.bird.width / 8 + right * 20;
        let rectY = this.y - this.sprites.bird.height / 2 + 10;
        let rectW = this.sprites.bird.width / 4 - 20;
        let rectH = this.sprites.bird.height - 20;

        if(right) {
            if(rectX + rectW >= p2.x && rectX + rectW <= p1.x) {
                let dy1 = Math.abs(rectY - p2.y);
                let dy2 = Math.abs(rectY + rectH - p2.y);

                let dx = rectX + rectW - p2.x;
                let dy = dx * (consts.SPIKE_H / 2) / consts.SPIKE_W;

                return dy1 <= dy || dy2 <= dy || ( rectY < p2.y && rectY + rectH > p2.y);
            }
        } else {
            if(rectX <= p2.x && rectX >= p1.x) {
                let dy1 = Math.abs(rectY - p2.y);
                let dy2 = Math.abs(rectY + rectH - p2.y);

                let dx = p2.x - rectX;
                let dy = dx * (consts.SPIKE_H / 2) / consts.SPIKE_W;

                return dy1 <= dy || dy2 <= dy || ( rectY < p2.y && rectY + rectH > p2.y);
            }
        }

        return false;
    }
    /**
     * 
     * @param {Bird} bird 
     */
    mate(bird, mutationType, mutationChance, crossoverType) {
        let child = new Bird(this.canvas, this.ctx, this.sprites, this.pressedKeys, this.x, this.y, this.control);
        child.setNeuralNet(this.nn);

        for(let i=0;i<this.brain.levels.length;i++) {
            for(let j=0;j<this.brain.levels[i].weights.length; j++) {
                let crossover = new Crossover(crossoverType, this.brain.levels[i].weights[j].length);
                for(let k=0;k<this.brain.levels[i].weights[j].length; k++) {
                    child.brain.levels[i].weights[j][k] = crossover.choose(bird.brain.levels[i].weights[j][k], this.brain.levels[i].weights[j][k], k)[0];

                    child.brain.levels[i].weights[j][k] = Mutation[mutationType](child.brain.levels[i].weights[j][k], mutationChance);
                }
            }
            let crossover = new Crossover(crossoverType, this.brain.levels[i].biases.length);
            for(let j=0;j<this.brain.levels[i].biases.length;j++) {
                child.brain.levels[i].biases[j] = crossover.choose(bird.brain.levels[i].biases[j], this.brain.levels[i].biases[j], j)[0];

                child.brain.levels[i].biases[j] = Mutation[mutationType](child.brain.levels[i].biases[j], mutationChance);
            }
        }

        return child;
    }
}