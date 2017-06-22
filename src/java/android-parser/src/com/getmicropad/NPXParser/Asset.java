package com.getmicropad.NPXParser;

import org.simpleframework.xml.Attribute;
import org.simpleframework.xml.Element;
import org.simpleframework.xml.Root;
import org.simpleframework.xml.Text;

import java.util.UUID;

@Element(name="asset")
public class Asset {
	@Text(required=false)
	private String data;

	@Attribute(required=false)
	private String uuid;

	public Asset() {
		this.uuid = UUID.randomUUID().toString();
		this.data = "";
	}

	public Asset(String uuid, String data) {
		this.data = data;
		this.uuid = uuid;
	}

	public String getUuid() {
		return this.uuid;
	}

	public byte[] getDataAsByteArray() {
		return Base64.decode(this.data.split(",")[1], Base64.DEFAULT);
	}

	public String getData() {
		return this.data;
	}

	public void setData(String data) {
		this.data = data;
	}
}