package com.getmicropad.parser;

import javax.xml.bind.annotation.adapters.XmlAdapter;

public class AdapterCDATA extends XmlAdapter<String, String> {
	@Override
	public String marshal(String content) throws Exception {
		return "<![CDATA["+content+"]]>";
	}

	@Override
	public String unmarshal(String content) throws Exception {
		return content;
	}
}
