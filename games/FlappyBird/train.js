/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const main = document.querySelector('.container');

let aspectRatio = 144 / 256;

let HEIGHT = Math.min(main.clientHeight * 0.9, main.clientWidth * 0.9 / aspectRatio);
let WIDTH = HEIGHT * aspectRatio;

canvas.height = HEIGHT;
canvas.width = WIDTH;

ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

window.onresize = () => {
    HEIGHT = Math.min(main.clientHeight * 0.9, main.clientWidth * 0.9 / aspectRatio);
    WIDTH = HEIGHT * aspectRatio;

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

// Neural Network Options

const activationOptions = `
<option value="" selected hidden>Activation function</option>
<option value="sigmoid">Sigmoid</option>
<option value="relu">ReLU</option>
<option value="tanh">tanh</option>
`;
let pomNN = [];

const renderLayers = () => {
    let layers = document.querySelector('.options .layers');
    layers.innerHTML = '';

    pomNN.forEach((i, ind) => {
        let newLayer = document.createElement('div');
        newLayer.classList.add('layer');
        if(ind === 0) {
            newLayer.innerHTML = `Input Layer, Size: <span class="num">${i.size}</span>`;
        } else if(ind === pomNN.length - 1) {
            newLayer.innerHTML = `Output Layer, Size: <span class="num">${i.size}</span>, Activation:`;

            let dropdown = document.createElement('select');

            dropdown.innerHTML = activationOptions;
            dropdown.value = i.activation;

            dropdown.onchange = () => {
                pomNN[ind].activation = dropdown.value;
            }

            newLayer.append(dropdown);
        } else {
            newLayer.innerHTML = `Hidden Layer, Size: <span class="num">${i.size}</span>, Activation:`;

            let dropdown = document.createElement('select');

            dropdown.innerHTML = activationOptions;
            dropdown.value = i.activation;

            dropdown.onchange = () => {
                pomNN[ind].activation = dropdown.value;
            }

            newLayer.append(dropdown);

            let close = document.createElement('i');
            close.className = 'fa-solid fa-xmark';

            close.onclick = () => {
                pomNN.splice(ind, 1);

                renderLayers();
            };
            
            newLayer.append(close);
        }
        layers.appendChild(newLayer);
    });
}

const openNeuralNetworkOptions = () => {
    let options = document.getElementById('nn_options');
    options.style.display = 'flex';

    pomNN = [];
    game.state.neuralNet.forEach(i => pomNN.push({...i}));

    renderLayers();
};

document.getElementById('nn_button').onclick = openNeuralNetworkOptions;
document.getElementById('add_layer').onclick = () => {
    document.querySelector('#nn_options .error').innerHTML = "";
    if(document.getElementById('neurons_num').value === '') {
        document.querySelector('#nn_options .error').innerHTML = "You didn't enter number of neurons!";
        return;
    }
    if(Number(document.getElementById('neurons_num').value) < 1) {
        document.querySelector('#nn_options .error').innerHTML = "Number of neurons must be greater than 0!";
        return;
    }
    if(document.getElementById('activation').value === '') {
        document.querySelector('#nn_options .error').innerHTML = "You didn't choose activation function!";
        return;
    }
    pomNN.splice(pomNN.length - 1, 0, 
    { 
        size: Number(document.getElementById('neurons_num').value), 
        activation: document.getElementById('activation').value
    });
    renderLayers();
    document.getElementById('neurons_num').value = '';
    document.getElementById('activation').value = '';
};
document.getElementById('save_nn').onclick = () => {
    game.state.neuralNet = pomNN;

    document.getElementById('nn_options').style.removeProperty('display');

    game.state.resetNeuroEvolution();
};
document.getElementById('discard_nn').onclick = () => {
    document.getElementById('nn_options').style.removeProperty('display');
};

// Evolution Options

let pomEvObj = {};

const openEvolutionOptions = () => {
    let options = document.getElementById('ga_options');
    options.style.display = 'flex';

    pomEvObj = { ...game.state.evolution };

    updateGAData();
};

const updateGAData = () => {
    document.getElementById('pop_num').innerHTML = pomEvObj.population;
    document.getElementById('mut_chance').innerHTML = `${pomEvObj.mutationChance}%`;
    document.getElementById('surv_per').innerHTML = `${pomEvObj.survivorPer}%`;
    document.getElementById('surviv').value = pomEvObj.survivorPer;
    document.getElementById('parent_sel').value = pomEvObj.parentSel;
    document.getElementById('crossover').value = pomEvObj.crossover;
    document.getElementById('mutation').value = pomEvObj.mutation;
    document.getElementById('age').checked = pomEvObj.survivorSel === 'age';
    document.getElementById('fit').checked = pomEvObj.survivorSel === 'fitness';
};

document.getElementById('discard_ga').onclick = () => {
    document.getElementById('ga_options').style.removeProperty('display');
};

document.getElementById('save_ga').onclick = () => {
    game.state.evolution = pomEvObj;

    document.getElementById('ga_options').style.removeProperty('display');

    game.state.resetNeuroEvolution();
};

document.getElementById('ga_button').onclick = openEvolutionOptions;

document.getElementById('set_pop').onclick = () => {
    document.querySelector('#ga_options .error').innerHTML = "";

    if(document.getElementById("population_num").value === '') {
        document.querySelector('#ga_options .error').innerHTML = "You didn't enter population number!";
        return;
    }

    if(Number(document.getElementById("population_num").value) < 1 || Number(document.getElementById("population_num").value) > 200) {
        document.querySelector('#ga_options .error').innerHTML = "Population number must be between 1 and 200!";
        return;
    }

    pomEvObj.population = Math.floor(document.getElementById("population_num").value);

    updateGAData();
};

document.getElementById('parent_sel').onchange = () => {
    pomEvObj.parentSel = document.getElementById('parent_sel').value;
};

document.getElementById('crossover').onchange = () => {
    pomEvObj.crossover = document.getElementById('crossover').value;
};

document.getElementById('mutation').onchange = () => {
    pomEvObj.mutation = document.getElementById('mutation').value;
};

document.getElementById('set_mut').onclick = () => {
    document.querySelector('#ga_options .error').innerHTML = "";

    if(document.getElementById("mutation_chance").value === '') {
        document.querySelector('#ga_options .options').scrollTop = 0;
        document.querySelector('#ga_options .error').innerHTML = "You didn't enter mutation chance!";
        return;
    }

    if(Number(document.getElementById("mutation_chance").value) <= 0 || Number(document.getElementById("mutation_chance").value) > 5) {
        document.querySelector('#ga_options .options').scrollTop = 0;
        document.querySelector('#ga_options .error').innerHTML = "Mutation chance must be greater than 0 and less or equal than 5!";
        return;
    }

    pomEvObj.mutationChance = Number(document.getElementById("mutation_chance").value);

    updateGAData();
};

document.getElementById('age').onchange = () => {
    pomEvObj.survivorSel = document.getElementById('age').checked ? 'age' : 'fitness';
};

document.getElementById('fit').onchange = () => {
    pomEvObj.survivorSel = document.getElementById('age').checked ? 'age' : 'fitness';
};

document.getElementById('surviv').onchange = () => {
    pomEvObj.survivorPer = Number(document.getElementById('surviv').value);

    updateGAData();
};

document.getElementById('surviv').onmousemove = () => {
    pomEvObj.survivorPer = Number(document.getElementById('surviv').value);

    document.getElementById('surv_per').innerHTML = `${pomEvObj.survivorPer}%`;
};

document.getElementById('start_game').onclick = () => {
    game.state.gameOn = true;
}