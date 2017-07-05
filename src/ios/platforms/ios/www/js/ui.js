// Initialize your app
var appUi = new Framework7({
	init: false
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
			$$('#notepadList').append('<li><a href="javascript:loadNotepad(\'{0}\');" class="item-link item-content"><div class="item-inner"><div class="item-title">{0}</div></div></a></li>'.format(key));
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
