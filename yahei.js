const UI = "UI"
const SANS = "SANS"

import {runProcess, AAJP_SANS, getNames, buildOtf, getFontObject, writeJson} from "./utils.ts"

const fontList = {
    "YH": {
        UI: {
            "EN": "Microsoft YaHei UI",
            "CN": "微软雅黑 UI"
        },
        SANS: {
            "EN": "Microsoft YaHei",
            "CN": "微软雅黑"
        },
        "FILENAME": "msyh",
        "meta": {
            "version": 1, "flags": 0, "entries": [{
                "tag": "dlng", "string": "Hans"
            }, {
                "tag": "slng", "string": "Hans, Bopo, Grek, Hani, Hant, Hira, Kana, Latn, Hant-HK"
            }]
        }
    }, "JH": {
        UI: {
            "EN": "Microsoft JhengHei UI", "CN": "微軟正黑體 UI"
        },
        SANS: {
            "EN": "Microsoft JhengHei", "CN": "微軟正黑體"
        },
        "FILENAME": "msjh",
        "meta": {
            "version": 1, "flags": 0, "entries": [{
                "tag": "dlng", "string": "Bopo, Hant"
            }, {
                "tag": "slng", "string": "Bopo, Grek, Hani, Hant, Hira, Kana, Latn, Hant-HK, Hans"
            }]
        }
    }
}


const englishLangs = [0, 1033, 15369]
// 1028 Chinese - Taiwan
//
// 1033 English - United States
//
// 1041 Japanese
//
// 1042 Korean
//
// 2052 Chinese - People's Republic of China
//
// 3076 Chinese - Hong Kong SAR
//
// 4100 Chinese - Singapore
//
// 5124 Chinese - Macao SAR
//
// 15369 English - Hong Kong SAR
// const allLangs = [1028, 1033, 1041, 1042, 2052, 3076, 4100, 5124, 15369]
const cnLangs = [1028, 1041, 1042, 2052, 3076, 4100, 5124]
const needChangeNames = [1, 3, 4, 6, 16]
const getNameString = (nameObject, languageID) => {
    if (englishLangs.includes(languageID)) {
        return nameObject["EN"]
    } else {
        return nameObject["CN"]
    }
}

const nameOfWeight = (weight) => {
    let result = ""
    switch (weight) {
        case "Bold":
            result = "bd"
            break
        case "Heavy":
            result = "hv"
            break
        case "Light":
            result = "l"
            break
        case "ExtraLight":
            result = "xl"
            break
        case "Medium":
            result = "md"
            break
        case "Normal":
            result = "nm"
            break
    }
    return result
}

const patchNameObject = async (fontObject, nameObject, fontName, SansOrUi, weight) => {
    nameObject.filter(element => needChangeNames.includes(element["nameID"]))
        .forEach(element => {
            switch (element["nameID"]) {
                case 1:
                case 16:
                    element["nameString"] = getNameString(fontList[fontName][SansOrUi], element["languageID"])
                    break
                case 3:
                case 4:
                    element["nameString"] = getNameString(fontList[fontName][SansOrUi], element["languageID"]) + (weight === "Regular" ? "" : ` ${weight}`)
                    break
                case 6:
                    element["nameString"] = getNameString(fontList[fontName][SansOrUi], element["languageID"]).replaceAll(" ", "") + (weight === "Regular" ? "" : weight)
                    break
            }
        })
    const fontNameSuffix = SansOrUi === UI ? "ui" : ""

    const hasLangs = nameObject.map(e => e["languageID"])
    const lackEng = englishLangs.filter(lang => !hasLangs.includes(lang))
    const lackCn = cnLangs.filter(lang => !hasLangs.includes(lang))

    const enNameList = nameObject.filter(e => e["languageID"] === 1033)
    const lackEngNameList = lackEng.flatMap(lang => {
        const result = JSON.parse(JSON.stringify(enNameList))
        result.forEach(name => name["languageID"] = lang)
        return result
    })
    const cnNameList = nameObject.filter(e => e["languageID"] === 2052)
    const lackCnNameList = lackCn.flatMap(lang => {
        const result = JSON.parse(JSON.stringify(cnNameList))
        result.forEach(name => name["languageID"] = lang)
        return result
    })
    fontObject["name"] = nameObject.concat(lackEngNameList, lackCnNameList)
    fontObject["meta"] = fontList[fontName]["meta"]
    writeJson(`temp/${fontList[fontName]["FILENAME"]}${fontNameSuffix}${nameOfWeight(weight)}.json`, fontObject)
    const otfFileName = `temp/${fontList[fontName]["FILENAME"]}${fontNameSuffix}${nameOfWeight(weight)}.otf`
    await buildOtf(otfFileName, `temp/${fontList[fontName]["FILENAME"]}${fontNameSuffix}${nameOfWeight(weight)}.json`)
    console.log(`${otfFileName} built`)
}

