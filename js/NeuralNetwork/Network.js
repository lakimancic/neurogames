import Level from "./Level.js";

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
}