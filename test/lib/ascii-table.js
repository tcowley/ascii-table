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

test('test getRowLength(row)', function (t) {
    
    var a = ['', '', ''];
    var b = at.getRowLength(a);
    t.equal(b, 3, "row is array");
    
    a = {a: '', b: '', c: ''};
    b = at.getRowLength(a);
    t.equal(b, 3, "row is an object");
    
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
    t.equal(b, a[1], "rows is array of arrays");

    a = [
        {a: '', b: ''},
        {a: '', b: '', c: ''},
        {}, 
    ];
    
    b = at.getRowWithMostFields(a);
    t.equal(b, a[1], "row is an array of objects");
    
    t.end();

});

test('test normalizeBorder(border)', function (t) {
    var a;
    ['', '-', ' '].forEach(function(border) {
        a = at.normalizeBorder(border);
        t.equal(a, border, "border is '" + border + "'");
    });
    a = at.normalizeBorder();
    t.equal(a, '-', "default border is '-'");
    t.end();
});

test('test normalizePadding(padding)', function (t) {
    var a;
    
    a = at.normalizePadding();
    t.equal(a, 1, "default padding is 1");
    
    a = at.normalizePadding(5);
    t.equal(a, 5, "padding is a positive integer");
    
    a = at.normalizePadding('5');
    t.equal(a, 5, "padding is a positive integer string");
    
    t.throws(function() { a = at.normalizePadding(5.1); }, "padding is a float");
    t.throws(function() { a = at.normalizePadding(-5); }, "padding is a negative number");
    t.throws(function() { a = at.normalizePadding('5x'); }, "padding is a garbage string");
    
    t.end();
});

test('test normalizeMargin(margin)', function (t) {
    var a;

    a = at.normalizeMargin();
    t.equal(a, 1, "default margin is 1");

    a = at.normalizeMargin(5);
    t.equal(a, 5, "margin is a positive integer");

    a = at.normalizeMargin('5');
    t.equal(a, 5, "margin is a positive integer string");

    t.throws(function() { a = at.normalizeMargin(5.1); }, "margin is a float");
    t.throws(function() { a = at.normalizeMargin(-5); }, "margin is a negative number");
    t.throws(function() { a = at.normalizeMargin('5x'); }, "margin is a garbage string");

    t.end();
});


test('test normalizeColumnsFromObject(columns, rows, totalWidth, borderWith, padding, margin)', function (t) {
    var a;
    var b;
    function getRows(n, type) {
        var arr;
        n = typeof n === 'undefined' ? 5000 : n;
        switch (type) {
        case 'object':
            arr = [{a:'a0', b:'b0'}, {a:'a1', b: 'b1', c:'c1'}, {}];
            break;
        default:
            arr = [ ['a0', 'b0'], ['a1', 'b1', 'c1'], [] ];
        }
        return arr.slice(0, n);
    }
    
    test('> test core columns object', function (t) {
        
        t.throws(function() { at.normalizeColumnsFromObject(undefined, getRows()); }, "columns is undefined");
        t.throws(function() { at.normalizeColumnsFromObject('asdf', getRows()); }, "columns is not an object");
        
        a = [
            {name: 0, width: 1, alignment: 'left'}, 
            {name: 1, width: 1, alignment: 'left'},
            {name: 2, width: 1, alignment: 'left'} 
        ];
        b = at.normalizeColumnsFromObject({}, getRows()); 
        t.deepEquals(b, a, "columns is an empty object");
        
        // columns.width is a garbage value
        t.throws(function() { at.normalizeColumnsFromObject({width: 'asdf'}, getRows()); }, "columns.width is a garbage value");
        
        // columns.width is a percentage
        b = at.normalizeColumnsFromObject({width: '0%'}, getRows(), 100)[0].width;
        t.deepEquals(b, 1, "columns.width is a percentage: '0%'");
        b = at.normalizeColumnsFromObject({width: '50%'}, getRows(), 100)[0].width;
        t.deepEquals(b, 50, "columns.width is a percentage: '50%'");
        b = at.normalizeColumnsFromObject({width: '100%'}, getRows(), 100)[0].width;
        t.deepEquals(b, 100, "columns.width is a percentage: '100%'");
        b = at.normalizeColumnsFromObject({width: '200%'}, getRows(), 100)[0].width;
        t.deepEquals(b, 200, "columns.width is a percentage: '200%'");
        
        // columns.width is a number
        b = at.normalizeColumnsFromObject({width: 0}, getRows(), 100)[0].width;
        t.deepEquals(b, 1, "columns.width is a number: 0");
        b = at.normalizeColumnsFromObject({width: 50}, getRows(), 100)[0].width;
        t.deepEquals(b, 50, "columns.width is a number: 50");
        b = at.normalizeColumnsFromObject({width: 200}, getRows(), 100)[0].width;
        t.deepEquals(b, 200, "columns.width is a number: 200");
       
        
        // columns.alignment 
        t.throws(function() { at.normalizeColumnsFromObject({alignment: 55}, getRows()); }, "columns.alignment is a garbage value");
        b = at.normalizeColumnsFromObject({alignment: 'right'}, getRows())[0].alignment;
        t.deepEquals(b, 'right', "columns.alignment is a valid non-default value: 'right'");
        b = at.normalizeColumnsFromObject({}, getRows())[0].alignment;
        t.deepEquals(b, 'left', "columns.alignment is not supplied");
        
        t.end();
    });
    
    
    test('> tests specific to rows', function (t) {
        b = at.normalizeColumnsFromObject({}, getRows());
        t.notEqual(b[0], b[1], "each columns array value is a distinct object");
        
        // column.width is empty, and number of columns results in all-equal values for width
        // column.width is empty, and number of columns results in last value being larger than other widths
        // column.width is empty, and number of columns results in min-width columns (1 char)
        // columns.width is non-empty, and will generate a table smaller than totalWidth
        // columns.width is non-empty, and will generate a table larger than totalWidth
        t.end();
    });
    
    // ---------------------------------------------------------
    // Array Rows tests
    // ---------------------------------------------------------
    
    test('> tests specific to rows that are arrays', function (t) {
        // columns array is length of longest array in rows
        t.end();
    });
    
    
    // ---------------------------------------------------------
    // Object Rows tests
    // ---------------------------------------------------------

    test('> tests specific to rows that are objects', function (t) {
        // all column names found in rows array of objects
        t.end();
    });
    
    
    t.end();
});

