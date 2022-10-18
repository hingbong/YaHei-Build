import {download, getNames, GithubRelease, runProcess, writeToGithubEnv} from "./utils.ts"

const api = "https://api.github.com/repos/JudouMetamedia/JudouSans/releases"
const releases: Array<GithubRelease> = (await (await fetch(api)).json()).sort((a: GithubRelease, b: GithubRelease) =>
    Date.parse(b.published_at) - Date.parse(a.published_at))
console.log(`releases: ${releases.map(release => release.name).join("\n")}`)
const sansRegex = new RegExp("judou-sans-hant-ttf-unhinted-(.*).7z")
const uiRegex = new RegExp("judou-sans-ui-hant-ttf-unhinted-(.*).7z")
const sansAssets = releases.flatMap(release => {
    const assets = release.assets
    return assets.filter(asset => sansRegex.test(asset.name))
})
if (sansAssets.length === 0) throw new Error("sansAssets is empty")

const uiAssets = releases.flatMap(release => {
    const assets = release.assets
    return assets.filter(asset => uiRegex.test(asset.name))
})
if (uiAssets.length === 0) throw new Error("uiAsset is empty")
const sansAsset = sansAssets[0]
const uiAsset = uiAssets[0]

console.log(`sansAsset: ${JSON.stringify(sansAsset, null, 2)}`)
console.log(`uiAsset: ${JSON.stringify(uiAsset, null, 2)}`)
const sansVersion = sansRegex.exec(sansAsset.name)?.[1] ?? ""
const uiVersion = uiRegex.exec(uiAsset.name)?.[1] ?? ""

await Deno.mkdir("temp")
const sansDownload = download(sansAsset.browser_download_url, `temp/${sansAsset.name}`)
const uiDownload = download(uiAsset.browser_download_url, `temp/${uiAsset.name}`)
await sansDownload
await uiDownload

const files = await getNames("temp")

console.log(`downloaded files: ${files}`)

await writeToGithubEnv([
    {key: "JUDOU_SANS_VERSION", value: sansVersion},
    {key: "JUDOU_SANS_UI_VERSION", value: uiVersion}
])
await Deno.mkdir("data")
await runProcess(["7z", "x", "-odata", "-x!*.txt", `temp/${sansAsset.name}`])
await runProcess(["7z", "x", "-odata", "-x!*.txt", `temp/${uiAsset.name}`])
