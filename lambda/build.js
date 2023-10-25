// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const esbuild = require("esbuild")
const glob = require("fast-glob")
const path = require("path")
const fs = require("fs/promises")

const OUT_DIR = "dist"

const main = async () => {
  const entryFiles = await glob(`./src/(*/**.ts)`)
  const entryPoints = entryFiles.reduce((acc, file) => {
    const { name } = path.parse(file)
    const baseDir = path.basename(path.dirname(file))
    acc[`${baseDir}/${name}`] = file
    return acc
  }, {})

  fs.rm(OUT_DIR, { recursive: true, force: true })

  const watch = process.argv.indexOf("--watch") > -1 ? true : false

  const options = {
    entryPoints,
    bundle: true,
    target: "node18",
    minify: false,
    sourcemap: true,
    platform: "node",
    external: ["aws-sdk"],
    outdir: OUT_DIR,
    outbase: `./src`,
    logLevel: "info",
  }

  if (watch) {
    options.define = { "process.env.NODE_ENV": '"test"' }
    let ctx = await esbuild.context(options)
    await ctx.watch()
  } else {
    await esbuild.build(options)
  }
}
main().catch(console.error)
