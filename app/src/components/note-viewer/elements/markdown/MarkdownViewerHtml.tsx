// @ts-ignore
import MathJax from '!raw-loader!../../../../assets/MathJax.js';

export namespace MarkDownViewer {
	export const getHtml = (id: string, initialContent?: string, doInitialMathJaxRender?: boolean): string => `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<style>
		html, body, #content {
			margin: 0;
			padding: 0;
			overflow-x: hidden;
		}

		#content {
			word-wrap: break-word;
			-webkit-box-sizing: border-box;
			-moz-box-sizing: border-box;
			box-sizing: border-box;
			min-width: 170px;
			min-height: 50px;
			padding: 5px;
			font-family: "Roboto", sans-serif;
			line-height: 1.5;
		}

		#content > :first-child {
			margin-top: 0;
		}
		
		#content > pre {
			white-space: pre-wrap;
			word-wrap: break-word;
		}
		
		#content img {
			max-width: 100%;
		}

		a {
			color: #039be5;
			text-decoration: none;
		}

		h1, h2, h3, h4, h5, h6 {
			font-weight: 400;
			margin: 10px;
			line-height: 110%;
		}

		table {
			width: 100%;
			display: table;
		}

		table, th, td {
			border: 1px solid black;
			border-collapse: collapse;
			background-color: white;
		}

		th, td {
			padding: 5px;
		}

		blockquote {
			background: #f9f9f9;
			border-left: 10px solid #ffb300;
			margin: 1.5em 10px;
			padding: 0.5em 10px;
			quotes: "\\201C""\\201D""\\2018""\\2019";
		}

		blockquote:before {
			color: #607d8b;
			content: open-quote;
			font-size: 4em;
			line-height: 0.1em;
			margin-right: 0.25em;
			vertical-align: -0.4em;
			font-family: serif;
		}

		blockquote:after {
			content: no-close-quote;
		}

		blockquote > p {
			display: inline;
		}
		
		.hidden {
			display: none;
		}
		
		@media print {
			html, body, #content {
				margin: 0;
				padding: 0;
				overflow-x: hidden;
				overflow-y: hidden;
			}
			
			.MathJax_SVG {
				display: none;
			}
		}
	</style>
	
	<script type="text/x-mathjax-config">
		MathJax.Hub.Config({
			root: '/assets/mathjax',
			jax: ['input/AsciiMath', 'input/TeX', 'output/SVG'],
			extensions: ['tex2jax.js', 'asciimath2jax.js'],
			messageStyle: 'none',
			tex2jax: {
				inlineMath: [[';;', ';;']]
			},
			asciimath2jax: {
				delimiters: [['===', '==='], ["''", "''"]]
			},
			showMathMenu: false,
			skipStartupTypeset: ${(!doInitialMathJaxRender) ? 'true' : 'false'}
		});
	</script>
	<script>${MathJax}</script>
</head>
<body>
<div id="content">${(!!initialContent) ? initialContent : ''}</div>

<script>
	var content = document.getElementById('content');
	var id = '${id}';
	var element;
	var showHidden = true;
	var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
	let isPrinting = false;

	window.addEventListener('message', handleMessage);
	
	document.body.onclick = function(event) {
		var path = event.path || (event.composedPath && event.composedPath()) || [event.target];
		if (path.some(p => !!p.tagName && p.tagName.toLowerCase() === 'a') || window.getSelection().toString() !== "") return;
		
		parent.postMessage({
			id,
			type: 'edit',
			payload: {}
		}, '*');
	};

	function handleMessage(event) {
		var message = event.data;
		if (message.id !== id) return;

		switch (message.type) {
			case 'resize':
				parent.postMessage({
					id,
					type: 'resize',
					payload: {
						width: window.getComputedStyle(content, null).getPropertyValue('width'),
						height: window.getComputedStyle(content, null).getPropertyValue('height')
					}
				}, '*');
				break;

			case 'render':
				element = message.payload;
				content.style.width = element.args.width || 'auto';
				content.style.height = element.args.height || '50px';
				content.style.fontSize = element.args.fontSize || '16px';
				isPrinting = element.isPrinting;

				document.getElementById('content').innerHTML = element.content;
				
				document.querySelectorAll('a').forEach(function(link) {
					if (link.getAttribute('href').substring(0, 24) !== 'javascript:searchHashtag') {
						link.setAttribute('onclick', 'redirectLinkClick(event);');
					}
				});
				
				manageToDoItems();
				adjustWidth();

				if (isPrinting) break;
				MathJax.Hub.Queue(['Typeset', MathJax.Hub, content]);
				MathJax.Hub.Queue(function () {
					if (!element.args.width || element.args.width === 'auto') {
						content.style.width = 'fit-content';
						document.documentElement.style.overflow = 'hidden';
					}
					adjustWidth();
				});
				break;
				
			case 'toggle':
				showHidden = !showHidden;
				manageToDoItems();
				break;
		}
	}
	
	function manageToDoItems() {
		document.querySelectorAll('.task-list-item input:checked').forEach(function(item) {
			if (showHidden) {
				getParentsUntil(item, '#content').forEach(function(parent) {
					parent.classList.remove('hidden');
				});
			} else {
				getParentsUntil(item, 'ul').forEach(function(parent) {
					parent.classList.add('hidden');
				});
			}
		});
	}

	function adjustWidth() {
		if (content.style.width === 'auto' || content.style.width === 'fit-content') {
			// Expand tables
			var style = document.createElement('style');
			style.type = 'text/css';
			style.appendChild(document.createTextNode('table { width: max-content; }'));
			document.head.appendChild(style);

			content.style.width = (!isFirefox) ? 'max-content' : '-moz-max-content';

			var computedWidth = parseInt(window.getComputedStyle(content, null).getPropertyValue('width'), 10) + 10 + 'px';
			content.style.width = computedWidth;

			parent.postMessage({
				id,
				type: 'resize',
				payload: {
					width: computedWidth
				}
			}, '*');
			
			parent.postMessage({
				id,
				type: 'ready',
				payload: {}
			}, '*');
		}

		handleMessage({ data: { type: 'resize', id } });
		parent.postMessage({
			id,
			type: 'ready',
			payload: {}
		}, '*');
	}
	
	function redirectLinkClick(event) {
		var path = event.path || (event.composedPath && event.composedPath()) || [event.target];
		const link = path.find(p => !!p.tagName && p.tagName.toLowerCase() === 'a')
		
	    parent.postMessage({
	    	id,
	    	type: 'link',
	    	payload: link.getAttribute('href')
	    }, '*');
	    
	    event.preventDefault();
	    return false;
	}
	
	function searchHashtag(query) {
		parent.postMessage({
			id,
			type: 'hashtag',
			payload: query
		}, '*');
	}

	try {
		new ResizeObserver(function() {
			if (!!element && element.args.width === 'auto') content.style.width = 'auto';

			adjustWidth();
		}).observe(content);
	} catch (e) {
		console.warn('Resize Observer not supported. IFrame rendering might be slightly off.')
	}
	
	var getParentsUntil = function (elem, parent, selector) {

		var parents = [];
		if ( parent ) {
			var parentType = parent.charAt(0);
		}
		if ( selector ) {
			var selectorType = selector.charAt(0);
		}

		// Get matches
		for ( ; elem && elem !== document; elem = elem.parentNode ) {

			// Check if parent has been reached
			if ( parent ) {

				// If parent is a class
				if ( parentType === '.' ) {
					if ( elem.classList.contains( parent.substr(1) ) ) {
						break;
					}
				}

				// If parent is an ID
				if ( parentType === '#' ) {
					if ( elem.id === parent.substr(1) ) {
						break;
					}
				}

				// If parent is a data attribute
				if ( parentType === '[' ) {
					if ( elem.hasAttribute( parent.substr(1, parent.length - 1) ) ) {
						break;
					}
				}

				// If parent is a tag
				if ( elem.tagName.toLowerCase() === parent ) {
					break;
				}

			}

			if ( selector ) {

				// If selector is a class
				if ( selectorType === '.' ) {
					if ( elem.classList.contains( selector.substr(1) ) ) {
						parents.push( elem );
					}
				}

				// If selector is an ID
				if ( selectorType === '#' ) {
					if ( elem.id === selector.substr(1) ) {
						parents.push( elem );
					}
				}

				// If selector is a data attribute
				if ( selectorType === '[' ) {
					if ( elem.hasAttribute( selector.substr(1, selector.length - 1) ) ) {
						parents.push( elem );
					}
				}

				// If selector is a tag
				if ( elem.tagName.toLowerCase() === selector ) {
					parents.push( elem );
				}

			} else {
				parents.push( elem );
			}

		}

		// Return parents if any exist
		if ( parents.length === 0 ) {
			return null;
		} else {
			return parents;
		}

	};
</script>
</body>
</html>`;
}
