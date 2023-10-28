import {listDir, runProcess, toWinFontsToolPath} from "./utils.ts";

const sansTg = ["msyh", "msjh", "simhei", "msgothic", "meiryo", "yugoth", "malgun"]

const serifTg = ["simsun", "msmincho", "mingliu", "yumin"]

const cwd = Deno.cwd()
const sansFonts = await listDir("sans")
console.log("sans fonts: ", sansFonts)

let sansFunc = sansFonts.flatMap(font => sansTg.map(tg =>
    () => runProcess(["python", toWinFontsToolPath, "-i", font, "-tg", tg, "-d", `${cwd}/out`, "-r"])
));

const serifFonts = await listDir("serif")
console.log("serif fonts: ", serifFonts)
let serifFunc = serifFonts.flatMap(font => serifTg.map(tg =>
    () => runProcess(["python", toWinFontsToolPath, "-i", font, "-tg", tg, "-d", `${cwd}/out`, "-r"])
));

let functions = sansFunc.concat(serifFunc);
while (functions.length) {
    // 2 at a time
    await Promise.all(functions.splice(0, 2).map(f => f()))
}
