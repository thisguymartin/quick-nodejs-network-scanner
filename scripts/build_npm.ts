// ex. scripts/build_npm.ts
import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

await build({
  entryPoints: ["./src/index.ts"],
  outDir: "./npm",
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    // package.json properties
    name: "quick-nodejs-network-scanner",
    version: Deno.args[0],
    description: "A quick and simple network scanner for NodeJS",
    license: "MIT",
    repository: {
      type: "git",
      url:
        "git+https://github.com/thisguymartin/quick-nodejs-network-scanner.git",
    },
    bugs: {
      url:
        "https://github.com/thisguymartin/quick-nodejs-network-scanner/issues",
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    // Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
