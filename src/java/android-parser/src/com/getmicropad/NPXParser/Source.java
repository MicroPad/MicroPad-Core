package com.getmicropad.NPXParser;

import org.simpleframework.xml.Attribute;
import org.simpleframework.xml.Element;
import org.simpleframework.xml.ElementList;
import org.simpleframework.xml.Text;

import java.util.ArrayList;
import java.util.List;

@Element(name="source")
public class Source {
	@Text(required=false)
	private String url;

	@Attribute
	private int id;

	@Attribute
	private String item;

	public Source() {
		this.id = 0;
		this.item = "";
		this.url = "";
	}

	public Source(int id, String item, String url) {
		this.id = id;
		this.item = item;
		this.url = url;
	}

	public String getUrl() {
		return this.url;
	}
	public void setUrl(String url) {
		this.url = url;
	}

	public int getId() {
		return this.id;
	}
	public void setId(int id) {
		this.id = id;
	}

	public String getItem() {
		return this.item;
	}
	public void setItem(String item) {
		this.item = item;
	}
}
