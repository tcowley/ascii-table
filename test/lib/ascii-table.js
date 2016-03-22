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
    t.doesNotThrow(function() { at.validateRows([]); } , "rows is an empty array");
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
    
    a = [];
    b = at.getRowWithMostFields(a);
    t.equal(b, null, "rows is an empty array, returns null");
    
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
    t.equal(b, a[1], "row is an array of object");
    
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
