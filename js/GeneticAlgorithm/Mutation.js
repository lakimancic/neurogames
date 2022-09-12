export default {
    "reset": (value, mutatationChance) => {
        return (Math.random() * 100 <= mutatationChance) ? Math.random() * 4 - 2 : value;
    },
    "add": (value, mutatationChance) => {
        return value + ((Math.random() * 100 <= mutatationChance) ? Math.random() * 4 - 2 : 0);
    },
    "inverse" : (value, mutatationChance) => {
        return (Math.random() * 100 <= mutatationChance) ? -value : value;
    }
}