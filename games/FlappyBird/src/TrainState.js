import Bird from "./Bird.js";
import Pipe from "./Pipe.js";
import * as consts from './constants.js';
import ParentSelection from '../../../js/GeneticAlgorithm/ParentSelection.js';
import SurvivorSelection from '../../../js/GeneticAlgorithm/SurvivorSelection.js';

export default class TrainState {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} sprites
     * @param {HTMLCanvasElement} gaCanvas
     * @param {CanvasRenderingContext2D} gaCtx
     */
     constructor(canvas, ctx, sprites, pressedKeys, nnCanvas, nnCtx, gaCanvas, gaCtx) {
        this.canvas = canvas;
        this.ctx = ctx;

        this.nnCanvas = nnCanvas;
        this.nnCtx = nnCtx;

        this.gaCanvas = gaCanvas;
        this.gaCtx = gaCtx;

        this.sprites = sprites;

        this.pressedKeys = pressedKeys;
        this.prevPressedKeys = pressedKeys;

        this.init();

        this.scale = this.canvas.width / this.sprites.background.width;

        this.saveObj = JSON.parse(localStorage.getItem('flappybird')) || {};

        this.neuralNet = [
            { size: 2 },
            { size: 5, activation: 'sigmoid' },
            { size: 1, activation: 'relu' }
        ];

        // this.evolution = {
        //     population: 0,
        //     parentSel: 'roulette',
        //     crossover: 'onep',
        //     mutation: 'reset',
        //     mutationChance: 1,
        //     survivorSel: 'fitness',
        //     survivorPer: 40
        // };

        this.evolution = {
            population: 50,
            parentSel: 'roulette',
            crossover: 'onep',
            mutation: 'add',
            mutationChance: 2,
            survivorSel: 'fitness',
            survivorPer: 40
        };

        this.generation = 1;
        this.population = [];

        this.data = [];
        this.dataShown = ['best', 'worst', 'mean', 'median'];

        this.paused = false;

        this.highscore = 0;

        this.resetNeuroEvolution();
    }

    resetNeuroEvolution() {
        this.init();

        this.generation = 1;

        this.population = [];

        for(let i=0;i<this.evolution.population;i++) {
            this.population[i] = new Bird(this.canvas, this.ctx, this.sprites, this.pressedKeys, 50, (this.sprites.background.height - this.sprites.ground.height) / 2, 'ai');
            this.population[i].setNeuralNet(this.neuralNet);
        }

        this.survivorSelectionMethod = SurvivorSelection[this.evolution.survivorSel];
        this.parentSelectionMethod = ParentSelection[this.evolution.parentSel];
    }

    init() {
        // this.bird = new Bird(this.canvas, this.ctx, this.sprites, this.pressedKeys, 50, (this.sprites.background.height - this.sprites.ground.height) / 2, 'ai');

        // this.population = [];

        // for(let i=0;i<50;i++) {
        //     this.population[i] = new Bird(this.canvas, this.ctx, this.sprites, this.pressedKeys, 50, (this.sprites.background.height - this.sprites.ground.height) / 2, 'ai');
        // }

        this.pipes = [];
        
        for(let i=0;i<3;i++) this.pipes.push(new Pipe(this.canvas, this.ctx, this.sprites, this.sprites.background.width + (this.sprites.pipes.width / 2 + 10) / 2 + i * consts.PIPES_GAP));

        this.ground1_x = 0;
        this.ground2_x = this.sprites.ground.width;

        this.gameOn = false;
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

        this.ctx.font = `${6 * this.scale}px Roboto`;
        this.ctx.fillText(`Generation: ${this.generation}`, 10 * this.scale, (this.sprites.background.height - 35) * this.scale);
        let alives = this.population.reduce((a, b) => a + (b.alive ? 1 : 0), 0);
        this.ctx.fillText(`Alive: ${alives} / ${this.population.length}`, 10 * this.scale, (this.sprites.background.height - 27) * this.scale);
        let first = this.population.find(i => i.alive);
        this.ctx.fillText(`Score: ${first ? first.score : 0}`, 10 * this.scale, (this.sprites.background.height - 19) * this.scale);
        this.ctx.fillText(`Highscore: ${this.highscore}`, 10 * this.scale, (this.sprites.background.height - 12) * this.scale);

        if(document.querySelector('.container2 > .upper').style.display === 'flex') {
            if(first) {
                first.brain.visualizeNetwork(this.nnCanvas, this.nnCtx, this.population.findIndex(i => i.alive) + 1);
            }
        }

        if(document.querySelector('.container2 > .lower').style.display === 'flex') {
            this.visualizeChart();
        }
    }

    update(dt) {
        if(this.paused) return;

        this.scale = this.canvas.width / this.sprites.background.width;

        let alives = this.population.reduce((a, b) => a + (b.alive ? 1 : 0), 0);

        this.population.forEach(bird => {
            let inputs = [];
            for(let i=0;i<this.pipes.length;i++) {
                if(bird.x < this.pipes[i].x + consts.GAP / 2) {
                    inputs.push((this.pipes[i].x - bird.x));
                    inputs.push(this.pipes[i].y - bird.y);
                    // inputs.push((this.pipes[i+1].x + consts.GAP / 2 - bird.x));
                    // inputs.push(this.pipes[i+1].y - bird.y);
                    break;
                }
            }
    
            let outputs = bird.brain.feedForward(inputs);
            let comparator = undefined;
            if(this.neuralNet[this.neuralNet.length - 1].activation === 'relu') comparator = 0;
            else if(this.neuralNet[this.neuralNet.length - 1].activation === 'sigmoid') comparator = 0.5;
            else if(this.neuralNet[this.neuralNet.length - 1].activation === 'tanh') comparator = 0;

            if(outputs[0] > comparator) {
                if(bird.alive && this.gameOn) bird.jump();
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
        } else if(this.gameOn) {
            // New generation

            this.highscore = Math.max(...[this.highscore, ...this.population.map(i => i.score)]);

            let newPopulation = this.survivorSelectionMethod(this.population, this.evolution.survivorPer);

            for(let i=0;i<newPopulation.length;i++) {
                newPopulation[i].age++;
            }

            while(newPopulation.length < this.evolution.population) {
                let parents = this.parentSelectionMethod(this.population);

                newPopulation.push(this.population[parents[0]].mate(this.population[parents[1]], this.evolution.mutation, this.evolution.mutationChance, this.evolution.crossover));
            }

            let sum = this.population.reduce((a, b) => a + b.score, 0);
            if(this.population.length > 0) sum /= this.population.length;
            else sum = 0;

            let pomPopulation = [...this.population];
            pomPopulation.sort((a, b) => (b.score - a.score));

            let median = pomPopulation[Math.floor(this.population.length / 2)].score;
            if(this.population.length % 2 === 0) median = (median + pomPopulation[Math.floor(this.population.length / 2) + 1].score) / 2;

            this.data[this.generation - 1] = {
                best : Math.max(...[0, ...this.population.map(i => i.score)]),
                worst: Math.min(...[0, ...this.population.map(i => i.score)]),
                mean: sum,
                median: median
            };

            console.log(this.data);

            this.generation++;

            this.population = newPopulation;

            this.population.forEach(i => i.restart(50, (this.sprites.background.height - this.sprites.ground.height) / 2));

            this.init();

            this.gameOn = true;

            // let newPopulation = [];

            // this.population.sort((a, b) => b.fitness - a.fitness);

            // for(let i=0;i<20;i++) {
            //     newPopulation.push(this.population[i]);
            // }

            // for(let i=0;i<30;i++) {
            //     let ind1, ind2;
            //     ind1 = Math.floor(Math.random() * 30);
            //     do{
            //         ind2 = Math.floor(Math.random() * 30);
            //     }while(ind1 === ind2);
            //     newPopulation.push(this.population[ind1].mate(this.population[ind2]));
            // }

            // this.population = newPopulation;

            // this.population.forEach(i => i.restart(50, (this.sprites.background.height - this.sprites.ground.height) / 2));

            // this.pipes = [];
        
            // for(let i=0;i<3;i++) this.pipes.push(new Pipe(this.canvas, this.ctx, this.sprites, this.sprites.background.width + (this.sprites.pipes.width / 2 + 10) / 2 + i * consts.PIPES_GAP));

            // this.ground1_x = 0;
            // this.ground2_x = this.sprites.ground.width;

            // this.gameOn = true;
            // this.gameOver = false;
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

    pause() {
        this.paused = true;
    }

    start() {
        this.paused = false;
        this.gameOn = true;
    }

    stop() {
        this.init();
        this.paused = true;

        this.population.forEach(i => i.restart(50, (this.sprites.background.height - this.sprites.ground.height) / 2));
    }

    visualizeChart() {
        const COLOR_DARK = '#3e3e42';
        const COLOR_LIGTH = '#c1c1bd';
        const COLOR_YELLOW = '#f0ad4e';
        const COLOR_BLUE = '#007acc';
        const COLOR_GREEN = '#5cb85c';
        const COLOR_RED = '#d9534f';

        const lineColor = document.body.classList.contains('dark') ? COLOR_DARK : COLOR_LIGTH;

        this.gaCtx.clearRect(0, 0, this.gaCanvas.width, this.gaCanvas.height);

        this.gaCtx.strokeStyle = lineColor;
        this.gaCtx.fillStyle = document.body.classList.contains('dark') ? COLOR_LIGTH : COLOR_DARK;

        let unitY = this.gaCanvas.height / 100;
        let unitX = this.gaCanvas.width / 100;
    
        for(let i=0;i<6;i++) {
            this.gaCtx.beginPath();
            this.gaCtx.moveTo(10 * unitX, 10 * unitY + 12 * unitY * i);
            this.gaCtx.lineTo(99 * unitX, 10 * unitY + 12 * unitY * i);
            this.gaCtx.stroke();
        }

        for(let i=0;i<8;i++) {
            this.gaCtx.beginPath();
            this.gaCtx.moveTo(12 * unitX + 12 * unitX * i, 6 * unitY);
            this.gaCtx.lineTo(12 * unitX + 12 * unitX * i, 74 * unitY);
            this.gaCtx.stroke();
        }

        if(this.data.length > 0) {
            let maxBest = 0;

            this.dataShown.forEach(i => {
                maxBest = Math.max(maxBest, Math.max(...this.data.map(j => j[i])));
            });

            let maxVal = Math.max(Math.ceil(maxBest / 5), 1) * 5;

            this.gaCtx.textBaseline = 'middle';
            this.gaCtx.textAlign = 'right';
            this.gaCtx.font = `${4.5*unitY}px Roboto`;

            for(let i=0;i<6;i++) {
                this.gaCtx.fillText(`${(5 - i) * maxVal / 5}`, 9 * unitX, 10 * unitY + 12 * unitY * i);
            }

            this.gaCtx.textBaseline = 'top';
            this.gaCtx.textAlign = 'center';

            for(let i=0;i<8;i++) {
                this.gaCtx.fillText(`${(i * this.data.length / 7).toFixed(2)}`, 12 * unitX + 12 * unitX * i, 76 * unitY);
            }

            this.gaCtx.textAlign = 'center';
            this.gaCtx.textBaseline = 'middle';

            this.gaCtx.save();
            this.gaCtx.translate(3 * unitX, 10 * unitY + 30 * unitY);
            this.gaCtx.rotate(-Math.PI / 2);
            this.gaCtx.translate(-3 * unitX, -10 * unitY - 30 * unitY);
            this.gaCtx.fillText(`Score`, 3 * unitX, 10 * unitY + 30 * unitY);
            this.gaCtx.restore();

            this.gaCtx.fillText(`Generation`, 12 * unitX + 42 * unitX, 87 * unitY);

            // Draw Best

            if(this.dataShown.includes('best')) {
                this.gaCtx.strokeStyle = COLOR_GREEN;
                this.gaCtx.beginPath();
                this.gaCtx.moveTo(12 * unitX, 70 * unitY);
                this.data.forEach((i, ind) => {
                    this.gaCtx.lineTo(12 * unitX + (ind + 1) * 84 * unitX / this.data.length, 70 * unitY - 60 * unitY * i.best / maxVal);
                });
                this.gaCtx.stroke();
            }

            if(this.dataShown.includes('worst')) {
                this.gaCtx.strokeStyle = COLOR_RED;
                this.gaCtx.beginPath();
                this.gaCtx.moveTo(12 * unitX, 70 * unitY);
                this.data.forEach((i, ind) => {
                    this.gaCtx.lineTo(12 * unitX + (ind + 1) * 84 * unitX / this.data.length, 70 * unitY - 60 * unitY * i.worst / maxVal);
                });
                this.gaCtx.stroke();
            }

            if(this.dataShown.includes('mean')) {
                this.gaCtx.strokeStyle = COLOR_YELLOW;
                this.gaCtx.beginPath();
                this.gaCtx.moveTo(12 * unitX, 70 * unitY);
                this.data.forEach((i, ind) => {
                    this.gaCtx.lineTo(12 * unitX + (ind + 1) * 84 * unitX / this.data.length, 70 * unitY - 60 * unitY * i.mean / maxVal);
                });
                this.gaCtx.stroke();
            }

            if(this.dataShown.includes('median')) {
                this.gaCtx.strokeStyle = COLOR_BLUE;
                this.gaCtx.beginPath();
                this.gaCtx.moveTo(12 * unitX, 70 * unitY);
                this.data.forEach((i, ind) => {
                    this.gaCtx.lineTo(12 * unitX + (ind + 1) * 84 * unitX / this.data.length, 70 * unitY - 60 * unitY * i.median / maxVal);
                });
                this.gaCtx.stroke();
            }

            let lx = 0;

            this.gaCtx.textAlign = 'left';
            this.gaCtx.textBaseline = 'middle';

            this.dataShown.forEach(i => {
                this.gaCtx.fillStyle = {
                    'best': COLOR_GREEN,
                    'worst': COLOR_RED,
                    'mean': COLOR_YELLOW,
                    'median': COLOR_BLUE
                }[i];

                this.gaCtx.beginPath();
                this.gaCtx.arc(12 * unitX + lx, 94 * unitY, 0.7 * unitX, 0, 2 * Math.PI);
                this.gaCtx.fill();

                this.gaCtx.fillText(i, 14 * unitX + lx, 94 * unitY);

                lx += 4.5 * unitX + this.gaCtx.measureText(i).width;
            });
        }
    }
}