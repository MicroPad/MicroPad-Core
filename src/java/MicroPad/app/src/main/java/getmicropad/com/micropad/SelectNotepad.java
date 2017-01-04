package getmicropad.com.micropad;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.widget.TextView;

import com.getmicropad.NPXParser.Notepad;
import com.getmicropad.NPXParser.Parser;

import java.util.Date;

public class SelectNotepad extends AppCompatActivity {

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_select_notepad);
	}
}
