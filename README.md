# Localstack + AWS CDK example

by @maxthom

# Purpose

This repo aims to showcase the usage of Localstack and AWS CDK to address specific integration challenges regarding local development where the end target is the AWS platform.

The following tenets were in mind (unless you know better ones):

1. **Everything is code and is stored at the same location** - Every single component of the application we're building has a code representation to ensure quality through test, reliability through reproduction and security through auditability.
1. **Our implementation is frugal** - We use the right tool for the right job and we decrease the number of lines of code to maximize productivity, ease debug and ensure high quality.
1. **We trust the code** - Local code is exactly the code sent and deployed in the cloud.
1. **We test in production-close conditions** - Local development is representative of the AWS cloud and we can add / remove test AWS accounts without interferring with CI/CD pipelines.

# Stack

## Local stack

1. [Docker](https://www.docker.com/)
1. (Optional) [Docker Desktop](https://www.docker.com/products/docker-desktop/)
1. [Localstack](https://localstack.cloud/)
1. (Optional) [Localstack Cockpit](https://docs.localstack.cloud/user-guide/tools/cockpit/)
1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html)
1. [Localstack AWSLocal](https://github.com/localstack/awscli-local)
1. [AWS CDK](https://aws.amazon.com/fr/cdk/)
1. [Localstack CDKLocal](https://github.com/localstack/aws-cdk-local)

## Backend

1. (global) [Typescript](https://www.typescriptlang.org/download)
1. (dependency) [esbuild](https://esbuild.github.io/)

## Frontend

1. (dependency) [React](https://react.dev/)
1. (dependency) [Next.js](https://nextjs.org/)
1. (dependency) [Axios](https://axios-http.com/)

## Install the stack

### Docker

    # brew install docker
    # docker --version

(Optional) install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Localstack

    # brew install localstack/tap/localstack-cli
    # localstack --version

(Optional) Install [LocalStack Cockpit](https://localstack.cloud/products/cockpit/)

### AWS CDK & LocalStack CDK Local

[Download](https://github.com/localstack/aws-cdk-local)

    # npm install -g aws-cdk-local aws-cdk

### AWS CLI && LocalStack AWS Local

[Download](https://github.com/localstack/awscli-local)

    # python3 -m pip --version
    # python3 -m pip install awscli awscli-local
    # awslocal --version

# Localstack

## Start

    # localstack start -d --no-banner

Where:

- d is for Daemon mode
- no banner remove the ASCII style banner (might cause trouble with Windows)

## Stop

    # localstack stop

## Configuration get/set

    # localstack config show

# CDK ans AWS Local

## Init

    # mkdir cdk
    # cd cdk
    # cdklocal init --language typescript

## Bootstrap

    # cd cdk
    # cdklocal bootstrap
    # awslocal s3 ls

## Deploy

    # cdk deploy --require-approval never

Where:

- require approval never skips approval prompts

# Part 1 - Building a simple stack

The following takes all the benefits from cdk and localstack to have one unique stack deployed both locally and remotely.
This means the services requried by the architecture is lowered by the actual list of LocalStack supported service.
For non exotic usage, it should cover most of the cases.

## Creating the stack

- Edit `cdk/lib/cdk-stack.ts`

- Add the creation of the Dynamo Table as follow (or uncomment the code):

```
const todoTable = new Table(this, "TodoTable", {
      tableName: "Todo",
      partitionKey: { name: "id", type: AttributeType.STRING },
    })
```

- Synthetize the Cloudformation template:

```
# cdklocal synth
```

- Deploy

```
cdklocal deploy --require-approval never
```

## Developping the backend

Backend code is supported by Typescript and esbuild. Source code is located in the `src` directory and has different directories for each lambda. Shared code is at the root of `src`.

    src
        --> <lambda name>
            --> index.ts
            --> <other resources>
        ddb.ts
        <other resources>

To start to develop:

    $ cd lambda
    $ lambda > npm start

It kicks off a watch process to compile the typescript if the content of the file change.

Using the [`Hot reload`](https://docs.localstack.cloud/user-guide/tools/lambda-tools/hot-reloading/) of Localstack, the code is then automatically (and magically) uploaded in the lambda. It allows you to developp locally and have a seamless developer experience, faster than Lambda's web editor.

_Note:_ You need one hot reload bucket for each lambda (using the same does not work)

## Developping frontend

Frontend does not need to be in the local CDK infrastructure as a developer can develop locally SPA without all the stack.

To start to develop:

    $ npm run dev

## Troubleshooting

### View the data from DynamoDB with NoSQL Workbench

- Check that the table is created

  $ awslocal dynamodb list-tables

- Download the [software](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.html)
- Install it & run it
- Select `Operation Builder` > `Add Connection` and fill the `DynamoDB local` form
- Change the port to `4566` //TOCHECK
- Browse the local tables

### Invoke a specific lambda from the console

    $ curl -X POST \
    'http://<XXXXXXXX>.lambda-url.us-east-1.localhost.localstack.cloud:4566/' \
    -H 'Content-Type: application/json' \
    -d '{"num1": "10", "num2": "10"}'

### View the logs of a specific lambda, since 1 min

    $ awslocal logs tail /aws/lambda/Todo --since 1m

### Debuging API calls from the frontend

**Symptoms**: in the browser, a RestAPI call response status is "502" with CORS reason.

**Debug steps**:

1. Brower shows CORS errors but it can be a classic regular error such as 4xx or 5xx. If the method is GET, open the link in the browser. You would have the main reason of the CORS issue: either a 404 or a 500. For example, \*Internal errorraises a
1. Check the following:
   1. API has the API resource definition in the CDK stack code
   1. CDK has been deployed
   1. Lambda resource is found and entered (console.log at the top of the handler)
   1. Lambda resource is entered and you enter the right method/path branch (console.log in the right portion of the code)

# Part 2 - Building deployment in AWS

## Backend

Build is pushed in the `dist` directory, so deployment is about pushing the lambda code through CDK.

## Frontend

Build is pushed in the `.next` directory, so the deployment is about pushing the SPA code through CDK.

## CDK

Considering the architecture of your project, you might have some differences between the infrastructure described locally and what you might have in the AWS platform. Localstack does not cover all the AWS Services and the coverage is available here: https://docs.localstack.cloud/user-guide/aws/feature-coverage/.

It implies that you'll have to add some logic in the CDK code to split both architectures.

### Part 1 - Split by Typescript imports

Basically, we use the TS imports to isolate parts of the code in different sections. Regarding the documentation of CDK on building a stack, a stack is defined by a scope and all constructs can be attached to this scope with [construct's constructor function](https://docs.aws.amazon.com/cdk/v2/guide/constructs.html) signature.

It means, you can leverage function in Typescript building Constructs, Array of Constructs or externalize the code for reuse.

#### Function returning a construct

In `cdk/lib/cdk-stack.ts`, you can add the following:

```
const getBucket = (scope: Construct, bucketName: string) => {
    return new s3.Bucket(scope, 'Bucket', {
        bucketName,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        enforceSSL: true,
        versioned: true,
        removalPolicy: RemovalPolicy.RETAIN,
    })
}

```

and use it in the code of the stack's constructor:

```
...
const myBucket = getBucket("my-bucket-32")
...
```

#### Function returning an array of constructs

Following the same principle, you can factorize your code to minimize its size, increase readability and reduce time to debug (less lines of code = easier to manage).

Let's say you have a list of lambda and you want one bucket by lambda, you can do:

```
const getLambdas = (scope: Construct)=>{
    const lambdaList : Function[] = ...
    const bucketList : any = {}
    lambdaList.map((lambda:Function)=>{
        const bucket = getBucket(scope, lambda.functionName)
        bucketList[lambda.functionName] = bucket
    })
    return {lambdaList, bucketList}
}
```


#### Exporting code in files

The last part is to reorganize the code so we have functional blocks corresponding to a specific intent. To do so, apply the following architecture tenet: **"for each single feature, we havee one and only one technical solution"**, whih basically means "we have only one file for every single purpose".

Following the same example, we can split our code in several pieces.

1. We move the getBucket function to another file called `storage.ts`. And we prefix the function by `export` so the code will be reacheable from an `import` elsewhere.
1. We move the lambda code to another file called `compute.ts`, we package it in a function, similar to `getBucket` and we do the same prefix to expose our function. As the lambda code use `getBucket`, we import it at the top of the file.
1. We remove all the previous code in the stack and we import the `getLambdas` function to use it.

Proceeding like this has several benefits:
1. the import system guarantees that you use only what is useful.
1. the functions are reusable and also composable (see CDK documentation)
1. the approach is functional, by big set of features, so you can easily navigate the code of your stack and identify resources easily.


### Part 2 - Flattening and Nested stack

This is great but if your infrastructure becomes huge, you'll face two main challenges:
1. CDK generates resources for you through the use of construct, and in certain cases, you won't need constrcut abstraction (L3).
1. CDK generates resources, so you'll quickly reach the famous limit of [500 resources](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cloudformation-limits.html) by AWS Cloud Formation.

To avoid those, the architecture tenet above helps your to split in the right way:
1. split your stack in several [Nested Stacks](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.NestedStack.html)
1. split by big technical mandatory features such as Network, Storage, Compute, Security and so on. It will result on resources set for the whole application and required for the built of the application. 
1. then for the application, if it's too big, you'll get to split in several nested stacks. You have the choice on two approaches:
    1. There's a natural split by technology or purpose : frontend and backend for instances.
    1. There's a functional split by domain or feature : users and registrations for example (including a mini-stack for each of those solutions)

The benefit of using `Nasted Stacks` is important:
1. For the delivery, Cloud Formation delivers only what needs to be changed, so it's quicker and you limit your blast radius in case of issue.
1. For reversibility, if you have to roll out for any reason, you'll roll out only the corresponding nested stack, so the time to retrieve normal operations is reduced. 

And it comes with several constraints:
1. Reorganizing the code implies a recompute for CDK of the logical ID. The logical ID is used to identify resource in CloudFormation and it's generated by CDK. Moving code from one file to another file will change the generated logical id and then create a new resource.
1. The granularity comes with a cost in terms of time as you have to set up the initial file split.


# Contributing

Please create a new [GitHub issue](https://github.com/aws-samples/localstack-aws-cdk-example/issues) for any feature requests, bugs, or documentation improvements.

Where possible, please also submit a [pull request](https://github.com/aws-samples/localstack-aws-cdk-example/pulls) for the change.


# License

This sample code is made available under the MIT-0 license. See the LICENSE file. 