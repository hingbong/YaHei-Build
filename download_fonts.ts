import {downloadFromGithubLatestRelease, runProcess, writeToGithubEnv} from "./utils.ts"

await Deno.mkdir("temp")
{

    const {tag_name, file_name} = await downloadFromGithubLatestRelease("hingbong/SourceHanToClassic",
        "AdvocateAncientSansTTFs.7z")

    await writeToGithubEnv([
        {key: "SANS_VERSION", value: tag_name},
        {key: "SANS_UI_VERSION", value: tag_name}
    ])
    Deno.mkdirSync("source")

    await runProcess(["7z", "x", "-osource", `temp/${file_name}`])

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
    const {tag_name, file_name}  = await downloadFromGithubLatestRelease("hingbong/SourceHanToClassic",
        "AdvocateAncientSerifTTFs.7z")
    await runProcess(["7z", "x", "-osource", `temp/${file_name}`])

    await Deno.mkdir("serif")
    const src = `source/AdvocateAncientSerifJP/AdvocateAncientSerifJP-Regular.ttf`
    const dest = `serif/AdvocateAncientSerifJP-Regular.ttf`
    console.log(`copy ${src} to ${dest}`)
    Deno.copyFileSync(src, dest)

    await writeToGithubEnv([{
        key: "SERIF_VERSION",
        value: tag_name
    }])
}
