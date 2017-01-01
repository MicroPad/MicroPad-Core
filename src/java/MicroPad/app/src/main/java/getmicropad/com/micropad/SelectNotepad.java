package getmicropad.com.micropad;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;

import com.getmicropad.parser.NotepadType;
import com.getmicropad.parser.ObjectFactory;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import ae.javax.xml.bind.JAXBContext;
import ae.javax.xml.bind.JAXBException;
import ae.javax.xml.bind.JAXBIntrospector;
import ae.javax.xml.bind.Marshaller;
import ae.javax.xml.bind.Unmarshaller;


public class SelectNotepad extends AppCompatActivity {

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_select_notepad);

		ObjectFactory objectFactory = new ObjectFactory();
		NotepadType notepad = objectFactory.createNotepadType();
		try {
			JAXBContext context = JAXBContext.newInstance(this.getClass());
			Marshaller marshaller = context.createMarshaller();
			marshaller.setProperty(Marshaller.JAXB_ENCODING, "UTF-8");
			marshaller.setProperty(Marshaller.JAXB_NO_NAMESPACE_SCHEMA_LOCATION, "https://getmicropad.com/schema.xsd");
			ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
			marshaller.marshal(NotepadType.class, byteArrayOutputStream);
			Log.w("m3k", byteArrayOutputStream.toString());
		}
		catch (JAXBException e) {
			e.printStackTrace();
		}
	}
}
