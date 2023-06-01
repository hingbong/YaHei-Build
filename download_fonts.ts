import {download, GithubRelease, listDir, runProcess, writeToGithubEnv} from "./utils.ts"

await Deno.mkdir("temp")
{
    const api = "https://api.github.com/repos/GuiWonder/SourceHanToClassic/releases"
    const releases: Array<GithubRelease> = (await (await fetch(api)).json()).sort((a: GithubRelease, b: GithubRelease) =>
        Date.parse(b.published_at) - Date.parse(a.published_at))
    console.log(`releases: ${releases.map(release => release.tag_name?.trim()).join("\n")}`)


    const latest = releases[0]
    if (!latest) throw new Error("cannot get latest ttf")

    console.log(`latest: ${JSON.stringify(latest, null, 2)}`)
    const sansAsset = latest.assets.find(asset => asset.name === "AdvocateAncientSansTTFs.7z")
    if (!sansAsset) throw new Error("cannot get latest ttf asset")

    await download(sansAsset.browser_download_url, `temp/${sansAsset.name}`)

    const files = await listDir("temp")

    console.log(`downloaded files: ${files}`)

    await writeToGithubEnv([
        {key: "SANS_VERSION", value: latest.tag_name},
        {key: "SANS_UI_VERSION", value: latest.tag_name}
    ])
    Deno.mkdirSync("source")

    await runProcess(["7z", "x", "-osource", `temp/${sansAsset.name}`])

    const sansFonts = Deno.readDirSync(`source/AdvocateAncientSansJP`)
    await Deno.mkdir("sans")
    for (const font of sansFonts) {
        const src = `source/AdvocateAncientSansJP/${font.name}`
        if (src.includes("HW") || src.includes(".txt") || src.includes("Normal")) continue
        const dest = `sans/${font.name}`
        console.log(`copy ${src} to ${dest}`)
        Deno.copyFileSync(src, dest)
    }
}

{
    const api = "https://api.github.com/repos/ichitenfont/I.Ming/releases"
    const releases: Array<GithubRelease> = (await (await fetch(api)).json()).sort((a: GithubRelease, b: GithubRelease) =>
        Date.parse(b.published_at) - Date.parse(a.published_at))
    console.log(`releases: ${releases.map(release => release.tag_name?.trim()).join("\n")}`)
    const latest = releases[0]
    console.log(`Serif latest tag: ${latest.name}`)
    const serifVersion = latest.tag_name
    const dLink = `https://github.com/ichitenfont/I.Ming/raw/master/${serifVersion}/PMingI.U-${serifVersion}.ttf`
    await download(dLink, `temp/PMingI.U-${serifVersion}.ttf`)

    await Deno.mkdir("serif")
    const src = `temp/PMingI.U-${serifVersion}.ttf`
    const dest = `serif/PMingI.U-${serifVersion}.ttf`
    console.log(`copy ${src} to ${dest}`)
    Deno.copyFileSync(src, dest)

    await writeToGithubEnv([{
        key: "SERIF_VERSION",
        value: serifVersion
    }])
}
