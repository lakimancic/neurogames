import * as consts from './constants.js';
import NeuralNetwork from '../../../js/NeuralNetwork/Network.js';
import Crossover from '../../../js/GeneticAlgorithm/Crossover.js';
import Mutation from '../../../js/GeneticAlgorithm/Mutation.js';

const directions = {
    'left': { x: -1, y: 0 },
    'right': { x: 1, y: 0 },
    'up': { x: 0, y: -1 },
    'down': { x: 0, y: 1 },
};

export default class Snake {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLImageElement} sprite
     */
    constructor(canvas, ctx, sprites, pressedKeys, x, y, control = 'player') {
        this.canvas = canvas;
        this.ctx = ctx;

        this.sprites = sprites;

        this.snake = [
            { x: x, y }, { x: x + 1, y }, { x: x + 2, y }
        ]

        this.pressedKeys = pressedKeys;
        this.prevPressedKeys = pressedKeys;
        this.control = control;

        this.direction = 'left';
        this.nextDirection = 'left';

        this.timer = 0;

        this.alive = true;
        this.lifeLeft = 100;

        this.eaten = [];

        this.fitness = 0;
        this.prevFitness = 0;
        this.score = 0;
        this.staleness = 0;

        this.age = 0;
    }

    setNeuralNet(nn) {
        this.brain = new NeuralNetwork(nn);

        this.nn = nn;
    }

    restartEpoch(x, y) {
        this.x = x;
        this.y = y;

        this.alive = true;
        this.lifeLeft = 100;
        this.steps = 0;

        this.snake = [
            { x: x, y }, { x: x + 1, y }, { x: x + 2, y }
        ]
    } 

    restart(x, y) {
        this.x = x;
        this.y = y;

        this.alive = true;
        this.lifeLeft = 100;
        this.steps = 0;

        this.fitness = 0;
        this.score = 0;

        this.snake = [
            { x: x, y }, { x: x + 1, y }, { x: x + 2, y }
        ];
        this.eaten = [];
    }

    render(scale) {
        this.snake.forEach(i => {
            this.ctx.fillStyle = consts.COLORS.BLACK;
            this.ctx.fillRect(
                (consts.LEFT + (1 + i.x * 3) * consts.BLOCK_SIZE) * scale,
                (consts.TOP + (1 + i.y * 3) * consts.BLOCK_SIZE) * scale,
                consts.BLOCK_SIZE * 3 * scale,
                consts.BLOCK_SIZE * 3 * scale
            );
        });

        // Food
        if(this.food) {
            this.ctx.fillRect(
                (consts.LEFT + (2 + this.food.x * 3) * consts.BLOCK_SIZE) * scale,
                (consts.TOP + (1 + this.food.y * 3) * consts.BLOCK_SIZE) * scale,
                consts.BLOCK_SIZE * scale,
                consts.BLOCK_SIZE * scale
            );
            this.ctx.fillRect(
                (consts.LEFT + (1 + this.food.x * 3) * consts.BLOCK_SIZE) * scale,
                (consts.TOP + (2 + this.food.y * 3) * consts.BLOCK_SIZE) * scale,
                consts.BLOCK_SIZE * scale,
                consts.BLOCK_SIZE * scale
            );
            this.ctx.fillRect(
                (consts.LEFT + (3 + this.food.x * 3) * consts.BLOCK_SIZE) * scale,
                (consts.TOP + (2 + this.food.y * 3) * consts.BLOCK_SIZE) * scale,
                consts.BLOCK_SIZE * scale,
                consts.BLOCK_SIZE * scale
            );
            this.ctx.fillRect(
                (consts.LEFT + (2 + this.food.x * 3) * consts.BLOCK_SIZE) * scale,
                (consts.TOP + (3 + this.food.y * 3) * consts.BLOCK_SIZE) * scale,
                consts.BLOCK_SIZE * scale,
                consts.BLOCK_SIZE * scale
            );
        }
    }

    update(dt, death, gameOn) {
        if(!this.alive || !gameOn) return;

        if(this.control === 'player') {
            this.handleInput();

            this.timer += dt;
        } else {
            this.lifeLeft--;
            this.steps++;

            if(this.lifeLeft === 0) {
                this.fitness = this.steps * this.steps * Math.pow(2, this.score);
                this.fitness = this.score * 1000 + this.steps;
                this.alive = false;
                return;
            }
        }

        if(this.timer >= 0.1 || this.control === 'ai') {
            this.direction = this.nextDirection;
            this.timer = 0;

            if(this.snake[0].x + directions[this.direction].x < 0 || this.snake[0].x + directions[this.direction].x >= consts.GRID_WIDTH) {
                this.alive = false;
                this.fitness = this.steps * this.steps * Math.pow(2, this.score);
                this.fitness = this.score * 1000 + this.steps;
                if(death) death();
                return;
            }
            else if(this.snake[0].y + directions[this.direction].y < 0 || this.snake[0].y + directions[this.direction].y >= consts.GRID_HEIGHT) {
                this.alive = false;
                this.fitness = this.steps * this.steps * Math.pow(2, this.score);
                this.fitness = this.score * 1000 + this.steps;
                if(death) death();
                return;
            }
            else if(this.snake.findIndex(i => i.y === this.snake[0].y + directions[this.direction].y && i.x === this.snake[0].x + directions[this.direction].x) !== -1) {
                this.alive = false;
                this.fitness = this.steps * this.steps * Math.pow(2, this.score);
                if(death) death();
                return;
            }

            if(this.snake[0].x === this.food.x && this.snake[0].y === this.food.y) {
                this.eaten.push(this.food);
                this.score++;
                this.lifeLeft += 100;

                this.randomFood();
            }

            if(this.eaten.length > 0 && this.eaten[0].x === this.snake[this.snake.length - 1].x && this.eaten[0].y === this.snake[this.snake.length - 1].y) {
                this.snake.push(this.snake[this.snake.length - 1]);

                this.eaten.shift();
            }

            for(let i=this.snake.length-1;i>0;i--) {
                this.snake[i] = this.snake[i-1];
            }
            this.snake[0] = {
                x: this.snake[0].x + directions[this.direction].x,
                y: this.snake[0].y + directions[this.direction].y
            }
        }

        this.prevPressedKeys = { ...this.pressedKeys };
    }

    handleInput() {
        if(
            (this.pressedKeys['a'] && !this.prevPressedKeys['a']) ||
            (this.pressedKeys['ArrowLeft'] && !this.prevPressedKeys['ArrowLeft'])
        ) {
            if(this.direction !== 'right') this.nextDirection = 'left';
        }
        if(
            (this.pressedKeys['d'] && !this.prevPressedKeys['d']) ||
            (this.pressedKeys['ArrowRight'] && !this.prevPressedKeys['ArrowRight'])
        ) {
            if(this.direction !== 'left') this.nextDirection = 'right';
        }
        if(
            (this.pressedKeys['w'] && !this.prevPressedKeys['w']) ||
            (this.pressedKeys['ArrowUp'] && !this.prevPressedKeys['ArrowUp'])
        ) {
            if(this.direction !== 'down') this.nextDirection = 'up';
        }
        if(
            (this.pressedKeys['s'] && !this.prevPressedKeys['s']) ||
            (this.pressedKeys['ArrowDown'] && !this.prevPressedKeys['ArrowDown'])
        ) {
            if(this.direction !== 'up') this.nextDirection = 'down';
        }
    }

    randomFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * (consts.GRID_WIDTH - 1)),
                y: Math.floor(Math.random() * (consts.GRID_HEIGHT - 1))
            };
        }while(this.snake.findIndex(i => i.x === this.food.x && i.y === this.food.y) !== -1)
    }

    /**
     * 
     * @param {Snake} snake 
     */
     mate(snake, mutationType, mutationChance, crossoverType) {
        //new Snake(this.canvas, this.ctx, this.sprites, this.pressedKeys, 19, 12, 'ai');
        let child = new Snake(this.canvas, this.ctx, this.sprites, this.pressedKeys, this.x, this.y, this.control);
        child.setNeuralNet(this.nn);

        for(let i=0;i<this.brain.levels.length;i++) {
            for(let j=0;j<this.brain.levels[i].weights.length; j++) {
                let crossover = new Crossover(crossoverType, this.brain.levels[i].weights[j].length);
                for(let k=0;k<this.brain.levels[i].weights[j].length; k++) {
                    child.brain.levels[i].weights[j][k] = crossover.choose(snake.brain.levels[i].weights[j][k], this.brain.levels[i].weights[j][k], k)[0];

                    child.brain.levels[i].weights[j][k] = Mutation[mutationType](child.brain.levels[i].weights[j][k], mutationChance);
                }
            }
            let crossover = new Crossover(crossoverType, this.brain.levels[i].biases.length);
            for(let j=0;j<this.brain.levels[i].biases.length;j++) {
                child.brain.levels[i].biases[j] = crossover.choose(snake.brain.levels[i].biases[j], this.brain.levels[i].biases[j], j)[0];

                child.brain.levels[i].biases[j] = Mutation[mutationType](child.brain.levels[i].biases[j], mutationChance);
            }
        }

        return child;
    }
}