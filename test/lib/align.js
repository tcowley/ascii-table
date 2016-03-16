#!/usr/bin/env node

var table = require('../../index.js');

//var str = 'one two three four five six seven eight ninetynine onhundred';
var str = 'one two three four'; 
[
    [str, 30, 'left'],
    [str, 30, 'right'],
    [str, 31, 'center'],
    [str, 30, 'justify'],
].forEach(function(line) {
    var output = table.fillRowLine.apply(null, line);
    console.log(output, '|', line[2]);
});


