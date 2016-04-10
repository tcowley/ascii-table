var test = require('tape-catch');
var at = require('../../lib/ascii-table.js');

test('test validateRow(row)', function (t) {

    t.throws(function() { at.validateRow(''); } , "row is not an array or object");
    t.doesNotThrow(function() { at.validateRow([]); } , "row is an array");
    t.doesNotThrow(function() { at.validateRow({}); } , "row is an object");
    
    t.equals(at.validateRow([]), true, 'an array returns true');
    t.equals(at.validateRow({}), false, 'an object returns false');

    t.end();

});

test('test validateRows(rows)', function (t) {

    t.throws(function() { at.validateRows(''); } , "rows is not an array");
    t.throws(function() { at.validateRows([]); } , "rows is an empty array");
    t.throws(function() { at.validateRows([{},[]]); } , "rows contains both arrays and objects");
    t.doesNotThrow(function() { at.validateRows([{}, {}]); } , "rows contains only objects");
    t.doesNotThrow(function() { at.validateRows([[], []]); } , "rows contains only arrays");

    t.end();

});

test('test validateColumns(columns)', function (t) {

    t.throws(function() { at.validateColumns(''); } , "columns is not an array");
    t.throws(function() { at.validateColumns([]); } , "columns is an empty array");
    t.throws(function() { at.validateColumns([[], 5, {}]); } , "columns contains non-object values");
    t.doesNotThrow(function() { at.validateColumns([{}, {}]); } , "columns contains only objects");
    
    t.end();

});

test('test getRowLength(row)', function (t) {
    
    var a = ['', '', ''];
    var b = at.getRowLength(a);
    t.equals(b, 3, "row is array");
    
    a = {a: '', b: '', c: ''};
    b = at.getRowLength(a);
    t.equals(b, 3, "row is an object");
    
    t.end();
    
});

test('test getRowWithMostFields(row)', function (t) {
    var a;
    var b;
    
    a = [
        ['', ''],
        ['', '', ''],
        [],
    ];
    
    b = at.getRowWithMostFields(a);
    t.equals(b, a[1], "rows is array of arrays");

    a = [
        {a: '', b: ''},
        {a: '', b: '', c: ''},
        {}, 
    ];
    
    b = at.getRowWithMostFields(a);
    t.equals(b, a[1], "row is an array of objects");
    
    t.end();

});

test('test normalizeBorder(border)', function (t) {
    var a;
    ['', '-', ' '].forEach(function(border) {
        a = at.normalizeBorder(border);
        t.equals(a, border, "border is '" + border + "'");
    });
    a = at.normalizeBorder();
    t.equals(a, '', "default border is ''");
    t.end();
});

test('test normalizePadding(padding)', function (t) {
    var a;
    
    a = at.normalizePadding();
    t.equals(a, 1, "default padding is 1");
    
    a = at.normalizePadding(5);
    t.equals(a, 5, "padding is a positive integer");
    
    a = at.normalizePadding('5');
    t.equals(a, 5, "padding is a positive integer string");
    
    t.throws(function() { a = at.normalizePadding(5.1); }, "padding is a float");
    t.throws(function() { a = at.normalizePadding(-5); }, "padding is a negative number");
    t.throws(function() { a = at.normalizePadding('5x'); }, "padding is a garbage string");
    
    t.end();
});

test('test normalizeMargin(margin)', function (t) {
    var a;

    a = at.normalizeMargin();
    t.equals(a, 1, "default margin is 1");

    a = at.normalizeMargin(5);
    t.equals(a, 5, "margin is a positive integer");

    a = at.normalizeMargin('5');
    t.equals(a, 5, "margin is a positive integer string");

    t.throws(function() { a = at.normalizeMargin(5.1); }, "margin is a float");
    t.throws(function() { a = at.normalizeMargin(-5); }, "margin is a negative number");
    t.throws(function() { a = at.normalizeMargin('5x'); }, "margin is a garbage string");

    t.end();
});

test('test normalizeColumnsFromObject(columns, rows)', function (t) {
    var a;
    var b;

    // columns isn't an object
    t.throws(function() { at.normalizeColumnsFromObject(undefined, getRows()); }, "columns is undefined");
    t.throws(function() { at.normalizeColumnsFromObject('asdf', getRows()); }, "columns is not an object");

    a = [
        {name: 0, width: undefined, alignment: undefined},
        {name: 1, width: undefined, alignment: undefined},
        {name: 2, width: undefined, alignment: undefined}
    ];
    b = at.normalizeColumnsFromObject({}, getRows());
    t.deepEquals(b, a, "columns is an empty object");
    
    b = at.normalizeColumnsFromObject({}, getRows());
    t.notEqual(b[0], b[1], "each columns array value is a distinct object");

    // rows are arrays
    b = at.normalizeColumnsFromObject({}, getRows());
    t.equal(b.length, 3, "columns array is length of longest array in rows");
    b = b.map(function(obj) {return obj.name;});
    t.deepEqual(b, [0,1,2], "column name values are ordinals: 0,1,2,...");

    // rows are objects
    b = at.normalizeColumnsFromObject({}, getRows(500, 'object')).map(function(obj) {return obj.name; });
    t.deepEqual(b, ['a', 'b', 'c', 'd'], "columns array contains all all field names found in rows");

    t.end();
});

