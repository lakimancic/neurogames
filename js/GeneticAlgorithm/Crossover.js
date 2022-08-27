export default class Crossover{
    constructor(type, length) {
        this.type = type;
        this.length = length;

        if(type === 'onep') {
            this.point = Math.floor(Math.random() * (this.length - 1)) + 1;
        } else if(type === 'multip') {
            this.points = [];

            for(let i=0;i<=Math.sqrt(this.length);i++) {
                let newInd = Math.floor(Math.random() * this.length);

                while(this.points.findIndex(j => j === newInd) !== -1) newInd = Math.floor(Math.random() * this.length);
            }

            this.points.sort((a, b) => a - b);
        }
    }

    choose(value1, value2, ind) {
        let newValue1, newValue2;
        if(this.type === 'onep') {
            if(ind < this.point) {
                newValue1 = value1;
                newValue2 = value2;
            } else {
                newValue1 = value2;
                newValue2 = value1;
            }
        } else if(this.type === 'multip') {
            let i = 0;

            while(ind < this.points[i]) i++;

            if(i % 2 === 0) {
                newValue1 = value1;
                newValue2 = value2;
            } else {
                newValue1 = value2;
                newValue2 = value1;
            }
        } else if(this.type === 'unif') {
            if(Math.random() > 0.5) {
                newValue1 = value1;
                newValue2 = value2;
            } else {
                newValue1 = value2;
                newValue2 = value1;
            }
        } else {
            let alpha = Math.random();
            newValue1 = value1 * alpha + value2 * (1 - alpha);
            newValue2 = value2 * alpha + value1 * (1 - alpha);
        }

        return [newValue1, newValue2];
    }
};