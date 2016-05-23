// --------------------------------------------------------------------------------
// Format a set of rows into an ascii-style table
// --------------------------------------------------------------------------------

var os = require('os');
var asciiStringAlign = require('ascii-string-align');
var asciiStringSplit = require('ascii-string-split');

exports = module.exports = {};

exports.asciiTable = asciiTable;
exports.normalizeConfig = normalizeConfig;
exports.normalizeColumns = normalizeColumns;
exports.getRowLength = getRowLength;
exports.getRowWithMostFields = getRowWithMostFields;
exports.validateRows = validateRows;
exports.validateColumns = validateColumns;
exports.validateRow = validateRow;
exports.normalizeBorder = normalizeBorder;
exports.normalizePadding = normalizePadding;
exports.normalizeMargin = normalizeMargin;
exports.normalizeColumnsFromObject = normalizeColumnsFromObject;
exports.normalizeColumnsFromArray = normalizeColumnsFromArray;
exports.normalizeRows = normalizeRows;
exports.generateEdgeLine = generateEdgeLine;
exports.generateTable = generateTable;


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
 * @param leftMargin Int, default 0
 */
function asciiTable(config) {
    var normalConfig = normalizeConfig(config);
    return generateTable(normalConfig);
}

function normalizeConfig(origConfig) {
    
    var config = {};

    config.margin = normalizeMargin(origConfig.margin);
    config.width = (process.stdout.columns || config.margin) - config.margin;
    config.border = normalizeBorder(origConfig.border);
    config.borderWidth = config.border.length;
    config.padding = normalizePadding(origConfig.padding);
    config.columns = normalizeColumns(origConfig.columns, origConfig.rows, config.width, config.borderWidth, config.padding);
    config.rows = normalizeRows(config.columns, origConfig.rows, true, true);
    
    return config;
}

