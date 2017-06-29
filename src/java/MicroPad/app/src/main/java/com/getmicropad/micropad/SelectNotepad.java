package com.getmicropad.micropad;

import android.Manifest;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.design.widget.FloatingActionButton;
import android.support.design.widget.Snackbar;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.view.ContextMenu;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.ListAdapter;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.androidnetworking.AndroidNetworking;
import com.getmicropad.NPXParser.Notepad;
import com.getmicropad.NPXParser.Parser;
import com.google.gson.Gson;
import com.mikepenz.google_material_typeface_library.GoogleMaterial;
import com.mikepenz.iconics.IconicsDrawable;
import com.mikepenz.iconics.context.IconicsContextWrapper;

import java.io.File;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SelectNotepad extends AppCompatActivity {
	List<NLevelItem> list;
	ListView mainList;
	NLevelAdapter adapter;
	static final int PERMISSION_REQ_FILESYSTEM = 0;
	FilesystemManager filesystemManager;
	SharedPreferences prefs;
	MicroSyncManager syncer;
	IabManager iabManager;

	@Override
	protected void attachBaseContext(Context newBase) {
		super.attachBaseContext(IconicsContextWrapper.wrap(newBase));
	}

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_select_notepad);
		this.setTitle(getResources().getString(R.string.title_activity_viewer));

		this.prefs = PreferenceManager.getDefaultSharedPreferences(this);
		this.syncer = new MicroSyncManager("https://getmicropad.com/sync/api/");
		AndroidNetworking.initialize(getApplicationContext());

		this.mainList = (ListView)findViewById(R.id.main_list);
		this.list = new ArrayList<>();

		this.adapter = new NLevelAdapter(list);
		this.mainList.setAdapter(this.adapter);

		/* Request permissions */
		if ((ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) | ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)) != PackageManager.PERMISSION_GRANTED)  {
			ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE}, PERMISSION_REQ_FILESYSTEM);
		}
		else {
			this.filesystemManager = new FilesystemManager(getApplicationContext());
			this.getNotepads();
		}

		this.mainList.setLongClickable(true);
		registerForContextMenu(this.mainList);

		this.mainList.setOnItemClickListener((AdapterView<?> parent, View view, int position, long id) -> {
			this.adapter.toggle(position);
			this.adapter.getFilter().filter();
			File notepadFile = (File)((NLevelItem)((NLevelAdapter)this.mainList.getAdapter()).getItem(position)).getWrappedObject();

			//Open Notepad
			Intent intent = new Intent(getBaseContext(), NotepadActivity.class);
			intent.putExtra("NOTEPAD_FILE", notepadFile);
			startActivity(intent);
		});

		FloatingActionButton newNotepadBtn = (FloatingActionButton)findViewById(R.id.add_notepad_btn);
		newNotepadBtn.setOnClickListener(view -> {
			EditText titleInput = new EditText(this);
			int paddingInDp = (int)(10*getResources().getDisplayMetrics().density + 0.5f);
			titleInput.setPadding(paddingInDp, paddingInDp, paddingInDp, paddingInDp);
			new AlertDialog.Builder(this)
					.setView(titleInput)
					.setTitle("New Notepad")
					.setPositiveButton("Create", (dialogInterface, whichButton) -> {
						if (this.filesystemManager.saveNotepad(new Notepad(titleInput.getText().toString()))) {
							this.getNotepads();
						}
						else {
							new AlertDialog.Builder(getApplicationContext())
									.setTitle("Error")
									.setMessage("Error saving notepad")
									.setCancelable(true)
									.setPositiveButton("Close", null)
									.show();
						}
					}).setNegativeButton(android.R.string.cancel, null).show();
		});

		/* Google Play Magic */
