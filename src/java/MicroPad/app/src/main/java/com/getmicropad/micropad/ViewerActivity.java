package com.getmicropad.micropad;

import android.os.Bundle;

import com.getmicropad.NPXParser.Notepad;

import java.util.ArrayList;
import java.util.Arrays;

public class ViewerActivity extends BaseActivity {

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.viewer_layout);

		getSupportActionBar().setDisplayHomeAsUpEnabled(false);

		NoteLoader noteLoader = new NoteLoader();
		try {
			noteLoader.execute(new ArrayList<>(Arrays.asList((Integer[])getIntent().getExtras().get("PATH"))));
		}
		catch (ClassCastException e) {
			noteLoader.execute(new ArrayList<>(Arrays.asList(Arrays.copyOf(((Object[])getIntent().getExtras().get("PATH")), ((Object[])getIntent().getExtras().get("PATH")).length, Integer[].class))));
		}
	}

	@Override
	protected void setNotepad(Notepad notepad) {
		super.setNotepad(notepad);
//		finish();
	}
}
