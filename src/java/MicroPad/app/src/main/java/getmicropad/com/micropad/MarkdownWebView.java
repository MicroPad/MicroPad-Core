package getmicropad.com.micropad;

import android.content.Context;
import android.util.AttributeSet;
import android.webkit.WebView;

public class MarkdownWebView extends WebView {
	public int realContentWidth;
	public int realContentHeight;

	public MarkdownWebView(Context context) {
		super(context);
	}

	public MarkdownWebView(Context context, AttributeSet attributeSet) {
		super(context, attributeSet);
	}

	public MarkdownWebView(Context context, AttributeSet attributeSet, int defStyleAttr) {
		super(context, attributeSet, defStyleAttr);
	}

//	@Override
//	public void onSizeChanged(int width, int height, int oWidth, int oHeight) {
//		super.onSizeChanged(width, height, oWidth, oHeight);
//
//		this.realContentWidth = this.computeHorizontalScrollRange();
//		this.realContentHeight = this.computeVerticalScrollRange();
//
//		this.getLayoutParams().width = this.realContentWidth;
//		this.getLayoutParams().height = this.realContentHeight;
//		this.requestLayout();
//	}
}
