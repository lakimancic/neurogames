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

        this.eaten = [];

        this.fitness = 0;
        this.prevFitness = 0;
        this.score = 0;

        this.age = 0;
    }

    setNeuralNet(nn) {
        this.brain = new NeuralNetwork(nn);

        this.nn = nn;
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

        this.timer += dt;

        if(this.control === 'player') {
            this.handleInput();
        }

        if(this.timer >= 0.1) {
            this.direction = this.nextDirection;
            this.timer = 0;

            if(this.snake[0].x + directions[this.direction].x < 0 || this.snake[0].x + directions[this.direction].x >= consts.GRID_WIDTH) {
                this.alive = false;
                if(death) death();
                return;
            }
            else if(this.snake[0].y + directions[this.direction].y < 0 || this.snake[0].y + directions[this.direction].y >= consts.GRID_HEIGHT) {
                this.alive = false;
                if(death) death();
                return;
            }
            else if(this.snake.findIndex(i => i.y === this.snake[0].y + directions[this.direction].y && i.x === this.snake[0].x + directions[this.direction].x) !== -1) {
                this.alive = false;
                if(death) death();
                return;
            }

            if(this.snake[0].x === this.food.x && this.snake[0].y === this.food.y) {
                this.eaten.push(this.food);
                this.score++;

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
}