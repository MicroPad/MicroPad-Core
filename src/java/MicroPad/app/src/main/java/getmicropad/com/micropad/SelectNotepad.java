package getmicropad.com.micropad;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;

import com.getmicropad.NPXParser.Notepad;


public class SelectNotepad extends AppCompatActivity {

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_select_notepad);
		Notepad notepad = new Notepad("Test Notepad");
		Log.w("wm3k", notepad.getLastModified().toXMLFormat());
	}
}