test('test normalizeColumnsFromArray(columns, rows, totalWidth, borderWith, padding, margin)', function (t) {
    t.end();
});





return;





var output = table.formatTable(
    generateColumns(),
    generateObjectRows(),
    false, 
    10
);

console.log(output);


// --------------------------------------------------------------------------------
// APP FUNCTIONS
// --------------------------------------------------------------------------------

function generateColumns() {
    var columns = [];
    columns.push({name: 'one', width: 25, align:'justify'});
    columns.push({name: 'two', width: 25,  align:'center'});
    columns.push({name: 'three', width: 25, align:'justify'});
    //columns.push({name: 'four', width: 25, align:'right'});
    //columns.push({name: 'two'});
    //columns.push('three');
    //columns.push({name: 'four', width: 50});
    return columns;
}

function generateObjectRows() {
    var rows = [];
    rows.push({
        two: '1-2 a one   two',
        one: '1-1 abcd efgh ij kl mnopqrstuvwxyz ABCD EFGHIJ KLM NO',
        three: '1-3 adsf asdf',
    });

    rows.push({
        two: '2-2 jalk',
        three: '2-3 adsf asdf ljkljlk jlkj lkj lkj jj wekjlkj lkjad lkj',
    });

    rows.push({
        one: '3-1 jljlk lkj lkj lakjl jl lkj lkjadfklj lkj lkja flkj',
        three: '3-3 adsf asdf lkjad lkj',
    });

    rows.push({
        one: '4-1 jljlk  ljsal jaslf jslfk jlklkj lkj lakjl jl lkj lkjadfklj lkj lkja flkj',
        three: '4-3 adsf asdf lkjad lkj',
    });
    return rows;    
}

function generateArrayRows() {
    var rows = [];
    rows.push({
        two: '1-2 a one   two',
        one: '1-1 abcd efgh ij kl mnopqrstuvwxyz ABCD EFGHIJ KLM NO',
        three: '1-3 adsf asdf',
    });

    rows.push({
        two: '2-2 jalk',
        three: '2-3 adsf asdf ljkljlk jlkj lkj lkj jj wekjlkj lkjad lkj',
    });

    rows.push({
        one: '3-1 jljlk lkj lkj lakjl jl lkj lkjadfklj lkj lkja flkj',
        three: '3-3 adsf asdf lkjad lkj',
    });

    rows.push({
        one: '4-1 jljlk  ljsal jaslf jslfk jlklkj lkj lakjl jl lkj lkjadfklj lkj lkja flkj',
        three: '4-3 adsf asdf lkjad lkj',
    });
    return rows;
}
