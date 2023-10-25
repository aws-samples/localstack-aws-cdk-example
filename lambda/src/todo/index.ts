// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { APIGatewayEvent, APIGatewayProxyResultV2 } from "aws-lambda"
import { del, read, upsert } from "../ddb"
import { log } from "console"

const headers = {
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*",
}

const ok = (body: any) => {
  return {
    statusCode: 200,
    body: JSON.stringify(body),
    headers,
  }
}

const ko = () => {
  return {
    statusCode: 401,
    headers,
  }
}

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  if (event.resource === "/todo") {
    if (event.httpMethod === "GET") {
      const results = await read()
      return ok(results)
    } else if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "")
      const results = await upsert(body)
      return ok(results)
    }
  } else if (event.resource === "/todo/{itemId}") {
    await del(event.pathParameters?.itemId || "")
    return ok({})
  }
  return ko()
}
