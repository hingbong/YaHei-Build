import {listDir, runProcess, toWinFontsToolPath} from "./utils.ts";

const cwd = Deno.cwd()
const sansFonts = await listDir("sans")
console.log("sans fonts: ", sansFonts)
for (const font: string of sansFonts ) {
    console.log(`to build ${font}`)
    await runProcess(["python", toWinFontsToolPath, "-i", font, "-tg", "allsans", "-d", `${cwd}/out`, "-r"])
}
const serifFonts = await listDir("serif")
console.log("serif fonts: ", serifFonts)
for (const font: string of serifFonts) {
    console.log(`to build ${font}`)
    await runProcess(["python", toWinFontsToolPath, "-i", font, "-tg", "allserif", "-d", `${cwd}/out`, "-r"])
}
