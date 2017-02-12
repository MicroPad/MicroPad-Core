package com.getmicropad.micropad;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.design.widget.FloatingActionButton;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.view.ContextMenu;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.widget.AdapterView;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.TextView;

import com.androidnetworking.AndroidNetworking;
import com.getmicropad.NPXParser.Notepad;
import com.getmicropad.NPXParser.Parser;
import com.mikepenz.google_material_typeface_library.GoogleMaterial;
import com.mikepenz.iconics.IconicsDrawable;
import com.mikepenz.iconics.context.IconicsContextWrapper;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class SelectNotepad extends AppCompatActivity {
	List<NLevelItem> list;
	ListView mainList;
	NLevelAdapter adapter;
	static final int PERMISSION_REQ_FILESYSTEM = 0;
	FilesystemManager filesystemManager;
	SharedPreferences prefs;
	MicroSyncManager syncer;

	@Override
	protected void attachBaseContext(Context newBase) {
		super.attachBaseContext(IconicsContextWrapper.wrap(newBase));
	}

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_select_notepad);

		this.prefs = PreferenceManager.getDefaultSharedPreferences(this);
		this.syncer = new MicroSyncManager("https://getmicropad.com/sync/api/");
		AndroidNetworking.initialize(getApplicationContext());

		this.mainList = (ListView)findViewById(R.id.main_list);
		this.list = new ArrayList<>();

		this.adapter = new NLevelAdapter(list);
		this.mainList.setAdapter(this.adapter);

		/* Request permissions */
		if ((ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) | ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)) != PackageManager.PERMISSION_GRANTED)  {
			ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE}, PERMISSION_REQ_FILESYSTEM);
		}
		else {
			this.filesystemManager = new FilesystemManager();
			this.getNotepads();
		}

		this.mainList.setLongClickable(true);
		registerForContextMenu(this.mainList);

		this.mainList.setOnItemClickListener((AdapterView<?> parent, View view, int position, long id) -> {
			this.adapter.toggle(position);
			this.adapter.getFilter().filter();
			File notepadFile = (File)((NLevelItem)((NLevelAdapter)this.mainList.getAdapter()).getItem(position)).getWrappedObject();

			//Open Notepad
			Intent intent = new Intent(getBaseContext(), NotepadActivity.class);
			intent.putExtra("NOTEPAD_FILE", notepadFile);
			startActivity(intent);
		});

		FloatingActionButton newNotepadBtn = (FloatingActionButton)findViewById(R.id.add_notepad_btn);
		newNotepadBtn.setOnClickListener(view -> {
			EditText titleInput = new EditText(this);
			int paddingInDp = (int)(10*getResources().getDisplayMetrics().density + 0.5f);
			titleInput.setPadding(paddingInDp, paddingInDp, paddingInDp, paddingInDp);
			new AlertDialog.Builder(this)
					.setView(titleInput)
					.setTitle("New Notepad")
					.setPositiveButton("Create", (dialogInterface, whichButton) -> {
						if (this.filesystemManager.saveNotepad(new Notepad(titleInput.getText().toString()))) {
							this.getNotepads();
						}
						else {
							new AlertDialog.Builder(getApplicationContext())
									.setTitle("Error")
									.setMessage("Error saving notepad")
									.setCancelable(true)
									.setPositiveButton("Close", (dialog, which) -> {})
									.show();
						}
					}).setNegativeButton(android.R.string.cancel, null).show();
		});
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		super.onCreateOptionsMenu(menu);

		MenuInflater inflater = getMenuInflater();
		inflater.inflate(R.menu.select_notepad_menu, menu);

		return true;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		switch (item.getItemId()) {
			case R.id.open_notepad:
				return true;

			default:
				return super.onContextItemSelected(item);
		}
	}

	@Override
	public void onCreateContextMenu(ContextMenu menu, View v, ContextMenu.ContextMenuInfo menuInfo) {
		super.onCreateContextMenu(menu, v, menuInfo);
		if (v.getId() == R.id.main_list) {
			MenuInflater inflater = getMenuInflater();
			inflater.inflate(R.menu.list_context, menu);
		}
	}

	@Override
	public boolean onContextItemSelected(MenuItem item) {
		AdapterView.AdapterContextMenuInfo info = (AdapterView.AdapterContextMenuInfo)item.getMenuInfo();
		NLevelItem selItem = ((NLevelItem)this.adapter.getItem(info.position));
		File notepadFile = (File)selItem.getWrappedObject();
		switch (item.getItemId()) {
			case R.id.delete_context:
				new AlertDialog.Builder(this)
						.setTitle("Confirm Deletion")
						.setMessage("Are you sure you want to delete this?")
						.setIcon(new IconicsDrawable(this).icon(GoogleMaterial.Icon.gmd_delete_forever))
						.setPositiveButton(android.R.string.yes, (dialogInterface, whichButton) -> {
							if (notepadFile.delete()) {
								this.getNotepads();
							}
							else {
								new AlertDialog.Builder(getApplicationContext())
										.setTitle("Error")
										.setMessage("Error deleting notepad")
										.setCancelable(true)
										.setPositiveButton("Close", (dialog, which) -> {})
										.show();
							}
						}).setNegativeButton(android.R.string.no, null).show();
				return true;

			case R.id.rename_context:
				EditText renameInput = new EditText(this);
				int paddingInDp = (int)(10*getResources().getDisplayMetrics().density + 0.5f);
				renameInput.setPadding(paddingInDp, paddingInDp, paddingInDp, paddingInDp);
				new AlertDialog.Builder(this)
						.setView(renameInput)
						.setTitle("Rename Notepad")
						.setPositiveButton("Rename", (dialogInterface, whichButton) -> {
							//Parse Notepad
							try {
								Notepad notepad = Parser.parseNpx(notepadFile);
								notepad.setTitle(renameInput.getText().toString());

								if (notepadFile.delete() && this.filesystemManager.saveNotepad(notepad)) {
									this.getNotepads();
								}
								else {
									new AlertDialog.Builder(getApplicationContext())
											.setTitle("Error")
											.setMessage("Error parsing notepad")
											.setCancelable(true)
											.setPositiveButton("Close", (dialog, which) -> {})
											.show();
								}
							} catch (Exception e) {
								new AlertDialog.Builder(getApplicationContext())
										.setTitle("Error")
										.setMessage("Error parsing notepad")
										.setCancelable(true)
										.setPositiveButton("Close", (dialog, which) -> {})
										.show();
							}
						}).setNegativeButton(android.R.string.cancel, null).show();
				return true;

			default:
				return super.onContextItemSelected(item);
		}
	}

	private void updateList(LayoutInflater inflater, File[] notepads) {
		this.list.clear();
		for (File notepad : notepads) {
			NLevelItem notepadItem = new NLevelItem(notepad, null, (NLevelItem item) -> {
				View view = inflater.inflate(R.layout.notepad_list_item, null);
				String name = "{gmd-collections-bookmark} "+((File)item.getWrappedObject()).getName().split(".npx")[0];
				view.setTag(R.id.TAG_OBJECT_TYPE, "notepad");
				view.setTag(R.id.TAG_OBJECT_TITLE, name);
				TextView titleText = (TextView)view.findViewById(R.id.title_text);
				titleText.setText(name);

				view.findViewById(R.id.overflow_button).setOnClickListener(v -> openContextMenu(view));
				return view;
			});
			this.list.add(notepadItem);
		}
		((NLevelAdapter)mainList.getAdapter()).getFilter().filter();
	}

	private void getNotepads() {
		this.updateList(getLayoutInflater(), this.filesystemManager.getNotepadFiles());
	}

	@Override
	public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
		switch (requestCode) {
			case PERMISSION_REQ_FILESYSTEM:
				if (grantResults.length > 1 && (grantResults[0] | grantResults[1]) == PackageManager.PERMISSION_GRANTED) {
					this.filesystemManager = new FilesystemManager();
					this.getNotepads();
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
}
