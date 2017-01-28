package com.getmicropad.micropad;

import android.content.Context;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

public class MarkdownInterface {
	Context context;
	WebView webView;

	public MarkdownInterface(Context context, WebView webView) {
		this.context = context;
		this.webView = webView;
	}

	@JavascriptInterface
	public void renderingDone(long width, long height) {
		this.webView.getLayoutParams().width = (int)width;
		this.webView.getLayoutParams().height = (int)height;
		this.webView.requestLayout();
	}
}
