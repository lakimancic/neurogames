/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const main = document.querySelector('main');

let aspectRatio = 4 / 3;

let HEIGHT = Math.min(main.clientHeight * 0.9, main.clientWidth * 0.9 / aspectRatio);
let WIDTH = HEIGHT * aspectRatio;

canvas.height = HEIGHT;
canvas.width = WIDTH;

ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

const updateSize = () => {
    let HEIGHT = Math.min(main.clientHeight * 0.9, main.clientWidth * 0.9 / aspectRatio);
    if(main.classList.contains('fullscreen')) {
        HEIGHT = Math.min(main.clientHeight, main.clientWidth / aspectRatio);
    }
    let WIDTH = HEIGHT * aspectRatio;

    canvas.height = HEIGHT;
    canvas.width = WIDTH;

    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
};

window.onresize = () => {
    updateSize();
};

document.querySelector('.fa-expand').onclick = () => {
    main.classList.toggle('fullscreen');

    if(main.classList.contains('fullscreen')) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }

    updateSize();
};

import Game from './src/Game.js';
import GameState from './src/GameState.js';

let game = new Game(canvas, ctx);

const runGame = async () => {
    await game.load();

    game.state = new GameState(game.canvas, game.ctx, game.sprites, game.pressedKeys);
    game.run();
};

runGame();
