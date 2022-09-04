import {runProcess, getFontObject, buildOtf, writeJson, AAJP_Serif, download, writeToGithubEnv} from "./utils.ts"

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
    }
}

const patchCFFObject = (fontObject: any, fontName: "simsun" | "nsimsun") => {
    const CFFObject = fontObject["CFF_"]
    if (!CFFObject) return
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

const i_dim_version = "7.01"
const i_dim = `https://github.com/ichitenfont/I.Ming/raw/master/${i_dim_version}/I.MingCP-${i_dim_version}.ttf`
await Deno.mkdir("serif")
await download(i_dim, `serif/I.MingCP-${i_dim_version}.ttf`)

const font = await getFontObject(`serif/I.MingCP-${i_dim_version}.ttf`)
console.log(`get serif/I.MingCP-${i_dim_version}.ttf font object`)
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
console.log(`out/simsun.ttc built`)

await writeToGithubEnv([{
    key: "I_MING_VERSION",
    value: i_dim_version
}])
