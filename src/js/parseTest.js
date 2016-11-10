var parser = require('./parse.js');
var fs = require('fs');
var path = require('path')

fs.readFile(path.resolve('../../examples/test.mpx'), 'utf-8', function(e, data) {
	parser.parse(data);
});