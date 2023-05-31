import {listDir, runProcess, toWinFontsToolPath} from "./utils.ts";

const cwd = Deno.cwd()
const sansFonts = await listDir("sans")
console.log("sans fonts: ", sansFonts)

const sansTg = ["msyh", "msjh", "simhei", "msgothic", "meiryo"]

const serifTg = ["simsun", "msmincho", "mingliu"]

for (const font: string of sansFonts) {
    for (const tg of sansTg) {
        console.log(`to build ${font} for ${tg}`)
        await runProcess(["python", toWinFontsToolPath, "-i", font, "-tg", tg, "-d", `${cwd}/out`, "-r"])
    }
}
const serifFonts = await listDir("serif")
console.log("serif fonts: ", serifFonts)
for (const font: string of serifFonts) {
    for (const tg of serifTg) {
        console.log(`to build ${font} for ${tg}`)
        await runProcess(["python", toWinFontsToolPath, "-i", font, "-tg", tg, "-d", `${cwd}/out`, "-r"])
    }
}
