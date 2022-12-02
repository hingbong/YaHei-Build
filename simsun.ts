import {
    runProcess,
    getFontObject,
    buildOtf,
    writeJson,
    AAJP_Serif,
    download,
    writeToGithubEnv,
    GithubRelease, readEnv
} from "./utils.ts"

const fontList = {
    "simsun": {
        name: "SimSun",
        "FILENAME": "simsun",
        "meta": {
            "version": 1,
            "flags": 0,
            "entries": [
                {
                    "tag": "dlng",
                    "string": "Hans"
                },
                {
                    "tag": "slng",
                    "string": "Bopo, Cyrl, Grek, Hani, Hans, Hira, Hrkt, Jpan, Kana, Latn"
                }
            ]
        }
    }, "nsimsun": {
        "name": "NSimSun",
        "FILENAME": "nsimsun",
        "meta": {
            "version": 1,
            "flags": 0,
            "entries": [
                {
                    "tag": "dlng",
                    "string": "Hans"
                },
                {
                    "tag": "slng",
                    "string": "Bopo, Cyrl, Grek, Hani, Hans, Hira, Hrkt, Jpan, Kana, Latn"
                }
            ]
        }
    },
    "msgothic": {
        FILENAME: "msgothic"
    }
}

const patchCFFObject = (fontObject: any, fontName: "simsun" | "nsimsun") => {
    const CFFObject = fontObject["CFF_"]
    if (CFFObject != undefined) throw new Error("do not support postscript for now")
    return;
    const enName: string = fontList[fontName].name
    const enNameCompat = enName.replaceAll(" ", "")
    CFFObject["fontName"] = enName
    CFFObject["fullName"] = enName
    CFFObject["familyName"] = enName
    const fdArray = CFFObject["fdArray"]
    if (!fdArray) return
    const newFd: Record<any, any> = {}
    Object.keys(fdArray).forEach(key => {
        newFd[key.replace(`${AAJP_Serif}-Regular`, enNameCompat)] = fdArray[key]
    })
    CFFObject["fdArray"] = newFd
    const glyf = fontObject["glyf"]
    Object.keys(glyf).forEach(key => {
        if (glyf[key]["CFF_fdSelect"]) {
            glyf[key]["CFF_fdSelect"] = glyf[key]["CFF_fdSelect"]
                .replace(`${AAJP_Serif}-Regular`, enNameCompat)
        }
    })
}
const api = "https://api.github.com/repos/GuiWonder/SourceHanToClassic/releases"
const releases: Array<GithubRelease> = (await (await fetch(api)).json()).sort((a: GithubRelease, b: GithubRelease) =>
    Date.parse(b.published_at) - Date.parse(a.published_at))
console.log(`releases: ${releases.map(release => release.name).join("\n")}`)

const tagReg = RegExp("(.*-ttf)")

const latest = releases.find(release => tagReg.test(release.tag_name))
if (!latest) throw new Error("cannot get latest ttf")

console.log(`latest: ${JSON.stringify(latest, null, 2)}`)
const asset = latest.assets.find(asset => asset.name === "AdvocateAncientSerifTTFs.7z")
if (!asset) throw new Error("cannot get latest ttf asset")
console.log(`Serif latest tag: ${latest.name}`)
const serifVersion = latest.tag_name
const dLink = asset.browser_download_url
await Deno.mkdir("serif")
await download(dLink, `temp/${asset.name}`)
await runProcess(["7z", "x", "-oserif", "-x!*.txt", `temp/${asset.name}`])


const font = await getFontObject(`serif/AdvocateAncientSerifJP/AdvocateAncientSerifJP-Regular.ttf`)
console.log(`get serif/AdvocateAncientSerifJP/AdvocateAncientSerifJP-Regular.ttf font object`)
// 宋体
const simsunName = JSON.parse(Deno.readTextFileSync("simsun-name.json"))
font["name"] = simsunName
patchCFFObject(font, "simsun")
font["meta"] = fontList["simsun"]["meta"]
const simsunJsonPath = `temp/${fontList["simsun"].FILENAME}.json`
await writeJson(simsunJsonPath, font)
const simsunFilePath = `temp/${fontList["simsun"].FILENAME}.ttf`
await buildOtf(simsunFilePath, simsunJsonPath)
console.log(`${simsunFilePath} built`)
// 新宋体
const nsimsunName = JSON.parse(Deno.readTextFileSync("nsimsun-name.json"))
font["name"] = nsimsunName
patchCFFObject(font, "nsimsun")
font["meta"] = fontList["nsimsun"]["meta"]
const nsimsunJsonPath = `temp/${fontList["nsimsun"].FILENAME}.json`
await writeJson(nsimsunJsonPath, font)
const nsimsunFilePath = `temp/${fontList["nsimsun"].FILENAME}.ttf`
await buildOtf(nsimsunFilePath, nsimsunJsonPath)
console.log(`${nsimsunFilePath} built`)

await runProcess(["otf2otc", "-o", "out/simsun.ttc", simsunFilePath, nsimsunFilePath])


// msmincho
const msminchoA: any[] = JSON.parse(Deno.readTextFileSync("msmincho.json"))
for (const index in msminchoA) {
    font["name"] = msminchoA[index]["name"]
    font["meta"] = msminchoA[index]["meta"]
    const tempJsonPath = `temp/msmincho${index}.json`
    await writeJson(tempJsonPath, font)
    const tempFilePath = `temp/msmincho${index}.ttf`
    await buildOtf(tempFilePath, tempJsonPath)
    console.log(`${tempFilePath} built`)
}
const msminchoTTFs: string[] = msminchoA.map((_, index) =>
    `temp/msmincho${index}.ttf`
)
await runProcess(["otf2otc", "-o", "out/msmincho.ttc", simsunFilePath, nsimsunFilePath].concat(msminchoTTFs))

// msgothic
const fontFile = readEnv("SANS_REGULAR_FONT_PATH")!!
const sansFont = await getFontObject(fontFile)
console.log(`get ${fontFile} font object`)
const msgothicA: any[] = JSON.parse(Deno.readTextFileSync("msgothic.json"))
for (const index in msgothicA) {
    sansFont["name"] = msgothicA[index]["name"]
    sansFont["meta"] = msgothicA[index]["meta"]
    const tempJsonPath = `temp/msgothic${index}.json`
    await writeJson(tempJsonPath, sansFont)
    const tempFilePath = `temp/msgothic${index}.ttf`
    await buildOtf(tempFilePath, tempJsonPath)
    console.log(`${tempFilePath} built`)
}
const msgothicTTFs: string[] = msgothicA.map((_, index) =>
    `temp/msgothic${index}.ttf`
)
await runProcess(["otf2otc", "-o", "out/msgothic.ttc", simsunFilePath, nsimsunFilePath].concat(msgothicTTFs))

console.log(`out/msgothic.ttc built`)

await writeToGithubEnv([{
    key: "SERIF_VERSION",
    value: serifVersion
}])
