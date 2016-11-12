var parseString = require('xml2js').parseString;
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

var Note = function(title, time, addons) {
	this.title = title;
	this.time = Date.parse(time);
	this.addons = addons;
	this.bibliography = [];
	this.elements = [];
};
Note.prototype.addSource = function(id, item, contents) {
	this.bibliography.push({
		id: id,
		item: item,
		contents: contents
	});
};
Note.prototype.addElement = function(type, args, content) {
	this.elements.push({
		type: type,
		args: args,
		content: content
	});
};

exports.parse = function parse(xml) {
	parseString(xml, function(e, res) {
		exports.notepad = new Notepad(res.notepad.$.title);
		for (var i = 0; i < res.notepad.section.length; i++) {
			var sectionXML = res.notepad.section[i];
			var section = new Section(sectionXML.$.title);

			parseSection(sectionXML, section, exports.notepad);
		}
	});
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
								if (!isCompatible(addon)) console.log("This notepad contains some features that aren't supported: "+addon);
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

						if (noteXML.image) {
							for (var j = 0; j < noteXML.image.length; j++) {
								var element = noteXML.image[j];
								note.addElement("image", element.$, element._);
							}
						}

						//TODO: TABLES
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

function isCompatible(addonName) {
	if (addonName == "asciimath") return true;
	return false;
}

exports.noteToHTML = function (note) {
}
