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

        this.vx = 0;
        this.vy = 0;

        this.angle = 0;

        this.frame = 0;
        this.frameCounter = 0;

        this.alive = true;

        this.pressedKeys = pressedKeys;
        this.prevPressedKeys = pressedKeys;
        this.control = control;

        this.fitness = 0;
        this.score = 0;

        if(this.control === 'ai') {
            this.age = 0;
        }
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

        this.frame = 0;
        this.frameCounter = 0;

        this.alive = true;

        this.fitness = 0;
        this.score = 0;
    }

    render(scale) {
        const frameWidth = this.sprites.bird.width / 4;
        const frameHeight = this.sprites.bird.height;

        const width = frameWidth * scale;
        const height = frameHeight * scale;

        this.ctx.save();

        this.ctx.translate(this.x * scale, this.y * scale);
        this.ctx.rotate(this.angle);
        this.ctx.translate(-this.x * scale, -this.y * scale);

        this.ctx.drawImage(
            this.sprites.bird,
            this.frame * frameWidth, 0, frameWidth - 0.5, frameHeight,
            this.x * scale - width / 2, this.y * scale - height / 2, width, height
        );

        this.ctx.restore();
    }

    update(dt, gameOn) {

        if(gameOn && this.alive) this.fitness += dt * consts.GROUND_SPEED;

        if(this.fitness >= this.sprites.background.width + (this.sprites.pipes.width / 2 + 10) / 2 - this.x) {
            this.score = Math.floor((this.fitness - this.sprites.background.width - (this.sprites.pipes.width / 2 + 10) / 2 + this.x) / consts.PIPES_GAP) + 1;
        }

        if(this.alive) {
            this.frameCounter += dt;

            if(this.frameCounter > 1 / consts.ANIMATION_SPEED) {
                this.frameCounter = 0;
                
                this.frame = (this.frame + 1) % 4;
            }
        }

        if(this.control === 'player') {
            if(this.alive && gameOn && ( 
                (this.pressedKeys[' '] && !this.prevPressedKeys[' ']) || 
                (this.pressedKeys['Mouse'] && !this.prevPressedKeys['Mouse']) || 
                (this.pressedKeys['Touch'] && !this.prevPressedKeys['Touch']) 
                ) 
            ) {
                this.jump();
            }
        }

        if(this.y < this.sprites.background.height - this.sprites.ground.height && gameOn) this.vy += consts.GRAVITY * dt;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // if(this.y >= this.sprites.background.height - this.sprites.ground.height - this.sprites.bird.height / 2) 
        //     this.alive = false;

        if(this.y >= this.sprites.background.height - this.sprites.ground.height) {
            this.y = this.sprites.background.height - this.sprites.ground.height;
        }

        this.angle = Math.atan(this.vy * 0.2 / consts.GROUND_SPEED);

        this.prevPressedKeys = { ...this.pressedKeys };
    }

    jump() {
        this.vy = -consts.JUMP_SPEED;
    }

    collision(pipe) {
        let cx = this.x;
        let cy = this.y;
        let r = this.sprites.bird.height / 2;

        let rx = pipe.x - this.sprites.pipes.width / 4;
        let ry = pipe.y - consts.GAP / 2 - this.sprites.pipes.height;
        let rw = this.sprites.pipes.width / 2;
        let rh = this.sprites.pipes.height;

        let testX = cx;
        let testY = cy;

        if(cx < rx) testX = rx;
        else if(cx > rx + rw) testX = rx + rw;

        if(cy < ry) testY = ry;
        else if(cy > ry + rh) testY = ry + rh;

        let dx = cx - testX;
        let dy = cy - testY;
        let d = Math.sqrt(dx * dx + dy * dy);

        if(d <= r) return true;

        ry = pipe.y + consts.GAP / 2;

        testY = cy;

        if(cy < ry) testY = ry;
        else if(cy > ry + rh) testY = ry + rh;

        dy = cy - testY;

        d = Math.sqrt(dx * dx + dy * dy);

        if(d <= r) return true;

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
                    // let chance = Math.random() * 100;
                    // if(chance <= 50) {
                    //     child.brain.levels[i].weights[j][k] = bird.brain.levels[i].weights[j][k];
                    // } else {
                    //     child.brain.levels[i].weights[j][k] = this.brain.levels[i].weights[j][k]
                    // }
                    // if(Math.random() * 100 < 5) {
                    //     child.brain.levels[i].weights[j][k] += Math.random() * 2 - 1;
                    // }
                    child.brain.levels[i].weights[j][k] = crossover.choose(bird.brain.levels[i].weights[j][k], this.brain.levels[i].weights[j][k], k)[0];

                    child.brain.levels[i].weights[j][k] = Mutation[mutationType](child.brain.levels[i].weights[j][k], mutationChance);
                }
            }
            let crossover = new Crossover(crossoverType, this.brain.levels[i].biases.length);
            for(let j=0;j<this.brain.levels[i].biases.length;j++) {
                // let chance = Math.random() * 100;
                // if(chance <= 50) {
                //     child.brain.levels[i].biases[j] = bird.brain.levels[i].biases[j];
                // } else {
                //     child.brain.levels[i].biases[j] = this.brain.levels[i].biases[j];
                // }
                // if(Math.random() * 100 < 5) {
                //     child.brain.levels[i].biases[j] += Math.random() * 2 - 1;
                // }
                child.brain.levels[i].biases[j] = crossover.choose(bird.brain.levels[i].biases[j], this.brain.levels[i].biases[j], j)[0];

                child.brain.levels[i].biases[j] = Mutation[mutationType](child.brain.levels[i].biases[j], mutationChance);
            }
        }

        return child;
    }
}