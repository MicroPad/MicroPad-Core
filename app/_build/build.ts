import { build } from 'esbuild';
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'fs/promises';
import { join } from 'path';
import { injectManifest } from 'workbox-build';
import { minify as minifyHtml } from 'html-minifier';
import { esbuildPluginBrowserslist } from 'esbuild-plugin-browserslist';
import browserslist, { clearCaches as clearBrowserslistCache } from 'browserslist';
import servor from 'servor';
import { getUserAgentRegExp } from 'browserslist-useragent-regexp';
import { createHash } from 'crypto';

const OUT_DIR = 'build';
const isDev = process.env.NODE_ENV !== 'production';
const PORT: number = (() => {
	const port = process.env.MICROPAD_PORT;
	return !!port ? parseInt(port, 10) : 3000;
})();

clearBrowserslistCache();
const esBuildTargets = browserslist().filter(browser => !browser.endsWith('TP'));

(async () => {
	process.env.PUBLIC_URL ??= '';

	await copyDir('node_modules/timers-browserify', 'node_modules/timers');

	await rm(OUT_DIR, { recursive: true, force: true });
	await copyDir('public', OUT_DIR);

	const { metafile: browserCheckMetafile } = await build({
		entryPoints: ['src/unsupported-page/index.ts'],
		entryNames: isDev ? 'browser-support-[name]-a' : 'browser-support-[name]-[hash]',
		bundle: true,
		outdir: `${OUT_DIR}/dist`,
		platform: 'browser',
		target: 'es2015',
		format: 'iife',
		minify: true,
		sourcemap: true,
		publicPath: '/dist',
		metafile: true,
		watch: isDev,
		define: {
			'build.defs.SUPPORTED_BROWSERS_REGEX': `"${getUserAgentRegExp({ allowHigherVersions: true }).source.replaceAll('\\', '\\\\')}"`,
			'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
			'process.env.PUBLIC_URL': `"${process.env.PUBLIC_URL}"`
		},
		assetNames: 'assets/[name].[hash]',
	}).catch(() => process.exit(1));

	if (!browserCheckMetafile) throw new Error('Missing metafile');
	const browserCheckJsPath: string | undefined = Object.entries(browserCheckMetafile.outputs)
		.find(([, metadata]) => metadata.entryPoint === 'src/unsupported-page/index.ts')?.[0]
		.replace(`${OUT_DIR}/`, '');
	if (!browserCheckJsPath) throw new Error('Missing unsupported-page bundle');

	const { metafile: syncWorkerMetafile } = await build({
		entryPoints: ['src/app/workers/sync-worker/sync.worker.ts'],
		entryNames: isDev ? '[name]' : '[name]-[hash]',
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
			'.ttf': 'file',
			'.wasm': 'file'
		},
		assetNames: 'assets/[name].[hash]',
		minify: !isDev,
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
			esbuildPluginBrowserslist(esBuildTargets)
		],
	}).catch(() => process.exit(1));

	if (!syncWorkerMetafile) throw new Error('Missing metafile');
	const syncWorkerJsPath: string | undefined = Object.entries(syncWorkerMetafile.outputs)
		.find(([, metadata]) => metadata.entryPoint === 'src/app/workers/sync-worker/sync.worker.ts')?.[0]
		.replace(`${OUT_DIR}/`, '');

	const { metafile: monacoMetafile } = await build({
		entryPoints: {
			'monaco.worker': 'node_modules/monaco-editor/esm/vs/editor/editor.worker.js'
		},
		entryNames: isDev ? '[name]' : '[name]-[hash]',
		bundle: true,
		outdir: `${OUT_DIR}/dist`,
		platform: 'browser',
		format: 'iife',
		loader: {
			'.npx': 'text',
			'.raw.js': 'text',
			'.raw.css': 'text',
			'.woff': 'file',
			'.woff2': 'file',
			'.png': 'file',
			'.mp4': 'file',
			'.svg': 'file',
			'.ttf': 'file',
			'.wasm': 'file'
		},
		assetNames: 'assets/[name].[hash]',
		minify: !isDev,
		sourcemap: true,
		publicPath: '/dist',
		metafile: true,
		watch: isDev,
		define: {
			'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
			'process.env.PUBLIC_URL': `"${process.env.PUBLIC_URL}"`
		},
		plugins: [
			esbuildPluginBrowserslist(esBuildTargets)
		],
	}).catch(() => process.exit(1));
	const monacoWorkerJsPath: string | undefined = Object.entries(monacoMetafile.outputs)
		.find(([, metadata]) => metadata.entryPoint === 'node_modules/monaco-editor/esm/vs/editor/editor.worker.js')?.[0]
		.replace(`${OUT_DIR}/`, '');
	if (!monacoWorkerJsPath) throw new Error('Missing monaco.worker.js');

	const wasmPaths = await copyWasm();
	const { metafile } = await build({
		entryPoints: ['src/index.tsx'],
		entryNames: isDev ? '[name]-a' : '[name]-[hash]',
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
			'.ttf': 'file',
			'.wasm': 'file'
		},
		assetNames: 'assets/[name].[hash]',
		minify: !isDev,
		sourcemap: true,
		splitting: true,
		publicPath: '/dist',
		metafile: true,
		watch: isDev,
		define: {
			'process.env.NODE_ENV': `'${process.env.NODE_ENV}'`,
			'process.env.PUBLIC_URL': `'${process.env.PUBLIC_URL}'`,
			'build.defs.SYNC_WORKER_PATH': `'${syncWorkerJsPath}'`,
			'build.defs.MONACO_WORKER_PATH': `'${monacoWorkerJsPath}'`,
			'build.defs.FEND_WASM_PATH': `'${wasmPaths['fend_wasm_bg.wasm']}'`,
			'build.defs.PHOTON_WASM_PATH': `'${wasmPaths['photon_rs_bg.wasm']}'`
		},
		plugins: [
			esbuildPluginBrowserslist(esBuildTargets)
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
	const html = await buildHtml(htmlPath, browserCheckJsPath, indexJsPath, indexCssPath);
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
		assetNames: 'assets/[name].[hash]',
		minify: !isDev,
		sourcemap: true,
		define: {
			'process.env.NODE_ENV': '"production"',
			'process.env.PUBLIC_URL': `"${process.env.PUBLIC_URL}"`
		},
		plugins: [
			esbuildPluginBrowserslist(esBuildTargets)
		],
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

async function copyWasm(): Promise<{ [originalName: string]: string }> {
	const fendPath = join('node_modules', 'fend-wasm-web', 'fend_wasm_bg.wasm');
	const fendHash = createHash('sha256').update(await readFile(fendPath)).digest('hex').substring(0,8);
	const fendName = `fend_wasm_bg.${fendHash}.wasm`;
	const fend$ = copyFile(fendPath, join(OUT_DIR, 'dist', fendName));

	const photonPath = join('node_modules', '@nick_webster', 'photon', 'photon_rs_bg.wasm');
	const photonHash = createHash('sha256').update(await readFile(photonPath)).digest('hex').substring(0,8);
	const photonName = `photon_rs_bg.${photonHash}.wasm`;
	const photon$ = copyFile(photonPath, join(OUT_DIR, 'dist', photonName));

	await Promise.all([fend$, photon$]);

	return {
		'fend_wasm_bg.wasm': `dist/fend_wasm_bg.${fendHash}.wasm`,
		'photon_rs_bg.wasm': `dist/photon_rs_bg.${photonHash}.wasm`
	}
}

async function buildHtml(path: string, browserCheckPath: string, indexJsPath: string, indexCssPath: string): Promise<string> {
	const html = await readFile(path).then(buffer => buffer.toString('utf-8'));
	return html
		.replace(/%PUBLIC_URL%/g, process.env.PUBLIC_URL ?? '')
		.replace(/%BROWSER_CHECK_JS_PATH%/g, browserCheckPath)
		.replace(/%INDEX_JS_PATH%/g, indexJsPath)
		.replace(/%INDEX_CSS_PATH%/g, indexCssPath);
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
		if ((e as unknown & { code?: string })?.code === 'ENOENT') {
			return false;
		}

		throw e;
	}
}
