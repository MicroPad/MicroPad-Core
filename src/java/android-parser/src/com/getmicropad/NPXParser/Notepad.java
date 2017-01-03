package com.getmicropad.NPXParser;

import com.sun.org.apache.xerces.internal.jaxp.datatype.DatatypeFactoryImpl;
import org.simpleframework.xml.*;

import javax.xml.crypto.Data;
import javax.xml.datatype.DatatypeConfigurationException;
import javax.xml.datatype.DatatypeFactory;
import javax.xml.datatype.XMLGregorianCalendar;
import java.util.ArrayList;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.List;

@Root(name="notepad")
public class Notepad implements Parent {
	@ElementList(inline=true, type=Section.class, entry="section", required=false)
	public List<Section> sections;

	@Attribute(name="noNamespaceSchemaLocation")
	@Namespace(reference = "http://www.w3.org/2001/XMLSchema-instance", prefix = "xsi")
	private String noNamespaceSchemaLocation = "https://getmicropad.com/schema.xsd";

	@Attribute
	private String title;

	@Attribute(required = false)
	private XMLGregorianCalendar lastModified;

	public Notepad() {}

	public Notepad(String title) {
		this.title = title;
		this.sections = new ArrayList<>();

		setLastModified(new Date());
	}

	public Notepad(String title, Date lastModified) {
		this.title = title;
		this.sections = new ArrayList<>();

		setLastModified(lastModified);
	}

	public Notepad(String title, Date lastModified, List<Section> sections) {
		this.title = title;
		this.sections = sections;

		setLastModified(lastModified);
	}

	public String getTitle() {
		return this.title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public XMLGregorianCalendar getLastModified() {
		return this.lastModified;
	}

	public void setLastModified(Date date) {
		GregorianCalendar calendar = new GregorianCalendar();
		calendar.setTime(date);
		try {
			DatatypeFactory datatypeFactory = DatatypeFactoryImpl.newInstance();
			this.lastModified = datatypeFactory.newXMLGregorianCalendar(calendar);
		} catch (DatatypeConfigurationException e) {
			e.printStackTrace();
		}
	}

	public void setLastModified(XMLGregorianCalendar date) {
		this.lastModified = date;
	}
}
