import {download, listDir, runProcess, unzip} from "./utils.ts";

Deno.mkdirSync("tools", {mode: 0o755})

const toWinToolsUrl = "https://github.com/GuiWonder/toWinFonts/archive/refs/heads/main.zip"

await download(toWinToolsUrl, "tools/toWinFonts.zip")

Deno.mkdirSync("tools/toWinFonts")

await unzip("tools/toWinFonts.zip", "tools/toWinFonts")

for (const file in await listDir("tools/toWinFonts")) {
    console.log(`tool file: ${file}`)
}

await runProcess(["chmod", "-R", "+x", "tools/toWinFonts"])
