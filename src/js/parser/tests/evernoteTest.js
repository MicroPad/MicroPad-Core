var parser = require('../parse.js');
var fs = require('fs');
var path = require('path');

var f = 'sample-enex.enex';

fs.readFile(path.resolve(f), 'utf-8', function(e, data) {
	parser.parseFromEvernote(data, ["asciimath"]);
	while (!parser.notepad) if (parser.notepad) break;
	console.log(parser.notepad.toXML());
});
