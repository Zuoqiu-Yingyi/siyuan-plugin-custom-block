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

import CONSTANTS from "@/constants";
import { createIAL } from "@workspace/utils/siyuan/ial";
import { base64ToFile } from "@workspace/utils/misc/dataurl";
import {
    parseText,
    parseData,
} from "./parse";
import type { Client } from "@siyuan-community/siyuan-sdk";
import type { IConfig } from "@/types/config";
import type * as Ipynb from "@/types/nbformat";
import { id } from "@workspace/utils/siyuan/id";

export interface IAttachment {
    [mime: string]: string | string[];
}

export interface IAttachments {
    [filename: string]: IAttachment;
}

export class IpynbImport {
    protected ipynb!: Ipynb.Notebook; // 文件内容
    protected cells!: Ipynb.Cell[]; // 内容块
    protected language!: string; // 单元格语言
    protected metadata!: Ipynb.NotebookMetadata; // notebook 元数据
    protected nbformat!: Ipynb.Notebook["nbformat"]; // 缩进长度
    protected nbformat_minor!: Ipynb.Notebook["nbformat_minor"]; // 次要缩进长度
    protected kramdowns!: string[]; // 导入的 kramdown 字符串数组
    protected attributes!: Record<string, string>; // 导入的文档块属性

    constructor(
        public client: InstanceType<typeof Client>,
        public config: IConfig,
    ) { }

    /* 从文件导入 */
    public async loadFile(file: File): Promise<this> {
        const json = await file.text();
        return this.loadJson(json);
    }

    /* 导入 json 文本内容 */
    public loadJson(json: string): this {
        return this.loadIpynb(JSON.parse(json));
    }

    /* 导入 ipynb json 对象 */
    public loadIpynb(ipynb: Ipynb.Notebook) {
        this.ipynb = ipynb;
        return this;
    }

    /**
     * 解析
     * REF: https://nbformat.readthedocs.io/en/latest/format_description.html#top-level-structure
     */
    public async parse() {
        this.kramdowns = [];
        this.attributes = {};

        this.cells = this.ipynb.cells; // 单元格
        this.metadata = this.ipynb.metadata; // 笔记本级元数据
        this.nbformat = this.ipynb.nbformat; // 缩进长度
        this.nbformat_minor = this.ipynb.nbformat_minor; // 次要缩进长度

        this.parseMetadata(); // 解析文档元数据
        await this.parseCells(); // 解析所有单元格
        return this;
    }

    /* 获取新的块 ID */
    public get id(): string {
        return id();
    }

    /* 获取转换后的 kramdown */
    public get kramdown(): string {
        return this.kramdowns.join("\n\n");
    }

    /* 获取文档块属性 */
    public get attrs(): Record<string, string> {
        return this.attributes;
    }

    /**
     * 解析文档元数据
     * REF: https://jupyter-client.readthedocs.io/en/stable/kernels.html#kernel-specs
     */
    parseMetadata(): this {
        this.language =
            this.metadata.kernelspec?.language
            ?? this.metadata.language_info?.name
            ?? this.metadata.language_info?.nbconvert_exporter;
        this.attributes[CONSTANTS.attrs.kernel.language] = this.language;

        const kernel_name =
            this.metadata.kernelspec?.name
            ?? this.metadata.kernel_info.name;
        this.attributes[CONSTANTS.attrs.kernel.name] = kernel_name;

        const display_name =
            this.metadata.kernelspec?.display_name
            ?? this.metadata.kernelspec?.name
            ?? this.metadata.kernel_info.name;
        this.attributes[CONSTANTS.attrs.kernel.display_name] = display_name;

        this.attributes[CONSTANTS.attrs.other.prompt] = `${this.language} | ${display_name}`;

        return this;
    }

    /* 解析单元格 */
    async parseCells(): Promise<this> {
        for (let i = 0; i < this.cells.length; ++i) {
            this.kramdowns.push(await this.parseCell(this.cells[i]));
        }
        return this;
    }

    /**
     * 解析单个块
     * REF: https://nbformat.readthedocs.io/en/latest/format_description.html#cell-types
     */
    async parseCell(cell: Ipynb.Cell): Promise<string> {
        switch (cell.cell_type) {
            case "markdown":
                return await this.parseMarkdown(cell);
            case "code":
                return await this.parseCode(cell);
            case "raw":
                return await this.parseRaw(cell);
        }
    }

