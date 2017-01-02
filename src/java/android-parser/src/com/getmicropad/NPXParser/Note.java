package com.getmicropad.NPXParser;

import org.simpleframework.xml.*;

import javax.xml.datatype.DatatypeConfigurationException;
import javax.xml.datatype.DatatypeFactory;
import javax.xml.datatype.XMLGregorianCalendar;
import java.util.ArrayList;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.List;

@Root(name="note")
public class Note {
	@Element
	private Addons addons = new Addons();

//	@ElementList(inline = false, entry = "source")
//	public List<Source> bibliography = new ArrayList<>();
	@Element
	public Bibliography bibliography = new Bibliography();

	@ElementListUnion({
			@ElementList(inline=true, type=MarkdownElement.class, entry="markdown", required=false),
			@ElementList(inline=true, type=DrawingElement.class, entry="drawing", required=false),
			@ElementList(inline=true, type=ImageElement.class, entry="image", required=false),
			@ElementList(inline=true, type=FileElement.class, entry="file", required=false),
			@ElementList(inline=true, type=RecordingElement.class, entry="recording", required=false)
	})
	public List<NoteElement> elements = new ArrayList<>();

	@Attribute
	private String title;

	@Attribute
	private XMLGregorianCalendar time;

	public Note() {
	}

	public Note(String title) {
		this.title = title;
		setTime(new Date());
	}

	public Note(String title, Date time) {
		this.title = title;
		setTime(time);
	}

	public String getTitle() {
		return this.title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public XMLGregorianCalendar getTime() {
		return this.time;
	}

	public void setTime(Date date) {
		GregorianCalendar calendar = new GregorianCalendar();
		calendar.setTime(date);
		try {
			DatatypeFactory datatypeFactory = DatatypeFactory.newInstance();
			this.time = datatypeFactory.newXMLGregorianCalendar(calendar);
		} catch (DatatypeConfigurationException e) {
			e.printStackTrace();
		}
	}

	public void setTime(XMLGregorianCalendar date) {
		this.time = date;
	}

	public List<Import> getAddons() {
		return this.addons.imports;
	}

	public void setAddons(List<Import> addons) {
		this.addons = new Addons(addons);
	}
}
