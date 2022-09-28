import * as consts from './constants.js';
import NeuralNetwork from '../../../js/NeuralNetwork/Network.js';
import Crossover from '../../../js/GeneticAlgorithm/Crossover.js';
import Mutation from '../../../js/GeneticAlgorithm/Mutation.js';

export default class Dino {
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

        this.vy = 0;
        
        this.state = 'idle';

        this.animFrame = 0;
        this.animTimer = 0;

        this.alive = true;

        this.pressedKeys = pressedKeys;
        this.prevPressedKeys = pressedKeys;
        this.control = control;

        this.fitness = 0;
        this.prevFitness = 0;
        this.score = 0;

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

        this.vy = 0;

        this.alive = true;

        this.fitness = 0;
        this.score = 0;
    }

    render(scale, gameOn) {
        const frameWidth = consts.DINO_SPRITE_SIZE.up_w;
        const frameHeight = consts.DINO_SPRITE_SIZE.up_h;

        const width = frameWidth * scale;
        const height = frameHeight * scale;

        if(this.state === 'idle') {
            this.ctx.drawImage(
                this.sprites.dino,
                0, 0, frameWidth, frameHeight,
                this.x * scale - width / 2, this.y * scale - height / 2, width, height
            );
        } else if(this.state === 'run') {
            if(this.y == consts.GROUND_Y - this.sprites.dino.height * 0.15) {
                this.ctx.drawImage(
                    this.sprites.dino,
                    frameWidth * (this.animFrame + 1) + 1, 0, frameWidth, frameHeight,
                    this.x * scale - width / 2, this.y * scale - height / 2, width, height
                );
            } else {
                this.ctx.drawImage(
                    this.sprites.dino,
                    0, 0, frameWidth, frameHeight,
                    this.x * scale - width / 2, this.y * scale - height / 2, width, height
                );
            }
        }
    }

    update(dt, gameOn) {
        if(this.state === 'run') {
            this.animTimer += dt;

            if(this.animTimer >= 0.1) {
                this.animFrame = (this.animFrame + 1) % 2;
                this.animTimer = 0;
            }
        }

        this.vy += consts.GRAVITY * dt;
        this.y += this.vy * dt;

        if(this.y >= consts.GROUND_Y - this.sprites.dino.height * 0.15) {
            this.y = consts.GROUND_Y - this.sprites.dino.height * 0.15;
        }

        if(this.y == consts.GROUND_Y - this.sprites.dino.height * 0.15) {
            if(this.pressedKeys[' '] || this.pressedKeys['ArrowUp'] || this.pressedKeys['Mouse'] || this.pressedKeys['Touch']) {
                this.jump();
            }
        }

        this.prevPressedKeys = { ...this.pressedKeys };
    }

    jump() {
        this.vy = -consts.JUMP_SPEED;
    }

    /**
     * 
     * @param {Dino} dino 
     */
    mate(dino, mutationType, mutationChance, crossoverType) {
        let child = new Dino(this.canvas, this.ctx, this.sprites, this.pressedKeys, this.x, this.y, this.control);
        child.setNeuralNet(this.nn);

        for(let i=0;i<this.brain.levels.length;i++) {
            for(let j=0;j<this.brain.levels[i].weights.length; j++) {
                let crossover = new Crossover(crossoverType, this.brain.levels[i].weights[j].length);
                for(let k=0;k<this.brain.levels[i].weights[j].length; k++) {
                    child.brain.levels[i].weights[j][k] = crossover.choose(dino.brain.levels[i].weights[j][k], this.brain.levels[i].weights[j][k], k)[0];

                    child.brain.levels[i].weights[j][k] = Mutation[mutationType](child.brain.levels[i].weights[j][k], mutationChance);
                }
            }
            let crossover = new Crossover(crossoverType, this.brain.levels[i].biases.length);
            for(let j=0;j<this.brain.levels[i].biases.length;j++) {
                child.brain.levels[i].biases[j] = crossover.choose(dino.brain.levels[i].biases[j], this.brain.levels[i].biases[j], j)[0];

                child.brain.levels[i].biases[j] = Mutation[mutationType](child.brain.levels[i].biases[j], mutationChance);
            }
        }

        return child;
    }
}