    /**
     * 解析源码
     */
    parseSource(source?: string | string[]): string {
        if (source) {
            return Array.isArray(source) // 源码文本
                ? source.join("") // 多行 (原文本自带换行符)
                : source; // 单行
        }
        else {
            return "";
        }
    }

    /**
     * 解析 markdown 块
     * REF: https://nbformat.readthedocs.io/en/latest/format_description.html#markdown-cells
     */
    async parseMarkdown(cell: Ipynb.Cell): Promise<string> {
        /* 标题折叠 */
        if (cell.metadata?.["jp-MarkdownHeadingCollapsed"]) {
            let index = -1; // 级别最高的标题所有序号
            let top_level = 7; // 当前级别最高的标题级别
            if (Array.isArray(cell.source)) { // 多行
                for (let i = 0; i < cell.source.length; ++i) {
                    const line = cell.source[i];
                    if (/^#{1,6}\s/.test(line)) { // 是否为标题块
                        for (let j = 0; j < line.length && j < 6; ++j) {
                            if (line.charAt(j) !== "#") {
                                if (j + 1 < top_level) {
                                    top_level = j + 1;
                                    index = i;
                                }
                                break;
                            }
                        }
                    }
                }
                if (index >= 0 && 1 <= top_level && top_level <= 6) { // 存在待折叠的标题
                    cell.source[index] = `${cell.source[index].trim()}\n${createIAL({ fold: "1" })}\n`;
                }
            }
        }
        var markdown = this.parseSource(cell.source);
        const attachments = await this.parseAttachments(cell.attachments); // 附件
        for (const [filename, filepath] of Object.entries(attachments)) {
            markdown = markdown.replace(`attachment:${filename}`, filepath);
        }

        // TODO: 解析 metadata 为块属性, 属性嵌套使用 `-` 展开
        /**幻灯片类型
         * slideshow.slide_type.slide
         * slideshow.slide_type.subslide
         * slideshow.slide_type.fragment
         * slideshow.slide_type.skip
         * slideshow.slide_type.notes
         */
        return markdown;
    }

    /**
     * 解析 code 块
     * REF: https://nbformat.readthedocs.io/en/latest/format_description.html#code-cells
     */
    async parseCode(cell: Ipynb.Cell): Promise<string> {
        const markdown = [];
        const execution_count = cell.execution_count?.toString() ?? "*"; // 当前块运行计数器
        const source_hidden = cell.metadata?.jupyter?.source_hidden; // 代码是否折叠
        const outputs_hidden = cell.metadata?.jupyter?.outputs_hidden; // 输出是否折叠
        const code_id = this.id; // 代码块 ID
        const output_id = this.id; // 输出块 ID

        const execute_input = cell.metadata.execution?.["iopub.execute_input"];
        const execute_reply = cell.metadata.execution?.["iopub.status.busy"];
        const busy = cell.metadata.execution?.["iopub.status.idle"];
        const idle = cell.metadata.execution?.["shell.execute_reply"];

        const code_attrs = {
            id: code_id,
            [CONSTANTS.attrs.code.index]: execution_count,
            [CONSTANTS.attrs.code.output]: output_id,
            [CONSTANTS.attrs.code.type.key]: CONSTANTS.attrs.code.type.value,
            fold: source_hidden ? "1" : null,

            [CONSTANTS.attrs.code.execute_input]: execute_input,
            [CONSTANTS.attrs.code.execute_reply]: execute_reply,
            [CONSTANTS.attrs.code.busy]: busy,
            [CONSTANTS.attrs.code.idle]: idle,
        }; // 代码块属性
        const output_attrs = {
            id: output_id,
            [CONSTANTS.attrs.output.index]: execution_count,
            [CONSTANTS.attrs.output.code]: code_id,
            [CONSTANTS.attrs.output.type.key]: CONSTANTS.attrs.output.type.value,
            fold: outputs_hidden ? "1" : null,
        }; // 输出块属性

        /* 代码块 */
        markdown.push(
            `\`\`\`${this.language}`,
            this.parseSource(cell.source),
            "```",
            createIAL(code_attrs),
        );
        /* 输出块 */
        markdown.push(
            `{{{row`,
            "---",
        );
        if (cell.outputs) {
            markdown.push(await this.parseOutputs(cell.outputs));
        }

        markdown.push(
            `---`,
            "}}}",
            createIAL(output_attrs),
        );
        return markdown.join("\n");
    }

