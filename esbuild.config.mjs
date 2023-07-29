import esbuild from "esbuild";
import builtins from "builtin-modules";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import * as sass from 'sass';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prod = (process.argv[2] === "production");
const stylesPath = path.join(__dirname, "src/styles/styles.scss");

function cleanDistDir() {
	const distDir = path.join(__dirname, "dist");
	try {
		const files = fs.readdirSync(distDir);
		files.forEach(file => {
			const filePath = path.join(distDir, file);
			fs.unlinkSync(filePath); // Delete each file in the dist directory
		});
		console.log("Dist directory cleaned.");
	} catch (err) {
		console.error("Error cleaning dist directory:", err);
		throw err;
	}
}
function compileSass() {
	return new Promise((resolve, reject) => {
		sass.render({ file: stylesPath }, (err, result) => {
			if (err) reject(err);
			else resolve(result.css.toString());
		});
	});
}

function moveStylesPlugin() {
	return {
		name: "move-styles",
		setup(build) {
			build.onEnd(async (result) => {
				const cssContent = await compileSass();
				const newPath = path.join(__dirname, "dist", "styles.css");
				await fs.promises.writeFile(newPath, cssContent);
			});
		},
	};
}

function resolveFixup() {
	return {
		name: "resolve-fixup",
		setup(build) {
			build.onResolve({ filter: /react-virtualized/ }, async (args) => {
				return {
					path: path.resolve('./node_modules/react-virtualized/dist/umd/react-virtualized.js'),
				};
			});
		}
	}
}

function copyManifestPlugin() {
	return {
		name: "copy-manifest",
		setup(build) {
			build.onEnd(async () => {
				await fs.promises.copyFile(path.join(__dirname, "manifest.json"), path.join(__dirname, "dist", "manifest.json"));
			});
		},
	};
}

const plugins = [moveStylesPlugin(), resolveFixup(), copyManifestPlugin()];

cleanDistDir();

const context = esbuild.build({
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtins,
	],
	format: "cjs",
	target: "esnext",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	outdir: "./dist/",
	plugins: plugins,
	resolveExtensions: [".tsx", ".ts", ".js", ".scss"],
});

if (prod) {
	context.then(() => {
		console.log("Build completed successfully.");
		process.exit(0);
	}).catch((err) => {
		console.error("Build failed:", err);
		process.exit(1);
	});
} else {
	context.then(() => {
		console.log("Development build is watching for changes...");
	}).catch((err) => {
		console.error("Build failed:", err);
		process.exit(1);
	});
}
