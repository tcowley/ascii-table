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
exports.normalizeColumnsFromObject = normalizeColumnsFromObject;
exports.normalizeColumnsFromArray = normalizeColumnsFromArray;


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
    var fn = Array.isArray(columns) ? normalizeColumnsFromArray : normalizeColumnsFromObject;
    return fn(columns, rows, totalWidth, borderWidth, padding, margin);
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

function normalizeColumnsFromObject(columns, rows, totalWidth, borderWidth, padding, margin) {

    var normalizedColumns;
    var longestRow;
    var availWidth;
    var avgWidth;

    if (typeof columns !== 'object') {
        throw new Error('columns must be an object');
    }

    validateRows(rows); // sanity check basic structure of raw rows 
    
    // give these real numeric values to avoid NaN during testing.
    totalWidth = totalWidth || 0;
    borderWidth = borderWidth || 0;
    padding = padding || 0;
    margin = margin || 0;

    longestRow = getRowWithMostFields(rows);
    normalizedColumns = Array.apply(null, Array(longestRow.length));
    availWidth = Math.max(longestRow.length, totalWidth - margin - borderWidth - (padding * 2 * longestRow.length)) ;
    avgWidth = Math.floor(availWidth/longestRow.length);

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
    
    // normalize columns.width
    if (columns.hasOwnProperty('width')) {
        // pct
        if (/^\d\d*%$/.test(columns.width)) {
            columns.width = Math.round((totalWidth - margin)*columns.width.replace('%','')/100);
        }
        // number
        else if (Math.abs(Math.round(columns.width) === +columns.width)) {
            columns.width = +columns.width;
        }
        // garbage
        else {
            throw new Error("columns.width must be either a whole number or a whole number percentage eg: 30, '30' or '30%'");
        }
        // ensure columns.width is at least 1 character
        columns.width = columns.width || 1;
    }
   
    if (columns.hasOwnProperty('alignment')) {
        switch (columns.alignment) {
        case 'right':
        case 'center':
        case 'justify':
            break;
        default: 
            throw new Error("columns.alignment must be 'left', 'right', 'center' or 'justify'");
        }
    }
    
    // convert column names to column config objects
    normalizedColumns = normalizedColumns.map(function(columnName, i) {
        var width = i === longestRow.length - 1 ? availWidth : avgWidth;
        var column = {
            name: columnName,
            alignment: columns.alignment || 'left',
            width: columns.hasOwnProperty('width') ? columns.width : width
        };
        availWidth -= width;
        return column;
    });
    
    return normalizedColumns;

}

function normalizeColumnsFromArray(columns, rows, totalWidth, borderWidth, padding, margin) {
    var columnWidth;
    var availWidth;
    var numColumnsWithNoWidth = 0;
    var normalizedColumns;
    var rowsAreArrays;
    
    if (!Array.isArray(columns)) {
        throw new Error('columns must be an array of objects');
    }
    columns.forEach(function(column) {
        if (typeof column !== 'object') {
            throw new Error('columns must be an array of objects');
        }
    });

    validateRows(rows); // sanity check basic structure of raw rows 
    
    // give these real numeric values to avoid NaN during testing.
    totalWidth = totalWidth || 0;
    borderWidth = borderWidth || 0;
    padding = padding || 0;
    margin = margin || 0;
    
    rowsAreArrays = Array.isArray(rows[0]);

    // Make sure all columns have a name attribute if rows are objects.
    if (!rowsAreArrays){
        columns.forEach(function(column) {
            if (!column.name) {
                throw new Error('column must have a name property if rows are objects.');
            }
        });
    }

    // first pass: normalize column objects, identify specified widths
    availWidth = Math.max(columns.length, totalWidth - margin - borderWidth - (padding * 2 * columns.length));

    normalizedColumns = columns.map(function(column, i){
        var newColumn = {
            name: rowsAreArrays ? i: column.name,
            alignment: column.alignment || 'left'
        };
        if (column.hasOwnProperty('width')) {
            if (Math.round(Math.abs(column.width)) !== column.width || Math.abs(column.width) === 0) {
                throw new Error('column width must be a positive integer');
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
    
    return normalizedColumns;
}

