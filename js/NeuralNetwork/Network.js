import Level from "./Level.js";

const COLOR_DARK = '#2d2d30';
const COLOR_LIGTH = '#d2d2cf';
const COLOR_ORANGE = '#ff8533';
const COLOR_BLUE = '#007acc';

export default class NeuralNetwork {
    constructor(layers) {
        this.levels = [];

        for(let i=1;i<layers.length;i++) {
            this.levels[i-1] = new Level(layers[i-1].size, layers[i].size, layers[i].activation);
        }
    }

    feedForward(givenInputs) {
        let outputs = this.levels[0].feedForward(givenInputs);

        for(let i=1;i<this.levels.length;i++) outputs = this.levels[i].feedForward(outputs);

        return outputs;
    }

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} ctx
     */
    visualizeNetwork(canvas, ctx, num) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let layersSize = this.levels.length + 1;
        let maxLayerHeight = Math.max(...this.levels.map(lvl => Math.max(lvl.inputSize, lvl.outputSize)));

        let cr = Math.min(canvas.width / (3*layersSize + 2), canvas.height / (1.5*maxLayerHeight + 0.5) ) / 2;
        let cR = cr * 2;

        let layers = [this.levels[0].inputSize, ...this.levels.map(lvl => lvl.outputSize)];

        ctx.fillStyle = 'red';
        ctx.strokeStyle = 'yellow';

        let widthHalf = layersSize / 2;

        let gap = canvas.width / (layersSize + 1) * ( 1 + 1 / (layersSize + 1));

        this.levels.forEach((i, ind) => {
            let maxWeight = Math.max(...i.weights.map(j => Math.max(...j.map(m => Math.abs(m)))));
            for(let k = 0; k < i.inputSize; k++) {
                for(let j = 0; j < i.outputSize; j++) {
                    if(i.weights[k][j] > 0) ctx.strokeStyle = COLOR_ORANGE;
                    else if(i.weights[k][j] < 0) ctx.strokeStyle = COLOR_BLUE;

                    if(maxWeight !== 0) {
                        ctx.lineWidth = 2 * i.weights[k][j] / maxWeight;
                    } else {
                        ctx.lineWidth = 0;
                    }

                    ctx.beginPath();
                    ctx.moveTo(
                        canvas.width / 2 + Math.ceil(ind - widthHalf) * gap + gap * (1 - (layersSize % 2)) / 2,
                        canvas.height / 2 + Math.ceil(k - i.inputSize / 2) * 1.5 * cR + 1.5 * cr * (1 - (i.inputSize % 2))
                    );
                    ctx.lineTo(
                        canvas.width / 2 + Math.ceil(ind + 1 - widthHalf) * gap + gap * (1 - (layersSize % 2)) / 2,
                        canvas.height / 2 + Math.ceil(j - i.outputSize / 2) * 1.5 * cR + 1.5 * cr * (1 - (i.outputSize % 2))
                    );
                    ctx.stroke();
                }
            }
        });

        ctx.fillStyle = document.body.classList.contains('dark') ? COLOR_DARK : COLOR_LIGTH;
        ctx.strokeStyle = document.body.classList.contains('dark') ? COLOR_LIGTH : COLOR_DARK;

        layers.forEach((i, ind) => {
            for(let j=0;j<i;j++) {
                let heightHalf = i / 2;
                ctx.beginPath();
                ctx.arc(
                    canvas.width / 2 + Math.ceil(ind - widthHalf) * gap + gap * (1 - (layersSize % 2)) / 2, 
                    canvas.height / 2 + Math.ceil(j - heightHalf) * 1.5 * cR + 1.5 * cr * (1 - (i % 2)), 
                    cr, 0, 2 * Math.PI
                );
                ctx.fill();

                if(ind === 0) {
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        });

        this.levels.forEach((i, ind) => {
            let maxBias = Math.max(...i.biases.map(p => Math.abs(p)));
            i.biases.forEach((bias, j) => {
                if(bias > 0) ctx.strokeStyle = COLOR_ORANGE;
                else if(bias < 0) ctx.strokeStyle = COLOR_BLUE;

                if(maxBias !== 0) {
                    ctx.lineWidth = 2 * bias / maxBias;
                } else {
                    ctx.lineWidth = 0;
                }

                ctx.beginPath();
                ctx.arc(
                    canvas.width / 2 + Math.ceil(ind + 1 - widthHalf) * gap + gap * (1 - (layersSize % 2)) / 2,
                    canvas.height / 2 + Math.ceil(j - i.outputSize / 2) * 1.5 * cR + 1.5 * cr * (1 - (i.outputSize % 2)),
                    cr, 0, 2 * Math.PI
                );
                ctx.stroke();
            })
        });

        ctx.font = `${canvas.height / 30}px Roboto`;
        ctx.fillStyle = document.body.classList.contains('dark') ? COLOR_LIGTH : COLOR_DARK;
        ctx.fillText(`Brain of individual #${num}`, canvas.width / 100, canvas.height / 20);

        ctx.font = `${canvas.height / 32}px Roboto`;
        ctx.fillText(` - Positive values`, canvas.width * 0.82, canvas.height * 0.9);

        ctx.beginPath();
        ctx.arc(canvas.width * 0.81, canvas.height * 0.89, canvas.width / 120, 0, 2*Math.PI);
        ctx.fillStyle = COLOR_ORANGE;
        ctx.fill();

        ctx.fillStyle = document.body.classList.contains('dark') ? COLOR_LIGTH : COLOR_DARK;
        ctx.fillText(` - Negative values`, canvas.width * 0.82, canvas.height * 0.95);

        ctx.beginPath();
        ctx.arc(canvas.width * 0.81, canvas.height * 0.94, canvas.width / 120, 0, 2*Math.PI);
        ctx.fillStyle = COLOR_BLUE;
        ctx.fill();
    }
}