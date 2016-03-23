// --------------------------------------------------------------------------------
// Format a set of rows into an ascii-style table
// --------------------------------------------------------------------------------

var os = require('os');
var stringAlign = require('string-align');
var stringSplit = require('string-split');

exports = module.exports = {};

exports.asciiTable = asciiTable;
exports.normalizeColumns = normalizeColumns;
exports.getRowLength = getRowLength;
exports.getRowWithMostFields = getRowWithMostFields;
exports.validateRows = validateRows;
exports.validateRow = validateRow;
exports.normalizeBorder = normalizeBorder;
exports.normalizePadding = normalizePadding;
exports.normalizeMargin = normalizeMargin;


// --------------------------------------------------------------------------------
// Methods
// --------------------------------------------------------------------------------

/**
 * Format a set of rows as an ascii table
 * 
 * All params are optional, except rows. 
 * 
 * Rows formats:
 *  
 *  1) [array, array, ...]
 *     Each row is an array of strings. Each string will be displayed in 
 *     order, unless the columns format is an array, and each object has a 
 *     name property with a value corresponding to an index.
 *     
 *  2) [obj, obj, ...]
 *     Each row is an object. This format requires that the columns
 *     config is an array, and each object must have a 'name' property.
 * 
 * 
 * Columns formats:
 * 
 *  1) {alignment: , width: }
 *     This format will apply the same params to all cells in the
 *     Rows data. All params are optional.
 *      - alignment:  'left', 'right', 'center', 'justify'
 *                    default 'left'
 *      - width:      N (num columns), 'N%' (percentage width)
 *                    default is avg available space.
 *      
 *  2) [{name:, alignment:, width:},...]   
 *     This format specifies which columns to print, and separate params for
 *     each one. All params are optional.
 *      - name:       int, an index for rows that are arrays
 *                    string, property name for rows that are objects
 *                    default is the current index of the  parent array.
 *                    If name is used, and does 
 *      - alignment:  'left', 'right', 'center', 'justify'
 *      - width:      N (num columns), 'N%' (percentage width)
 *
 * NOTE: The generated output will default to the width of process.stdout.columns.
 * However, supplied column widths can generate output that is smaller or larger
 * than this width. For best results, make sure that column widths add up
 * correctly, OR leave some widths empty so that they can be auto-assigned the
 * available remaining space without exceeding screen width.
 *
 * 
 * @param rows       [array, array, ...] OR [obj, obj, ...]
 * @param columns    {alignment, width} OR [{name, alignment, width}, ...]
 * @param border     Char: '', ' ', '-', default '-'
 * @param padding    Int, default 1
 * @param margin     Int, default 0
 */
function asciiTable(rows, columns, border, padding, margin) {
    
    var config;
    var lines;
    var output;

    config = normalizeConfig(rows, columns, border, padding, margin);
   
    lines = generateLines(config);
    output = combineLines(config); 
    
    // NOTE: rows may be empty, generate an empty grid anyway.
    // generateRowLines(row, border, padding)
    // - combine row values array into lines
    // combineRowLines(rows, border, padding, margin)
    // - add padding and border rows
    // - add margin
    // - rows.join(os.EOF)
    
}

function normalizeConfig(rows, columns, border, padding, margin) {
    var config = {};
    
    config.width = process.stdout.columns;
    config.border = normalizeBorder(border);
    config.borderWidth = config.border.length;
    config.padding = normalizePadding(padding);
    config.margin = normalizeMargin(margin);
    config.columns = normalizeColumns(columns, rows, config.width, config.borderWidth, config.padding, config.margin);
    config.rows = normalizeRows(rows, columns);
    
    return config;
}

function normalizeColumns(columns, rows, totalWidth, borderWidth, padding, margin) {
    
    var normalizedColumns;
    var longestRow;
    var availWidth;
    var numColumnsWithNoWidth;
    var columnWidth;
    var rowType = rows.length ? Array.isArray(rows[0]) ?  'array' : 'object' : 'empty';
    
    columns = columns || {};

    validateRows(rows); // sanity check basic structure of raw rows 
    
    // CASE 1: columns is an array
    // - normalize each column config
    if (Array.isArray(columns)) {
        
        // make sure all columns have a name attribute
        if (rowType === 'object') {
            columns.forEach(function(column) {
                if (!column.name) {
                    throw new Error('column must have a name property if rows are objects.')
                }
            });
        }

        // first pass: normalize column objects, identify specified widths
        availWidth = Math.max(columns.length, totalWidth - margin - borderWidth - (padding * 2 * columns.length));
        
        normalizedColumns = columns.map(function(column, i){
            var newColumn = {
                name: rowType === 'object' ? column.name : i,
                alignment: columns.alignment || 'left',
            };
            if (column.hasOwnProperty('width')) {
                if (Math.abs(column.width) !== column.width) {
                    throw new Error('column width must be a positive number');
                }
                newColumn.width = column.width;
                availWidth -= column.width;
            } 
            else {
                numColumnsWithNoWidth++;
            }
            return newColumn;
        });
        
        columnWidth = Math.floor(availWidth/numColumnsWithNoWidth);
        
        // populate remaining widths
        normalizedColumns.forEach(function(column){
            var width;
            if (!column.hasOwnProperty('width')) {
                width = numColumnsWithNoWidth ? columnWidth : availWidth;
                numColumnsWithNoWidth--;
                availWidth -= width;
                column.width = width;
            }
        });
    }
    
    // CASE 2: columns is an object to be applied to all fields 
    // - generate an array of column configs, one for every field in the data.
    else {
        
        // rows is an empty array
        if (!rows.length) {
            normalizedColumns = [{}];
        }

        // rows is an array of arrays
        else {
            
            longestRow = getRowWithMostFields(rows);
            normalizedColumns = Array.apply(null, Array(longestRow.length));
            availWidth = Math.max(longestRow.length, totalWidth - margin - borderWidth - (padding * 2 * longestRow.length)) ;
            
            // row are arrays: generate field names that are indexes
            if (Array.isArray(longestRow)) {
                normalizedColumns = normalizedColumns.map(function(field, i) { return i; });
            }
            // rows are objects: find all unique field names 
            else {
                normalizedColumns = [];
                rows.forEach(function(row) {
                    Object.keys(row).forEach(function(field) {
                        ~normalizedColumns.indexOf(field) || normalizedColumns.push(field);
                    });
                });
            }
                
            normalizedColumns = normalizedColumns.map(function(name, i) {
                var width = i === longestRow.length - 1 ? availWidth : Math.floor(availWidth/longestRow.length);
                var column = {
                    name: name,
                    alignment: columns.alignment || 'left',
                    width: columns.width || width,
                };
                availWidth -= width;
                return column;
            });
        }
    }
    
    return normalizedColumns;
}

