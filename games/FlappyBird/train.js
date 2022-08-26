/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const main = document.querySelector('main');

let HEIGHT = main.clientHeight * 0.9;
let WIDTH = HEIGHT * 144 / 256;

canvas.height = HEIGHT;
canvas.width = WIDTH;

ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

window.onresize = () => {
    HEIGHT = main.clientHeight * 0.9;
    WIDTH = HEIGHT * 144 / 256;

    canvas.height = HEIGHT;
    canvas.width = WIDTH;

    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
};

import Game from './src/Game.js';
import TrainState from './src/TrainState.js';

let game = new Game(canvas, ctx);

const runGame = async () => {
    await game.load();

    game.state = new TrainState(game.canvas, game.ctx, game.sprites, game.pressedKeys);
    game.run();
};

runGame();