var parser = require('../parse.js');
var fs = require('fs');
var path = require('path');

fs.readFile(path.resolve('../../../examples/test.npx'), 'utf-8', function(e, data) {
	parser.parse(data, ["asciimath"]);
	while (!parser.notepad) if (parser.notepad) break;
	console.log(parser.notepad);
});
