const UI = "UI"
const SANS = "SANS"

import {
    runProcess,
    listDir,
    buildOtf,
    getFontObject,
    writeJson,
    needChangeNames,
    writeToGithubEnv
} from "./utils.ts"

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
    },
    "JH": {
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
    },
    "MEIRYO": {
        UI: {
            "EN": "Meiryo UI", "CN": "Meiryo UI"
        },
        SANS: {
            "EN": "Meiryo", "CN": "メイリオ"
        },
        "FILENAME": "meiryo",
        "meta": {
            "version": 1,
            "flags": 0,
            "entries": [
                {
                    "tag": "dlng",
                    "string": "Hani, Hira, Hrkt, Jpan, Kana"
                },
                {
                    "tag": "slng",
                    "string": "Cyrl, Grek, Hani, Hira, Hrkt, Jpan, Kana, Latn"
                }
            ]
        }
    },
    "YuGothic" :{ UI: {
            "EN": "Yu Gothic UI", "CN": "Yu Gothic UI"
        },
        SANS: {
            "EN": "Yu Gothic", "CN": "游ゴシック"
        },
        "FILENAME": "YuGoth",
        "meta": {
            "version": 1,
            "flags": 0,
            "entries": [
                {
                    "tag": "dlng",
                    "string": "Jpan, Hrkt, Hira, Kana"
                },
                {
                    "tag": "slng",
                    "string": "Jpan, Hrkt, Hira, Kana, Latn, Grek, Cyrl"
                }
            ]
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
const getNameString = (nameObject, languageID) => {
    if (englishLangs.includes(languageID)) {
        return nameObject["EN"]
    } else {
        return nameObject["CN"]
    }
}

const nameOfWeight = (weight) => {
    let result = ""
    if (weight.includes("Bold")) result += "bd"
    if (weight.includes("Xlight")) result += "xl"
    if (weight.includes("Extralight")) result += "xl"
    if (weight.includes("Heavy")) result += "hv"
    if (weight.includes("Light")) result += "l"
    if (weight.includes("Medium")) result += "md"
    if (weight.includes("Semilight")) result += "sl"
    if (weight.includes("Italic")) result += "i"
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
                    element["nameString"] = getNameString(fontList[fontName][SansOrUi], element["languageID"]) + ((weight === "Regular" || weight === "Normal") ? "" : ` ${weight}`)
                    break
                case 6:
                    element["nameString"] = getNameString(fontList[fontName][SansOrUi], element["languageID"]).replaceAll(" ", "") + ((weight === "Regular" || weight === "Normal") ? "" : weight)
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
    const otfFileName = `temp/${fontList[fontName]["FILENAME"]}${fontNameSuffix}${nameOfWeight(weight)}.ttf`
    await buildOtf(otfFileName, `temp/${fontList[fontName]["FILENAME"]}${fontNameSuffix}${nameOfWeight(weight)}.json`)
    console.log(`${otfFileName} built`)
}

const patchCFFObject = (fontObject, fontName, SansOrUi, weight, needToReplaceName) => {
    const CFFObject = fontObject["CFF_"]
    if (CFFObject != undefined) throw new Error("do not support postscript for now")
    return;
    const enName = fontList[fontName][SansOrUi]["EN"]
    const enNameCompat = enName.replaceAll(" ", "")
    const enNameCompatWithWeight = (weight === "Regular" || weight === "Normal") ? enNameCompat : (enNameCompat + weight)
    CFFObject["fontName"] = enNameCompatWithWeight
    CFFObject["fullName"] = (weight === "Regular" || weight === "Normal") ? enName : (enName + " " + weight)
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
// Regular/Normal不在名称上标识
const build = async (sansFontFile, uiFontFile) => {
    const sansFont = await getFontObject(sansFontFile)
    console.log(`${sansFontFile} object read finished`)
    const uiFont = await getFontObject(uiFontFile)
    console.log(`${uiFontFile} object read finished`)
    const sansName = sansFont["name"]
    const uiName = uiFont["name"]
    // 字重
    const sansWeight = sansFont["CFF_"]?.weight ?? sansName.find(element => element["nameID"] === 17)?.nameString ??
        sansName.find(element => element["nameID"] === 2).nameString
    const uiWeight = uiFont["CFF_"]?.weight ?? uiName.find(element => element["nameID"] === 17)?.nameString ??
        uiName.find(element => element["nameID"] === 2).nameString
    console.log(`sansWeight: ${sansWeight}, uiWeight: ${uiWeight}`)
    if (sansWeight !== uiWeight) throw new Error("sansWeight !== uiWeight")
    // 微软雅黑
    let nextSansReplaceName = patchCFFObject(sansFont, "YH", SANS, sansWeight, "")
    await patchNameObject(sansFont, sansName, "YH", SANS, sansWeight)
    // 微软雅黑UI
    let nextUiReplaceName = patchCFFObject(uiFont, "YH", UI, uiWeight, "")
    await patchNameObject(uiFont, uiName, "YH", UI, uiWeight)
    const yhTTC = `out/${fontList["YH"]["FILENAME"]}${nameOfWeight(sansWeight)}.ttc`
    await runProcess(["otf2otc", "-o", yhTTC, `temp/${fontList["YH"]["FILENAME"]}${nameOfWeight(sansWeight)}.ttf`, `temp/${fontList["YH"]["FILENAME"]}ui${nameOfWeight(uiWeight)}.ttf`])
    console.log(`${yhTTC} built`)
    // 微软正黑
    nextSansReplaceName = patchCFFObject(sansFont, "JH", SANS, sansWeight, nextSansReplaceName)
    await patchNameObject(sansFont, sansName, "JH", SANS, sansWeight)
    // 微软正黑UI
    nextUiReplaceName = patchCFFObject(sansFont, "JH", UI, sansWeight, nextUiReplaceName)
    await patchNameObject(uiFont, uiName, "JH", UI, uiWeight)
    const jhTTC = `out/${fontList["JH"]["FILENAME"]}${nameOfWeight(sansWeight)}.ttc`
    await runProcess(["otf2otc", "-o", jhTTC, `temp/${fontList["JH"]["FILENAME"]}${nameOfWeight(sansWeight)}.ttf`, `temp/${fontList["JH"]["FILENAME"]}ui${nameOfWeight(uiWeight)}.ttf`])
    console.log(`${jhTTC} built`)

    // Meiryo
    nextSansReplaceName = patchCFFObject(sansFont, "MEIRYO", SANS, sansWeight, nextSansReplaceName)
    await patchNameObject(sansFont, sansName, "MEIRYO", SANS, sansWeight)
    // MeiryoUI
    nextUiReplaceName = patchCFFObject(uiFont, "MEIRYO", UI, uiWeight, nextUiReplaceName)
    await patchNameObject(uiFont, uiName, "MEIRYO", UI, uiWeight)
    const mrTTC = `out/${fontList["MEIRYO"]["FILENAME"]}${nameOfWeight(sansWeight)}.ttc`
    await runProcess(["otf2otc", "-o", mrTTC, `temp/${fontList["MEIRYO"]["FILENAME"]}${nameOfWeight(sansWeight)}.ttf`, `temp/${fontList["MEIRYO"]["FILENAME"]}ui${nameOfWeight(uiWeight)}.ttf`])
    console.log(`${mrTTC} built`)

    // YuGothic
    nextSansReplaceName = patchCFFObject(sansFont, "YuGothic", SANS, sansWeight, nextSansReplaceName)
    await patchNameObject(sansFont, sansName, "YuGothic", SANS, sansWeight)
    // YuGothicUI
    nextUiReplaceName = patchCFFObject(uiFont, "YuGothic", UI, uiWeight, nextUiReplaceName)
    await patchNameObject(uiFont, uiName, "YuGothic", UI, uiWeight)
    const yuTTC = `out/${fontList["YuGothic"]["FILENAME"]}${nameOfWeight(sansWeight)}.ttc`
    await runProcess(["otf2otc", "-o", yuTTC, `temp/${fontList["YuGothic"]["FILENAME"]}${nameOfWeight(sansWeight)}.ttf`, `temp/${fontList["YuGothic"]["FILENAME"]}ui${nameOfWeight(uiWeight)}.ttf`])
    console.log(`${mrTTC} built`)
}

const files = (await listDir("data")).sort()
console.log(`prepare to build ${files}`)
// Normal is same weight with Regular
for (const file of files.filter(file => file.endsWith(".ttf") && !file.includes("HW") && !file.includes("Normal"))) {
    await build(file, file)
    if (file.includes("Regular")) {
        const regularPath = [{key: "SANS_REGULAR_FONT_PATH", value: file}]
        await writeToGithubEnv(regularPath)
    }
}
