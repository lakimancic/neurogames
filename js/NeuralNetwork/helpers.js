// Activation Functions

const ActivationFunctions = {
    "sigmoid" : (num) => 1 / ( 1 + Math.pow(Math.E, -num)),
    "tanh": (num) => Math.tanh(num),
    "relu": (num) => Math.max(0, num)
};

export { ActivationFunctions };