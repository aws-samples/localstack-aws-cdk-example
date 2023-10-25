// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import shell from "shelljs"

const run = () => {
  shell.env["TARGET"] = "dev"
  shell.env["AWS_REGION"] = "us-east-1"

  shell.exec(`localstack stop`)
  shell.exec(`localstack start -d --no-banner`)
  shell.exec(`localstack config show`)

  shell.cd("cdk")
  shell.exec(`cdklocal bootstrap`)
  shell.exec(`cdklocal deploy --require-approval never`)

  shell.exec(
    `awslocal apigateway get-rest-apis --output json --query "items[0].{apiId: id}" > ../frontend/src/.local.json`
  )
  shell.cd("..")
  shell.cp("./frontend/src/.local.json", "./lambda/src/.local.json")
}
run()
