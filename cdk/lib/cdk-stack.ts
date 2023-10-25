// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb"
import {
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam"
import { Bucket } from "aws-cdk-lib/aws-s3"
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda"
import * as path from "path"
import {
  AuthorizationType,
  Cors,
  LambdaIntegration,
  MethodOptions,
  RestApi,
} from "aws-cdk-lib/aws-apigateway"

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    //Part 1 - DynamoDB
    const todoTable = new Table(this, "TodoTable", {
      tableName: "Todo",
      partitionKey: { name: "id", type: AttributeType.STRING },
    })

    //Part 2 - Lambda
    const lambdaRole = new Role(this, "LambdaRole", {
      assumedBy: new ServicePrincipal("lambda.amazon.com"),
    })

    lambdaRole.addToPolicy(
      new PolicyStatement({
        actions: ["dynamodb:*"],
        resources: ["arn:aws:synamodb:us-east-1::table/*"],
      })
    )
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    )

    const lambdaPath = "../../lambda/dist/todo"
    const hotReloadingBucket = Bucket.fromBucketName(
      this,
      "HotReloadingBucket",
      "hot-reload"
    )

    const todoLambda = new Function(this, "LambdaFunctionTodo", {
      functionName: "Todo",
      runtime: Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(120),
      handler: "index.handler",
      code: Code.fromBucket(
        hotReloadingBucket,
        path.join(__dirname, lambdaPath)
      ),
      memorySize: 128,
    })

    //Part 3 - API Gateway
    const sharedMO: MethodOptions = {
      authorizationType: AuthorizationType.NONE,
    }
    const sharedMOItem: MethodOptions = {
      ...sharedMO,
      requestParameters: {
        "method.request.path.itemId": true,
      },
    }
    const api = new RestApi(this, "RestAPI", {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    })
    const todoLI = new LambdaIntegration(todoLambda)
    const todoResource = api.root.addResource("todo")
    todoResource.addMethod("GET", todoLI, sharedMO)
    todoResource.addMethod("POST", todoLI, sharedMO)

    const todoResourceItem = todoResource.addResource("{itemId}")
    todoResourceItem.addMethod("DELETE", todoLI, sharedMOItem)
  }
}
