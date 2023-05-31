import {download, listDir, GithubRelease, runProcess, writeToGithubEnv} from "./utils.ts"

const api = "https://api.github.com/repos/GuiWonder/SourceHanToClassic/releases"
const releases: Array<GithubRelease> = (await (await fetch(api)).json()).sort((a: GithubRelease, b: GithubRelease) =>
    Date.parse(b.published_at) - Date.parse(a.published_at))
console.log(`releases: ${releases.map(release => release.tag_name?.trim()).join("\n")}`)


const latest = releases[0]
if (!latest) throw new Error("cannot get latest ttf")

console.log(`latest: ${JSON.stringify(latest, null, 2)}`)
const asset = latest.assets.find(asset => asset.name === "AdvocateAncientSansTTFs.7z")
if (!asset) throw new Error("cannot get latest ttf asset")

await Deno.mkdir("temp")
await download(asset.browser_download_url, `temp/${asset.name}`)

const files = await listDir("temp")

console.log(`downloaded files: ${files}`)

await writeToGithubEnv([
    {key: "SANS_VERSION", value: latest.tag_name},
    {key: "SANS_UI_VERSION", value: latest.tag_name}
])
Deno.mkdirSync("source")

await runProcess(["7z", "x", "-osource", "-x!AdvocateAncientSansJP/LICENSE.txt", `temp/${asset.name}`])

const fonts = Deno.readDirSync(`source/AdvocateAncientSansJP`)
await Deno.mkdir("data")
for (const font of fonts) {
    Deno.copyFileSync(`source/AdvocateAncientSansJP/${font.name}`, `data/${font.name}`)
}
