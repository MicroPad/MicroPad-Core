var xml2js = require('xml2js');
var parseString = require('xml2js').parseString;
var moment = require('moment');
var toMarkdown = require('to-markdown');
var pd = require('pretty-data').pd;
var JsDiff = require('diff');

var Note = require('./Note.js').Note;

var searchResults = [];

var Notepad = function(title, lastModified) {
	this.title = title;
	this.sections = [];

	if (lastModified) {
		this.lastModified = lastModified;
	}
	else {
		this.lastModified = moment().format();
	}
}
Notepad.prototype.addSection = function(section) {
	section.parent = this;
	this.sections.push(section);
}
Notepad.prototype.search = function(query) {
	searchResults = [];
	for (s in this.sections) {
		var section = this.sections[s];
		Array.prototype.push.apply(searchResults, section.search(query));
	}

	return searchResults;
}
Notepad.prototype.toXMLObject = function() {
	var parseableNotepad = {
		notepad: {
			$: {
				'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
				'xsi:noNamespaceSchemaLocation': 'https://getmicropad.com/schema.xsd',
				title: this.title,
				lastModified: this.lastModified
			},
			section: []
		}
	}

	for (k in this.sections) {
		parseableNotepad.notepad.section.push(this.sections[k].toXMLObject().section);
	}

	return parseableNotepad;
}
Notepad.prototype.toXML = function() {
	var builder = new xml2js.Builder({
		allowSurrogateChars: true,
		headless: false,
		xmldec: {
			version: '1.0',
			encoding: 'UTF-8',
			'standalone': false
		},
		cdata: true
	});
	return builder.buildObject(this.toXMLObject());
}
Notepad.prototype.toMarkdown = function() {
	var notes = [];
	for (var i = 0; i < this.sections.length; i++) {
		notes.push.apply(notes, this.sections[i].toMarkdown());
	}
	return notes;
}
Notepad.prototype.makeDiff = function(oldXML) {
	var diff = JsDiff.parsePatch(JsDiff.createPatch('d.npx', oldXML, this.toXML(), undefined, undefined, {context: 0}))[0].hunks;

	var processedDiff = [];
	for (var i = 0; i < diff.length; i++) {
		var toPush = {opts: {replace: false}};
		toPush[diff[i].oldStart] = [];
		var toDelete = [];

		for (var j = 0; j < diff[i].lines.length; j++) {
			var line = diff[i].lines[j];
			switch (line.substring(0, 1)) {
				case "-":
					toPush.opts.replace = true;
					toPush[diff[i].oldStart] = [""];
					toDelete.push(parseInt(diff[i].oldStart)+j);
					break;
				case "+":
					if (toPush[diff[i].oldStart][0] === "") toPush[diff[i].oldStart] = [];
					toPush[diff[i].oldStart].push(line.substring(1, line.length));
					break;
			}
		}

		processedDiff.push(toPush);
		if (toDelete.length > 1) {
			for (var j = 1; j < toDelete.length; j++) {
				var lineNumber = toDelete[j];
				toPush = {opts: {replace: true}};
				toPush[lineNumber] = [""];
				processedDiff.push(toPush);
			}
		}
	}

	var diffStr = "";
	for (var i = 0; i < processedDiff.length; i++) {
		var hunk = processedDiff[i];
		diffStr += JSON.stringify(hunk)+'\n';
	}
	return diffStr;
}

var Section = function(title) {
	this.parent = undefined;
	this.title = title;
	this.sections = [];
	this.notes = [];
};
Section.prototype.addSection = function(section) {
	section.parent = this;
	this.sections.push(section);
};
Section.prototype.addNote = function(note) {
	note.parent = this;
	this.notes.push(note);
};
Section.prototype.search = function(query) {
	var res = [];
	for (n in this.notes) {
		var note = this.notes[n];
		var searchRes = note.search(query);
		if (searchRes) {
			res.push(searchRes);
		}
	}

	for (s in this.sections) {
		Array.prototype.push.apply(searchResults, this.sections[s].search(query));
	}

	return res;
}
Section.prototype.toXMLObject = function() {
	var parseableSection = {
		section: {
			$: {
				title: this.title
			},
			section: [],
			note: []
		}
	}

	for (k in this.sections) {
		parseableSection.section.section.push(this.sections[k].toXMLObject().section);
	}

	for (k in this.notes) {
		parseableSection.section.note.push(this.notes[k].toXMLObject().note);
	}

	return parseableSection;
}
Section.prototype.toXML = function() {
	var builder = new xml2js.Builder({
		allowSurrogateChars: true,
		headless: true,
		cdata: true
	});
	return builder.buildObject(this.toXMLObject());
}
Section.prototype.toMarkdown = function() {
	var mdNoteList = [];

	for (var i = 0; i < this.sections.length; i++) {
		var section = this.sections[i];
		mdNoteList.push.apply(mdNoteList, section.toMarkdown());
	}

	for (var i = 0; i < this.notes.length; i++) {
		mdNoteList.push(this.notes[i].toMarkdown());
	}

	return mdNoteList;
}

