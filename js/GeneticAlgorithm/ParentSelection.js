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

        do {
            let second = sum * Math.random();
            j = 0;

            pomsum = population[0].fitness;

            while(pomsum < second) {
                j++;
                pomsum += population[j].fitness;
            }
        } while(i === j);

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
        let max1 = Math.max(...first.map(k => population[k].fitness));
        let i = first.find(k => population[k].fitness === max1);

        let second = indeces.slice(half);
        let max2 = Math.max(...second.map(k => population[k].fitness));
        let j = second.find(k => population[k].fitness === max2);

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