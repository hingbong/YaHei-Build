import {buildOtf, download, getFontObject, needChangeNames, writeJson} from "./utils.ts";

const fontInfo = {
    name: "Droid Sans Mono",
    "FILENAME": "DroidSansMono"
}

const d1 = download("https://github.com/mplusfonts/mplusfonts.github.com/raw/master/download/Fixed_ZERO_and_UNDERSCORE/TTF/MPLUSCodeLatin50-Regular.ttf", "temp/MPLUSCodeLatin50-Regular.ttf")
const d2 = download("https://github.com/mplusfonts/mplusfonts.github.com/raw/master/download/Fixed_ZERO_and_UNDERSCORE/TTF/MPLUSCodeLatin50-Bold.ttf", "temp/MPLUSCodeLatin50-Bold.ttf")
await d1
await d2

const patchNameObject = async (fontObject: any, nameObject: any[], weight: string) => {
    nameObject.filter(element => needChangeNames.includes(element["nameID"]))
        .forEach(element => {
            switch (element["nameID"]) {
                case 1:
                case 16:
                    element["nameString"] = fontInfo.name
                    break
                case 3:
                case 4:
                    element["nameString"] = fontInfo.name + (weight === "Regular" ? "" : ` ${weight}`)
                    break
                case 6:
                    element["nameString"] = fontInfo.name.replaceAll(" ", "") + (weight === "Regular" ? "" : weight)
                    break
            }
        })

    fontObject["name"] = nameObject
    writeJson(`temp/${fontInfo["FILENAME"]}-${weight}.json`, fontObject)
    const otfFileName = `temp/${fontInfo["FILENAME"]}-${weight}.ttf`
    await buildOtf(otfFileName, `temp/${fontInfo["FILENAME"]}-${weight}.json`)
    console.log(`${otfFileName} built`)
}

{
    const font = await getFontObject(`temp/MPLUSCodeLatin50-Regular.ttf`)
    console.log(`get temp/MPLUSCodeLatin50-Regular.ttf`)
    const nameObject: any[] = font["name"]
    const weight = font["CFF_"]?.weight ?? nameObject.find(element => element["nameID"] === 2)["nameString"]
    console.log(`weight: ${weight}`)
    await patchNameObject(font, nameObject, weight)
}

{
    const font = await getFontObject(`temp/MPLUSCodeLatin50-Bold.ttf`)
    console.log(`get temp/MPLUSCodeLatin50-Bold.ttf`)
    const nameObject: any[] = font["name"]
    const weight = font["CFF_"]?.weight ?? nameObject.find(element => element["nameID"] === 2)["nameString"]
    console.log(`weight: ${weight}`)
    await patchNameObject(font, nameObject, weight)
}

Deno.copyFileSync("temp/DroidSansMono-Regular.ttf", "out/DroidSansMono-Regular.ttf")
Deno.copyFileSync("temp/DroidSansMono-Bold.ttf", "out/DroidSansMono-Bold.ttf")
