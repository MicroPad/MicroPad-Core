var parser = require('../parse.js');
var fs = require('fs');
var path = require('path');

fs.readFile(path.resolve('oldXML.npx'), 'utf-8', function(e, data) {
	parser.parse(data, ["asciimath"]);
	while (!parser.notepad) if (parser.notepad) break;
	fs.readFile(path.resolve('oldXML.npx'), 'utf-8', function(e, oldData) {
		parser.notepad.addSection(parser.createSection("Test"));
		var res = parser.notepad.makeDiff(oldData);
		console.log(res);
	});
});
