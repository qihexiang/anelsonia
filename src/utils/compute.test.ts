import { readFile } from "fs/promises";
import { computeStream, computeStreamLazy, fillNullable } from "./compute";

test("calc by stream: 2 ^ 2 + 4 = 8", () => {
    expect(computeStream(2).map(a => a ** 2).map(a => a + 4).value).toBe(8)
    expect(computeStreamLazy(() => 2).map(a => a ** 2).map(a => a + 4).value).toBe(8)
})

test("calc with mapNN method", () => {
    expect(computeStream(2).map(a => a ** 2).map(() => null).mapNN(a => a + 4).value).toBeNull()
    expect(computeStreamLazy(() => 2).map(a => a ** 2).map(() => null).mapNN(a => a + 4).value).toBeNull()
})

test("calc with Promise result", async () => {
    const readFileSafely = async (target: string) => {
        try {
            return readFile(target)
        } catch(err) {
            return null
        }
    }
    const originRes = await readFileSafely("./package.json").then(buf => buf !== null ? `# test\n${buf.toString()}` : "Failed to read")
    const streamRes = await computeStream(readFileSafely("./package.json")).mapNN(buf => buf.toString()).mapNN(text => `# test\n${text}`).map(fillNullable("Failed to read")).value
    const lazyStreamRes = await computeStreamLazy(() => readFileSafely("./package.json")).mapNN(buf => buf.toString()).mapNN(text => `# test\n${text}`).map(fillNullable("Failed to read")).value
    expect(streamRes).toBe(originRes)
    expect(lazyStreamRes).toBe(originRes)
})