var xml2js = require('xml2js');
var moment = require('moment');

exports.Note = function(title, time, addons) {
	this.parent = undefined;
	this.title = title;
	this.time = Date.parse(time);
	this.addons = addons;
	this.bibliography = [];
	this.elements = [];
};
exports.Note.prototype.addSource = function(id, item, content) {
	this.bibliography.push({
		id: id,
		item: item,
		content: content
	});
};
exports.Note.prototype.addElement = function(type, args, content) {
	if (!type) return;
	if (!content || content.length === 0) return;
	this.elements.push({
		type: type,
		args: args,
		content: content
	});
};
exports.Note.prototype.search = function(query) {
	var pattern = new RegExp("\\b"+query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), 'i');
	if (pattern.test(this.title)) return this;
	return false;
}
exports.Note.prototype.toXMLObject = function() {
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
exports.Note.prototype.toXML = function() {
	var builder = new xml2js.Builder({
		allowSurrogateChars: true,
		headless: true,
		cdata: true
	});
	return builder.buildObject(this.toXMLObject());
}
