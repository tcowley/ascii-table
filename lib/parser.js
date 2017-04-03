// parse a string into a 2d array of strings
var os = require('os');

module.exports = exports = {};

exports.parser = parser;
exports.concatSplitLines = concatSplitLines;
exports.parseRows = parseRows;
exports.parseCells = parseCells;

// TABLE, ROW and CELL PARSING:
// start/end of table
// start/end of rows
// start/end of cells

// CELL CONTENT PARSING:
// join lines ending in \
// final linebreak at end of cell is always removed

function parser(input) {
    var lines = concatSplitLines(input);
    var rows = parseRows(lines);
    var cells = rows.map(parseCells);
    
    
}

function concatSplitLines(input) {
    
    if (typeof input !== 'string') {
        throw new Error('Input must be a string');
    }
    
    var lines = [];
    var strs = input.split(os.EOL);
    for (var i = 0; i < strs.length; i++) {
        // if previous line ends in \: 
        // - remove the \ from the previous line
        // - strip leading whitespace from current line
        // - append current line to previous line
        if (i && /\\$/.test(strs[i-1])) {
            lines[lines.length - 1] = 
                lines[lines.length - 1].replace(/\\$/, '')
                + strs[i].replace(/^\s*/, '');
        }
        else {
            lines.push(strs[i]);
        }
    }
    return lines;
}

function parseRows(lines) {
    
    if (!Array.isArray(lines) || !lines.length) {
        throw new Error('lines must be an array of strings');
    }
    else {
        lines.forEach(function(line) {
            if (typeof line !== 'string') {
                throw new Error('lines must be an array of strings');
            }
        });
    }
    
    var rows = [];
    var row = [];
    lines.forEach(function(line, i) {
        // start a new line iff:
        // - this is the first line in the input array
        // - line starts with unescaped |
        if (!i || line === '|' || /^\|[^|]/.test(line)) {
            row.length && rows.push(row);
            row = [];
        }
        row.push(line);
    });
    row.length && rows.push(row);
    
    return rows;
}

function parseCells(row) {
    // row is an array of lines
    var cells = [];
    var cell = [];
    row.forEach(function(line) {
        var str = line.split('|');
        str.shift();
        for (var i = 1; i < str.length; i++) {
            // if the previous line is empty, we had an escaped delimiter
            if (!str[i - 1].length) {
                str[i - 2] += '|' + str[i];
            }
        }
        // split the line on 
    });
    
}

// split input string into array
// create a rows array
// create a cells array

