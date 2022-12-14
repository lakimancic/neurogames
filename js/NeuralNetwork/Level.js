import { ActivationFunctions } from "./helpers.js";

export default class Level {
    constructor(inputSize, outputSize, activationName = "sigmoid") {
        this.inputSize = inputSize;
        this.outputSize = outputSize;
        this.biases = new Array(outputSize);

        this.weights = [];
        for(let i=0;i<inputSize;i++) this.weights[i] = new Array(outputSize);

        this.activation = ActivationFunctions[activationName];

        this.randomize();
    }

    randomize() {
        for(let i=0;i<this.inputSize;i++) {
            for(let j=0;j<this.outputSize;j++) {
                this.weights[i][j] = Math.random() * 2 - 1;
            }
        }

        for(let i=0;i<this.biases.length;i++) this.biases[i] = Math.random() * 2 - 1;
    }

    feedForward(inputs) {
        let outputs = new Array(this.outputSize);

        for(let i=0;i<this.outputSize;i++) {
            let sum = 0;

            for(let j=0;j<this.inputSize;j++) sum += inputs[j] * this.weights[j][i];

            sum += this.biases[i];

            outputs[i] = this.activation(sum);
        }

        return outputs;
    }

    set(level, activation) {
        this.inputSize = level.inputSize;
        this.outputSize = level.outputSize;

        this.weights = JSON.parse(JSON.stringify(level.weights));

        this.biases = JSON.parse(JSON.stringify(level.biases));

        this.activation = ActivationFunctions[activation];
    }
}