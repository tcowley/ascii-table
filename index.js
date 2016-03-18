/**
 * Module dependencies
 */
    
var table = module.exports = {};
var os = require('os');
var spaces = (new Array(process.stdout.columns)).join(' ');

table.formatTable = function(columns, rows, borders, leftOffset) {
    var config = table.generateConfig(columns, rows, borders, leftOffset);
    table.generateRowLines(config);
    var output = table.render(config);
    return output;
};

table.generateConfig = function(columns, rows, borders, leftOffset) {
    var config = {};
    var alignments = ['left', 'right', 'center', 'justify'];

    config.borders = typeof borders !== 'undefined' ? borders : false;
    config.leftOffset = leftOffset || 0;
    
    // generate clean row definitions

    config.rows = rows.map(function(orig) {
        var clone = {};
        columns.forEach(function(column) {
            var columnName = typeof column === 'string' ? column : column.name;
            clone[columnName] = orig.hasOwnProperty(columnName) ? orig[columnName] : '';
        });
        return clone;
    });

    // generate clean column definitions
    
    var maxTableWidth = process.stdout.columns - config.leftOffset;
    var spaceBetweenCells = ((columns.length - 1)*3);  // 3px between columns
    var spaceAroundTableEdge = config.borders ? 4 : 0; // 2px on outer sides IFF borders = true
    var leftOverWidth = maxTableWidth - spaceBetweenCells - spaceAroundTableEdge;
    var avgColWidth = Math.floor(leftOverWidth/columns.length);
    
    config.columns = columns.map(function(orig) {
        var clone = {};
        clone.name = typeof orig === 'string' ? orig : orig.name;
        clone.align = alignments.indexOf(orig.align) > -1 ? orig.align: 'left';
        clone.desiredWidth = orig.width*1 || config.rows.reduce(function (prev, curr) {
            var prevLength = prev[clone.name].length || 0;
            var currLength = curr[clone.name].length || 0;
            return prevLength > currLength ? prev : curr;
        })[clone.name].length;
        clone.desiredWidth = clone.desiredWidth < clone.name.length ? clone.name.length : clone.desiredWidth;
        clone.actualWidth = clone.desiredWidth < avgColWidth ? clone.desiredWidth : avgColWidth;
        leftOverWidth -= clone.actualWidth;
        return clone;
    });
    
    // adjust column widths, via simple round-robin allocation

    while (leftOverWidth > 0) {
        config.columns.forEach(function(column) {
            if (leftOverWidth > 0 && column.actualWidth < column.desiredWidth ) {
                column.actualWidth++;
                leftOverWidth--;
            }
        })
        if (!config.columns.some(function(column) { return column.actualWidth < column.desiredWidth; })) {
            break;
        }
    }


    //var columnsWidth = 0; 
    //var eq = '=';
    //config.columns.forEach(function(column) { columnsWidth += column.actualWidth*1});
    //console.log( process.stdout.columns );
    //console.log( config.leftOffset + maxTableWidth, eq, config.leftOffset, maxTableWidth );
    //console.log( columnsWidth + spaceBetweenCells + spaceAroundTableEdge, eq, columnsWidth, spaceBetweenCells, spaceAroundTableEdge);
    //console.log( columnsWidth, eq, config.columns.map(function(column) { return column.actualWidth}).join(', ')  );
    
    //console.log(config.columns)
    //console.log(config.columns, config.rows);
    
    return config;

};

