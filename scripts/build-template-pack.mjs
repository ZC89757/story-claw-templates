import fs from "node:fs/promises";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {build as esbuild} from "esbuild";

const projectRoot = path.resolve(import.meta.dirname, "..");
const payloadRoot = path.join(projectRoot, "build", "mg-template-pack");
const templatePackage = JSON.parse(await fs.readFile(path.join(projectRoot, "package.json"), "utf8"));

await fs.rm(payloadRoot, {recursive: true, force: true});
await fs.mkdir(path.join(payloadRoot, "src"), {recursive: true});

for (const name of ["src", "runtime", "public"]) {
  await fs.cp(path.join(projectRoot, name), path.join(payloadRoot, name), {recursive: true});
}
// The Provider is bundled below. Keeping its TypeScript source makes tsx resolve
// provider.js back to provider.ts when the desktop host imports the package.
await fs.rm(path.join(payloadRoot, "src", "provider.ts"));
await fs.mkdir(path.join(payloadRoot, "tools", "mg-template-gallery", "public"), {recursive: true});
for (const name of ["index.html", "gallery.css"]) {
  await fs.copyFile(
    path.join(projectRoot, "tools", "mg-template-gallery", name),
    path.join(payloadRoot, "tools", "mg-template-gallery", name),
  );
}
await fs.cp(
  path.join(projectRoot, "tools", "mg-template-gallery", "public"),
  path.join(payloadRoot, "tools", "mg-template-gallery", "public"),
  {recursive: true},
);

const videoLibraryPath = path.normalize(path.join(projectRoot, "src", "video-footage", "library.ts"));
await esbuild({
  entryPoints: [path.join(projectRoot, "src", "provider.ts")],
  outfile: path.join(payloadRoot, "src", "provider.js"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  // ws is CommonJS and its bundled Node built-ins use require at runtime.
  banner: {js: 'import {createRequire} from "node:module"; const require = createRequire(import.meta.url);'},
  sourcemap: false,
  logLevel: "info",
  plugins: [{
    name: "preserve-template-public-root",
    setup(build) {
      build.onLoad({filter: /[\\/]video-footage[\\/]library\.ts$/}, async (args) => {
        if (path.normalize(args.path) !== videoLibraryPath) return null;
        const source = await fs.readFile(args.path, "utf8");
        return {
          contents: source.replace(
            'new URL("../../public/", import.meta.url)',
            'new URL("../public/", import.meta.url)',
          ),
          loader: "ts",
        };
      });
    },
  }],
});

const templateCommit = process.env.GITHUB_SHA?.trim() || (() => {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {cwd: projectRoot, encoding: "utf8"}).trim();
  } catch {
    return "unknown";
  }
})();
const manifest = {
  name: "Story Claw MG Template Pack",
  version: templatePackage.version,
  protocolVersion: 3,
  provider: "src/provider.js",
  templateCommit,
};
await fs.writeFile(path.join(payloadRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`[template-pack] payload: ${payloadRoot}`);
console.log(`[template-pack] version: ${templatePackage.version}; protocol: ${manifest.protocolVersion}; commit: ${templateCommit}`);
