package com.getmicropad.NPXParser;

import org.simpleframework.xml.Attribute;
import org.simpleframework.xml.Element;

import javax.xml.datatype.DatatypeConfigurationException;
import javax.xml.datatype.DatatypeFactory;
import javax.xml.datatype.XMLGregorianCalendar;
import java.util.Date;
import java.util.GregorianCalendar;

@Element
public class Note {
	@Attribute
	private String title;

	@Attribute
	private XMLGregorianCalendar time;

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
}
