export default {
    "age": (population, survivePer) => {
        let sorted = [...population];
        sorted.sort((a, b) => a.age - b.age);
        let count = Math.floor(population.length * survivePer / 100);

        return sorted.slice(0, count);
    },
    "fitness" : (population, survivePer) => {
        let sorted = [...population];
        sorted.sort((a, b) => b.fitness - a.fitness);
        let count = Math.floor(population.length * survivePer / 100);

        return sorted.slice(0, count);
    }
}