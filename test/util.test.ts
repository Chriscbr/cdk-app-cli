import {
  matchesPath,
  tryFindTemplateJsonResource,
  tryFindTreeJsonResource,
} from "../src/util";
import templateFixture from "./fixtures/DemoAppStack.template.json";
import treeFixture from "./fixtures/tree.json";

test("matchesPath", () => {
  expect(matchesPath("MyQueue", "DemoAppStack")).toEqual(false);
  expect(matchesPath("MyQueue", "DemoAppStack/MyQueue")).toEqual(true);
  expect(matchesPath("MyQueue", "DemoAppStack/MyQueue/Resource")).toEqual(
    false
  );
});

test("tryFindTreeJsonResource", () => {
  expect(tryFindTreeJsonResource(treeFixture, "MyQueue")).toEqual(
    expect.objectContaining({
      id: "MyQueue",
      path: "DemoAppStack/MyQueue",
    })
  );
});

test("tryFindTemplateJsonResource", () => {
  expect(
    tryFindTemplateJsonResource(
      templateFixture,
      "DemoAppStack/MyQueue/Resource"
    )
  ).toEqual(
    expect.objectContaining({
      Type: "AWS::SQS::Queue",
      Metadata: {
        "aws:cdk:path": "DemoAppStack/MyQueue/Resource",
      },
    })
  );
});
