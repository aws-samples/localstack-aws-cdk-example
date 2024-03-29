// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
"use client"
import Image from "next/image"
import axios from "axios"

import config from "../.local.json"
import { useEffect, useState } from "react"
// const API_URL = `http://${config.apiId}.execute-api.localhost.localstack.cloud:4566/prod/todo`
const API_URL = ` http://localhost:4566/restapis/${config.apiId}/test/_user_request_/todo`

export default function Home() {
  const read = async () => {
    const results = await axios.get(API_URL)
    setItems(results.data)
  }

  const save = async () => {
    const result = await axios.post(API_URL, {
      activity
    })
    setActivity("")
    await read()
  }
  const del = async (event: any) => {
    const id = event.target.id
    const result = await axios.delete(`${API_URL}/${id}`)
    await read()
  }

  const [items, setItems] = useState<any>([])
  const [activity, setActivity] = useState<string>("")

  useEffect(() => {
    if (!items.length) {
      read()
    }
  }, [items.length])

  // console.log("ITEMS", items)

  return (
    <main className="flex flex-col items-center justify-between p-0">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30"></p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            By maxthom
          </a>
        </div>
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
        <Image
          className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
          src="/vercel.svg"
          alt="Vercel Logo"
          width={180}
          height={37}
          priority
        />
      </div>

      <div className="mt-10">RestAPI : {config.apiId}</div>
      <div className="mt-10">
        <input
          className="w-40"
          type="text"
          id="activityToAdd"
          value={activity}
          onChange={(event: any) => {
            setActivity(event.target.value)
          }}
          data-np-intersection-state
          data-np-mark
          style={{ color: "black", paddingLeft: 10, border: "1px solid black" }}
        />
        <button className="w-40" onClick={save}>
          Save
        </button>
      </div>

      <div className="mt-10">
        {items.length > 0 &&
          items.map((item: any) => (
            <div key={item.id} className="w-80">
              <button id={item.id} onClick={del} className="w-20">
                DELETE
              </button>
              <span className="w-40">{item.activity}</span>
            </div>
          ))}
      </div>
    </main>
  )
}
