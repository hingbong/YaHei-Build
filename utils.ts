export async function runProcess(command: string[], log: boolean = true): Promise<void> {
    const p = Deno.run({
        cmd: command,
        stdout: 'piped',
        stderr: 'piped'
    });
    const {code} = await p.status()
    const rawOutput = await p.output()
    const rawError = await p.stderrOutput()
    if (log) {
        console.log(`subprocess output:\n${new TextDecoder().decode(rawOutput)}`)
    }
    if (code === 0) {
        return
    } else {
        throw new Error(new TextDecoder().decode(rawError))
    }
}

export async function getNames(currentPath: string): Promise<string[]> {

    const names: string[] = []

    for await (const dirEntry of Deno.readDir(currentPath)) {

        const entryPath = `${currentPath}/${dirEntry.name}`
        if (dirEntry.isFile) {
            names.push(entryPath)
        }
    }
    return names
}

export const otfccdump = "SourceHanToClassic/main/otfcc/otfccdump2"
export const otfccbuild = "SourceHanToClassic/main/otfcc/otfccbuild2"
export const AAJP_SANS = "AdvocateAncientJPSans"
export const AAJP_Serif ="AdvocateAncientJPSerif"

export const buildOtf: (string, string) => Promise<void> = async (outputFileName, jsonFile) => {
    await runProcess([otfccbuild, "--keep-modified-time", "--keep-average-char-width", "-O3", "-q", "-o", outputFileName, jsonFile])
}

export const getFontObject = async (filePath: string) => {
    await runProcess([otfccdump, "--no-bom", "-o", "temp/temp.json", filePath])
    return JSON.parse(Deno.readTextFileSync("temp/temp.json"))
}

export function writeJson(filePath: string, o: any) {
    Deno.writeTextFileSync(filePath, JSON.stringify(o))
}
