import Bird from "./Bird.js";
import Pipe from "./Pipe.js";
import * as consts from './constants.js';

export default class TrainState {
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
        // this.bird = new Bird(this.canvas, this.ctx, this.sprites, this.pressedKeys, 50, (this.sprites.background.height - this.sprites.ground.height) / 2, 'ai');

        this.population = [];

        for(let i=0;i<50;i++) {
            this.population[i] = new Bird(this.canvas, this.ctx, this.sprites, this.pressedKeys, 50, (this.sprites.background.height - this.sprites.ground.height) / 2, 'ai');
        }

        this.pipes = [];
        
        for(let i=0;i<3;i++) this.pipes.push(new Pipe(this.canvas, this.ctx, this.sprites, this.sprites.background.width + (this.sprites.pipes.width / 2 + 10) / 2 + i * consts.PIPES_GAP));

        this.ground1_x = 0;
        this.ground2_x = this.sprites.ground.width;

        this.gameOn = true;
        this.gameOver = false;
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

        let firstRendered = false;

        this.population.forEach(i => {
            if(i.alive) {
                if(firstRendered) this.ctx.globalAlpha = 0.5;

                i.render(this.scale);

                firstRendered = true;

                this.ctx.globalAlpha = 1;
            }
        });
    }

    update(dt) {
        this.scale = this.canvas.width / this.sprites.background.width;

        let alives = this.population.reduce((a, b) => a + b.alive ? 1 : 0, 0);

        this.population.forEach(bird => {
            let inputs = [];
            for(let i=0;i<this.pipes.length;i++) {
                if(bird.x < this.pipes[i].x + consts.GAP / 2) {
                    inputs.push((this.pipes[i].x + consts.GAP / 2 - bird.x));
                    inputs.push(this.pipes[i].y - bird.y);
                    inputs.push(this.pipes[i+1].y - bird.y);
                    break;
                }
            }
    
            let outputs = bird.brain.feedForward(inputs);
            if(outputs[0] > 0.5) {
                if(bird.alive) bird.jump();
            }

            if(bird.alive) bird.update(dt, this.gameOn);
        });

        // this.bird.update(dt, this.gameOn);
        // this.bird.y < this.sprites.background.height - this.sprites.ground.height
        if(alives > 0) {
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
        } else {
            // New generation

            let newPopulation = [];

            this.population.sort((a, b) => b.fitness - a.fitness);

            for(let i=0;i<20;i++) {
                newPopulation.push(this.population[i]);
            }

            for(let i=0;i<30;i++) {
                let ind1, ind2;
                ind1 = Math.floor(Math.random() * 30);
                do{
                    ind2 = Math.floor(Math.random() * 30);
                }while(ind1 === ind2);
                newPopulation.push(this.population[ind1].mate(this.population[ind2]));
            }

            this.population = newPopulation;

            this.population.forEach(i => i.restart(50, (this.sprites.background.height - this.sprites.ground.height) / 2));

            this.pipes = [];
        
            for(let i=0;i<3;i++) this.pipes.push(new Pipe(this.canvas, this.ctx, this.sprites, this.sprites.background.width + (this.sprites.pipes.width / 2 + 10) / 2 + i * consts.PIPES_GAP));

            this.ground1_x = 0;
            this.ground2_x = this.sprites.ground.width;

            this.gameOn = true;
            this.gameOver = false;
        }

        this.population.forEach(bird => {
            if(bird.alive) {
                this.pipes.forEach(i => {
                    if(bird.collision(i)) {
                        bird.alive = false;
        
                        bird.vy = -consts.JUMP_SPEED * 0.7;
                    }
                });
    
                if(bird.y >= this.sprites.background.height - this.sprites.ground.height - this.sprites.bird.height / 2 || bird.y < this.sprites.bird.height / 2) {
                    bird.alive = false;
                }
            }
        });
    }
}