function generateTable(config) {
    var margin = asciiStringAlign('', config.margin);
    var padding = asciiStringAlign('', config.padding);
    var borderLine = generateEdgeLine(config);
    var paddingLine = generateEdgeLine(config, true);

    // join all rows 
    config.rows = config.rows.map(function(row, i) {
        var maxFieldLength = 0;
        var newRow = [];
        var fillArray;
        
        // split and align fields
        config.columns.forEach(function(column) {
            var width = column.width - config.padding*2;
            var fieldArray;
            fieldArray = asciiStringSplit(row[column.name], width);
            fieldArray = fieldArray.map(function(line, i) {
                if (column.align === 'justify' && i === fieldArray.length - 1) {
                    return asciiStringAlign(line, width, 'left');
                }
                return asciiStringAlign(line, width, column.alignment);
            });
            
            if (fieldArray.length > maxFieldLength) {
                maxFieldLength = fieldArray.length;
            }
            newRow.push(fieldArray);
        });
        
        // pad field arrays to the same length
        config.columns.forEach(function(column, i) {
            var width = column.width - config.padding*2;
            var spaces = asciiStringAlign('', width);
            fillArray = Array.apply(null, Array(maxFieldLength)).map(String.prototype.valueOf, spaces);
            newRow[i] = newRow[i].concat(fillArray).slice(0, maxFieldLength);
        });

        // join lines of fields with padding, borders and margin
        var lines = [];
        newRow.forEach(function(fieldArray, i) {
            fieldArray.forEach(function(line, j) {
                // add initial margin + border
                if (!i) {
                    lines[j] = margin;
                    lines[j] += config.border;
                }
                // add padding + content + padding + border
                lines[j] += padding + line + padding + config.border;
            });
        });

        // add border and padding lines to the top and bottom of the row
        for (var i=0; i < config.padding; i++ ) {
            lines.unshift(paddingLine);
            lines.push(paddingLine);
        }
        config.borderWidth && lines.unshift(borderLine);
        
        return lines.join("\n");
    });
    
    // add border lines to the bottom of the grid
    config.borderWidth && config.rows.push(borderLine);

    return config.rows.join("\n");
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

function validateColumns(columns) {
    if (!Array.isArray(columns)) {
        throw new Error('columns must be an array');
    }
    if (!columns.length) {
        throw new Error('columns must have at least one row');
    }
    // rows must be all objects or all arrays
    columns.forEach(function(column) {
        if (typeof column !== 'object') {
            throw new Error('columns must contain all objects');
        }
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
    case ' ':
    case '|':
        return border;
    default:
        return '';
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

function normalizeColumns(columns, rows, totalWidth, borderWidth, padding) {
    if (!Array.isArray(columns)) {
        columns = normalizeColumnsFromObject(columns, rows);
    }
    return normalizeColumnsFromArray(columns, totalWidth, borderWidth, padding);
}

function normalizeColumnsFromObject(columns, rows) {

    var longestRow;
    var normalizedColumns;

    if (typeof columns !== 'object') {
        throw new Error('columns must be an object');
    }

    validateRows(rows); // sanity check basic structure of raw rows 


    // --------------------------------------------------------------------------------
    // GENERATE FIELD NAMES
    // --------------------------------------------------------------------------------
    
    longestRow = getRowWithMostFields(rows);
    normalizedColumns = Array.apply(null, Array(longestRow.length));

    // row are arrays: generate field names that are indexes
    if (Array.isArray(longestRow)) {
        normalizedColumns = normalizedColumns.map(function(columnName, i) { return i; });
    }
    // rows are objects: find all unique field names 
    else {
        normalizedColumns = [];
        rows.forEach(function(row) {
            Object.keys(row).forEach(function(columnName) {
                ~normalizedColumns.indexOf(columnName) || normalizedColumns.push(columnName);
            });
        });
    }

    // --------------------------------------------------------------------------------
    // convert column names to column config objects
    // --------------------------------------------------------------------------------

    normalizedColumns = normalizedColumns.map(function(columnName, i) {
        return {
            name: columnName,
            alignment: columns.alignment,
            width: columns.width
        };
    });

    return normalizedColumns;

}

function normalizeColumnsFromArray(columns, tableWidth, borderWidth, padding, skipValidateColumns) {

    // --------------------------------------------------------------------------------
    // validate and init
    // --------------------------------------------------------------------------------

    var availableWidth = tableWidth - (columns.length + 1)*borderWidth;
    var minColWidth = 2 + padding*2;
    var unusedWidth = availableWidth;
    var totalEmptyColumns = 0;
    var totalColumnWidths = 0;
    var averageWidth;

    skipValidateColumns || validateColumns(columns);
    
    if (!/^\d+$/.test(tableWidth)) {
        throw new Error('table width must be a whole number');
    }
    if (!/^\d+$/.test(borderWidth)) {
        throw new Error('border width must be a whole number');
    }
    if (!/^\d+$/.test(padding)) {
        throw new Error('padding must be a whole number');
    }


    // --------------------------------------------------------------------------------
    // FIRST PASS OVER COLUMNS
    // --------------------------------------------------------------------------------
    // - normalize existing column widths, ensure they are minColWidth
    // - normalize alignment
    // - validate name

    columns.forEach(function(column) {
        
        // validate alignment
        if (!~[undefined, 'left', 'right', 'center', 'justify'].indexOf(column.alignment)) {
            throw new Error('alignment must be one of "left", "right", "center" or "justify"');
        }

        // validate name
        if (typeof column.name === 'undefined') {
            throw new Error('name must be provided');
        }
    
        //
        // column width
        //
        
        // normalize width phase 1: only widths with values 
        if (/^\d+%$/.test(column.width)) {
            column.width = Math.max(minColWidth, Math.floor(column.width.slice(0,-1)*availableWidth/100));
        }
        else if (/^\d+$/.test(column.width)) {
            column.width = Math.max(minColWidth, column.width);
        }
        else if (typeof column.width !== 'undefined') {
            throw new Error('width must be a whole number, or a percentage. eg 50, "50", "50%"');
        }
        // calculate unused width:
        if (column.width) {
            unusedWidth -= column.width
        }
        // tally number of columns with no defined width
        else {
            totalEmptyColumns++;
        }
        

    });

    // calculate average column width, must be minimum width
    unusedWidth = Math.max(unusedWidth, totalEmptyColumns*minColWidth);
    averageWidth = Math.floor(unusedWidth/totalEmptyColumns);

    // --------------------------------------------------------------------------------
    // SECOND PASS OVER COLUMNS
    // --------------------------------------------------------------------------------
    // - assign width to columns with no width
    // - allocate remaining table width to final column

    columns.forEach(function(column, i) {
        if (!column.width) {
            totalEmptyColumns--;
            column.width = totalEmptyColumns ? averageWidth : unusedWidth;
            unusedWidth -= column.width;
        }
        totalColumnWidths += column.width;

        // adjust last column to ensure table is at least tableWidth wide.
        if (i === columns.length - 1 && totalColumnWidths < availableWidth) {
            column.width += availableWidth - totalColumnWidths;
        }

    });

    return columns;
}

function normalizeRows(columns, rows, skipValidateColumns, skipValidateRows) {
    var maxRowLength = columns.length;
    var normalizedRows;
    var emptyRow;
    var fieldNames;

    skipValidateColumns || validateColumns(columns);
    skipValidateRows || validateRows(rows);

    // ARRAY
    if (Array.isArray(rows[0])) {
        emptyRow = Array.apply(null, Array(maxRowLength)).map(String.prototype.valueOf, '');
        normalizedRows = rows.map(function(row) {
            return row.concat(emptyRow).slice(0, maxRowLength);
        });
    }
    // OBJECT
    else {
        fieldNames = columns.map(function(column) { return column.name;});
        normalizedRows = rows.map(function(row) {
            var normalizedRow = {};
            fieldNames.forEach(function(fieldName) {
                normalizedRow[fieldName] = row[fieldName] || '';
            });
            return normalizedRow;
        });
    }

    return normalizedRows;
}

function generateEdgeLine(config, isPadding) {
    var separatorLine = asciiStringAlign('', config.margin);
    var separatorBorder;
    var content = ' ';
    
    switch (config.border) {
    case ' ':
        separatorBorder = ' ';
        break;
    case '|':
        separatorBorder = isPadding ? '|' : '+';
        content = isPadding ? ' ' : '-';
        break;
    default:
        separatorBorder = '';
    }

    config.columns.forEach(function(column, i) {
        !i && (separatorLine += separatorBorder);
        separatorLine += (new Array(column.width + 1)).join(content) + separatorBorder;
    });
    return separatorLine;
}


