package com.getmicropad.NPXParser;

import org.simpleframework.xml.transform.Matcher;
import org.simpleframework.xml.transform.Transform;

import javax.xml.datatype.XMLGregorianCalendar;

public class NPXMatcher implements Matcher {
	@Override
	public Transform<?> match(@SuppressWarnings("rawtypes") final Class type) throws Exception {
		if (XMLGregorianCalendar.class.isAssignableFrom(type)) {
			return new XMLGregorianCalendarTransform();
		}

		return null;
	}
}