    /**
     * 解析 raw 块
     * REF: https://nbformat.readthedocs.io/en/latest/format_description.html#raw-nbconvert-cells
     */
    async parseRaw(cell: Ipynb.Cell): Promise<string> {
        var mime_main, mime_sub;
        const mime = cell.metadata?.raw_mimetype ?? "/";
        [mime_main, mime_sub] = mime.split("/");
        const markdown = [];
        switch (mime_main) {
            case "text":
                switch (mime_sub) {
                    case "markdown":
                        markdown.push(
                            "{{{row",
                            this.parseSource(cell.source),
                            "}}}",
                        );
                        break;
                    case "html":
                        markdown.push(
                            "<div>",
                            this.parseSource(cell.source),
                            "</div>",
                        );
                        break;
                    case "x-python":
                        markdown.push(
                            "```python",
                            this.parseSource(cell.source),
                            "```",
                        );
                        break;
                    case "asciidoc":
                    case "latex":
                    case "restructuredtext":
                    default:
                        markdown.push(
                            `\`\`\`${mime_sub}`,
                            this.parseSource(cell.source),
                            "```",
                        );
                        break;
                }
                break;
            case "pdf":
            case "slides":
            case "script":
            case "notebook":
            case "custom":
            default:
                markdown.push(
                    `\`\`\`${mime_main}`,
                    this.parseSource(cell.source),
                    "```",
                );
                break;
        }
        if (cell.metadata?.jupyter?.source_hidden) { // 折叠内容
            markdown.push(createIAL({ fold: "1" }));
        }
        return markdown.join("\n");
    }

    /**
     * 解析附件
     * REF: https://nbformat.readthedocs.io/en/latest/format_description.html#cell-attachments
     * @returns 附件引用名(attachment:xxx.ext) -> 附件文件引用(assets/xxx.ext)
     */
    async parseAttachments(attachments: IAttachments | undefined): Promise<Map<string, string>> {
        const map = new Map<string, string>; // attachment -> assets
        if (attachments) {
            for (const [filename, attachment] of Object.entries(attachments)) {
                for (const [mine, source] of Object.entries(attachment)) {
                    const base64 = Array.isArray(source)
                        ? source[0]
                        : source;
                    const file = base64ToFile(base64, mine, filename);
                    if (file) {
                        const response = await this.client.upload({ files: [file] });
                        const filepath = response.data.succMap[filename];
                        map.set(filename, filepath);
                        break;
                    }
                }
            }
        }
        return map;
    }

    /**
     * 解析输出
     * @param outputs 输出对象列表
     * @return 最终结果
     */
    async parseOutputs(outputs: Ipynb.Output[]): Promise<string> {
        const markdowns = [];
        for (let i = 0; i < outputs.length; ++i) {
            const output = outputs[i];
            switch (output.output_type) {
                case "stream": {
                    const markdown = parseText(
                        this.parseSource(output.text),
                        this.config.jupyter.import.parser,
                    );
                    switch (output.name) {
                        case "stdout":
                            markdowns.push(markdown);
                            break;
                        case "stderr":
                            const lines = markdown.split("\n{2,}");
                            for (let j = 0; j < lines.length; ++j) {
                                markdowns.push(lines[j]);
                                markdowns.push(createIAL({ style: CONSTANTS.styles.error }));
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                }
                case "error":
                    markdowns.push("{{{row");
                    markdowns.push(parseText(output.traceback?.join("\n"), this.config.jupyter.import.parser));
                    markdowns.push("}}}");
                    markdowns.push(createIAL({ style: CONSTANTS.styles.error }));
                    markdowns.join("\n");
                    break;
                case "execute_result":
                case "display_data":
                    if (output.data) {
                        markdowns.push(await parseData(
                            this.client,
                            this.config.jupyter.import.parser,
                            output.data,
                            output.metadata,
                        ));
                    }
                    break;
            }
        }
        return markdowns.join("\n");
    }
}
