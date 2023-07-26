// Name: Snippets
// Description: Quickly insert snippets of text
// Cache: true
// Keyword: snip

import "@johnlindquist/kit"
import { globby } from "globby"
import slugify from "slugify"
import { closeShortcut } from "../core/utils.js"
let snippetPaths = await globby([
  kenvPath("snippets", "**", "*.txt"),
  kenvPath("kenvs", "*", "snippets", "**", "*.txt"),
])

let defaultSnippetTemplate = `// Name: \${1:Required}
\${0}`

let getSnippet = (
  contents: string
): {
  metadata: Record<string, string>
  snippet: string
} => {
  let lines = contents.split("\n")
  let metadata = {}
  let contentStartIndex = lines.length

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    let match = line.match(
      /(?<=^(?:(?:\/\/)|#)\s{0,2})([\w-]+)(?::)(.*)/
    )

    if (match) {
      let [, key, value] = match
      if (value) {
        metadata[key.trim().toLowerCase()] = value.trim()
      }
    } else {
      contentStartIndex = i
      break
    }
  }

  let snippet = lines.slice(contentStartIndex).join("\n")
  return { metadata, snippet }
}

let snippetChoices = []
for await (let s of snippetPaths) {
  let contents = await readFile(s, "utf8")
  let { metadata, snippet } = getSnippet(contents)

  snippetChoices.push({
    name: metadata?.name || s,
    tag: metadata?.snippet || "",
    description: s,
    value: snippet.trim(),
    preview: `<div class="p-4">${snippet}</div>`,
  })
}

let snippet = await arg(
  {
    placeholder: "Choose a snippet",
    enter: `Paste Snippet`,
    shortcuts: [
      {
        key: `${cmd}+o`,
        name: "Edit Snippet",
        onPress: async (input, state) => {
          console.log(state.focused?.description)
          await edit(state?.focused?.description)
          exit()
        },
        bar: "right",
      },
      {
        key: `${cmd}+n`,

        name: "New Snippet",
        onPress: async () => {
          setInput(``) // clearing keyword

          let contents = await template(
            defaultSnippetTemplate,
            {
              shortcuts: [
                closeShortcut,
                {
                  key: `${cmd}+s`,
                  name: "Save Snippet",
                  onPress: async input => {
                    submit(input)
                  },
                  bar: "right",
                },
              ],
            }
          )
          let { metadata } = getSnippet(contents)
          await ensureDir(kenvPath("snippets"))
          await writeFile(
            kenvPath(
              "snippets",
              `${slugify(metadata.name, {
                lower: true,
                trim: true,
              })}.txt`
            ),
            contents
          )
        },
        bar: "right",
      },
    ],
  },
  snippetChoices.concat({
    name: "No snippets found...",
    miss: true,
    info: true,
  })
)

if (snippet.match(/\${(.+)?}/)) {
  setInput(``) // clearing keyword
  snippet = await template(snippet, {
    shortcuts: [
      {
        key: `${cmd}+s`,
        name: "Paste Snippet",
        onPress: async input => {
          submit(input)
        },
        bar: "right",
      },
    ],
  })
}
await setSelectedText(snippet)
