import ava from "ava"
import fs from "fs-extra"
import "../../test/config.js"

/** @type {import("./utils")} */
let { resolveToScriptPath } = await import(
  kitPath("core", "utils.js")
)

let testingFindMe = `testing-find-me`
let testingFullPath = home(
  `.kit-testing-full-path`,
  `some-script.js`
)

ava.before(async () => {
  await $`kit set-env-var KIT_TEMPLATE default --no-edit`
  await $`kit new ${testingFindMe} home --no-edit`
})

ava("resolve full path", async t => {
  await fs.outputFile(
    testingFullPath,
    `console.log(await arg())`
  )
  let { scriptPath, requiresPkg } =
    resolveToScriptPath(testingFullPath)

  t.assert(scriptPath, testingFullPath)
  t.true(requiresPkg)
})

ava("resolve in kenvPath", t => {
  let { scriptPath, requiresPkg } =
    resolveToScriptPath(testingFindMe)

  t.assert(
    scriptPath,
    kenvPath("scripts", `${testingFindMe}.js`)
  )
  t.false(requiresPkg)
})

ava("resolve in kenvPath with .js", t => {
  let { scriptPath, requiresPkg } = resolveToScriptPath(
    testingFindMe + ".js"
  )

  t.assert(
    scriptPath,
    kenvPath("scripts", `${testingFindMe}.js`)
  )
  t.false(requiresPkg)
})

ava("resolve doesn't exist", t => {
  let error = t.throws(() => {
    resolveToScriptPath(`i-dont-exist`)
  })

  t.true(error.message.includes("not found"))
})

ava.after.always("clean up", async () => {
  await $`kit rm ${testingFindMe}  --confirm`
  await fs.rm(path.dirname(testingFullPath), {
    recursive: true,
    force: true,
  })
})
