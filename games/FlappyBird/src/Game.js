// Method for loading image from file url
const loadImage = (url) => new Promise((res,err) => {
    let image = new Image();
    image.src = url;
    image.onload = () => {
        res(image);
    }
});

import GameState from "./GameState.js";

// Game class
export default class Game {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} ctx
     */
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        this.isLoaded = false;

        this.sprites = {};

        this.loop = false;

        this.state = null;

        this.pressedKeys = {};
        this.prevPressedKeys = {};
    }

    async load() {

        this.sprites['background'] = await loadImage('./assets/background.png');
        this.sprites['bird'] = await loadImage('./assets/bird.png');
        this.sprites['ground'] = await loadImage('./assets/ground.png');
        this.sprites['pipes'] = await loadImage('./assets/pipes.png');
        this.sprites['getready'] = await loadImage('./assets/getready.png');
        this.sprites['tap'] = await loadImage('./assets/tap.png');
        this.sprites['bignums'] = await loadImage('./assets/big_numbers.png');
        this.sprites['smallnums'] = await loadImage('./assets/small_numbers.png');
        this.sprites['gameover'] = await loadImage('./assets/gameover.png');
        this.sprites['panel'] = await loadImage('./assets/panel.png');
        this.sprites['medals'] = await loadImage('./assets/medals.png');

        this.isLoaded = true;
    }

    render() {
        if(!this.isLoaded) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if(this.state) this.state.render();
    }

    update(dt) {
        dt /= 1000;

        if(this.state) this.state.update(dt);

        this.prevPressedKeys = { ...this.pressedKeys };
    }

    run() {
        this.loop = true;

        let lastUpdate = Date.now();

        addEventListener('keydown', e => this.pressedKeys[e.key] = true );
        addEventListener('keyup', e => this.pressedKeys[e.key] = false );

        this.canvas.addEventListener('mousedown', () => this.pressedKeys['Mouse'] = true );
        addEventListener('mouseup', () => this.pressedKeys['Mouse'] = false );

        this.canvas.addEventListener('touchstart', () => this.pressedKeys['Touch'] = true );
        addEventListener('touchend', () => this.pressedKeys['Touch'] = false );

        const step = () => {
            let now = Date.now();
            let dt = now - lastUpdate;
            lastUpdate = Date.now();

            this.update(dt);
            this.render();

            if(this.loop) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    }

    stop() {
        this.loop = false;
    }
}