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

export async function listDir(currentPath: string): Promise<string[]> {

    const names: string[] = []

    for await (const dirEntry of Deno.readDir(currentPath)) {

        const entryPath = `${currentPath}/${dirEntry.name}`
        if (dirEntry.isFile) {
            names.push(entryPath)
        }
    }
    return names
}

export const otfccdump = "bin/otfccdump"
export const otfccbuild = "bin/otfccbuild"
export const AAJP_SANS = "AdvocateAncientJPSans"
export const AAJP_Serif = "AdvocateAncientJPSerif"

export async function buildOtf(outputFileName: string, jsonFile: string): Promise<void> {
    await runProcess([otfccbuild, "--keep-modified-time", "--keep-average-char-width", "-O3", "-q", "-o", outputFileName, jsonFile])
}

export const getFontObject = async (filePath: string) => {
    await runProcess([otfccdump, "--no-bom", "-o", "temp/temp.json", filePath])
    return JSON.parse(Deno.readTextFileSync("temp/temp.json"))
}

export const needChangeNames = [1, 3, 4, 6, 16]

export function writeJson(filePath: string, o: any) {
    Deno.writeTextFileSync(filePath, JSON.stringify(o))
}

import {readerFromStreamReader, copy} from "https://deno.land/std/streams/conversion.ts";

export async function download(url: string, destPath: string): Promise<void> {
    const res = await fetch(url);
    if (res.status !== 200) {
        throw new Error(`response status was ${res.status}, this is not handled.`);
    }

    const file = await Deno.open(destPath, {create: true, write: true, read: true})

    if (res?.body) {
        const reader = readerFromStreamReader(res.body.getReader());
        await copy(reader, file);
    }
    file.close();
}

type Env = {
    key: string,
    value: string
}

export async function writeToGithubEnv(env: Env[]): Promise<void> {
    const GITHUB_ENV_PATH = Deno.env.get("GITHUB_ENV") ?? ""
    if (GITHUB_ENV_PATH === "") throw new Error("GITHUB_ENV is empty")
    const file = await Deno.open(GITHUB_ENV_PATH, {create: true, write: true, read: true, append: true})
    const encoder = new TextEncoder()
    for (const e of env) {
        await file.write(encoder.encode("\n"))
        await file.write(encoder.encode(`${e.key}=${e.value}`))
    }
    await file.write(encoder.encode("\n"))
    file.close()
}


export interface Author {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
}

export interface Uploader {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
}

export interface Asset {
    url: string;
    id: number;
    node_id: string;
    name: string;
    label?: any;
    uploader: Uploader;
    content_type: string;
    state: string;
    size: number;
    download_count: number;
    created_at: Date;
    updated_at: Date;
    browser_download_url: string;
}

export interface Reactions {
    url: string;
    total_count: number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
}

export interface GithubRelease {
    url: string;
    assets_url: string;
    upload_url: string;
    html_url: string;
    id: number;
    author: Author;
    node_id: string;
    tag_name: string;
    target_commitish: string;
    name: string;
    draft: boolean;
    prerelease: boolean;
    created_at: Date;
    published_at: string;
    assets: Asset[];
    tarball_url: string;
    zipball_url: string;
    body: string;
    reactions: Reactions;
}