table.generateRowLines = function(config) {
    //console.log(config.rows);
    
    config.rows.forEach(function(row){
        // SPLIT FIELDS INTO ARRAYS OF LINES
        config.columns.forEach(function(col) {
            // convert the field from a single line into an array of lines
            var words = row[col.name].split(' ');
            var lines = [];
            var line = '';
            //console.log('----- orig', col.actualWidth, row[col.name]);
            words.forEach(function(word) {

                // start a new line if the line is empty
                if (!line.length) {
                    line = word;
                    //console.log('starting a new line', word, '|', line)
                }
                // start a new line if the next word is small and doesn't fit existing line
                else if ( line.length + word.length + 1 <= col.actualWidth ) {
                    line += ' ' + word;
                    //console.log('appending small word to line', word, '|', line, line.length, word.length, col.actualWidth)
                }
                // existing line, at least 5 spaces left, word is at least 6 letters long
                else if ( line.length + 5 <= col.actualWidth && word.length > 5) {
                    // fill the rest of the line
                    var offset = col.actualWidth - line.length - 2; // available space
                    // but, there must be at least 3 chars after the split
                    offset = offset > word.length - 3 ? word.length - 3 : offset;

                    line += ' ' + word.substring(0, offset) + '-';
                    lines.push(line);
                    line = word.substring(offset);
                    //console.log('append then split large word across lines', word, '|', line)
                }
                // start a new line 
                else {
                    lines.push(line);
                    line = word;
                    //console.log('line doesnt fit, start new line with word: ', word, '|', line)
                }

                // wrap all really long words onto additional lines
                while (line.length > col.actualWidth) {
                    lines.push(line.substring(0, col.actualWidth-1) + '-');
                    line = line.substring(col.actualWidth-1);
                }
            });
            lines.push(line);
            row[col.name] = lines;
        });
    });
    
    console.log(config.rows);
    console.log(config.columns);
};

table.fillRowLine = function(line, width, align) {
    var paddedLine = '';
    switch (align) {
        case 'right':
            paddedLine = (spaces + line).slice(-1*width);
            break;
        case 'center':
            var left = Math.ceil((width - line.length)/2);
            var right = width - line.length - left;
            //console.log(left, right, line.length, width)
            paddedLine = (spaces + line).slice(-1*(line.length + left));
            paddedLine = (paddedLine + spaces).slice(0, width);
            break;
        case 'justify':
            var words = line.split(' ');
            // use cases:
            // - no words: just spaces
            // - one word
            // - 2+ words
            if (words.length < 2) {
                paddedLine = (spaces).slice(0, width);
            }
            else {
                var padding = spaces.slice(0, width - line.length).split('')
                while (padding.length && padding.length < width) {
                    words = words.map(function(word, i) {
                        return i && padding.length ? padding.shift() + word : word;
                    });
                }
                paddedLine = words.join(' ');
            }
            break;
        default: // 'left'
            paddedLine = (line + spaces).slice(0, width);
    }
    return paddedLine;
};

table.render = function(config) {
    
    // PAD ALL LINES ARRAYS
    config.rows.forEach(function(row){
        var maxLines = 0;
        // pad each line with spaces
        config.columns.forEach(function(col) {
            maxLines = row[col.name].length > maxLines ? row[col.name].length : maxLines;
            row[col.name].forEach(function(line, i) {
                var align = col.align;
                // special case: don't justify the last line of a justified array of lines
                if (align === 'justify' && i === row[col.name].length - 1) {
                    align = 'left';
                }
                row[col.name][i] = table.fillRowLine(line, col.actualWidth, align);
            });
        });
        // make each lines array the same length
        config.columns.forEach(function(col) {
            var paddingRows = Array.apply(null, Array(maxLines - row[col.name].length)).map(String.prototype.valueOf, spaces.slice(0, col.actualWidth));
            row[col.name] = row[col.name].concat(paddingRows);
        });
    });

    // RENDER FINAL STRINGS
    var rows = [];
    var rowSeparator = [];
    config.rows.forEach(function(row, i){
        var lines = [];
        config.columns.forEach(function(col) {
            row[col.name].forEach(function(line, i) {
                lines[i] = lines[i] || [];
                lines[i].push(line);
            });
            i || rowSeparator.push(spaces.slice(0, col.actualWidth));
        });
        if (!i) {
            rowSeparator = rowSeparator.join('-+-').replace(/ /g, '-');
            rowSeparator = '+-' + rowSeparator + '-+';
            rowSeparator = spaces.slice(0, config.leftOffset) + rowSeparator;
            if (!config.borders) {
                rowSeparator = rowSeparator.replace(/[-+]/g, ' ');
            }
            rows.push(rowSeparator)
        }
        lines.forEach(function(line, i) {
            line = line.join(config.borders ? ' | ' : '   ');
            if (config.borders) {
                line = '| ' + line + ' |';
            }
            lines[i] = spaces.slice(0, config.leftOffset) + line;
        })
        lines = lines.join(os.EOL);
        rows.push(lines);
        rows.push(rowSeparator);
    });
    //console.log(rows);
    //console.log(rows.join())
    
    return rows.join(os.EOL); 
};

// --------------------------------------------------------------------------------
// Methods
// --------------------------------------------------------------------------------

