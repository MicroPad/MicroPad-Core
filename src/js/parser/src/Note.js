const xml2js = require('xml2js');
const format = require('date-fns/format');
const parseDate = require('date-fns/parse');

exports.Note = function (title, time, addons) {
	this.parent = undefined;
	this.title = removeHTML(title);
	this.time = Date.parse(time);
	this.addons = addons;
	this.bibliography = [];
	this.elements = [];
	this.internalRef = generateGuid();
};

exports.Note.prototype.addSource = function (id, item, content) {
	this.bibliography.push({
		id: id,
		item: item,
		content: content
	});
};

exports.Note.prototype.addElement = function (type, args, content) {
	if (!type) return;
	if (!content || content.length === 0) return;
	this.elements.push({
		type: type,
		args: args,
		content: content
	});
};

exports.Note.prototype.search = function (query) {
	var pattern = new RegExp("\\b" + query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), 'i');
	if (pattern.test(this.title)) return this;

	if (query.length > 1 && query.charAt(0) == '#') {
		pattern = new RegExp("(^|\\s)" + query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + "(\\b)", 'i');
		for (var i = 0; i < this.elements.length; i++) {
			var el = this.elements[i];
			if (el.type !== "markdown") continue;
			if (pattern.test(el.content)) return this;
		}
	}
	return false;
};

exports.Note.prototype.toXMLObject = function () {
	var parseableNote = {
		note: {
			$: {
				title: removeHTML(this.title),
				time: format(parseDate(this.time, 'YYYY-MM-DDTHH:mm:ss.SSSZ'))
			},
			addons: [],
			bibliography: []
		}
	};

	var imports = {
		import: []
	};
	for (let k in this.addons) {
		imports.import.push(this.addons[k]);
	}
	parseableNote.note.addons.push(imports);

	var sources = {
		source: []
	};
	for (let k in this.bibliography) {
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

	let elements = {};
	for (let k in this.elements) {
		var element = this.elements[k];
		if (!elements[element.type]) elements[element.type] = [];

		var elementToPush = {
			_: element.content,
			$: {}
		};

		for (let argName in element.args) {
			elementToPush.$[argName] = element.args[argName];
		}

		elements[element.type].push(elementToPush);
	}
	for (let k in elements) {
		var elementGroup = elements[k];
		parseableNote.note[k] = elementGroup;
	}

	return parseableNote;
};

exports.Note.prototype.toXML = function () {
	var builder = new xml2js.Builder({
		allowSurrogateChars: true,
		headless: true,
		renderOpts: {
			'pretty': false
		},
		cdata: true
	});
	return builder.buildObject(this.toXMLObject());
};

exports.Note.prototype.toMarkdown = function (assets) {
	var mdNote = "";
	for (var i = 0; i < this.elements.length; i++) {
		var element = this.elements[i];
		var citation = "";
		for (var j = 0; j < this.bibliography.length; j++) {
			var source = this.bibliography[j];

			if (source.item === element.args.id) {
				citation = "[[{0}]]({1})".format(source.id, source.content);
			}
		}

		switch (element.type) {
			case "markdown":
				mdNote += element.content + citation + "\n\n";
				break;

			case "drawing":
			case "image":
				var content = "";
				if (element.args.ext) {
					content = assets[element.args.ext];
				} else {
					content = element.content;
				}

				mdNote += "![]({0}){1}\n\n".format(content, citation);
				break;

			case "file":
			case "recording":
				var content = "";
				if (element.args.ext) {
					content = assets[element.args.ext];
				} else {
					content = element.content;
				}

				mdNote += "[{0}]({1}){2}\n\n".format(element.args.filename, content, citation);
				break;
		}
	}

	return { title: this.title, md: mdNote };
};

exports.Note.prototype.getUsedAssets = function () {
	var usedAssets = [];
	for (var i = 0; i < this.elements.length; i++) {
		var element = this.elements[i];
		if (element.content === "AS") usedAssets.push(element.args.ext);

		if (element.type === "markdown") {
			var inlineImages = [];
			element.content.replace(/!!\(([^]+?)\)/gi, (match, p1) => {
				inlineImages.push(p1);
			});
			element.content.replace(/!!\[([^]+?)\]/gi, (match, p1) => {
				inlineImages.push(p1);
			});

			if (inlineImages) {
				let uuid = inlineImages[i];
				if (uuid) usedAssets.push(uuid);
			}
		}
	}

	return usedAssets;
};

// Thanks to http://stackoverflow.com/a/4673436/998467
if (!String.prototype.format) {
	String.prototype.format = function () {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function (match, number) {
			return typeof args[number] != 'undefined' ? args[number] : match;
		});
	};
}

//Thanks to https://stackoverflow.com/a/105074
function generateGuid() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function removeHTML(string) {
	return string.replace(/<[^>]*>/, "");
}