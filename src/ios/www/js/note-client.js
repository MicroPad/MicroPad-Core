function sendToViewer(options) {
	document.getElementById('viewer').contentWindow.postMessage(options, "*");
}

function displayNote(delta) {
	sendToViewer({req: 'clear'});

	appUi.showPreloader("Loading Note...");
	if (!delta) $('#viewer').html('');

	var elementCount = 0;
	for (let i = 0; i < note.elements.length; i++) {
		let element = note.elements[i];

		if (element.content !== "AS" && element.type !== "markdown") {
			try {
				let asset = new parser.Asset(dataURItoBlob(element.content));
				element.args.ext = asset.uuid;
				element.content = "AS";
				notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');

				assetStorage.setItem(asset.uuid, asset.data).then(() => {
					if (!notepadAssets.has(asset)) notepadAssets.add(asset.uuid);
					displayElement(delta, element, (++elementCount === note.elements.length));
				});
			}
			catch(e) {
				note.elements.splice(note.elements.indexOf(element), 1);
				continue;
			}
		}
		else {
			displayElement(delta, element, (++elementCount === note.elements.length));
		}
	}
}

function displayNoteOld(delta) {
	appUi.showPreloader("Loading Note...");
	if (!delta) $('#viewer').html('');

	var elementCount = 0;
	for (let i = 0; i < note.elements.length; i++) {
		let element = note.elements[i];

		if (element.content !== "AS" && element.type !== "markdown") {
			try {
				let asset = new parser.Asset(dataURItoBlob(element.content));
				element.args.ext = asset.uuid;
				element.content = "AS";
				notepad.lastModified = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');

				assetStorage.setItem(asset.uuid, asset.data).then(() => {
					if (!notepadAssets.has(asset)) notepadAssets.add(asset.uuid);
					displayElement(delta, element, (++elementCount === note.elements.length));
				});
			}
			catch(e) {
				note.elements.splice(note.elements.indexOf(element), 1);
				continue;
			}
		}
		else {
			displayElement(delta, element, (++elementCount === note.elements.length));
		}
	}

	function displayElementOld(delta, element, lastElement) {
		if (delta && $('#' + element.args.id).length) return;
		$('#viewer').append('<div id="{0}" class="drag z-depth-2" style="left: {1}; top: {2}; width: {3}; height: {4};"><p class="handle">::::</p></div>'.format(element.args.id, element.args.x, element.args.y, element.args.width, element.args.height))
		var elementDiv = document.getElementById(element.args.id);

		switch (element.type) {
			case "markdown":
				elementDiv.style.fontSize = element.args.fontSize;
				elementDiv.innerHTML += md.makeHtml(element.content);
				asciimath.translate(undefined, true);
				drawPictures();
				MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

				var checkedTodoItems = $('#'+element.args.id+' .task-list-item input:checked');
				if (checkedTodoItems.length > 5) {
					todoShowToggle[element.args.id] = false;
					$(elementDiv).find('.handle').after($('<a class="hidden-todo-msg todo-toggle" href="javascript:showTodo(\'{0}\')">Toggle {1} Completed Items</a>'.format(element.args.id, checkedTodoItems.length)));
				}

				
				var inlineImages = [];
				element.content.replace(/!!\(([^]+?)\)/gi, (match, p1) => { inlineImages.push(p1); });
				element.content.replace(/!!\[([^]+?)\]/gi, (match, p1) => { inlineImages.push(p1); });

				if (inlineImages) {
					if (inlineImages) {
						for (let i = 0; i < inlineImages.length; i++) {
							let uuid = inlineImages[i];

							assetStorage.getItem(uuid, (err, blob) => {
								if (!blob) {
									setTimeout(() => {
										arguments.callee(err, blob);
									}, 500);
									return;
								}
								elementDiv.innerHTML = elementDiv.innerHTML.replace("!!\("+uuid+"\)", '<img src="{0}" />'.format(URL.createObjectURL(blob)));
								var drawingName = "inline-drawing-"+Math.random().toString(36).substring(7);
								elementDiv.innerHTML = elementDiv.innerHTML.replace("!!\["+uuid+"\]", '<img id="{1}" src="{0}" />'.format(URL.createObjectURL(blob), drawingName));
								if ($('#'+drawingName).length > 0) {
									var trimmed = false;
									$('#'+drawingName)[0].onload = function() {
										if (!trimmed) {
											trimmed = true;
											initDrawing($('#'+drawingName)[0]);
										}
									}
								}
							});
						}
					}
				}
				break;
			case "drawing":
				elementDiv.style.padding = "0px";

				assetStorage.getItem(element.args.ext).then(blob => {
					if (!notepadAssets.has(element.args.ext)) notepadAssets.add(element.args.ext);
					elementDiv.innerHTML += '<img class="drawing" style="width: auto; height: auto;" />';

					var trimmed = false;
					$(elementDiv).find('img')[0].onload = function() {
						if (!trimmed) {
							trimmed = true;
							initDrawing($(elementDiv).find('img')[0]);
						}
					};

					$(elementDiv).find('img')[0].src = URL.createObjectURL(blob);
				});
				break;
			case "image":
				elementDiv.style.padding = "0px";

				assetStorage.getItem(element.args.ext).then(blob => {
					if (!notepadAssets.has(element.args.ext)) notepadAssets.add(element.args.ext);
					elementDiv.innerHTML += '<img id="img_{1}" style="padding: 5px; width: 100%; height: auto;" src="{0}" />'.format(URL.createObjectURL(blob), element.args.id, element.args.width, element.args.height);
					elementDiv.style.padding = "0px";
				});
				break;
			case "file":
				elementDiv.innerHTML += '<div class="fileHolder" id="{4}" style="padding: 20px; height: {0}; width: {1};"><a href="javascript:downloadFile(\'{3}\');">{2}</a></div>'.format(element.args.height, element.args.width, element.args.filename, element.args.id);
				break;
			case "recording":
				$(elementDiv).addClass('recording');

				elementDiv.innerHTML += '<p class="recording-text"><em>{0}</em></p><audio controls="true" style="padding-top: 20px;"></audio>'.format(element.args.filename);
				assetStorage.getItem(element.args.ext).then(blob => {
					if (!notepadAssets.has(element.args.ext)) notepadAssets.add(element.args.ext);
					if (!delta) {
						$(elementDiv).find('audio')[0].src = URL.createObjectURL(blob);
					}
				});
				break;
		}

		if (lastElement) {
			appUi.stopPreloader();
			$('#viewer').removeClass('hidden');
			updateBib();
			setTimeout(function() {
				updateNote(undefined, true);
			}, 1000);
		}
	}
}
