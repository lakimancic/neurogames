export default {
    "age": (population, survivePer) => {
        let sorted = [...population];
        sorted.sort((a, b) => {
            if(a.age === b.age) return b.fitness - a.fitness;
            return a.age - b.age;
        });
        let count = Math.floor(population.length * survivePer / 100);

        return sorted.slice(0, count);
    },
    "fitness" : (population, survivePer) => {
        let sorted = [...population];
        sorted.sort((a, b) => {
            if(b.fitness === a.fitness) return b.age - a.age;
            return b.prevFitness - a.prevFitness;
        });
        let count = Math.floor(population.length * survivePer / 100);

        return sorted.slice(0, count);
    }
}