const shuffle = (array) => {
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {

        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
};

export default {
    "roulette" : (population) => {
        let sum = population.reduce((a, b) => a + b.fitness, 0);

        let first = sum * Math.random();
        let i = 0;

        let pomsum = population[0].fitness;

        while(pomsum < first) {
            i++;
            pomsum += population[i].fitness;
        }

        let j = 0;

        let second = sum * Math.random();

        pomsum = population[0].fitness;

        while(pomsum < second) {
            j++;
            pomsum += population[j].fitness;
        }

        return [i, j];
    },
    "sus" : (population) => {
        let sum = population.reduce((a, b) => a + b.fitness, 0);

        let first = sum * Math.random();
        let i = 0;

        let pomsum = population[0].fitness;

        while(pomsum < first) {
            i++;
            pomsum += population[i].fitness;
        }

        let j = (i + Math.floor(population.length / 2)) % population.length;

        return [i, j];
    },
    "tour" : (population) => {
        let indeces = [];
        for(let i=0;i<population.length;i++) indeces.push(i);

        const half = Math.floor(population.length / 2);

        shuffle(indeces);

        let first = indeces.slice(0, half);
        let i = 0;
        for(let k=1;k<half;k++) {
            if(first[k] > first[i]) i = k;
        }

        let second = indeces.slice(half);
        let j = 0;
        for(let k=1;k<half;k++) {
            if(second[k] > second[j]) j = k;
        }

        return [i, j];
    },
    "rand": (population) => {
        let i = Math.floor(Math.random() * population.length);

        let j = Math.floor(Math.random() * population.length);

        while(i === j) {
            j = Math.floor(Math.random() * population.length);
        }

        return [i, j];
    }
};