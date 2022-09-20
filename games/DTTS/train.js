/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const main = document.querySelector('.container');
const upper = document.querySelector('.container2 > .upper');
const lower = document.querySelector('.container2 > .lower');

const nnCanvas = document.getElementById('nnCanvas');
const nnCtx = nnCanvas.getContext('2d');

const gaCanvas = document.getElementById('gaCanvas');
const gaCtx = gaCanvas.getContext('2d');

nnCanvas.height = Math.min(upper.clientHeight * 0.9, upper.clientWidth * 0.9 / 1.5);
nnCanvas.width = nnCanvas.height * 1.5;

gaCanvas.height = Math.min(lower.clientHeight * 0.9, lower.clientWidth * 0.9 / 2);
gaCanvas.width = gaCanvas.height * 2;

let aspectRatio = 144 / 256;

let HEIGHT = Math.min(main.clientHeight * 0.9, main.clientWidth * 0.9 / aspectRatio);
let WIDTH = HEIGHT * aspectRatio;

canvas.height = HEIGHT;
canvas.width = WIDTH;

ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

const updateCanvasSize = () => {
    HEIGHT = Math.min(main.clientHeight * 0.9, main.clientWidth * 0.9 / aspectRatio);
    WIDTH = HEIGHT * aspectRatio;

    canvas.height = HEIGHT;
    canvas.width = WIDTH;

    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    nnCanvas.height = Math.min(upper.clientHeight * 0.8, upper.clientWidth * 0.8 / 1.5);
    nnCanvas.width = nnCanvas.height * 1.5;

    gaCanvas.height = Math.min(lower.clientHeight * 0.9, lower.clientWidth * 0.9 / 2);
    gaCanvas.width = gaCanvas.height * 2;
}

window.onresize = () => {
    updateCanvasSize();
};

import Game from './src/Game.js';
// import TrainState from './src/TrainState.js';
import GameState from './src/GameState.js';

let game = new Game(canvas, ctx);

const runGame = async () => {
    await game.load();

    game.state = new GameState(game.canvas, game.ctx, game.sprites, game.pressedKeys, nnCanvas, nnCtx, gaCanvas, gaCtx);
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

    document.querySelector('#nn_options .options').scrollTop = 0;

    renderLayers();

    document.getElementById('visualize_nn').checked = (document.querySelector('.container2 > .upper').style.display === 'flex');
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

    // document.querySelector('.container2').style.display = document.querySelector('.container2 > .lower').style.display || (document.getElementById('visualize_nn').checked ? 'flex' : '');

    // document.querySelector('.container2 > .upper').style.display = (document.getElementById('visualize_nn').checked ? 'flex' : '');

    updateCanvasSize();
};
document.getElementById('discard_nn').onclick = () => {
    document.getElementById('nn_options').style.removeProperty('display');
};

document.querySelector('#nn_options .fa-circle-xmark').onclick = () => {
    document.getElementById('nn_options').style.removeProperty('display');
}

document.getElementById('visualize_nn').onchange = () => {
    document.querySelector('.container2').style.display = document.querySelector('.container2 > .lower').style.display || (document.getElementById('visualize_nn').checked ? 'flex' : '');

    document.querySelector('.container2 > .upper').style.display = (document.getElementById('visualize_nn').checked ? 'flex' : '');

    updateCanvasSize();
};

// Evolution Options

let pomEvObj = {};

const dataTypes = ['best', 'worst', 'mean', 'median'];

const openEvolutionOptions = () => {
    let options = document.getElementById('ga_options');
    options.style.display = 'flex';

    document.querySelector('#ga_options .options').scrollTop = 0;

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

    dataTypes.forEach(i => {
        document.getElementById(`show_${i}`).checked = game.state.dataShown.includes(i);
    });
};

document.getElementById('discard_ga').onclick = () => {
    document.getElementById('ga_options').style.removeProperty('display');
};

document.querySelector('#ga_options .fa-circle-xmark').onclick = () => {
    document.getElementById('ga_options').style.removeProperty('display');
}

document.getElementById('save_ga').onclick = () => {
    game.state.evolution = pomEvObj;

    document.getElementById('ga_options').style.removeProperty('display');

    game.state.resetNeuroEvolution();

    updateCanvasSize();
};

document.getElementById('visualize_ga').onchange = () => {
    dataTypes.forEach(i => {
        document.getElementById(`show_${i}`).disabled = !document.getElementById('visualize_ga').checked;
    });

    document.querySelector('.container2').style.display = document.querySelector('.container2 > .upper').style.display || (document.getElementById('visualize_ga').checked ? 'flex' : '');

    document.querySelector('.container2 > .lower').style.display = (document.getElementById('visualize_ga').checked ? 'flex' : '');

    game.state.dataShown = [];

    dataTypes.forEach(i => {
        if(document.getElementById(`show_${i}`).checked) {
            game.state.dataShown.push(i);
        }
    });

    updateCanvasSize();
};

dataTypes.forEach(i => {
    document.getElementById(`show_${i}`).onchange = () => {
        game.state.dataShown = [];
    
        dataTypes.forEach(j => {
            if(document.getElementById(`show_${j}`).checked) {
                game.state.dataShown.push(j);
            }
        });
    };
});

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
    game.state.start();

    document.getElementById('start_game').disabled = true;
    document.getElementById('pause_game').disabled = false;
    document.getElementById('stop_game').disabled = false;
};

document.getElementById('pause_game').onclick = () => {
    game.state.pause();

    document.getElementById('start_game').disabled = false;
    document.getElementById('pause_game').disabled = true;
    document.getElementById('stop_game').disabled = false;
};

document.getElementById('stop_game').onclick = () => {
    game.state.stop();

    document.getElementById('start_game').disabled = false;
    document.getElementById('pause_game').disabled = true;
    document.getElementById('stop_game').disabled = true;
};

document.getElementById('reset_game').onclick = () => {
    game.state.reset();

    document.getElementById('start_game').disabled = false;
    document.getElementById('pause_game').disabled = true;
    document.getElementById('stop_game').disabled = true;
};

// Save / Load

document.getElementById('save_game').onclick = () => {
    document.getElementById('save_con').style.display = 'flex';
};

document.querySelector('#save_con .fa-circle-xmark').onclick = () => {
    document.getElementById('save_con').style.removeProperty('display');
}

document.querySelector('#discard_s').onclick = () => {
    document.getElementById('save_con').style.removeProperty('display');
}

document.querySelector('#save_s').onclick = () => {
    if(document.getElementById('save_filename').value === '') {
        document.querySelector('#save_con .error').innerHTML = "You didn't enter save file name!";
        return;
    }

    game.state.save(document.getElementById('save_filename').value);

    document.getElementById('save_con').style.removeProperty('display');
}

document.getElementById('load_game').onclick = () => {
    document.getElementById('load_con').style.display = 'flex';

    document.querySelector('#load_con .files').innerHTML = '';

    game.state.saveObj.saveFiles.forEach(i => {
        let file = document.createElement('div');
        file.classList.add('file');

        file.innerText = i.filename;

        file.onclick = () => {
            game.state.load(i.filename);

            document.getElementById('load_con').style.removeProperty('display');
        }

        document.querySelector('#load_con .files').append(file);
    });
};

document.querySelector('#load_con .fa-circle-xmark').onclick = () => {
    document.getElementById('load_con').style.removeProperty('display');
}