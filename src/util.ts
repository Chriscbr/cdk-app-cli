import * as cp from "child_process";

const MAX_BUFFER = 10 * 1024 * 1024;

/**
 * Executes a command with STDOUT > STDERR.
 */
export function exec(command: string, options: { cwd: string }): void {
  try {
    cp.execSync(command, {
      stdio: ["inherit", process.stderr, "pipe"], // "pipe" for STDERR means it appears in exceptions
      maxBuffer: MAX_BUFFER,
      cwd: options.cwd,
    });
  } catch (e) {
    // log the error in some debugger mode
    // for now, do nothing
    console.error(`Error when running: ${command}`);
  }
}

/**
 * Executes command and returns STDOUT. If the command fails (non-zero), throws an error.
 */
export function execCapture(command: string, options: { cwd: string }) {
  return cp.execSync(command, {
    stdio: ["inherit", "pipe", "pipe"], // "pipe" for STDERR means it appears in exceptions
    maxBuffer: MAX_BUFFER,
    cwd: options.cwd,
  });
}

type Obj = { [key: string]: any };

function isObj(value: any): value is Obj {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

export function matchesPath(nameOrPath: string, resourcePath: string): boolean {
  return resourcePath.endsWith(nameOrPath);
}

export type Condition<T> = (key: string, value: any) => value is T;

export function tryFindByPredicate<T>(
  json: any,
  condition: Condition<T>
): T | undefined {
  if (!isObj(json)) {
    return undefined;
  }

  for (const [key, value] of Object.entries(json)) {
    if (isObj(value) && condition(key, value)) {
      return value;
    }

    const resource = tryFindByPredicate(value, condition);
    if (resource) {
      return resource;
    }
  }

  return undefined;
}

// TODO: refactor to use tryFindByPredicate
export function tryFindTemplateJsonResource(
  json: any,
  resourcePath: string
): { key: string; value: any } | undefined {
  if (!isObj(json)) {
    return undefined;
  }

  for (const [key, value] of Object.entries(json)) {
    if (
      isObj(value) &&
      value.hasOwnProperty("Metadata") &&
      value.Metadata.hasOwnProperty("aws:cdk:path") &&
      value.Metadata["aws:cdk:path"] === resourcePath
    ) {
      return { key, value };
    }

    const resource = tryFindTemplateJsonResource(value, resourcePath);
    if (resource) {
      return resource;
    }
  }

  return undefined;
}

// TODO: refactor to use tryFindByPredicate
export function tryFindTreeJsonResource(json: any, nameOrPath: string): any {
  if (!isObj(json)) {
    return undefined;
  }

  for (const [_key, value] of Object.entries(json)) {
    if (
      isObj(value) &&
      value.hasOwnProperty("path") &&
      matchesPath(nameOrPath, value.path)
    ) {
      return value;
    }

    const resource = tryFindTreeJsonResource(value, nameOrPath);
    if (resource) {
      return resource;
    }
  }
}
