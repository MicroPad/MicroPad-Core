#!/usr/bin/python3
import glob
from pathlib import Path
import itertools

def recursive_path_walker(root_path, version, path_to_url):
	for path in sorted(glob.iglob(root_path + '/**/*', recursive=True)):
		if not Path(path).is_file():
			continue

		yield single_item(path, version, path_to_url)

def single_item(path, version, path_to_url):
	return f'{{ url: \'{path_to_url(path)}\', revision: \'{version}\' }}'

replace_public = lambda path: path.replace('public/', '/')

precache_lines = itertools.chain(
#   TODO: MathJax prefetch is pointless because it looks like reqs from within an iframe aren't caught. There are
#         active chromium bugs on this issue.
# 	recursive_path_walker('public/assets/mathjax', '2018', replace_public),
	[
		single_item('public/assets/recorder/encoderWorker.min.wasm', '2018', replace_public),
		single_item('public/assets/recorder/decoderWorker.min.wasm', '2018', replace_public)
	]
)

print(f'// Generated by get_precache_files.py')
print('export const EXTRA_PRECACHE_FILES = [')

for path in precache_lines:
	print(f'\t{path},')

print('];')
