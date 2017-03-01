package com.getmicropad.micropad;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.support.v7.app.AlertDialog;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.getmicropad.micropad.util.IabHelper;
import com.getmicropad.micropad.util.IabResult;
import com.getmicropad.micropad.util.Inventory;
import com.getmicropad.micropad.util.Purchase;

import java.util.ArrayList;
import java.util.List;

public class IabManager {
	public static final int SINGLE = 3001;
	public static final int STUDY = 3002;
	public static final int POWER = 3003;

	private IabHelper helper;
	private boolean iabEnabled = false;
	private Context context;
	private IabHelper.OnIabPurchaseFinishedListener purchaseFinishedListener;
	SharedPreferences prefs;

	public IabManager(Context context) {
		this.context = context;
		this.prefs = PreferenceManager.getDefaultSharedPreferences(this.context);

		this.helper = new IabHelper(this.context, BuildConfig.IAB_KEY);
		this.helper.startSetup(res -> {
			if (res.isSuccess()) {
				iabEnabled = true;
			}
		});

		this.purchaseFinishedListener = new IabHelper.OnIabPurchaseFinishedListener() {
			@Override
			public void onIabPurchaseFinished(IabResult result, Purchase purchase) {
				if (result.isFailure()) {
					showError("Error purchasing: "+result);
					return;
				}

				//TODO: Tell server to check the Google Play API for purchase details

//				switch (purchase.getSku()) {
//					case "single_pack_2":
//						break;
//
//					case "study_pack":
//						break;
//
//					case "power_pack":
//						break;
//				}
			}
		};
	}

	public void destroy() {
		if (this.helper != null) try {
			this.helper.dispose();
		} catch (IabHelper.IabAsyncInProgressException e) {
			e.printStackTrace();
		}
		this.helper = null;
	}

	public void showPurchaseDialog() {
		List<String> subSkuList = new ArrayList<>();
		subSkuList.add("single_pack_2");
		subSkuList.add("study_pack");
		subSkuList.add("power_pack");

		try {
			this.helper.queryInventoryAsync(true, new ArrayList<>(), subSkuList, new IabHelper.QueryInventoryFinishedListener() {
				public void onQueryInventoryFinished(IabResult result, Inventory inventory) {
					if (result.isFailure()) {
						showError("Error getting data from Google Play");
						return;
					}

					//Show purchase dialog
					AlertDialog.Builder builder = new AlertDialog.Builder(context)
							.setTitle("Subscribe to \u00B5Sync")
							.setPositiveButton("Close", null)
							.setCancelable(true);
					LayoutInflater loginInflater = LayoutInflater.from(context);
					View view = loginInflater.inflate(R.layout.subscription_picker, null);

					((TextView)view.findViewById(R.id.title_1)).setText(inventory.getSkuDetails(subSkuList.get(0)).getTitle().substring(0, inventory.getSkuDetails(subSkuList.get(0)).getTitle().length()-10));
					((TextView)view.findViewById(R.id.title_2)).setText(inventory.getSkuDetails(subSkuList.get(1)).getTitle().substring(0, inventory.getSkuDetails(subSkuList.get(1)).getTitle().length()-10));
					((TextView)view.findViewById(R.id.title_3)).setText(inventory.getSkuDetails(subSkuList.get(2)).getTitle().substring(0, inventory.getSkuDetails(subSkuList.get(2)).getTitle().length()-10));

					((TextView)view.findViewById(R.id.description_1)).setText(inventory.getSkuDetails(subSkuList.get(0)).getDescription());
					((TextView)view.findViewById(R.id.description_2)).setText(inventory.getSkuDetails(subSkuList.get(1)).getDescription());
					((TextView)view.findViewById(R.id.description_3)).setText(inventory.getSkuDetails(subSkuList.get(2)).getDescription());

					((Button)view.findViewById(R.id.buy_button1)).setText(String.format("%s%s", inventory.getSkuDetails(subSkuList.get(0)).getPriceCurrencyCode(), inventory.getSkuDetails(subSkuList.get(0)).getPrice()));
					((Button)view.findViewById(R.id.buy_button2)).setText(String.format("%s%s", inventory.getSkuDetails(subSkuList.get(1)).getPriceCurrencyCode(), inventory.getSkuDetails(subSkuList.get(1)).getPrice()));
					((Button)view.findViewById(R.id.buy_button3)).setText(String.format("%s%s", inventory.getSkuDetails(subSkuList.get(2)).getPriceCurrencyCode(), inventory.getSkuDetails(subSkuList.get(2)).getPrice()));

					view.findViewById(R.id.buy_button1).setOnClickListener((v) -> {
						try {
							helper.launchPurchaseFlow((Activity)context, subSkuList.get(0), SINGLE, purchaseFinishedListener, prefs.getString("username", null));
						} catch (IabHelper.IabAsyncInProgressException e) {
							e.printStackTrace();
							showError("Error purchasing from Google Play");
						}
					});

					view.findViewById(R.id.buy_button2).setOnClickListener((v) -> {
						try {
							helper.launchPurchaseFlow((Activity)context, subSkuList.get(1), STUDY, purchaseFinishedListener, prefs.getString("username", null));
						} catch (IabHelper.IabAsyncInProgressException e) {
							e.printStackTrace();
							showError("Error purchasing from Google Play");
						}
					});

					view.findViewById(R.id.buy_button3).setOnClickListener((v) -> {
						try {
							helper.launchPurchaseFlow((Activity)context, subSkuList.get(2), POWER, purchaseFinishedListener, prefs.getString("username", null));
						} catch (IabHelper.IabAsyncInProgressException e) {
							e.printStackTrace();
							showError("Error purchasing from Google Play");
						}
					});

					builder.setView(view);
					AlertDialog dialog = builder.create();
					dialog.show();
				}
			});
		} catch (IabHelper.IabAsyncInProgressException e) {
			e.printStackTrace();
			showError("Error getting data from Google Play");
		}
	}

	public boolean getIabEnabled() {
		return this.iabEnabled;
	}

	private void showError(String msg) {
		new AlertDialog.Builder(context)
				.setTitle("Error")
				.setMessage(msg)
				.setCancelable(true)
				.setPositiveButton("Close", null)
				.show();
	}
}
