package com.getmicropad.NPXParser;

import org.simpleframework.xml.transform.Transform;

import javax.xml.datatype.DatatypeFactory;
import javax.xml.datatype.XMLGregorianCalendar;

public class XMLGregorianCalendarTransform implements Transform<XMLGregorianCalendar> {
	@Override
	public XMLGregorianCalendar read(final String value) throws Exception {
		return DatatypeFactory.newInstance().newXMLGregorianCalendar(value);
	}

	@Override
	public String write(final XMLGregorianCalendar value) throws Exception {
		return value.toXMLFormat();
	}
}
