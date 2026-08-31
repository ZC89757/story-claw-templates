import {build} from "esbuild";
import path from "node:path";
import {fileURLToPath} from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url));
await build({entryPoints:[path.join(here,"client-entry.tsx")],bundle:true,format:"iife",outfile:path.join(here,"public","app.js"),jsx:"automatic",minify:false});
