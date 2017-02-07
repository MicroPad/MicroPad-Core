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
		noteLoader.execute(getIntent().getExtras().get("NOTEPAD_FILE"), new ArrayList<>(Arrays.asList((Integer[])getIntent().getExtras().get("PATH"))));
	}

	@Override
	protected void setNotepad(Notepad notepad) {
		super.setNotepad(notepad);
//		finish();
	}
}
