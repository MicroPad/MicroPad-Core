import { build } from 'esbuild';
import wasmLoader from 'esbuild-plugin-wasm';
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'fs/promises';
import { join } from 'path';
import { injectManifest } from 'workbox-build';
import { minify as minifyHtml } from 'html-minifier';
import servor from 'servor';

const OUT_DIR = 'build';
const isDev = process.env.NODE_ENV !== 'production';
const PORT: number = (() => {
	const port = process.env.MICROPAD_PORT;
	return !!port ? parseInt(port, 10) : 3000;
})();

(async () => {
	process.env.PUBLIC_URL ??= '';

	await copyDir('node_modules/timers-browserify', 'node_modules/timers');

	await rm(OUT_DIR, { recursive: true, force: true });
	await copyDir('public', OUT_DIR);

	const { metafile: syncWorkerMetafile } = await build({
		entryPoints: ['src/app/workers/sync-worker/sync.worker.ts'],
		entryNames: isDev? '[name]' : '[name]-[hash]',
		bundle: true,
		outdir: `${OUT_DIR}/dist`,
		platform: 'browser',
		format: 'esm',
		loader: {
			'.npx': 'text',
			'.raw.js': 'text',
			'.raw.css': 'text',
			'.woff': 'file',
			'.woff2': 'file',
			'.png': 'file',
			'.mp4': 'file',
			'.svg': 'file',
			'.ttf': 'file'
		},
		minify: true,
		sourcemap: true,
		splitting: true,
		publicPath: '/dist',
		metafile: true,
		watch: isDev,
		define: {
			'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
			'process.env.PUBLIC_URL': `"${process.env.PUBLIC_URL}"`
		},
		plugins: [
			// esbuildPluginBrowserslist(browserslist()), TODO: top-level await detection bug
			wasmLoader({ mode: 'deferred' })
		],
	}).catch(() => process.exit(1));

	if (!syncWorkerMetafile) throw new Error('Missing metafile');
	const syncWorkerJsPath: string | undefined = Object.entries(syncWorkerMetafile.outputs)
		.find(([, metadata]) => metadata.entryPoint === 'src/app/workers/sync-worker/sync.worker.ts')?.[0]
		.replace(`${OUT_DIR}/`, '');
	if (!syncWorkerJsPath) throw new Error('Missing sync.worker.js');

	const { metafile } = await build({
		entryPoints: ['src/index.tsx',],
		entryNames: isDev? '[name]-a' : '[name]-[hash]',
		bundle: true,
		outdir: `${OUT_DIR}/dist`,
		platform: 'browser',
		format: 'esm',
		loader: {
			'.npx': 'text',
			'.raw.js': 'text',
			'.raw.css': 'text',
			'.woff': 'file',
			'.woff2': 'file',
			'.png': 'file',
			'.mp4': 'file',
			'.svg': 'file',
			'.ttf': 'file'
		},
		minify: true,
		sourcemap: true,
		splitting: true,
		publicPath: '/dist',
		metafile: true,
		watch: isDev,
		define: {
			'process.env.NODE_ENV': `'${process.env.NODE_ENV}'`,
			'process.env.PUBLIC_URL': `'${process.env.PUBLIC_URL}'`,
			'build.defs.SYNC_WORKER_PATH': `'${syncWorkerJsPath}'`,
		},
		plugins: [
			// esbuildPluginBrowserslist(browserslist()), TODO: top-level await detection bug
			wasmLoader({ mode: 'deferred' })
		],
	}).catch(() => process.exit(1));

	if (!metafile) throw new Error('Missing metafile');
	const indexJsPath: string | undefined = Object.entries(metafile.outputs)
		.find(([, metadata]) => metadata.entryPoint === 'src/index.tsx')?.[0]
		.replace(`${OUT_DIR}/`, '');
	if (!indexJsPath) throw new Error('Missing index.js');

	const indexCssPath: string | undefined = Object.keys(metafile.outputs)
		.find(output => /\/index-.+\.css$/.test(output))
		?.replace(`${OUT_DIR}/`, '');
	if (!indexCssPath) throw new Error('Missing index.css');

	// Build index.html
	const htmlPath = join(OUT_DIR, 'index.html');
	const html = await buildHtml(htmlPath, indexJsPath, indexCssPath);
	await writeFile(htmlPath, isDev ? html : minifyHtml(html, {
		removeComments: true,
		collapseWhitespace: true,
	}));

	// Build service worker
	await build({
		entryPoints: ['src/service-worker.ts'],
		entryNames: '[name]',
		bundle: true,
		outdir: `${OUT_DIR}`,
		platform: 'browser',
		loader: {
			'.npx': 'text',
			'.raw.js': 'text',
			'.raw.css': 'text',
			'.woff': 'file',
			'.woff2': 'file',
			'.png': 'file',
			'.mp4': 'file',
			'.svg': 'file',
			'.ttf': 'file'
		},
		minify: true,
		sourcemap: true,
		define: {
			'process.env.NODE_ENV': '"production"',
			'process.env.PUBLIC_URL': `"${process.env.PUBLIC_URL}"`
		},
	}).catch(() => process.exit(1));

	// Build manifest
	await injectManifest({
		swSrc: join(OUT_DIR, 'service-worker.js'),
		swDest: join(OUT_DIR, 'service-worker.js'),
		globDirectory: OUT_DIR
	});

	console.log('Built!');

	if (isDev) {
		runDevServer(PORT);
	}
})().catch(err => {
	console.error(err);
	process.exit(1);
});

const PUBLIC_URL_REGEX = /%PUBLIC_URL%/g;
const INDEX_JS_REGEX = /%INDEX_JS_PATH%/g;
const INDEX_CSS_REGEX = /%INDEX_CSS_PATH%/g;
async function buildHtml(path: string, indexJsPath: string, indexCssPath: string): Promise<string> {
	const html = await readFile(path).then(buffer => buffer.toString('utf-8'));
	return html
		.replace(PUBLIC_URL_REGEX, process.env.PUBLIC_URL ?? '')
		.replace(INDEX_JS_REGEX, indexJsPath)
		.replace(INDEX_CSS_REGEX, indexCssPath);
}

function runDevServer(port: number) {
	servor({
		root: OUT_DIR,
		fallback: 'index.html',
		port
	}).then(() => console.log(`Running on http://localhost:${port}`));
}

async function copyDir(source: string, dest: string) {
	if (!await exists(dest)) {
		await mkdir(dest, { recursive: true });
	}

	await Promise.all((await readdir(source)).map(async item => {
		const itemSource = join(source, item);
		const itemDest = join(dest, item);

		if ((await stat(itemSource)).isDirectory()) {
			await copyDir(itemSource, itemDest);
			return;
		}
		await copyFile(itemSource, itemDest);
	}));
}

async function exists(path: string): Promise<boolean> {
	try {
		await stat(path);
		return true;
	} catch (e) {
		if (e?.code === 'ENOENT') {
			return false;
		}
		throw e;
	}
}