//		this.iabManager = new IabManager(this);
//		new Thread(() -> {
//			while (!iabManager.getIabEnabled()) {
//				try {
//					Thread.sleep(100);
//				} catch (InterruptedException e) {
//					e.printStackTrace();
//				}
//			}
//			runOnUiThread(() -> this.iabManager.showPurchaseDialog());
//		}).start();
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		super.onCreateOptionsMenu(menu);

		MenuInflater inflater = getMenuInflater();
		inflater.inflate(R.menu.select_notepad_menu, menu);

		if (prefs.getString("token", null) != null) {
			menu.findItem(R.id.logout_item).setVisible(true);
		}

		return true;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		switch (item.getItemId()) {
			case R.id.open_notepad:
				String token = prefs.getString("token", null);
				if (token != null) {
					this.openFromSync(token);
				}
				else {
					AlertDialog.Builder builder = new AlertDialog.Builder(this)
							.setTitle("Login/Register")
							.setNegativeButton("Close", null)
							.setCancelable(true);
					LayoutInflater loginInflater = this.getLayoutInflater();
					View view = loginInflater.inflate(R.layout.login, null);
					builder.setView(view);

					builder.setPositiveButton("Login", (d, w) -> {
						ProgressDialog dialog = new ProgressDialog(this);
						dialog.setProgressStyle(ProgressDialog.STYLE_SPINNER);
						dialog.setMessage("Loading...");
						dialog.setIndeterminate(true);
						dialog.setCanceledOnTouchOutside(false);
						dialog.show();

						String username = ((EditText) view.findViewById(R.id.username_input)).getText().toString();
						String password = ((EditText) view.findViewById(R.id.password_input)).getText().toString();

						syncer.service.login(username, password).enqueue(new Callback<String>() {
							@Override
							public void onResponse(Call<String> call, Response<String> response) {
								dialog.dismiss();
								if (response.isSuccessful()) {
									prefs.edit().putString("token", response.body()).apply();
									prefs.edit().putString("username", username).apply();
									Snackbar.make(findViewById(android.R.id.content), "Logged into MicroSync as " + username, Snackbar.LENGTH_SHORT).show();
									openFromSync(response.body());
								}
								else {
									new AlertDialog.Builder(SelectNotepad.this)
											.setTitle("Error")
											.setMessage("There was an error completing this request. Is your username and password correct?")
											.setPositiveButton("Close", null)
											.show();
								}
							}

							@Override
							public void onFailure(Call<String> call, Throwable t) {
								dialog.dismiss();
								new AlertDialog.Builder(SelectNotepad.this)
										.setTitle("Error")
										.setMessage("There was an error completing this request. Are you online?")
										.setPositiveButton("Close", null)
										.show();
							}
						});
					});

					builder.setNeutralButton("Sign up", (d, w) -> {
						ProgressDialog dialog = new ProgressDialog(this);
						dialog.setProgressStyle(ProgressDialog.STYLE_SPINNER);
						dialog.setMessage("Loading...");
						dialog.setIndeterminate(true);
						dialog.setCanceledOnTouchOutside(false);
						dialog.show();

						String username = ((EditText) view.findViewById(R.id.username_input)).getText().toString();
						String password = ((EditText) view.findViewById(R.id.password_input)).getText().toString();

						syncer.service.signup(username, password).enqueue(new Callback<String>() {
							@Override
							public void onResponse(Call<String> call, Response<String> response) {
								if (response.isSuccessful()) {
									if (response.code() == 209) {
										dialog.dismiss();
										new AlertDialog.Builder(SelectNotepad.this)
												.setTitle("Error")
												.setMessage("This username has already been taken")
												.setPositiveButton("Close", null)
												.show();
										return;
									}
									new Thread(() -> syncer.service.login(username, password).enqueue(new Callback<String>() {
										@Override
										public void onResponse(Call<String> call, Response<String> loginResponse) {
											dialog.dismiss();
											prefs.edit().putString("token", loginResponse.body()).apply();
											prefs.edit().putString("username", username).apply();
											Snackbar.make(findViewById(android.R.id.content), "Logged into MicroSync as " + username, Snackbar.LENGTH_SHORT).show();
											openFromSync(loginResponse.body());
										}

										@Override
										public void onFailure(Call<String> call, Throwable t) {
											dialog.dismiss();
											new AlertDialog.Builder(SelectNotepad.this)
													.setTitle("Error")
													.setMessage("There was an error completing this request. Are you online?")
													.setPositiveButton("Close", null)
													.show();
										}
									})).start();
								}
								else {
									dialog.dismiss();
									new AlertDialog.Builder(SelectNotepad.this)
											.setTitle("Error")
											.setMessage("There was an error completing this request")
											.setPositiveButton("Close", null)
											.show();
								}
							}

							@Override
							public void onFailure(Call<String> call, Throwable t) {
								dialog.dismiss();
								new AlertDialog.Builder(SelectNotepad.this)
										.setTitle("Error")
										.setMessage("There was an error completing this request. Are you online?")
										.setPositiveButton("Close", null)
										.show();
							}
						});
					});

					AlertDialog dialog = builder.create();
					dialog.show();
				}
				return true;

			case R.id.logout_item:
				prefs.edit().remove("token").apply();
				prefs.edit().remove("username").apply();
				item.setVisible(false);
				return true;

			default:
				return super.onContextItemSelected(item);
		}
	}

	protected void openFromSync(String token) {
		AlertDialog.Builder builder = new AlertDialog.Builder(this)
				.setTitle("Open from \u00B5Sync")
				.setPositiveButton("Close", null)
				.setCancelable(true);
		LayoutInflater loginInflater = this.getLayoutInflater();
		View view = loginInflater.inflate(R.layout.open_from_sync, null);

		ProgressBar progressBar = (ProgressBar)view.findViewById(R.id.progress);
		progressBar.setVisibility(View.VISIBLE);
		view.findViewById(R.id.open_manager_button).setOnClickListener(v -> {
			Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://getmicropad.com/sync"));
			startActivity(intent);
		});

		this.syncer.service.getNotepads(token).enqueue(new Callback<String>() {
			@Override
			public void onResponse(Call<String> call, Response<String> response) {
				progressBar.setVisibility(View.GONE);
				if (response.isSuccessful()) {
					ListView syncedNotepadListView = (ListView)view.findViewById(R.id.synced_notepad_list);
					List<String> syncedNotepadList = new Gson().fromJson(response.body(), ArrayList.class);
					ListAdapter syncedNotepadListAdapter = new ArrayAdapter<>(SelectNotepad.this, android.R.layout.simple_list_item_1, syncedNotepadList);
					syncedNotepadListView.setAdapter(syncedNotepadListAdapter);

					syncedNotepadListView.setOnItemClickListener((AdapterView<?> parent, View view, int position, long id) -> {
						if (filesystemManager.saveNotepad(new Notepad(syncedNotepadList.get(position).split(".npx")[0], new Date(0)))) {
							getNotepads();
							Intent intent = new Intent(getBaseContext(), NotepadActivity.class);
							intent.putExtra("NOTEPAD_FILE", new File(filesystemManager.workingDirectory.getAbsolutePath()+"/"+syncedNotepadList.get(position)));
							startActivity(intent);
						}
						else {
							new AlertDialog.Builder(getApplicationContext())
									.setTitle("Error")
									.setMessage("Error saving notepad")
									.setCancelable(true)
									.setPositiveButton("Close", (dialog, which) -> {})
									.show();
						}
					});
				}
				else {
					prefs.edit().remove("token").apply();
					recreate();
				}
			}

			@Override
			public void onFailure(Call<String> call, Throwable t) {
				progressBar.setVisibility(View.GONE);
				new AlertDialog.Builder(SelectNotepad.this)
						.setTitle("Error")
						.setMessage("There was an error completing this request. Are you online?")
						.setPositiveButton("Close", null)
						.show();
			}
		});

		builder.setView(view);
		AlertDialog dialog = builder.create();
		dialog.show();
	}

	@Override
	public void onCreateContextMenu(ContextMenu menu, View v, ContextMenu.ContextMenuInfo menuInfo) {
		super.onCreateContextMenu(menu, v, menuInfo);
		if (v.getId() == R.id.main_list) {
			MenuInflater inflater = getMenuInflater();
			inflater.inflate(R.menu.list_context, menu);
		}
	}

	@Override
	public boolean onContextItemSelected(MenuItem item) {
		AdapterView.AdapterContextMenuInfo info = (AdapterView.AdapterContextMenuInfo)item.getMenuInfo();
		NLevelItem selItem = ((NLevelItem)this.adapter.getItem(info.position));
		File notepadFile = (File)selItem.getWrappedObject();
		switch (item.getItemId()) {
			case R.id.delete_context:
				new AlertDialog.Builder(this)
						.setTitle("Confirm Deletion")
						.setMessage("Are you sure you want to delete this?")
						.setIcon(new IconicsDrawable(this).icon(GoogleMaterial.Icon.gmd_delete_forever))
						.setPositiveButton(android.R.string.yes, (dialogInterface, whichButton) -> {
							if (notepadFile.delete()) {
								this.getNotepads();
							}
							else {
								new AlertDialog.Builder(getApplicationContext())
										.setTitle("Error")
										.setMessage("Error deleting notepad")
										.setCancelable(true)
										.setPositiveButton("Close", (dialog, which) -> {})
										.show();
							}
						}).setNegativeButton(android.R.string.no, null).show();
				return true;

			case R.id.rename_context:
				EditText renameInput = new EditText(this);
				int paddingInDp = (int)(10*getResources().getDisplayMetrics().density + 0.5f);
				renameInput.setPadding(paddingInDp, paddingInDp, paddingInDp, paddingInDp);
				new AlertDialog.Builder(this)
						.setView(renameInput)
						.setTitle("Rename Notepad")
						.setPositiveButton("Rename", (dialogInterface, whichButton) -> {
							//Parse Notepad
							try {
								Notepad notepad = Parser.parseNpx(notepadFile);
								notepad.setTitle(renameInput.getText().toString());

								if (notepadFile.delete() && this.filesystemManager.saveNotepad(notepad)) {
									this.getNotepads();
								}
								else {
									new AlertDialog.Builder(getApplicationContext())
											.setTitle("Error")
											.setMessage("Error parsing notepad")
											.setCancelable(true)
											.setPositiveButton("Close", (dialog, which) -> {})
											.show();
								}
							} catch (Exception e) {
								new AlertDialog.Builder(getApplicationContext())
										.setTitle("Error")
										.setMessage("Error parsing notepad")
										.setCancelable(true)
										.setPositiveButton("Close", (dialog, which) -> {})
										.show();
							}
						}).setNegativeButton(android.R.string.cancel, null).show();
				return true;

			default:
				return super.onContextItemSelected(item);
		}
	}

	private void updateList(LayoutInflater inflater, File[] notepads) {
		this.list.clear();
		for (File notepad : notepads) {
			NLevelItem notepadItem = new NLevelItem(notepad, null, (NLevelItem item) -> {
				View view = inflater.inflate(R.layout.notepad_list_item, null);
				String name = "{gmd-collections-bookmark} "+((File)item.getWrappedObject()).getName().split(".npx")[0];
				view.setTag(R.id.TAG_OBJECT_TYPE, "notepad");
				view.setTag(R.id.TAG_OBJECT_TITLE, name);
				TextView titleText = (TextView)view.findViewById(R.id.title_text);
				titleText.setText(name);

				view.findViewById(R.id.overflow_button).setOnClickListener(v -> openContextMenu(view));
				return view;
			});
			this.list.add(notepadItem);
		}
		((NLevelAdapter)mainList.getAdapter()).getFilter().filter();
	}

	private void getNotepads() {
		this.updateList(getLayoutInflater(), this.filesystemManager.getNotepadFiles());
	}

	@Override
	public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
		switch (requestCode) {
			case PERMISSION_REQ_FILESYSTEM:
				if (grantResults.length > 1 && (grantResults[0] | grantResults[1]) == PackageManager.PERMISSION_GRANTED) {
					this.filesystemManager = new FilesystemManager(getApplicationContext());
					this.getNotepads();
				}
				else {
					new AlertDialog.Builder(this)
							.setTitle("Permission Denied")
							.setMessage("Error accessing the device's storage")
							.setPositiveButton("Close", (dialog, which) -> {
								System.exit(0);
							})
							.show();
				}
		}
	}

	@Override
	public void onDestroy() {
		super.onDestroy();
//		this.iabManager.destroy();
	}
}
