import * as cp from "child_process";
import * as path from "path";
import chalk from "chalk";
import * as fs from "fs-extra";
import { API_LIST } from "./commands";
import {
  Condition,
  execCapture,
  tryFindByPredicate,
  tryFindTemplateJsonResource,
} from "./util";

export interface CdkAppOptions {
  readonly resourceName: string;
  readonly subcommand?: string;
  readonly appDir: string;
  readonly restArgs: string[];
}

const AWS_REGION = "us-east-1" ?? process.env.AWS_REGION;

export async function cdkApp(options: CdkAppOptions): Promise<void> {
  // console.log(options);

  const { resourceName: nameOrPath, subcommand, appDir, restArgs } = options;

  const { treeJson, templateJson } = getCloudAssembly(appDir);

  const stackName = getStackName(treeJson);
  const stackResourceMetadata = getStackResourceMetadata(stackName, AWS_REGION);

  // console.log(stackResourceMetadata);

  const resource = findResource(
    nameOrPath,
    { treeJson, templateJson },
    stackResourceMetadata
  );

  if (!resource) {
    throw new Error(
      `Could not find a resource named "${nameOrPath}" in the CDK app.`
    );
  }

  if (!subcommand || subcommand === "help") {
    displayAvailableCommands(resource);
    return;
  }

  // console.log(resource);

  runCommand(resource, subcommand, restArgs);

  return;
}

function getCloudAssembly(appDir: string): CloudAssembly {
  const treeJson: any = fs.readJsonSync(path.join(appDir, "tree.json"));

  // TODO: add better logic for figuring out the right template by checking
  // the manifest.json file
  const files: string[] = fs.readdirSync(appDir);
  const templateFileName = files.filter((f) => f.endsWith(".template.json"))[0];
  const templateJson: any = fs.readJsonSync(
    path.join(appDir, templateFileName)
  );

  return { treeJson, templateJson };
}

function getStackResourceMetadata(
  stackName: string,
  region: string
): DescribeStackResourcesOutput {
  console.error("Refreshing stack metadata...");
  let output = execCapture(
    `AWS_REGION=${region} aws cloudformation describe-stack-resources --stack-name ${stackName}`,
    {
      cwd: process.cwd(),
    }
  );
  return JSON.parse(output.toString());
}

function findResource(
  nameOrPath: string,
  cloudAssembly: CloudAssembly,
  stackResourceMetadata: DescribeStackResourcesOutput
): Resource | undefined {
  const { treeJson, templateJson } = cloudAssembly;

  const resourceMatcher = createTreeJsonResourceNameMatcher(nameOrPath);
  const treeData = tryFindByPredicate(treeJson, resourceMatcher);

  if (!treeData) {
    throw new Error(
      `Could not find resource with name "${nameOrPath}" in tree.json.`
    );
  }

  const cfnTemplateData = tryFindTemplateJsonResource(
    templateJson,
    treeData.path + "/Resource" // TODO: could this be "/Default"? or something else?
  );
  if (!cfnTemplateData) {
    throw new Error(
      `Could not find resource "${treeData.path}/Resource" in tree.json.`
    );
  }

  const runtimeData = stackResourceMetadata.StackResources.find(
    (stackResource) => stackResource.LogicalResourceId === cfnTemplateData.key
  );
  if (!runtimeData) {
    throw new Error(
      `Could not find logical id "${cfnTemplateData.key}" in describe-stack-resources metadata.`
    );
  }

  return { treeData, cfnTemplateData, runtimeData };
}

export function displayAvailableCommands(resource: Resource) {
  const resourceType = resource.treeData.constructInfo?.fqn!;

  let commands = API_LIST[resourceType];
  if (!commands) {
    chalk.red(
      "Error: no commands are currently available for this resource type."
    );
    process.exit(1);
  }

  console.log("Available commands:");
  for (const command of Object.keys(commands)) {
    console.log(` * ${command}`);
  }
}

export function runCommand(
  resource: Resource,
  subcommand: string,
  restArgs: string[]
) {
  const resourceType = resource.treeData.constructInfo?.fqn!;

  let command = API_LIST[resourceType][subcommand];
  command = command.replace(
    /ENCODED_PHYSICAL_RESOURCE_ID/g,
    encodeURIComponent(resource.runtimeData.PhysicalResourceId)
  );
  command = command.replace(
    /PHYSICAL_RESOURCE_ID/g,
    resource.runtimeData.PhysicalResourceId
  );
  command = command.replace(/AWS_REGION/g, AWS_REGION);

  if (restArgs.length > 0) {
    command = command + " " + restArgs.join(" ");
  }

  if (!process.env.AWS_REGION) {
    command = `AWS_REGION=${AWS_REGION} ${command}`;
  }
  console.error(chalk.gray(`> ${command}`));

  try {
    const proc = cp.exec(command, {
      // stdio: ["pipe", "pipe", "pipe"], // "pipe" for STDERR means it appears in exceptions
      cwd: process.cwd(),
    });
    proc.stdout?.pipe(process.stdout);
    proc.stderr?.pipe(process.stderr);
  } catch (e: any) {
    console.error(e.message);
  }
}

function getStackName(treeJson: any) {
  const stackMatcher = createTreeJsonResourceTypeMatcher("aws-cdk-lib.Stack");
  const stackData = tryFindByPredicate(treeJson, stackMatcher);
  if (!stackData) {
    throw new Error("Could not find a stack within in the CDK app.");
  }
  return stackData.id;
}

// function createTemplateJsonResourceNameMatcher(
//   resourcePath: string
// ): Condition<any> {
//   return (_key: string, value: any): value is any =>
//     value.hasOwnProperty("Metadata") &&
//     value.Metadata.hasOwnProperty("aws:cdk:path") &&
//     value.Metadata["aws:cdk:path"] === resourcePath;
// }

function createTreeJsonResourceNameMatcher(
  resourcePath: string
): Condition<TreeJsonResource> {
  return (_key: string, value: any): value is TreeJsonResource =>
    value.hasOwnProperty("path") && value.path.endsWith(resourcePath);
}

function createTreeJsonResourceTypeMatcher(
  resourceType: string
): Condition<TreeJsonResource> {
  return (_key: string, value: any): value is TreeJsonResource =>
    value.hasOwnProperty("constructInfo") &&
    value.constructInfo.hasOwnProperty("fqn") &&
    value.constructInfo.fqn === resourceType;
}

interface CloudAssembly {
  treeJson: any; // TODO: make more specific
  templateJson: any; // TODO: make more specific
}

interface Resource {
  treeData: TreeJsonResource;
  cfnTemplateData: any; // TODO: make more specific
  runtimeData: DescribeStackResourcesItem;
}

// TODO; make more specific / improve
interface TreeJsonResource {
  readonly id: string;
  readonly path: string;
  readonly children?: TreeJsonResource[];
  readonly attributes?: any;
  readonly constructInfo?: TreeJsonConstructInfo;
}

interface TreeJsonConstructInfo {
  readonly fqn: string;
  readonly version: string;
}

interface DescribeStackResourcesOutput {
  readonly StackResources: DescribeStackResourcesItem[];
}

interface DescribeStackResourcesItem {
  readonly StackName: string;
  readonly StackId: string;
  readonly LogicalResourceId: string;
  readonly PhysicalResourceId: string;
  readonly ResourceType: string;
  readonly Timestamp: string;
  readonly ResourceStatus: string; // can make more specific
  readonly DriftInformation: any; // can make more specific
}
