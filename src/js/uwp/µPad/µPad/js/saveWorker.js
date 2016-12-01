/// <reference group="Dedicated Worker" />
importScripts('parser.js');

onmessage = function(event) {
	postMessage({ xml: new Blob([parser.xmlObjToXML(event.data.xmlObj)], { type: "text/xml;charset=utf-8" }), fileLoad: event.data.fileLoad, bulk: event.data.fileLoad });
}
