import * as consts from './constants.js';
import Snake from './Snake.js';
import ParentSelection from '../../../js/GeneticAlgorithm/ParentSelection.js';
import SurvivorSelection from '../../../js/GeneticAlgorithm/SurvivorSelection.js';

const formatTime = (time) => {
    let floored = Math.floor(time);
    let secs = floored % 60;
    floored = Math.floor(floored / 60);
    let mins = floored % 60;
    floored = Math.floor(floored / 60);
    return `${floored < 10 ? `0${floored}`: floored}:${mins < 10 ? `0${mins}`: mins}:${secs < 10 ? `0${secs}`: secs}`
}

export default class TrainState {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} sprites
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

        // this.snake = new Snake(canvas, ctx, sprites, pressedKeys, 19, 12);

        this.saveObj = JSON.parse(localStorage.getItem('snakegame')) || {};

        if(!this.saveObj.saveFiles) this.saveObj.saveFiles = [];

        this.neuralNet = [
            { size: 4 },
            { size: 5, activation: 'sigmoid' },
            { size: 3, activation: 'relu' }
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
        this.EPOCHS_COUNT = 20;

        this.generation = 1;
        this.epoch = 0;
        this.population = [];

        this.data = [];
        this.dataShown = ['best', 'worst', 'mean', 'median'];

        this.paused = false;

        this.highscore = 0;

        this.timer = 0;

        this.resetNeuroEvolution();
    }

    resetNeuroEvolution() {
        this.gameOn = false;
        this.gameOver = false;

        this.generation = 1;

        this.time = 0;
        this.data = [];

        this.highscore = 0;

        this.population = [];

        for(let i=0;i<this.evolution.population;i++) {
            this.population[i] = new Snake(this.canvas, this.ctx, this.sprites, this.pressedKeys, 19, 12, 'ai');
            this.population[i].setNeuralNet(this.neuralNet);
            this.population[i].randomFood();
        }

        this.survivorSelectionMethod = SurvivorSelection[this.evolution.survivorSel];
        this.parentSelectionMethod = ParentSelection[this.evolution.parentSel];
    }

    render() {
        this.ctx.globalAlpha = 1;

        this.ctx.fillStyle = consts.COLORS.GREEN;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        let sx = consts.LEFT * this.scale;
        let sy = consts.TOP * this.scale;
        
        // Border
        this.ctx.fillStyle = consts.COLORS.BLACK;
        this.ctx.fillRect(sx, sy, consts.BLOCK_SIZE * this.scale, consts.BLOCK_SIZE * (consts.GRID_HEIGHT * 3 + 2) * this.scale);
        this.ctx.fillRect(sx + consts.BLOCK_SIZE * (consts.GRID_WIDTH * 3 + 1) * this.scale, sy, consts.BLOCK_SIZE * this.scale, consts.BLOCK_SIZE * (consts.GRID_HEIGHT * 3 + 2) * this.scale);
        this.ctx.fillRect(sx, sy, consts.BLOCK_SIZE * (consts.GRID_WIDTH * 3 + 2) * this.scale, consts.BLOCK_SIZE * this.scale);
        this.ctx.fillRect(sx, sy + consts.BLOCK_SIZE * (consts.GRID_HEIGHT * 3 + 1) * this.scale, consts.BLOCK_SIZE * (consts.GRID_WIDTH * 3 + 2) * this.scale, consts.BLOCK_SIZE * this.scale);

        // Snakes
        let firstRendered = false;

        this.population.forEach(i => {
            if(i.alive) {
                if(firstRendered) this.ctx.globalAlpha = 0.5;

                i.render(this.scale);

                firstRendered = true;

                this.ctx.globalAlpha = 1;
            }
        });

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

        this.ctx.fillStyle = consts.COLORS.BLACK;
        this.ctx.font = `${7 * this.scale}px Roboto`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Generation: ${this.generation}`, 20 * this.scale, 15 * this.scale);
        let alives = this.population.reduce((a, b) => a + (b.alive ? 1 : 0), 0);
        this.ctx.fillText(`Alive: ${alives} / ${this.population.length}`, 20 * this.scale, 27 * this.scale);
        let first = this.population.find(i => i.alive);
        this.ctx.fillText(`Score: ${Math.max(...this.population.map(i => i.score))}`, 20 * this.scale, 39 * this.scale);
        this.ctx.fillText(`Highscore: ${this.highscore}`, 80 * this.scale, 15 * this.scale);
        this.ctx.fillText(`Time: ${formatTime(this.time)}`, 80 * this.scale, 27 * this.scale);

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

        if(this.gameOn) {
            this.timer += dt;
            this.time += dt;
        }

        this.scale = this.canvas.width / 400;

        let alives = this.population.reduce((a, b) => a + (b.alive ? 1 : 0), 0);

        if(this.timer >= 0) {
            this.population.forEach(snake => {
                let inputs = [];
                let head = snake.snake[0];
                const DIRS = [
                    { name:'right', x: 1, y: 0 },
                    { name:'up', x: 0, y: -1 },
                    { name:'left', x: -1, y: 0 },
                    { name:'down', x: 0, y: 1 }
                ];
                let dirInd = DIRS.findIndex(i => i.name === snake.direction);
                let left = DIRS[(dirInd + 3) % 4], front = DIRS[dirInd], right = DIRS[(dirInd + 1) % 4];
                if(
                    head.x + left.x >= consts.GRID_WIDTH || head.x + left.x < 0 ||
                    head.y + left.y >= consts.GRID_HEIGHT || head.y + left.y < 0 ||
                    snake.snake.slice(1).find(i => i.x === head.x + left.x && i.y === head.y + left.y)
                ) inputs.push(1);
                else inputs.push(-1);

                if(
                    head.x + front.x >= consts.GRID_WIDTH || head.x + front.x < 0 ||
                    head.y + front.y >= consts.GRID_HEIGHT || head.y + front.y < 0 ||
                    snake.snake.slice(1).find(i => i.x === head.x + front.x && i.y === head.y + front.y)
                ) inputs.push(1);
                else inputs.push(-1);

                if(
                    head.x + right.x >= consts.GRID_WIDTH || head.x + right.x < 0 ||
                    head.y + right.y >= consts.GRID_HEIGHT || head.y + right.y < 0 ||
                    snake.snake.slice(1).find(i => i.x === head.x + right.x && i.y === head.y + right.y)
                ) inputs.push(1);
                else inputs.push(-1);

                const dy = snake.food.y - head.y;
                const dx = snake.food.x - head.x;

                inputs.push(dy / Math.sqrt(dx*dx + dy*dy));

                // console.log(inputs);
                // throw 1;

                let outputs = snake.brain.feedForward(inputs);

                let maxInd = 0;
                for(let i=1;i<outputs.length;i++) if(outputs[i] > outputs[maxInd]) maxInd = i;

                if(maxInd === 0) snake.nextDirection = left.name;
                else if(maxInd === 1) snake.nextDirection = front.name;
                else snake.nextDirection = right.name;

                snake.update(dt, null, this.gameOn);
            });
            this.timer = 0;
        }

        if(this.gameOn && alives === 0) {
            this.highscore = Math.max(...[this.highscore, ...this.population.map(i => i.score)]);

            let newPopulation = this.survivorSelectionMethod(this.population, this.evolution.survivorPer);

            let forRemove = [];
            for(let i=0;i<newPopulation.length;i++) {
                newPopulation[i].age++;
                if(newPopulation[i].fitness <= newPopulation[i].oldFitness) newPopulation[i].staleness++;
                else newPopulation[i].staleness = 0;

                if(newPopulation[i].staleness == 10) {
                    forRemove.push(i);
                }
            }
            let popSize = newPopulation.length;
            forRemove.reverse().forEach(i => newPopulation.splice(i, 1));
            while(newPopulation.length < popSize) {
                newPopulation.push(new Snake(this.canvas, this.ctx, this.sprites, this.pressedKeys, 19, 12, 'ai'));
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
                i.oldFitness = Math.max(i.oldFitness, i.fitness);
                i.restart(19, 12);
                i.randomFood();
            });

            this.gameOn = true;
        }

        this.prevPressedKeys = { ...this.pressedKeys };
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
        this.paused = false;
        this.gameOn = false;

        // this.population.forEach(i => i.restart(50, (this.sprites.background.height - this.sprites.ground.height) / 2));
    }

    reset() {
        this.paused = false;
        this.resetNeuroEvolution();
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