package com.getmicropad.micropad;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AlertDialog;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.ContextMenu;
import android.view.LayoutInflater;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.ListAdapter;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.getmicropad.NPXParser.Note;
import com.getmicropad.NPXParser.Notepad;
import com.getmicropad.NPXParser.Parent;
import com.getmicropad.NPXParser.Parser;
import com.getmicropad.NPXParser.Section;
import com.mikepenz.google_material_typeface_library.GoogleMaterial;
import com.mikepenz.iconics.IconicsDrawable;

import java.io.File;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class NotepadActivity extends BaseActivity {
	List<NLevelItem> list;
	ListView mainList;
	NLevelAdapter adapter;
	File notepadFile;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_select_notepad);
		getSupportActionBar().setDisplayHomeAsUpEnabled(false);

		/* Request permissions */
		if (savedInstanceState != null) {
			this.notepadFile = (File)savedInstanceState.getSerializable("NOTEPAD_FILE");
		}
		else {
			this.notepadFile = (File)getIntent().getExtras().get("NOTEPAD_FILE");
		}
		if ((ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) | ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)) != PackageManager.PERMISSION_GRANTED)  {
			ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE}, PERMISSION_REQ_FILESYSTEM);
		}
		else {
			this.parseNotepad();
		}

		this.mainList = (ListView)findViewById(R.id.main_list);
		this.list = new ArrayList<>();

		this.adapter = new NLevelAdapter(list);
		this.mainList.setAdapter(this.adapter);

		this.mainList.setOnItemClickListener((AdapterView<?> parent, View view, int position, long id) -> {
			this.adapter.toggle(position);
			this.adapter.getFilter().filter();
			Object item = ((NLevelItem)((NLevelAdapter)this.mainList.getAdapter()).getItem(position)).getWrappedObject();

			switch (view.getTag(R.id.TAG_OBJECT_TYPE).toString()) {
				case "section":
					this.updateParentTree(view, this.adapter, position);
					return;

				case "note":
					NLevelItem parentSectionItem = (NLevelItem)adapter.getItem(position).getParent();
					this.setNote((Note)item);
					this.updateParentTree(view, this.adapter, position);

					Notepad tmpNp = new Notepad("tmp", new Date());
					Section tmpS = new Section("tmp");
					tmpS.notes.add((Note)item);
					tmpNp.getSections().add(tmpS);

					if ((getResources().getConfiguration().screenLayout & Configuration.SCREENLAYOUT_SIZE_MASK) != Configuration.SCREENLAYOUT_SIZE_LARGE && (getResources().getConfiguration().screenLayout & Configuration.SCREENLAYOUT_SIZE_MASK) != Configuration.SCREENLAYOUT_SIZE_XLARGE) {
						//Phone
						Intent intent = new Intent(this, ViewerActivity.class);

						try {
							intent.putExtra("PATH", this.getParentTree().toArray(new Integer[this.getParentTree().size()]));
							startActivity(intent);
						} catch (Exception e) {
							e.printStackTrace();
						}
					}
					else {
						//Tablet
						NoteLoader noteLoader = new NoteLoader();
						noteLoader.execute(this.getParentTree());
					}
			}
		});

		this.mainList.setLongClickable(true);
		registerForContextMenu(this.mainList);

		FloatingActionButton newNotepadBtn = (FloatingActionButton)findViewById(R.id.add_notepad_btn);
		newNotepadBtn.setOnClickListener(view -> {
			EditText titleInput = new EditText(this);
			int paddingInDp = (int)(10*getResources().getDisplayMetrics().density + 0.5f);
			titleInput.setPadding(paddingInDp, paddingInDp, paddingInDp, paddingInDp);
			new AlertDialog.Builder(this)
					.setView(titleInput)
					.setTitle("New Section")
					.setPositiveButton("Create", (dialogInterface, whichButton) -> this.createNewSection(titleInput.getText().toString(), this.getNotepad()))
					.setNegativeButton(android.R.string.cancel, null).show();
		});
	}

	@Override
	protected void onResume() {
		super.onResume();
		if (this.getNotepad() != null) setTitle(this.getNotepad().getTitle());
	}

	protected void updateNotepad(Section section, LayoutInflater inflater) {
		super.updateNotepad(section);
		updateList(inflater, this.getNotepad());
	}

	protected void updateNotepad(Note note, LayoutInflater inflater) {
		super.updateNotepad(note);
		updateList(inflater, this.getNotepad());
	}

	protected void addToNotepad(LayoutInflater inflater) {
		super.addToNotepad();
		updateList(inflater, this.getNotepad());
	}

	private void createNewSection(String title, Parent parent) {
		this.getParentTree().clear();
		List<Section> parentSections = parent.getSections();
		if (parentSections == null) {
			parent.setSections(new ArrayList<>());
			parentSections = parent.getSections();
		}

		parentSections.add(new Section(title));
		addToParentTree(parentSections.size()-1);
		addToNotepad(getLayoutInflater());
	}

	@Override
	public void onCreateContextMenu(ContextMenu menu, View v, ContextMenu.ContextMenuInfo menuInfo) {
		super.onCreateContextMenu(menu, v, menuInfo);
		if (v.getId() == R.id.main_list) {
			AdapterView.AdapterContextMenuInfo info = (AdapterView.AdapterContextMenuInfo)menuInfo;
			Object selectedObj = ((NLevelItem)this.adapter.getItem(info.position)).getWrappedObject();
			if (Parent.class.isInstance(selectedObj)) menu.add(0, R.id.new_section_context, 0, "New Section");
			if (Section.class.isInstance(selectedObj)) menu.add(0, R.id.new_note_context, 0, "New Note");

			MenuInflater inflater = getMenuInflater();
			inflater.inflate(R.menu.list_context, menu);
		}
	}

	@Override
	public boolean onContextItemSelected(MenuItem item) {
		AdapterView.AdapterContextMenuInfo info = (AdapterView.AdapterContextMenuInfo)item.getMenuInfo();
		NLevelItem selItem = ((NLevelItem)this.adapter.getItem(info.position));
		switch (item.getItemId()) {
			case R.id.delete_context:
				switch (info.targetView.getTag(R.id.TAG_OBJECT_TYPE).toString()) {
					case "section":
						updateParentTree(info.targetView, this.adapter, info.position);
						new AlertDialog.Builder(this)
								.setTitle("Confirm Deletion")
								.setMessage("Are you sure you want to delete this?")
								.setIcon(new IconicsDrawable(this).icon(GoogleMaterial.Icon.gmd_delete_forever))
								.setPositiveButton(android.R.string.yes, (dialogInterface, whichButton) -> {
									updateNotepad((Section)null, getLayoutInflater());
								}).setNegativeButton(android.R.string.no, null).show();
						return true;
					case "note":
						updateParentTree(info.targetView, this.adapter, info.position);
						new AlertDialog.Builder(this)
								.setTitle("Confirm Deletion")
								.setMessage("Are you sure you want to delete this?")
								.setIcon(new IconicsDrawable(this).icon(GoogleMaterial.Icon.gmd_delete_forever))
								.setPositiveButton(android.R.string.yes, (dialogInterface, whichButton) -> {
									updateNotepad((Note)null, getLayoutInflater());
								}).setNegativeButton(android.R.string.no, null).show();
						return true;
				}
				return true;

			case R.id.new_section_context:
				updateParentTree(info.targetView, this.adapter, info.position);
				EditText renameInput = new EditText(this);
				int paddingInDp = (int)(10*getResources().getDisplayMetrics().density + 0.5f);
				renameInput.setPadding(paddingInDp, paddingInDp, paddingInDp, paddingInDp);
				new AlertDialog.Builder(this)
						.setView(renameInput)
						.setTitle("New Section")
						.setPositiveButton("Create", (dialogInterface, whichButton) -> {
							this.createNewSection(renameInput.getText().toString(), (Parent)selItem.getWrappedObject());
						}).setNegativeButton(android.R.string.cancel, null).show();
				return true;

			case R.id.new_note_context:
				updateParentTree(info.targetView, this.adapter, info.position);
				renameInput = new EditText(this);
				paddingInDp = (int)(10*getResources().getDisplayMetrics().density + 0.5f);
				renameInput.setPadding(paddingInDp, paddingInDp, paddingInDp, paddingInDp);
				new AlertDialog.Builder(this)
						.setView(renameInput)
						.setTitle("New Note")
						.setPositiveButton("Create", (dialogInterface, whichButton) -> {
							Section parentSection = ((Section) selItem.getWrappedObject());
							List<Note> parentNoteList = parentSection.notes;
							if (parentNoteList == null) {
								parentSection.notes = new ArrayList<>();
								parentNoteList = parentSection.notes;
							}
							parentNoteList.add(new Note(renameInput.getText().toString()));
							addToParentTree(parentNoteList.size()-1);
							addToNotepad(getLayoutInflater());
						}).setNegativeButton(android.R.string.cancel, null).show();
				return true;

			case R.id.rename_context:
				switch (info.targetView.getTag(R.id.TAG_OBJECT_TYPE).toString()) {
					case "section":
						updateParentTree(info.targetView, this.adapter, info.position);
						renameInput = new EditText(this);
						paddingInDp = (int)(10*getResources().getDisplayMetrics().density + 0.5f);
						renameInput.setPadding(paddingInDp, paddingInDp, paddingInDp, paddingInDp);
						new AlertDialog.Builder(this)
								.setView(renameInput)
								.setTitle("Rename Section")
								.setPositiveButton("Rename", (dialogInterface, whichButton) -> {
									Section section = (Section)selItem.getWrappedObject();
									section.setTitle(renameInput.getText().toString());
									updateNotepad(section, getLayoutInflater());
								}).setNegativeButton(android.R.string.cancel, null).show();
						return true;

					case "note":
						updateParentTree(info.targetView, this.adapter, info.position);
						renameInput = new EditText(this);
						paddingInDp = (int)(10*getResources().getDisplayMetrics().density + 0.5f);
						renameInput.setPadding(paddingInDp, paddingInDp, paddingInDp, paddingInDp);
						new AlertDialog.Builder(this)
								.setView(renameInput)
								.setTitle("Rename Note")
								.setPositiveButton("Rename", (dialogInterface, whichButton) -> {
									Note note = (Note)selItem.getWrappedObject();
									note.setTitle(renameInput.getText().toString());
									updateNotepad(note, getLayoutInflater());
								}).setNegativeButton(android.R.string.cancel, null).show();
						return true;
				}
				return true;

			default:
				return super.onContextItemSelected(item);
		}
	}

	List<Integer> path = new ArrayList<>();
	private void addToPath(int pos, int val) {
		if (this.path.size() <= depth) {
			this.path.add(pos, val);
		}
		else {
			this.path.set(pos, val);
		}
	}

	int depth = 0;

	private void updateList(LayoutInflater inflater, Notepad notepad) {
		this.list.clear();

		addSectionToList(inflater, null);
		this.path.clear();
		((NLevelAdapter)mainList.getAdapter()).getFilter().filter();
	}
	private void addSectionToList(LayoutInflater inflater, NLevelItem parentItem) {
		List<Section> sectionList;
		if (parentItem != null) {
			sectionList = ((Parent) parentItem.getWrappedObject()).getSections();
		}
		else {
			sectionList = getNotepad().getSections();
			if (sectionList == null) {
				getNotepad().setSections(new ArrayList<>());
				sectionList = getNotepad().getSections();
			}
		}

		for (int i = 0; i < sectionList.size(); i++) {
			Section section = sectionList.get(i);

			int finalI = i;
			NLevelItem sectionItem = new NLevelItem(section, parentItem, (NLevelItem item) -> {
				View view = inflater.inflate(R.layout.section_list_item, null);
				String name = "{gmd-book} " + ((Section) item.getWrappedObject()).getTitle();
				view.setTag(R.id.TAG_OBJECT_TYPE, "section");
				view.setTag(R.id.TAG_OBJECT_TITLE, name);

				addToPath(depth, finalI);
				String pathStr = "";
				for (Integer index : this.path) {
					if (pathStr.length() > 0) pathStr += ":";
					pathStr += index.toString();
				}
				view.setTag(R.id.TAG_OBJECT_PATH, pathStr);

				/** Generate a colour for the level of nesting */
				String levelStr;
				if (parentItem != null) {
					levelStr = ((Parent) parentItem.getWrappedObject()).getTitle();
				}
				else {
					levelStr = this.getNotepad().getTitle();
				}
				int hashcode = levelStr.hashCode() % 16777216;
				String hexHashCode = Integer.toHexString(hashcode);
				while (hexHashCode.length() < 6) hexHashCode += "0";
				int colour = Color.parseColor("#" + hexHashCode);

				View indentBar = view.findViewById(R.id.indent_bar);
				indentBar.setBackgroundColor(colour);

				TextView titleText = (TextView) view.findViewById(R.id.title_text);
				if (item.isExpanded()) titleText.setTypeface(null, Typeface.BOLD);
				titleText.setText(name);

				view.findViewById(R.id.overflow_button).setOnClickListener(v -> openContextMenu(view));
				return view;
			});
			this.list.add(sectionItem);

			this.depth++;
			if (section.getSections() != null && section.getSections().size() > 0) {
				addSectionToList(inflater, sectionItem);
			}

			if (section.notes != null) {
				for (int j = 0; j < section.notes.size(); j++) {
					Note note = section.notes.get(j);

					int finalJ = j;
					NLevelItem noteItem = new NLevelItem(note, sectionItem, (NLevelItem item) -> {
						if (item.isExpanded()) item.toggle();
						View view = inflater.inflate(R.layout.section_list_item, null);
						String name = "{gmd-note} " + ((Note) item.getWrappedObject()).getTitle();
						view.setTag(R.id.TAG_OBJECT_TYPE, "note");
						view.setTag(R.id.TAG_OBJECT_TITLE, name);

						addToPath(this.depth, finalJ);
						String pathStr = "";
						for (Integer index : this.path) {
							if (pathStr.length() > 0) pathStr += ":";
							pathStr += index.toString();
						}
						view.setTag(R.id.TAG_OBJECT_PATH, pathStr);

						//Generate a colour for the level of nesting
						String levelStr;
						if (parentItem != null) {
							levelStr = ((Parent) parentItem.getWrappedObject()).getTitle() + ":" + ((Section) sectionItem.getWrappedObject()).getTitle();
						}
						else {
							levelStr = this.getNotepad().getTitle() + ":" + ((Section) sectionItem.getWrappedObject()).getTitle();
						}
						int hashcode = levelStr.hashCode() % 16777216;
						String hexHashCode = Integer.toHexString(hashcode);
						while (hexHashCode.length() < 6) hexHashCode += "0";
						int colour = Color.parseColor("#" + hexHashCode);

						View indentBar = view.findViewById(R.id.indent_bar);
						indentBar.setBackgroundColor(colour);

						TextView titleText = (TextView) view.findViewById(R.id.title_text);
						titleText.setText(name);

						view.findViewById(R.id.overflow_button).setOnClickListener(v -> openContextMenu(view));
						return view;
					});
					this.list.add(noteItem);
				}
			}
			this.depth--;
		}
	}

	private void parseNotepad() {
		File file = this.notepadFile;
		NpxReader npxReader = new NpxReader();
		npxReader.execute(file, 1);
	}

	@Override
	public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
		super.onRequestPermissionsResult(requestCode, permissions, grantResults);

		switch (requestCode) {
			case PERMISSION_REQ_FILESYSTEM:
				if (grantResults.length > 1 && (grantResults[0] | grantResults[1]) == PackageManager.PERMISSION_GRANTED) {
					this.filesystemManager = new FilesystemManager(getApplicationContext());
					this.parseNotepad();
				}
				else {
					new AlertDialog.Builder(this)
							.setTitle("Permission Denied")
							.setMessage("Error accessing the device's storage")
							.setPositiveButton("Close", (dialog, which) -> {
								System.exit(0);
							})
							.show();
				}
		}
	}

	@Override
	public void onSaveInstanceState(Bundle savedInstanceState) {
		savedInstanceState.putSerializable("NOTEPAD_FILE", this.notepadFile);

		super.onSaveInstanceState(savedInstanceState);
	}

	private class NpxReader extends AsyncTask<Object, String, Notepad> {
		private Notepad res;
		private ProgressBar progressBar;

		@Override
		protected void onPreExecute() {
			//Show progress bar
			progressBar = (ProgressBar)findViewById(R.id.progress);
			progressBar.setIndeterminate(true);
			progressBar.setVisibility(View.VISIBLE);
		}

		@Override
		protected Notepad doInBackground(Object... params) {
			try {
				res = Parser.parseNpx((File)params[0]);
			} catch (Exception e) {
				res = null;
			}
			return res;
		}

		@Override
		protected void onPostExecute(Notepad notepad) {
			progressBar.setVisibility(View.GONE);

			if (notepad == null) {
				new AlertDialog.Builder(NotepadActivity.this)
						.setTitle("Error")
						.setMessage("Error parsing notepad")
						.setCancelable(true)
						.setPositiveButton("Close", (dialog, which) -> {})
						.show();
			}
			else {
				setNotepad(notepad);
				setTitle(notepad.getTitle());
				updateList(getLayoutInflater(), notepad);
			}
		}
	}

	@Override
	protected void setNotepad(Notepad notepad) {
		super.setNotepad(notepad);
		this.updateList(getLayoutInflater(), notepad);
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		switch (item.getItemId()) {
			case R.id.app_bar_search:
				AlertDialog.Builder builder = new AlertDialog.Builder(this)
						.setTitle("Search")
						.setPositiveButton("Close", (d, w) -> {})
						.setCancelable(true);
				LayoutInflater inflater = this.getLayoutInflater();
				View view = inflater.inflate(R.layout.search_layout, null);
				builder.setView(view);
				AlertDialog dialog = builder.create();

				((EditText)view.findViewById(R.id.search_input)).addTextChangedListener(new TextWatcher() {
					@Override
					public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {}

					@Override
					public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {}

					@Override
					public void afterTextChanged(Editable editable) {
						List<Note> res = notepadSearcher.search(editable.toString());

						ListAdapter searchAdapter = new ArrayAdapter<>(NotepadActivity.this, android.R.layout.simple_list_item_1, res);
						runOnUiThread(() -> {
							ListView searchList = (ListView)view.findViewById(R.id.search_list);
							searchList.setAdapter(searchAdapter);

							searchList.setOnItemClickListener((adapterView, v, pos, a4) -> {
								if ((getResources().getConfiguration().screenLayout & Configuration.SCREENLAYOUT_SIZE_MASK) != Configuration.SCREENLAYOUT_SIZE_LARGE && (getResources().getConfiguration().screenLayout & Configuration.SCREENLAYOUT_SIZE_MASK) != Configuration.SCREENLAYOUT_SIZE_XLARGE) {
									//Phone
									Intent intent = new Intent(NotepadActivity.this, ViewerActivity.class);

									try {
										setParentTree(notepadSearcher.getTree(adapterView.getItemAtPosition(pos)));
										intent.putExtra("PATH", getParentTree().toArray(new Integer[getParentTree().size()]));
										startActivity(intent);
									} catch (Exception e) {
										e.printStackTrace();
									}
								}
								else {
									Note resNote = (Note)adapterView.getItemAtPosition(pos);
									setParentTree(notepadSearcher.getTree(resNote));
									loadNote(resNote);
									dialog.dismiss();
								}
							});
						});
					}
				});

				dialog.show();
				return true;

			default:
				return super.onOptionsItemSelected(item);
		}
	}
}
