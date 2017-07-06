// Initialize your app
var appUi = new Framework7({
	init: false,
	tapHold: true
});

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = appUi.addView('.view-main', {
	dynamicNavbar: true
});

appUi.onPageInit('index', page => {

});
appUi.onPageReinit('index', updateNotepadList);

function updateNotepadList() {
	notepadStorage.keys((err, keys) => {
		$$('#notepadList').html('');
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			$$('#notepadList').append('<li><a href="javascript:loadNotepad(\'{1}\');" class="item-link item-content notepad-item"><div class="item-inner"><div class="item-title">{0}</div></div></a></li>'.format(key, key.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0')));
		}
	});
}

function newNotepad() {
	navigator.notification.prompt("Notepad Title:", (results) => {
		if (results.buttonIndex !== 1 || results.input1.length < 1) return;

		var title = results.input1;
		notepad = parser.createNotepad(title);

		var demoNote = parser.createNote("Example Note", ['asciimath']);
		var demoSection = parser.createSection("Example Section");
		demoSection.addNote(demoNote);
		notepad.addSection(demoSection);

		saveNotepad(() => {
			updateNotepadList();
			initNotepad();
		});

	}, "New Notepad", ["Create", "Cancel"]);
}

$$('#notepadList').on('taphold', '#notepadList > li > a', e => {
	var notepadTitle;
	if ($$(e.target).hasClass("item-inner")) {
		notepadTitle = $$(e.target).find('.item-title').html();
	}
	else {
		notepadTitle = e.target.innerHTML;
	}

	var buttons = [
		[
			{
				text: "Delete",
				color: "red",
				onClick: () => {
					navigator.notification.confirm("Are you sure you want to delete this notepad?", buttonIndex => {
						if (buttonIndex === 1) {
							notepadStorage.removeItem(notepadTitle, () => {
								notepad = undefined;
								setTimeout(() => {
									updateNotepadList();
								}, 500);
							});
						}
					}, "Delete Notepad", ["Yes", "No"]);
				}
			},
			{
				text: "Rename",
				onClick: () => {
					navigator.notification.prompt("Notepad Title:", (results) => {
						if (results.buttonIndex !== 1 || results.input1.length < 1) return;

						var title = results.input1;
						notepadStorage.getItem(notepadTitle, function(err, res) {
							if (err || res === null) return;

							res = JSON.parse(res);
							notepad = parser.restoreNotepad(res);
							notepad.notepadAssets = res.notepadAssets;
							notepad.title = title;

							notepadStorage.removeItem(notepadTitle, () => {
								saveNotepad(updateNotepadList);
							});
						});
					}, "Rename Notepad", ["Rename", "Cancel"]);
				}
			}
		]
		// [
		// 	{
		// 		text: "Cancel"
		// 	}
		// ]
	];
	appUi.actions(e.target, buttons);
});

// Generate dynamic page
var dynamicPageIndex = 0;
function createContentPage() {
	mainView.router.loadContent(
		'<div class="navbar">' +
		'  <div class="navbar-inner">' +
		'    <div class="left"><a href="#" class="back link"><i class="icon icon-back"></i><span>Back</span></a></div>' +
		'    <div class="center sliding">Dynamic Page ' + (++dynamicPageIndex) + '</div>' +
		'  </div>' +
		'</div>' +
		'<div class="pages">' +
		'  <!-- Page, data-page contains page name-->' +
		'  <div data-page="dynamic-pages" class="page">' +
		'    <!-- Scrollable page content-->' +
		'    <div class="page-content">' +
		'      <div class="content-block">' +
		'        <div class="content-block-inner">' +
		'          <p>Here is a dynamic page created on ' + new Date() + ' !</p>' +
		'          <p>Go <a href="#" class="back">back</a> or go to <a href="services.html">Services</a>.</p>' +
		'        </div>' +
		'      </div>' +
		'    </div>' +
		'  </div>' +
		'</div>'
	);
	return;
}