test('test normalizeColumnsFromArray(columns, rows, totalWidth, borderWith, padding)', function (t) {
    var a;
    var b;

    // length params
    t.throws(function() { at.normalizeColumnsFromArray([{name:0}], undefined, 1, 1, false) },
        "totalWidth is not supplied");
    t.throws(function() { at.normalizeColumnsFromArray([{name:0}], 100, undefined, 1, false) },
        "borderWidth is not supplied");
    t.throws(function() { at.normalizeColumnsFromArray([{name:0}], 100, 1, undefined, false) },
        "padding is not supplied");
    
    // basic columns structure
    t.throws(function() { at.normalizeColumnsFromArray('sna', 100, 1, 1, false) }, 
        "columns is not an array");
    t.throws(function() { at.normalizeColumnsFromArray(['sna'], 100, 1, 1, false) }, 
        "columns elements are not all objects");
    
    // column names
    t.throws(function() { at.normalizeColumnsFromArray([{name: 0},{}], 100, 1, 1, false) }, 
        "column.name is undefined");
    
    // column alignment
    b = at.normalizeColumnsFromArray([{name: 0}], 100, 1, 1, false);
    t.equals(b[0].alignment, undefined, "column.alignment is undefined");
    b = at.normalizeColumnsFromArray([{name: 0, alignment: 'justify'}], 100, 1, 1, false);
    t.equals(b[0].alignment, 'justify', "column.alignment is legal value");
    t.throws(function() { at.normalizeColumnsFromArray([{name: 0, alignment: 'foo'}], 1, 1, false) }, 
        "column.alignment is garbage value");
   
    // columns with provided width values
    
    t.throws(function() { at.normalizeColumnsFromArray([{name: 0, width: 'foo'}], 1, 1, false) }, 
        "column.width is a garbage value");

    a = [
        {name: 0, width: 10},
        {name: 1, width: '50%'},
        {name: 2, width: 1},
        {name: 3, width: 10},
    ];
    b = at.normalizeColumnsFromArray(a, 100, 0, 1, false ).map(function(obj) {return obj.width;});
    t.deepEqual(b[0], 10, "column.width is a whole number");
    t.deepEqual(b[1], 50, "column.width is a whole number percentage");
    t.deepEqual(b[2], 3, "column.width is too small");
    t.deepEqual(b[3], 37, "column.width of last column is lengthened to fill table width");


    // columns with no provided values
    
    a = [ {name: 0}, {name: 1}, {name: 2} ];
    b = at.normalizeColumnsFromArray(a, 100, 0, 1, false ).map(function(obj) {return obj.width;});
    t.deepEqual(b, [33, 33, 34], "available width is split evenly among columns without widths");

    a = [ {name: 0, width: 100}, {name: 1}, {name: 2} ];
    b = at.normalizeColumnsFromArray(a, 100, 0, 1, false ).map(function(obj) {return obj.width;});
    t.deepEqual(b, [100, 3, 3], "available width is less than minimum column width");
    
    t.end();
    
});

test('test normalizeRows(columns, rows, skipValidateRows)', function (t) {
    var a = [{name: 'a'}, {name:'b'}, {name: 'c'}, {name: 'd'}, {name:'e'}];
    var b;
    var c;
    
    // ROWS ARE ARRAYS
    
    b = at.normalizeRows(a.slice(0,1), getRows());
    c = [['a0'], ['a1'], ['']];
    t.deepEqual(b, c, "columns length is shorter than longest row");
    
    b = at.normalizeRows(a, getRows());
    c = [['a0', 'b0', '', '', ''], ['a1', 'b1', 'c1', '', ''], ['', '', '','', '']];
    t.deepEqual(b, c, "columns length is longer than longest row");
    
    // ROWS ARE OBJECTS
    
    b = at.normalizeRows(a.slice(3), getRows(500, 'object'));
    c = [{d: '', e: ''}, {d: 'd1', e: ''}, {d: '', e: ''}];
    t.deepEqual(b, c, "columns has a mix of field names, some not in any rows, some in some rows");
    
    t.end();
});


// --------------------------------------------------------------------------------
// MOCKS, STUBS and OTHER HELPERS
// --------------------------------------------------------------------------------


function getRows(n, type) {
    var arr;
    n = typeof n === 'undefined' ? 5000 : n;
    switch (type) {
    case 'object':
        arr = [{a:'a0', b:'b0'}, {a:'a1', c:'c1', d: 'd1'}, {}];
        break;
    default:
        arr = [ ['a0', 'b0'], ['a1', 'b1', 'c1'], [] ];
    }
    return arr.slice(0, n);
}
