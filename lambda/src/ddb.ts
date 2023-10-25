// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocument,
  ScanCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb"
import { log } from "console"
import { v4 as uuid } from "uuid"

const client = () => {
  let config: DynamoDBClientConfig & {
    accessKeyId?: string
    secretAccesskey?: string
  } = {}

  if (process.env.NODE_ENV === "test") {
    config = {
      region: "us-east-1",
      endpoint: `http://${process.env.LOCALSTACK_HOSTNAME}:4566`,
    }
  }
  const ddbClient = new DynamoDBClient(config)
  return DynamoDBDocument.from(ddbClient)
}

export const upsert = async (params: any) => {
  const id = params.id || uuid()
  const paramsWithoutId = params
  delete paramsWithoutId.id

  const commandOptions: UpdateCommandInput = {
    TableName: "Todo",
    Key: { id },
    UpdateExpression: "set #activity = :activity",
    ExpressionAttributeNames: {
      "#activity": "activity",
    },
    ExpressionAttributeValues: {
      ":activity": params["activity"],
    },
  }
  log(JSON.stringify(commandOptions))
  await client().update(commandOptions)
  return { ...paramsWithoutId, id }
}

export const read = async () => {
  const items = await client().send(
    new ScanCommand({
      TableName: "Todo",
    })
  )
  return items.Items
}

export const del = async (id: string) => {
  await client().delete({
    TableName: "Todo",
    Key: { id },
  })
  return
}