const patchCFFObject = (fontObject, fontName, SansOrUi, weight, needToReplaceName) => {
    const CFFObject = fontObject["CFF_"]
    if (!CFFObject) return
    const enName = fontList[fontName][SansOrUi]["EN"]
    const enNameCompat = enName.replaceAll(" ", "")
    const enNameCompatWithWeight = weight === "Regular" ? enNameCompat : (enNameCompat + weight)
    CFFObject["fontName"] = enNameCompatWithWeight
    CFFObject["fullName"] = weight === "Regular" ? enName : (enName + " " + weight)
    CFFObject["familyName"] = enName
    const fdArray = CFFObject["fdArray"]
    if (!fdArray) return
    console.log(`${needToReplaceName} will be replaced with ${enNameCompatWithWeight}`)
    const newFd = {}
    // MicrosoftYaHei-Regular- => MicrosoftYaHei-
    // MicrosoftYaHei-Bold- => MicrosoftYaHeiBold
    Object.keys(fdArray).forEach(key => {
        newFd[key.replace(needToReplaceName, enNameCompatWithWeight)] = fdArray[key]
    })
    CFFObject["fdArray"] = newFd
    const glyf = fontObject["glyf"]
    Object.keys(glyf).forEach(key => {
        if (glyf[key]["CFF_fdSelect"]) glyf[key]["CFF_fdSelect"] = glyf[key]["CFF_fdSelect"].replace(needToReplaceName, enNameCompatWithWeight)
    })
    return enNameCompatWithWeight
}

// [name-ids](https://docs.microsoft.com/en-us/typography/opentype/spec/name#name-ids)
//
// 1	Font Family name; Microsoft YaHei UI 微软雅黑 UI
//
// 2	Font Subfamily name; Bold
//
// 3 	Unique font identifier; Microsoft YaHei UI Bold 微软雅黑 UI Bold
//
// 4 	Full font name that reflects all family and relevant subfamily descriptors.; Microsoft YaHei UI Bold 微软雅黑 UI Bold
//
// 6 	PostScript name for the font; In a CFF OpenType font, there is no requirement that this name be the same as the font name in the CFF’s Name INDEX. AdvocateAncientJPSans-Regular
//
// 16 	Typographic Family name; Microsoft YaHei UI 微软雅黑 UI
//
// [Locale ID](https://docs.microsoft.com/en-us/openspecs/office_standards/ms-oe376/6c085406-a698-4e12-9d4d-c3b0ee3dbc4a)
//
// languageID为 `0`, `1033`, `15369`使用英文名称，其余使用中文
//
// Regular不在名称上标识
const build = async (otf) => {
    const font = await getFontObject(otf)
    console.log(`${otf} object read finished`)
    const name = font["name"]
    // 字重
    const weight = font["CFF_"]?.weight ?? name.find(element => element["nameID"] === 17)["nameString"]
    console.log(`current font weight is ${weight}`)
    // 微软雅黑
    let nextReplaceName = patchCFFObject(font, "YH", SANS, weight, `${AAJP_SANS}-${weight}`)
    await patchNameObject(font, name, "YH", SANS, weight)
    // 微软雅黑UI
    nextReplaceName = patchCFFObject(font, "YH", UI, weight, nextReplaceName)
    await patchNameObject(font, name, "YH", UI, weight)
    const yhTTC = `out/${fontList["YH"]["FILENAME"]}${nameOfWeight(weight)}.ttc`
    await runProcess(["otf2otc", "-o", yhTTC, `temp/${fontList["YH"]["FILENAME"]}${nameOfWeight(weight)}.otf`, `temp/${fontList["YH"]["FILENAME"]}ui${nameOfWeight(weight)}.otf`])
    console.log(`${yhTTC} built`)
    // 微软正黑
    nextReplaceName = patchCFFObject(font, "JH", SANS, weight, nextReplaceName)
    await patchNameObject(font, name, "JH", SANS, weight)
    // 微软正黑UI
    patchCFFObject(font, "JH", UI, weight, nextReplaceName)
    await patchNameObject(font, name, "JH", UI, weight)
    const jhTTC = `out/${fontList["JH"]["FILENAME"]}${nameOfWeight(weight)}.ttc`
    await runProcess(["otf2otc", "-o", jhTTC, `temp/${fontList["JH"]["FILENAME"]}${nameOfWeight(weight)}.otf`, `temp/${fontList["JH"]["FILENAME"]}ui${nameOfWeight(weight)}.otf`])
    console.log(`${jhTTC} built`)
}

const files = await getNames("data")
console.log(`prepare to build ${files}`)
await Deno.mkdir("temp")
for (const file of files) {
    await build(file)
}
