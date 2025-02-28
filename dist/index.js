"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = __importDefault(require("inquirer"));
const colors_1 = __importDefault(require("colors"));
inquirer_1.default
    .prompt([
    {
        type: 'list',
        message: 'What is your favorite color?',
        name: 'color',
        choices: ['red', 'blue', 'green', 'yellow', 'cyan', 'magenta'],
    },
])
    .then((response) => console.log(colors_1.default[response.color](`Your favorite color is ${response.color}!`)));
