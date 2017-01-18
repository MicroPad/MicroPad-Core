package getmicropad.com.micropad;

import android.content.Intent;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.design.widget.Snackbar;
import android.view.View;

import java.io.File;

public class ViewerActivity extends BaseActivity {

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.viewer_layout);

		FloatingActionButton fab = (FloatingActionButton) findViewById(R.id.add_element_btn);
		fab.setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View view) {
				Snackbar.make(view, "Replace with your own action", Snackbar.LENGTH_LONG)
						.setAction("Action", null).show();
			}
		});
		getSupportActionBar().setDisplayHomeAsUpEnabled(false);

		NoteLoader noteLoader = new NoteLoader();
		noteLoader.execute(getIntent().getExtras().get("NOTEPAD_FILE"), getIntent().getExtras().get("NOTE_XML"));
	}
}
