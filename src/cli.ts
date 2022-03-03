import yargs from "yargs";
import { cdkApp } from "./app";

export async function main() {
  const args: any = yargs
    // @ts-ignore
    .command("$0")
    .usage(
      "$0 [resource] [subcommand]",
      "Run an operator command on your CDK app constructs.",
      (builder) =>
        builder
          .positional("resource", {
            type: "string",
            description:
              "Name of a construct, or a full path to the construct.",
          })
          .positional("subcommand", {
            type: "string",
            description:
              'Operation to perform on the construct. Run "help" command for a list of available operations.',
          })
          .option("app", {
            type: "string",
            default: process.env.CDK_APP_DIR ?? "cdk.out",
            description: "Path to cdk.out",
          })
    )
    .demandOption(["resource"])
    .help().argv;

  // capture everything after `NODE cdk-app RESOURCE SUBCOMMAND`
  const restArgs = process.argv.slice(4);

  return cdkApp({
    resourceName: args.resource,
    subcommand: args.subcommand,
    appDir: args.app,
    restArgs,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