var supportedAddons = [];
exports.parse = function parse(xml, addons) {
	supportedAddons = addons;
	parseString(xml, {trim: true}, function(e, res) {
		exports.notepad = new Notepad(res.notepad.$.title, res.notepad.$.lastModified);
		if (res.notepad.section) {
			for (var i = 0; i < res.notepad.section.length; i++) {
				var sectionXML = res.notepad.section[i];
				var section = new Section(sectionXML.$.title);

				parseSection(sectionXML, section, exports.notepad);
			}
		}
	});
}

exports.parseFromEvernote = function parseFromEvernote(xml, addons) {
	supportedAddons = addons;
	parseString(xml, {trim: true, normalize: false}, function(e, res) {
		exports.notepad = new Notepad("{0} Import ({1})".format(res['en-export'].$.application, moment(res['en-export'].$['export-date']).format('D MMM h:mmA')));
		var section = new Section('Imported Notes');
		var notes = res['en-export'].note;
		for (var i = 0; i < notes.length; i++) {
			var noteXML = notes[i];
			var note = new Note(noteXML.title[0], moment(noteXML.created[0]).format(), supportedAddons);

			//Add the general note content
			note.addElement('markdown', {
				id: 'markdown1',
				x: '10px',
				y: '10px',
				width: '600px',
				height: 'auto',
				fontSize: '16px'
			}, enmlToMarkdown(pd.xml(noteXML.content[0])));

			//Add attachments
			var resources = noteXML.resource;
			if (resources) {
				var y = 10;
				for (var j = 0; j < resources.length; j++) {
					var resource = resources[j];
					var id = 'file'+(j+1);
					
					if (note.elements[note.elements.length - 1].type === 'file') {
						y = parseInt(note.elements[note.elements.length - 1].args.y) + 100;
					}

					if (resource['resource-attributes'][0]['file-name']) {
						var filename = resource['resource-attributes'][0]['file-name'][0];
					}
					else if (resource['resource-attributes'][0]['source-url']) {
						var filename = resource['resource-attributes'][0]['source-url'][0].split('/').pop();
					}
					else {
						var filename = id+'.'+resource.mime[0].split('/').pop();
					}

					note.addElement('file', {
						id: id,
						x: '650px',
						y: y+'px',
						width: 'auto',
						height: 'auto',
						filename: filename
					}, 'data:'+resource.mime[0]+';base64,'+resource.data[0]._.replace(/\r?\n|\r/g, ''));
				}
			}

			section.addNote(note);
		}
		exports.notepad.addSection(section);
	});
}

exports.createNotepad = function createNotepad(title) {
	return new Notepad(title);
}

exports.createSection = function createSection(title) {
	return new Section(title);
}

exports.createNote = function createNote(title, addons) {
	return new Note(title, moment().format(), addons);
}

exports.restoreNotepad = function restoreNotepad(obj) {
	var restoredNotepad = new Notepad(obj.title, obj.lastModified);
	for (k in obj.sections) {
		var section = obj.sections[k];
		restoredNotepad.addSection(exports.restoreSection(section));
	}

	return restoredNotepad;
}
exports.restoreSection = function restoreSection(obj) {
	var restoredSection = new Section(obj.title);
	for (k in obj.sections) {
		var section = obj.sections[k];
		restoredSection.addSection(exports.restoreSection(section));
	}

	for (k in obj.notes) {
		var note = obj.notes[k];
		restoredSection.addNote(exports.restoreNote(note));
	}

	return restoredSection;
}
exports.restoreNote = function restoreNote(obj) {
	var restoredNote = new Note(obj.title, moment(obj.time).format(), obj.addons);
	for (k in obj.bibliography) {
		var source = obj.bibliography[k];
		restoredNote.addSource(source.id, source.item, source.content);
	}

	for (k in obj.elements) {
		var element = obj.elements[k];
		restoredNote.addElement(element.type, element.args, element.content);
	}

	return restoredNote;
}
exports.xmlObjToXML = function xmlObjToXml(xmlObj) {
	var builder = new xml2js.Builder({
		allowSurrogateChars: true,
		headless: false,
		xmldec: {
			version: '1.0',
			encoding: 'UTF-8',
			'standalone': false
		},
		cdata: true
	});
	return builder.buildObject(xmlObj);
}

