var test = require('tape-catch');
var at = require('../../lib/parser.js');

test('test concatSplitRows(input)', function (t) {
   
    var input;
    var expected;
    var actual;
    
    t.throws(function() { at.concatSplitLines(5); }, 'throws an error when input is not a string');

    input = '';
    expected = [''];
    actual = at.concatSplitLines(input);
    t.deepEquals(expected, actual, 'empty string results in array containing empty string');
    
    
    input = ['line 1: \\', '    as\\', '  df\\', '\\', ''].join("\n");
    expected = ['line 1: asdf'];
    actual = at.concatSplitLines(input);
    t.deepEquals(expected, actual, 'split lines are correctly concatenated');

    
    input = ['line 1: \\', '    as', '  df', '', '\\', ''].join("\n");
    expected = ['line 1: as', '  df', '', ''];
    actual = at.concatSplitLines(input);
    t.deepEquals(expected, actual, 'correct number of lines is returned');

    t.end();

});

test('test parseRows(lines)', function (t) {
    
    var input;
    var expected;
    var actual;
    
    t.throws(function() { at.parseRows([]); }, 'throws an error when input is not an array of strings');
    
    input = ['', ''];
    expected = [['', '']];
    actual = at.parseRows(input);
    t.deepEquals(expected, actual, 'first line starts a row if does not start with a delimiter');
    //console.log(expected, actual)
    
    input = ['|', ''];
    expected = [['|', '']];
    actual = at.parseRows(input);
    t.deepEquals(expected, actual, 'first line starts a row if starts with a delimiter');
    
    input = ['', '', '|', ''];
    expected = [['', ''], ['|', '']];
    actual = at.parseRows(input);
    t.deepEquals(expected, actual, 'a line containing only a delimiter will start a new row');

    input = ['', '', '||', ''];
    expected = [['', '', '||', '']];
    actual = at.parseRows(input);
    t.deepEquals(expected, actual, 'a line starting with an double delimiter will not start a new row');
    
    input = ['', '', '|a', ''];
    expected = [['', ''], ['|a', '']];
    actual = at.parseRows(input);
    t.deepEquals(expected, actual, 'a line starting with a delimiter and followed by any non-delimiter character will start a new row');

    input = ['', '', '|', '', '|a', '', '|', ''];
    expected = [['', ''], ['|', ''], ['|a', ''], ['|', '']];
    actual = at.parseRows(input);
    t.deepEquals(expected, actual, 'expected 2d array of strings is returned from input containing multiple rows');

    t.end();
});

test.only('test parseCells(row)', function (t) {

    var input;
    var expected;
    var actual;

    t.throws(function() { at.parseCells([]); }, 'throws an error when input is not an array of strings');

    input = ['', ''];
    expected = [['', '']];
    actual = at.parseCells(input);
    t.deepEquals(expected, actual, 'first line starts a cell if does not start with a delimiter');
    //console.log(expected, actual)

    input = ['|', ''];
    expected = [['|', '']];
    actual = at.parseCells(input);
    t.deepEquals(expected, actual, 'first line starts a cell if starts with a delimiter');
    
    
    // final line break in each cell is removed
    // a line containing multiple cell delimiters

    input = ['', '', '|', ''];
    expected = [['', ''], ['|', '']];
    actual = at.parseCells(input);
    t.deepEquals(expected, actual, 'a line containing only a delimiter will start a new row');

    input = ['| one || one | two'];
    expected = [[' one || one '], [' two']];
    actual = at.parseCells(input);
    t.deepEquals(expected, actual, 'a double delimiter will not start a new cell');

    input = ['', '', '|a', ''];
    expected = [['', ''], ['|a', '']];
    actual = at.parseCells(input);
    t.deepEquals(expected, actual, 'a line starting with a delimiter and followed by any non-delimiter character will start a new row');

    input = ['', '', '|', '', '|a', '', '|', ''];
    expected = [['', ''], ['|', ''], ['|a', ''], ['|', '']];
    actual = at.parseCells(input);
    t.deepEquals(expected, actual, 'expected 2d array of strings is returned from input containing multiple rows');

    t.end();
});

