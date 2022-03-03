const SHARED_COMMANDS = {
  audit:
    "aws cloudtrail lookup-events --lookup-attributes AttributeKey=ResourceName,AttributeValue=PHYSICAL_RESOURCE_ID",
  "audit-console":
    'open "https://console.aws.amazon.com/cloudtrail/home?region=AWS_REGION#/events?ResourceName=PHYSICAL_RESOURCE_ID"',
};

export const API_LIST: Record<string, Record<string, string>> = {
  "aws-cdk-lib.aws_s3.Bucket": {
    ls: "aws s3 ls PHYSICAL_RESOURCE_ID",
    "copy-object": "aws s3api copy-object --bucket PHYSICAL_RESOURCE_ID",
    "get-object": "aws s3api get-object --bucket PHYSICAL_RESOURCE_ID",
    "head-object": "aws s3api head-object --bucket PHYSICAL_RESOURCE_ID",
    "list-objects": "aws s3api list-objects-v2 --bucket PHYSICAL_RESOURCE_ID",
    "put-object": "aws s3api put-object --bucket PHYSICAL_RESOURCE_ID",
    "visit-console":
      'open "https://s3.console.aws.amazon.com/s3/buckets/ENCODED_PHYSICAL_RESOURCE_ID?region=AWS_REGION&tab=objects"',
    ...SHARED_COMMANDS,
  },
  "aws-cdk-lib.aws_lambda.Function": {
    "get-function":
      "aws lambda get-function --function-name PHYSICAL_RESOURCE_ID",
    "get-function-configuration":
      "aws lambda get-function --function-name PHYSICAL_RESOURCE_ID",
    invoke:
      "aws lambda invoke --function-name PHYSICAL_RESOURCE_ID /dev/stdout",
    "visit-console":
      "open https://console.aws.amazon.com/lambda/home?region=AWS_REGION#/functions/ENCODED_PHYSICAL_RESOURCE_ID?tab=code",
    logs: "awslogs get /aws/lambda/PHYSICAL_RESOURCE_ID --start='5m ago'",
    "tail-logs": "awslogs get /aws/lambda/PHYSICAL_RESOURCE_ID ALL --watch",
    ...SHARED_COMMANDS,
  },
  "aws-cdk-lib.aws_sqs.Queue": {
    redrive: "echo Unimplemented",
    "receive-message": "echo Unimplemented",
    "visit-console":
      "open https://console.aws.amazon.com/sqs/v2/home?region=AWS_REGION#/queues/ENCODED_PHYSICAL_RESOURCE_ID",
    ...SHARED_COMMANDS,
  },
  "aws-cdk-lib.aws_sns.Topic": {
    publish: "echo Unimplemented",
    "visit-console":
      "open https://console.aws.amazon.com/sns/v3/home?region=AWS_REGION#/topic/ENCODED_PHYSICAL_RESOURCE_ID",
    ...SHARED_COMMANDS,
  },
  "aws-cdk-lib.aws_dynamodb.Table": {
    describe: "aws dynamodb describe-table --table-name PHYSICAL_RESOURCE_ID",
    "visit-console":
      "open https://console.aws.amazon.com/dynamodbv2/home?region=AWS_REGION#table?name=ENCODED_PHYSICAL_RESOURCE_ID&tab=overview",
    ...SHARED_COMMANDS,
  },
};
