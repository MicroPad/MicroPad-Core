var parseString = require('xml2js').parseString;

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

exports.parse = function parse(xml) {
	parseString(xml, function(e, res) {
		var notepad = new Notepad(res.notepad.$.title);
		// console.log(res.notepad.section);
		for (var i = 0; i < res.notepad.section.length; i++) {
			var sectionXML = res.notepad.section[i];
			var section = new Section(sectionXML.$.title);
			// console.log(sectionXML.note[0].addons[0].import[0]);

			for (var k in sectionXML){
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
							}
							break;
					}
				}
			}
		}
	});
}
