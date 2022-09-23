import Bird from "./Bird.js";
import * as consts from './constants.js';
import ParentSelection from '../../../js/GeneticAlgorithm/ParentSelection.js';
import SurvivorSelection from '../../../js/GeneticAlgorithm/SurvivorSelection.js';

const formatTime = (time) => {
    let floored = Math.floor(time);
    let secs = floored % 60;
    floored = Math.floor(floored / 60);
    let mins = floored % 60;
    floored = Math.floor(floored / 60);
    return `${floored < 10 ? `0${floored}`: floored}:${mins < 10 ? `0${mins}`: mins}:${secs < 10 ? `0${secs}`: secs}`
};

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

        this.scale = this.canvas.width / this.sprites.border.width;

        this.saveObj = JSON.parse(localStorage.getItem('flappybird')) || {};

        if(!this.saveObj.saveFiles) this.saveObj.saveFiles = [];

        this.neuralNet = [
            { size: 6 },
            { size: 4, activation: 'sigmoid' },
            { size: 1, activation: 'relu' }
        ];

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

        this.time = 0;
    }

    resetNeuroEvolution() {
        this.init();

        this.generation = 1;

        this.time = 0;
        this.data = [];

        this.highscore = 0;

        this.population = [];

        for(let i=0;i<this.evolution.population;i++) {
            this.population[i] = new Bird(this.canvas, this.ctx, this.sprites, this.pressedKeys, this.sprites.border.width / 2, this.sprites.border.height * 0.45, 'ai');
            this.population[i].setNeuralNet(this.neuralNet);
        }

        this.survivorSelectionMethod = SurvivorSelection[this.evolution.survivorSel];
        this.parentSelectionMethod = ParentSelection[this.evolution.parentSel];
    }

    init() {
        this.spikes = [];

        this.gameOn = false;
        this.gameOver = false;

        this.colorState = 0;
        this.colorTimer = 0.7;
        this.colorBg = consts.COLORS[this.colorState].bg;
        this.colorBorder = consts.COLORS[this.colorState].border;
        this.prevColorBg = consts.COLORS[this.colorState].bg;
        this.prevColorBorder = consts.COLORS[this.colorState].bg;

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

        let firstRendered = false;

        this.population.forEach(i => {
            if(i.alive) {
                if(firstRendered) this.ctx.globalAlpha = 0.5;

                i.render(this.scale, this.gameOn);

                firstRendered = true;

                this.ctx.globalAlpha = 1;
            }
        });

        this.ctx.fillStyle = this.colorBg;
        this.ctx.font = `${25 * this.scale}px Roboto`;
        this.ctx.fillText(`Generation: ${this.generation}`, 50 * this.scale, (this.sprites.border.height - 140) * this.scale);
        let alives = this.population.reduce((a, b) => a + (b.alive ? 1 : 0), 0);
        this.ctx.fillText(`Alive: ${alives} / ${this.population.length}`, 50 * this.scale, (this.sprites.border.height - 100) * this.scale);
        let first = this.population.find(i => i.alive);
        this.ctx.fillText(`Score: ${first ? first.score : 0}`, 50 * this.scale, (this.sprites.border.height - 60) * this.scale);
        this.ctx.fillText(`Highscore: ${this.highscore}`, 280 * this.scale, (this.sprites.border.height - 140) * this.scale);
        this.ctx.fillText(`Time: ${formatTime(this.time)}`, 280 * this.scale, (this.sprites.border.height - 100) * this.scale);

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

        if(this.gameOn) this.time += dt;

        this.scale = this.canvas.width / this.sprites.border.width;
        let prevScore = this.population.find(bird => bird.alive).score;

        this.population.forEach(bird => {
            if(bird.alive) {
                let inputs = [];

                inputs.push(bird.y - consts.GND_UP);
                inputs.push(this.sprites.border.height - consts.GND_DOWN - bird.y);
                
                if(bird.vx >= 0) inputs.push(this.sprites.border.width - consts.WALL - bird.x);
                else inputs.push(bird.x - consts.WALL);

                // consts.GND_UP - consts.SPIKE_W * 0.9 + (i + 1) * consts.SPIKE_GAP * 0.9 + i * consts.SPIKE_H * 0.9 = d
                // i * ( SPIKE_GAP + SPIKE_H ) * 0.9 + SPIKE_GAP * 0.9 - SPIKE_W * 0.9 + GND_UP
                let ind = Math.floor((bird.y - consts.GND_UP + consts.SPIKE_W * 0.9 - consts.SPIKE_GAP * 0.9) / ( consts.SPIKE_GAP + consts.SPIKE_H ));
                if(!this.spikes) {
                    inputs.push(0);
                    inputs.push(0);
                    inputs.push(0);
                }
                else{
                    if(ind > 0) inputs.push(this.spikes[ind-1] ? 1 : 0);
                    else inputs.push(1);
                    inputs.push(this.spikes[ind] ? 1 : 0);
                    if(ind < 11) inputs.push(this.spikes[ind+1] ? 1 : 0);
                    else inputs.push(1);
                }

                let outputs = bird.brain.feedForward(inputs);
                let comparator = undefined;
                if(this.neuralNet[this.neuralNet.length - 1].activation === 'relu') comparator = 0;
                else if(this.neuralNet[this.neuralNet.length - 1].activation === 'sigmoid') comparator = 0.5;
                else if(this.neuralNet[this.neuralNet.length - 1].activation === 'tanh') comparator = 0;

                if(outputs[0] > comparator) {
                    if(bird.alive && this.gameOn) bird.jump();
                }

                bird.update(dt, this.gameOn);

                if(this.spikes) {
                    this.spikes.forEach((val, i) => {
                        if(val && bird.collision(i, this.spikeDirection)) {
                            if(bird.alive) {
                                bird.alive = false;
                                if(this.vy < 0) bird.vy = 0;
                                bird.score--;
                            }
                        }
                    });
                }
            }
        });

        let alives = this.population.reduce((a, b) => a + (b.alive ? 1 : 0), 0);

        if(alives > 0) {
            let bird = this.population.find(bird => bird.alive);

            if(bird.score !== prevScore) {
                this.generateSpikes(this.getNumberOfSpieks(bird.score), bird.vx > 0);
            }

            if(Math.min(20, Math.floor(bird.score / 5)) !== this.colorState) {
                this.colorTimer = 0;
    
                this.prevColorBg = consts.COLORS[this.colorState].bg;
                this.prevColorBorder = consts.COLORS[this.colorState].border;
            }
            this.colorState = Math.min(20, Math.floor(bird.score / 5));
    
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
        } 
        else if(this.gameOn) {
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

            this.generation++;

            this.population = newPopulation;

            this.population.forEach(i => {
                i.prevFitness = (i.prevFitness * (i.age - 1) + i.fitness) / i.age;
                i.restart(this.sprites.border.width / 2, this.sprites.border.height * 0.45);

                i.vx = consts.SPEED_X
            });

            this.init();

            this.gameOn = true;
        }
    }

    pause() {
        this.paused = true;
    }

    start() {
        this.paused = false;
        this.gameOn = true;

        this.population.forEach(i => i.vx = consts.SPEED_X);
    }

    stop() {
        this.init();
        this.paused = false;
        this.gameOn = false;

        this.population.forEach(i => i.restart(this.sprites.border.width / 2, this.sprites.border.height * 0.45));
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