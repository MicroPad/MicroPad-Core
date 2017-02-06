package com.getmicropad.micropad;

import android.graphics.Bitmap;
import android.graphics.Color;
import android.text.Layout;
import android.text.Selection;
import android.widget.EditText;

import java.text.NumberFormat;
import java.text.ParseException;

public class Helpers {
	public static Bitmap TrimBitmap(Bitmap bmp) {
		int imgHeight = bmp.getHeight();
		int imgWidth  = bmp.getWidth();


		//TRIM WIDTH - LEFT
		int startWidth = 0;
		for(int x = 0; x < imgWidth; x++) {
			if (startWidth == 0) {
				for (int y = 0; y < imgHeight; y++) {
					if (bmp.getPixel(x, y) != Color.TRANSPARENT) {
						startWidth = x;
						break;
					}
				}
			} else break;
		}


		//TRIM WIDTH - RIGHT
		int endWidth  = 0;
		for(int x = imgWidth - 1; x >= 0; x--) {
			if (endWidth == 0) {
				for (int y = 0; y < imgHeight; y++) {
					if (bmp.getPixel(x, y) != Color.TRANSPARENT) {
						endWidth = x;
						break;
					}
				}
			} else break;
		}



		//TRIM HEIGHT - TOP
		int startHeight = 0;
		for(int y = 0; y < imgHeight; y++) {
			if (startHeight == 0) {
				for (int x = 0; x < imgWidth; x++) {
					if (bmp.getPixel(x, y) != Color.TRANSPARENT) {
						startHeight = y;
						break;
					}
				}
			} else break;
		}



		//TRIM HEIGHT - BOTTOM
		int endHeight = 0;
		for(int y = imgHeight - 1; y >= 0; y--) {
			if (endHeight == 0 ) {
				for (int x = 0; x < imgWidth; x++) {
					if (bmp.getPixel(x, y) != Color.TRANSPARENT) {
						endHeight = y;
						break;
					}
				}
			} else break;
		}


		return Bitmap.createBitmap(
				bmp,
				startWidth,
				startHeight,
				endWidth - startWidth,
				endHeight - startHeight
		);

	}

	public static int getIntFromString(String str) throws ParseException {
		return (NumberFormat.getInstance().parse(str)).intValue();
	}

	public static int getCurrentCursorLine(EditText editText) {
		int selectionStart = Selection.getSelectionStart(editText.getText());
		Layout layout = editText.getLayout();

		if (!(selectionStart == -1)) {
			return layout.getLineForOffset(selectionStart);
		}

		return -1;
	}

	public static String getFilename(String title) {
		return title.replaceAll("/[^a-z0-9 ]/gi", "")+".npx";
	}
}
