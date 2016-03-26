return;
var test = require('tape-catch');
var at = require('../../lib/ascii-table.js');



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

