/**
 * Copyright (C) 2023 Zuoqiu Yingyi
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { PriorityQueue } from "@workspace/utils/structure/priority-queue";

import { base64ToFile } from "@workspace/utils/misc/dataurl";
import { isString } from "@workspace/utils/misc/object";
import { createIAL, createStyle } from "@workspace/utils/siyuan/ial";

import { Output } from "./output";
import type { IJupyterImportParams } from "@/types/config";
import type Plugin from "@/index";
import type { Client } from "@siyuan-community/siyuan-sdk";

export interface IData {
    [key: string]: string | string[];
}

/**
 * 解析文本
 * @param text 文本
 * @param params 解析选项
 * @returns 解析后的文本
 */
export function parseText(
    text: string = "",
    params: IJupyterImportParams,
): string {
    const output = new Output(text);
    if (params.escaped) output.escapeMark();
    if (params.cntrl) output.parseCmdControlChars(params.escaped);
    else output.removeCmdControlChars();
    return output.toString();
}

/**
 * 解析数据
 * @param plugin 插件对象
 * @param data 数据
 * @param metadata 元数据
 * @param params 解析选项
 * @returns 解析后的文本
 */
export async function parseData(
    client: InstanceType<typeof Client>,
    data: IData,
    metadata: Record<string, string>,
    params: IJupyterImportParams,
): Promise<string> {
    let filedata: string;
    const markdowns = new PriorityQueue<string>();
    for (const [mime, datum] of Object.entries(data)) {
        if (Array.isArray(datum) && datum.length === 0) continue;

        // REF: https://www.iana.org/assignments/media-types/media-types.xhtml
        const types = mime.split(";")[0];
        const main = types.split("/")[0];
        const sub = types.split("/")[1];
        const ext = sub.split("+")[0];
        const serialized = sub.split("+")[1];

        const value = Array.isArray(datum)
            ? datum.join("\n")
            : datum;

        switch (main) {
            case "text":
                const text = Array.isArray(value)
                    ? value.join("\n\n")
                    : value;
                switch (sub) {
                    case "plain":
                        markdowns.enqueue(parseText(text, params), 0);
                        break;
                    case "html":
                        markdowns.enqueue(`<div>${text}</div>`, 1);
                        break;
                    case "markdown":
                        markdowns.enqueue(text, 1);
                        break;
                    default:
                        markdowns.enqueue(`\`\`\`${ext}\n${text}\n\`\`\``, 2);
                        break;
                }
                break;
            case "image": {
                switch (sub) {
                    case "svg+xml":
                        // filedata = Buffer.from(value).toString("base64");
                        filedata = btoa(value);
                        break;
                    default:
                        filedata = value.split("\n")[0];
                        break;
                }
                const text = data["text/plain"];
                const title = Array.isArray(text)
                    ? text.join(" ")
                    : text;

                const filename = `jupyter-output.${ext}`;
                const file = base64ToFile(filedata, mime, filename);
                if (file) {
                    const response = await client.upload({ files: [file] });
                    const filepath = response.data.succMap[filename];
                    const style = "needs_background" in metadata
                        ? createIAL({
                            style: createStyle({
                                background: metadata.needs_background === "light"
                                    ? "white"
                                    : "black"
                            })
                        })
                        : "";
                    if (filepath) markdowns.enqueue(`![${filename}](${filepath}${isString(title) ? ` "${title.replaceAll("\"", "&quot;")}"` : ""})${style}`, 3);
                }
                break;
            }
            case "audio": {
                switch (sub) {
                    default:
                        filedata = value.split("\n")[0];
                        break;
                }
                const filename = `jupyter-output.${ext}`;
                const file = base64ToFile(filedata, mime, filename);
                if (file) {
                    const response = await client.upload({ files: [file] });
                    const filepath = response.data.succMap[filename];
                    if (filepath) markdowns.enqueue(`<audio controls="controls" src="${filepath}" data-src="${filepath}"/>`, 3);
                }
                break;
            }
            case "video": {
                switch (sub) {
                    default:
                        filedata = value.split("\n")[0];
                        break;
                }
                const filename = `jupyter-output.${ext}`;
                const file = base64ToFile(filedata, mime, filename);
                if (file) {
                    const response = await client.upload({ files: [file] });
                    const filepath = response.data.succMap[filename];
                    if (filepath) markdowns.enqueue(`<video controls="controls" src="${filepath}" data-src="${filepath}"/>`, 3);
                }
            }
                break;
            case "application":
                switch (sub) {
                    case "json":
                        markdowns.enqueue(`\`\`\`json\n${JSON.stringify(value, undefined, 4)}\n\`\`\``, 4);
                        break;
                    default:
                        markdowns.enqueue(parseText(`[${mime}]`, params), 4);
                        break;
                }
                break;
            default:
                markdowns.enqueue(parseText(`[${mime}]`, params), 4);
                break;
        }
    }
    return markdowns.items.map((item) => item.value).join("\n");
}
