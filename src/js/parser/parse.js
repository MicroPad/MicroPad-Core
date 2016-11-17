var xml2js = require('xml2js');
var parseString = require('xml2js').parseString;
var moment = require('moment');
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

var Notepad = function(title) {
	this.title = title;
	this.sections = [];
};
Notepad.prototype.addSection = function(section) {
	this.sections.push(section);
};
Notepad.prototype.toXMLObject = function() {
	var parseableNotepad = {
		notepad: {
			$: {
				'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
				'xsi:noNamespaceSchemaLocation': 'https://nick.geek.nz/projects/uPad/schema.xsd',
				title: this.title
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

var Section = function(title) {
	this.title = title;
	this.sections = [];
	this.notes = [];
};
Section.prototype.addSection = function(section) {
	this.sections.push(section);
};
Section.prototype.addNote = function(note) {
	this.notes.push(note);
};
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

var Note = function(title, time, addons) {
	this.title = title;
	this.time = Date.parse(time);
	this.addons = addons;
	this.bibliography = [];
	this.elements = [];
};
Note.prototype.addSource = function(id, item, content) {
	this.bibliography.push({
		id: id,
		item: item,
		content: content
	});
};
Note.prototype.addElement = function(type, args, content) {
	if (!type) return;
	this.elements.push({
		type: type,
		args: args,
		content: content
	});
};
Note.prototype.toXMLObject = function() {
	var parseableNote = {
		note: {
			$: {
				title: this.title,
				time: moment(this.time).format()
			},
			addons: [],
			bibliography: []
		}
	}

	var imports = {
		import: []
	};
	for (k in this.addons) {
		imports.import.push(this.addons[k]);
	}
	parseableNote.note.addons.push(imports);

	var sources = {
		source: []
	};
	for (k in this.bibliography) {
		var source = this.bibliography[k];
		sources.source.push({
			_: source.content,
			$: {
				id: source.id,
				item: source.item
			}
		});
	}
	parseableNote.note.bibliography.push(sources);

	elements = {};
	for (k in this.elements) {
		var element = this.elements[k];
		if (!elements[element.type]) elements[element.type] = [];
		
		var elementToPush = {
			_: element.content,
			$: {}
		}

		for (argName in element.args) {
			elementToPush.$[argName] = element.args[argName];
		}

		elements[element.type].push(elementToPush);
	}
	for (k in elements) {
		var elementGroup = elements[k];
		parseableNote.note[k] = elementGroup;
	}

	return parseableNote;
}
Note.prototype.toXML = function() {
	var builder = new xml2js.Builder({
		allowSurrogateChars: true,
		headless: true,
		cdata: true
	});
	return builder.buildObject(this.toXMLObject());
}

var supportedAddons = [];
exports.parse = function parse(xml, addons) {
	supportedAddons = addons;
	parseString(xml, {trim: true}, function(e, res) {
		exports.notepad = new Notepad(res.notepad.$.title);
		if (res.notepad.section) {
			for (var i = 0; i < res.notepad.section.length; i++) {
				var sectionXML = res.notepad.section[i];
				var section = new Section(sectionXML.$.title);

				parseSection(sectionXML, section, exports.notepad);
			}
		}
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
	var restoredNotepad = new Notepad(obj.title);
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
								if (supportedAddons.indexOf(addon) == -1) console.log("This notepad contains some features that aren't supported: "+addon);
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

						if (noteXML.table) {
							for (var j = 0; j < noteXML.table.length; j++) {
								var table = noteXML.table[j];
								var content = [];
								for (var n = 0; n < table.column[0].markdown.length; n++) content.push([]);
								for (var l = 0; l < table.column.length; l++) {
									var rows = table.column[l].markdown;
									for (var m = 0; m < rows.length; m++) {
										var cell = rows[m];
										content[m].push(cell);
									}
								}

								note.addElement("table", table.$, content);
							}
						}

						if (noteXML.image) {
							for (var j = 0; j < noteXML.image.length; j++) {
								var element = noteXML.image[j];
								note.addElement("image", element.$, element._);
							}
						}

						if (noteXML.file) {
							for (var j = 0; j < noteXML.image.length; j++) {
								var element = noteXML.image[j];
								note.addElement("file", element.$, element._);
							}
						}

						section.addNote(note);
					}
					break;

				case "section":
					parseSection(v[0], new Section(v[0].$.title), section);
					break;
			}
		}
	}

	parent.addSection(section);
}
