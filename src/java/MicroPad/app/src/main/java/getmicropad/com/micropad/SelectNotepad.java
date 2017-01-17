package getmicropad.com.micropad;

import android.Manifest;
import android.content.Context;
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
import android.support.v7.app.AppCompatActivity;
import android.view.ContextMenu;
import android.view.LayoutInflater;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.widget.AdapterView;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.TextView;

import com.getmicropad.NPXParser.Note;
import com.getmicropad.NPXParser.Notepad;
import com.getmicropad.NPXParser.Parent;
import com.getmicropad.NPXParser.Parser;
import com.getmicropad.NPXParser.Section;
import com.mikepenz.google_material_typeface_library.GoogleMaterial;
import com.mikepenz.iconics.IconicsDrawable;
import com.mikepenz.iconics.context.IconicsContextWrapper;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

public class SelectNotepad extends AppCompatActivity {
	List<NLevelItem> list;
	ListView mainList;
	NLevelAdapter adapter;
	static final int PERMISSION_REQ_FILESYSTEM = 0;
	FilesystemManager filesystemManager;

	@Override
	protected void attachBaseContext(Context newBase) {
		super.attachBaseContext(IconicsContextWrapper.wrap(newBase));
	}

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_select_notepad);

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


		this.mainList.setOnItemClickListener((AdapterView<?> parent, View view, int position, long id) -> {
			this.adapter.toggle(position);
			this.adapter.getFilter().filter();
			File notepadFile = (File)((NLevelItem)((NLevelAdapter)this.mainList.getAdapter()).getItem(position)).getWrappedObject();

			//TODO: Open Notepad
			Intent intent = new Intent(getBaseContext(), NotepadActivity.class);
			intent.putExtra("NOTEPAD_FILE", notepadFile);
			startActivity(intent);
		});

		FloatingActionButton newNotepadBtn = (FloatingActionButton)findViewById(R.id.add_notepad_btn);
		newNotepadBtn.setOnClickListener(view -> {
			EditText titleInput = new EditText(this);
			new AlertDialog.Builder(this)
					.setView(titleInput)
					.setTitle("New Notepad")
					.setPositiveButton("Create", (dialogInterface, whichButton) -> {
						//TODO: Filesystem
					}).setNegativeButton(android.R.string.cancel, null).show();
		});
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