function parseSection(sectionXML, section, parent) {
	for (var k in sectionXML) {
		if (typeof sectionXML[k] !== 'function') {
			var v = sectionXML[k];

			switch (k) {
				case "note":
					for (var i = 0; i < v.length; i++) {
						var noteXML = v[i];

						var title = noteXML.$.title;
						var time = noteXML.$.time;
						var addons = [];
						if (noteXML.addons[0].import) {
							for (var j = noteXML.addons[0].import.length - 1; j >= 0; j--) {
								var addon = noteXML.addons[0].import[j];
								if (supportedAddons.indexOf(addon) == -1) console.log("This note contains some features that aren't supported: "+addon);
								addons.push(addon);
							}
						}

						var note = new Note(title, time, addons);

						if (noteXML.bibliography[0].source) {
							for (var l = noteXML.bibliography[0].source.length - 1; l >= 0; l--) {
								var source = noteXML.bibliography[0].source[l];
								note.addSource(source.$.id, source.$.item, source._);
							}
						}

						if (noteXML.markdown) {
							for (var j = 0; j < noteXML.markdown.length; j++) {
								var element = noteXML.markdown[j];
								note.addElement("markdown", element.$, element._);
							}
						}

						if (noteXML.drawing) {
							for (var j = 0; j < noteXML.drawing.length; j++) {
								var element = noteXML.drawing[j];
								note.addElement("drawing", element.$, element._);
							}
						}

						if (noteXML.image) {
							for (var j = 0; j < noteXML.image.length; j++) {
								var element = noteXML.image[j];
								note.addElement("image", element.$, element._);
							}
						}

						if (noteXML.file) {
							for (var j = 0; j < noteXML.file.length; j++) {
								var element = noteXML.file[j];
								note.addElement("file", element.$, element._);
							}
						}

						if (noteXML.recording) {
							for (var j = 0; j < noteXML.recording.length; j++) {
								var element = noteXML.recording[j];
								note.addElement("recording", element.$, element._);
							}
						}

						section.addNote(note);
					}
					break;

				case "section":
					for (var i = 0; i < v.length; i++) {
						var subsectionXML = v[i];
						parseSection(subsectionXML, new Section(subsectionXML.$.title), section);
					}
					break;
			}
		}
	}

	parent.addSection(section);
}

function enmlToMarkdown(enml) {
	var lineArr = enml.split('\n');
	lineArr = lineArr.slice(3, lineArr.length-1);
	var html = [];
	for (var i = 0; i < lineArr.length; i++) {
		var line = lineArr[i].trim();
		html.push(line);
	}

	html = html.join('\n');
	return toMarkdown(html, {
		gfm: true,
		converters: [
			{
				filter: 'div',
				replacement: function(content) {
					return '\n\n'+content+'\n\n';
				}
			},
			{
				filter: 'en-media',
				replacement: function(content) {
					return '`<there was an attachment here>`';
				}
			},
			{
				filter: 'en-todo',
				replacement: function(content, node) {
					var checkStr = ' ';
					if (node.getAttributeNode('checked')) {
						if (node.getAttributeNode('checked').value == 'true') checkStr = 'x';
					}
					return '- [{0}] {1}'.format(checkStr, content);
				}
			},
			{
				filter: 'en-crypt',
				replacement: function(content) {
					return '`<there was encrypted text here>`';
				}
			}
		]
	});
}

// Thanks to http://stackoverflow.com/a/4673436/998467
if (!String.prototype.format) {
	String.prototype.format = function() {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function(match, number) { 
			return typeof args[number] != 'undefined'
				? args[number]
				: match
			;
		});
	};
}