function normalizeRows(rows, columns) {
    // normalizeRow(row, columns);
    // - add an empty string for all missing values
    // - split each value to the correct width (results in an array)
    // - align text
    // - rowHeight = row.reduce(findLongestArray)
    // - pad each row values array to rowHeight
}

// --------------------------------------------------------------------------------
// helpers
// --------------------------------------------------------------------------------

function validateRows(rows) {
    var prevRowType;
    if (!Array.isArray(rows)) {
        throw new Error('rows must be an array');
    }
    if (!rows.length) {
        throw new Error('rows must have at least one row');
    }
    // rows must be all objects or all arrays
    rows.forEach(function(row, i) {
        var rowType = validateRow(row);
        if (i && rowType !== prevRowType) {
            throw new Error('rows must contain all objects or all arrays');
        }
        prevRowType = rowType;
    });
}

function validateRow(row) {
    if (!Array.isArray(row) && typeof row !== 'object') {
        throw new Error('row is not an array or object');
    }
    return Array.isArray(row);
}

function getRowWithMostFields(rows) {
    var row = null;
    validateRows(rows);
    if (rows.length) {
        row = rows.reduce(function(l,r) {
            return getRowLength(l) > getRowLength(r) ? l : r;
        });
    }
    return row;
}

function getRowLength(row) {
    validateRow(row);
    return Array.isArray(row) ? row.length : Object.keys(row).length ;
}

function normalizeBorder(border) {
    switch (border) {
    case '':
    case ' ':
        return border;
    default:
        return '-';
    }
}

function normalizePadding(padding) {
    if (typeof padding === 'undefined') {
        return 1;
    }
    else if (Math.abs(Math.round(padding)) === +padding) {
        return +padding;
    }
    throw new Error('padding must be a positive integer');
}

function normalizeMargin(margin) {
    if (typeof margin === 'undefined') {
        return 1;
    }
    else if (Math.abs(Math.round(margin)) === +margin) {
        return +margin;
    }
    throw new Error('margin must be a positive integer');
}




// --------------------------------------------------------------------------------
// previous stuff
// --------------------------------------------------------------------------------




function formatTable(rows, columns, borders, leftOffset) {
    var config;
    config = normalizeConfig(rows, columns, borders, leftOffset);
    generateRowLines(config);
    return render(config);
}

function normalizeConfig(columns, rows, borders, leftOffset) {
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

}

function generateRowLines(config) {
    // SPLIT FIELDS INTO ARRAYS OF LINES
    config.rows.forEach(function(row){
        config.columns.forEach(function(col) {
            row[col.name] = stringSplit(row[col.name], col.actualWidth);
        });
    });

    console.log(config.rows);
    console.log(config.columns);
}

function render(config) {
    var spaces = (new Array(process.stdout.columns)).join(' ');

    // --------------------------------------------------------------------------------
    // PAD ALL LINES ARRAYS
    // --------------------------------------------------------------------------------

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
                row[col.name][i] = stringAlign(line, col.actualWidth, align);
            });
        });
        // make each lines array the same length
        config.columns.forEach(function(col) {
            var paddingRows = Array.apply(null, Array(maxLines - row[col.name].length)).map(String.prototype.valueOf, spaces.slice(0, col.actualWidth));
            row[col.name] = row[col.name].concat(paddingRows);
        });
    });

    // --------------------------------------------------------------------------------
    // RENDER FINAL STRINGS
    // --------------------------------------------------------------------------------

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
        });
        lines = lines.join(os.EOL);
        rows.push(lines);
        rows.push(rowSeparator);
    });
    //console.log(rows);
    //console.log(rows.join())

    return rows.join(os.EOL);
}

