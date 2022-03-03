const { typescript } = require("projen");
const project = new typescript.TypeScriptProject({
  name: "cdk-app-cli",
  defaultReleaseBranch: "main",

  deps: ["yargs", "fs-extra", "chalk@^4"],
  devDeps: ["@types/fs-extra"],

  prettier: true,

  minNodeVersion: "14.7.0",
});

project.package.addBin({
  "cdk-app": "bin/cdk-app",
});

project.synth();
