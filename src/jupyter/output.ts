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

import stripAnsi from "strip-ansi";
import { isEmptyObject } from "@workspace/utils/misc/object";
import {
    createIAL,
    createStyle,
} from "@workspace/utils/siyuan/ial";
import { encode } from "@workspace/utils/misc/base64";
import { escapeHTML } from "@workspace/utils/misc/html";
import { trimPrefix, trimSuffix } from "@workspace/utils/misc/string";

/**
 * 构建 xterm 元素
 * @param stream 流
 * @param format 格式
 * @param blockId 块 ID
 * @param save 是否保存
 */
export function xtermElement(
    stream: string,
    blockId?: string,
    save?: boolean,
): string {
    const elenent: Record<string, string> = {};
    if (blockId) elenent["data-block-id"] = blockId;
    if (save) elenent["data-save"] = "true";
    const element_attrs = Object.entries(elenent).map(([k, v]) => `${k}="${v}"`).join(" ");

    const content: Record<string, string> = {
        id: "content",
        "data-stream": encode(stream, true),
    };
    const content_attrs = Object.entries(content).map(([k, v]) => `${k}="${v}"`).join(" ");
    const content_data = escapeHTML( // 转义 HTML
        trimSuffix( // 移除末尾的换行符
            trimPrefix( // 移除开头的换行符
                stripAnsi(stream) // 移除控制台 ANSI 转义序列
                    .replaceAll(/\n+/g, "\n"), // 移除多余的换行符
                "\n",
            ),
            "\n",
        ),
    );

    return [
        "<div>",
        `<jupyter-xterm-output ${element_attrs}>`,
        `<pre ${content_attrs}>\n${content_data}\n</pre>`,
        "</jupyter-xterm-output>",
        "</div>",
    ].join("\n")
}

export class Output {
    public static readonly ZWS = "\u200B"; // 零宽空格
    public static readonly REGEXP = { // 正则表达式
        mark: /([\<\>\{\}\[\]\(\)\`\~\#\$\^\*\_\=\|\:\-\\])/g, // 匹配需转义的 Markdown 标志符号
        ANSIesc: /\x1b[^a-zA-Z]*[a-zA-Z]/g, // ANSI 转义序列
        richtext: /\x1b\\?\[((?:\d*)(?:\\?;\d+)*)m([^\x1b]*)/g, // 控制台富文本控制字符

        escaped: {
            mark: /(?:\\([\<\>\{\}\[\]\(\)\`\~\#\$\^\*\_\=\|\:\-\\]))/g, // 匹配被转义的 Markdown 标志符号
            richtext: /\x1b\\\[((?:\d*)(?:\\?;\d+)*)m([^\x1b]*)/g, // 被转义的控制台富文本控制字符
        },
    } as const;

    /* 构造函数 */
    constructor(
        protected text: string,
    ) { }

    toString() {
        return this.text;
    }

    /* 👇可链式调用的方法👇 */

    /**
     * 构建 xterm 元素
     * @param blockId 块 ID
     */
    buildXtermElement(
        blockId?: string,
    ) {
        this.text = xtermElement(
            this.text,
            blockId,
        );
        return this;
    }

    /**
     * 转义 Markdown 标志符
     */
    escapeMark() {
        this.text = this.text.replaceAll(Output.REGEXP.mark, '\\$1');
        return this;
    }

    /**
     * 解析控制字符
     * @param src 原字符串
     */
    parseControlChars(src = "") {
        const chars = [...src];
        const content = this.text.replaceAll("\r\n", "\n");
        const content_length = content.length;
        let ptr = chars.length;
        let start = src.lastIndexOf("\n") + 1;
        for (let i = 0; i < content_length; ++i) {
            const c = content[i];
            switch (c) {
                case "\b": // backspace
                    if (ptr > start) ptr--;
                    break;
                case "\r": // carriage return
                    ptr = start;
                    break;
                case "\n": // line feed
                    start = ptr + 1;
                default:
                    chars[ptr++] = c;
                    break;
            }
        }
        this.text = chars.slice(0, ptr).join("");
        return this;
    }

    /**
     * 解析控制台控制字符
     * @param escaped Markdown 标志字符是否被转义
     */
    parseCmdControlChars(escaped: boolean = true) {
        const reg = escaped
            ? Output.REGEXP.escaped.richtext
            : Output.REGEXP.richtext;
        const mark = {
            strong: false, // 加粗
            em: false, // 倾斜
            s: false, // 删除线
            u: false, // 下划线
        }; // 标志

        // REF: https://zhuanlan.zhihu.com/p/184924477
        const custom: {
            ground: "" | "color" | "background-color", // color 前景颜色, background-color: 背景颜色
            mode: number, // 第二个参数的模式 (前景或背景)
            color: string, // 颜色
        } = {
            ground: "",
            mode: 0,
            color: "",
        }; // 使用 ANSI 转义序列自定义颜色
        var style: Record<string, string> = {}; // ial 样式列表

        /* 清除样式 */
        const clearCustom = () => {
            custom.ground = "";
            custom.mode = 0;
            custom.color = "";
        }
        const clearStyle = () => {
            clearCustom();

            mark.strong = false; // 加粗
            mark.em = false; // 倾斜
            mark.s = false; // 删除线
            mark.u = false; // 下划线

            style = {};
        };

        this.text = this.text
            .replaceAll(/\x1bc/g, '') // 不解析清屏命令
            .replaceAll(/\x1b\\?\[\\?\?\d+[lh]/g, '') // 不解析光标显示命令
            .replaceAll(/\x1b\\?\[\d*(\\?;\d+)*[a-ln-zA-Z]/g, '') // 不解析光标位置命令
            .replaceAll(
                reg,
                (match, p1, p2, offset, string) => {
                    // REF: https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/replaceAll

                    let ial = ""; // 行级元素的 IAL 字符串

                    const params = p1
                        .replaceAll("\\;", ";") // 替换转义的分号
                        .split(";"); // 根据分号分割所有参数
                    for (const param of params) {
                        const num = parseInt(param) || 0; // 若参数无效则清除样式
                        if (custom.mode) { // 已自定义颜色
                            /* 颜色值必须是有效的 */
                            if (num >= 0 && num <= 255) {
                                switch (custom.mode) {
                                    /**
                                     * 24 位色
                                     * 前景: \e[38;2;<R>;<G>;<B>m
                                     * 背景: \e[48;2;<R>;<G>;<B>m
                                     */
                                    case 2:
                                        if (!custom.color.startsWith("#")) custom.color = "#";
                                        switch (custom.color.length) {
                                            case 1:
                                            case 3:
                                                custom.color += num.toString(16).toUpperCase().padStart(2, "0");
                                                continue;
                                            case 5:
                                                custom.color += num.toString(16).toUpperCase().padStart(2, "0");
                                                if (custom.ground) style[custom.ground] = custom.color;
                                                break;
                                            default:
                                                break;
                                        }
                                        break;

                                    /**
                                     * 8 位色
                                     * 前景: \e[38;5;<n>m
                                     * 背景: \e[48;5;<n>m
                                     */
                                    case 5:
                                        custom.color = `var(--custom-jupyter-256-color-${num.toString().padStart(3, "0")})`;
                                        if (custom.ground) style[custom.ground] = custom.color;
                                        break;
                                    default:
                                        break;
                                }
                            }
                            clearCustom();
                        }
                        else { // 暂未自定义颜色
                            switch (num) {
                                case 0: // 清除样式
                                    clearStyle();
                                    continue;
                                case 1: // 加粗
                                    mark.strong = true;
                                    break;
                                case 2: // 字体变暗
                                    /* ANSI 转义序列自定义颜色: 8 位色 */
                                    if (custom.ground) {
                                        custom.mode = 2;
                                        continue;
                                    }
                                    style.opacity = "var(--custom-jupyter-opacity-dull)";
                                    break;
                                case 3: // 斜体
                                    mark.em = true;
                                    break;
                                case 4: // 下划线
                                    mark.u = true;
                                    break;
                                case 5: // 呼吸闪烁
                                    /* ANSI 转义序列自定义颜色 24 位色 */
                                    if (custom.ground) {
                                        custom.mode = 5;
                                        continue;
                                    }
                                    style.animation = "var(--custom-jupyter-animation-breath)";
                                    break;
                                case 6: // 快速闪烁
                                    style.animation = "var(--custom-jupyter-animation-blink)";
                                    break;
                                case 7: // 反色
                                    style.filter = "var(--custom-jupyter-filter-invert)";
                                    break;
                                case 8: // 透明
                                    style.opacity = "var(--custom-jupyter-opacity-transparent)";
                                    break;
                                case 9: // 删除线
                                    mark.s = true
                                    break;
                                default: { // num >= 10
                                    let k: "color" | "background-color";

                                    /* 前景/背景 */
                                    const pre = (num / 10) | 0; // 前几位数
                                    const suf = num % 10; // 最后一位数

                                    switch (pre) {
                                        case 1: // 设置字体 (不支持)
                                            continue;
                                        case 2: // 关闭样式
                                            switch (suf) {
                                                case 0: // 尖角体 (不支持)
                                                    break;
                                                case 1: // 取消加粗
                                                    mark.strong = false;
                                                    break;
                                                case 2: // 取消变暗
                                                    delete style.opacity;
                                                    break;
                                                case 3: // 取消斜体
                                                    mark.em = false;
                                                    break;
                                                case 4: // 取消下划线
                                                    mark.u = false;
                                                    break;
                                                case 5: // 取消呼吸闪烁
                                                    delete style.animation;
                                                    break;
                                                case 6: // 取消快速闪烁
                                                    delete style.animation;
                                                    break;
                                                case 7: // 取消反色
                                                    delete style.filter;
                                                    break;
                                                case 8: // 取消透明
                                                    delete style.opacity;
                                                    break;
                                                case 9: // 取消删除线
                                                    mark.s = false
                                                    break;
                                            }
                                            continue;
                                        case 3:
                                        case 9:
                                            /* 设置前景色 */
                                            k = "color";
                                            break;
                                        case 4:
                                        case 10:
                                            /* 设置背景色 */
                                            k = "background-color";
                                            break;
                                        case 5:
                                        case 6:
                                        case 7:
                                        case 8:
                                        default: // (不支持)
                                            continue;
                                    }

                                    /* 颜色 */
                                    /**
                                     * windows:
                                     * cmd: `color /?`
                                     * 0 = 黑色       8 = 灰色
                                     * 1 = 蓝色       9 = 淡蓝色
                                     * 2 = 绿色       A = 淡绿色
                                     * 3 = 浅绿色     B = 淡浅绿色
                                     * 4 = 红色       C = 淡红色
                                     * 5 = 紫色       D = 淡紫色
                                     * 6 = 黄色       E = 淡黄色
                                     * 7 = 白色       F = 亮白色
                                     */
                                    switch (pre) {
                                        case 3:
                                        case 4:
                                            /* 正常颜色 */
                                            switch (suf) {
                                                case 0: // 黑色
                                                    style[k] = "var(--custom-jupyter-ansi-color-black)";
                                                    break;
                                                case 1: // 红色
                                                    style[k] = "var(--custom-jupyter-ansi-color-red)";
                                                    break;
                                                case 2: // 绿色
                                                    style[k] = "var(--custom-jupyter-ansi-color-green)";
                                                    break;
                                                case 3: // 黄色
                                                    style[k] = "var(--custom-jupyter-ansi-color-yellow)";
                                                    break;
                                                case 4: // 蓝色
                                                    style[k] = "var(--custom-jupyter-ansi-color-blue)";
                                                    break;
                                                case 5: // 紫色
                                                    style[k] = "var(--custom-jupyter-ansi-color-magenta)";
                                                    break;
                                                case 6: // 青色
                                                    style[k] = "var(--custom-jupyter-ansi-color-cyan)";
                                                    break;
                                                case 7: // 白色
                                                    style[k] = "var(--custom-jupyter-ansi-color-white)";
                                                    break;
                                                case 8: // 自定义颜色
                                                    custom.ground = k;
                                                    continue;
                                                case 9: // 默认
                                                // REF [node.js - What is this \u001b[9... syntax of choosing what color text appears on console, and how can I add more colors? - Stack Overflow](https://stackoverflow.com/questions/23975735/what-is-this-u001b9-syntax-of-choosing-what-color-text-appears-on-console)
                                                default:
                                                    delete style[k];
                                                    break;
                                            } // switch (suf)
                                            continue;
                                        case 9:
                                        case 10:
                                            /* 鲜明颜色 */
                                            switch (suf) {
                                                case 0: // 黑色
                                                    style[k] = "var(--custom-jupyter-ansi-color-black-intense)";
                                                    break;
                                                case 1: // 红色
                                                    style[k] = "var(--custom-jupyter-ansi-color-red-intense)";
                                                    break;
                                                case 2: // 绿色
                                                    style[k] = "var(--custom-jupyter-ansi-color-green-intense)";
                                                    break;
                                                case 3: // 黄色
                                                    style[k] = "var(--custom-jupyter-ansi-color-yellow-intense)";
                                                    break;
                                                case 4: // 蓝色
                                                    style[k] = "var(--custom-jupyter-ansi-color-blue-intense)";
                                                    break;
                                                case 5: // 紫色
                                                    style[k] = "var(--custom-jupyter-ansi-color-magenta-intense)";
                                                    break;
                                                case 6: // 青色
                                                    style[k] = "var(--custom-jupyter-ansi-color-cyan-intense)";
                                                    break;
                                                case 7: // 白色
                                                    style[k] = "var(--custom-jupyter-ansi-color-white-intense)";
                                                    break;
                                                case 8: // 自定义颜色 (8 位色 / 24 位色)
                                                    custom.ground = k;
                                                    continue;
                                                case 9: // 默认颜色
                                                // REF [node.js - What is this \u001b[9... syntax of choosing what color text appears on console, and how can I add more colors? - Stack Overflow](https://stackoverflow.com/questions/23975735/what-is-this-u001b9-syntax-of-choosing-what-color-text-appears-on-console)
                                                default:
                                                    delete style[k];
                                                    break;
                                            } // switch (suf)
                                            continue;
                                        default:
                                            continue;
                                    } // switch (pre)
                                    continue;
                                } // default
                            } // switch (param)
                        }
                    }

                    /* 生成前缀/后缀 */
                    const types: string[] = [];
                    if (mark.strong) types.push("strong");
                    if (mark.em) types.push("em");
                    if (mark.s) types.push("s");
                    if (mark.u) types.push("u");
                    if (!isEmptyObject(style)) types.push("text");
                    const pre_mark = types.length > 0
                        ? `<span data-type="${types.join(" ")}">`
                        : ""; // 前缀标志
                    const suf_mark = types.length > 0
                        ? `</span>`
                        : ""; // 后缀标志

                    // const pre_mark =
                    //     `${mark.strong || !isEmptyObject(style) ? "**" : ""
                    //     }${mark.em ? "*" : ""
                    //     }${mark.s ? "~~" : ""
                    //     }${mark.u ? "<u>" : ""
                    //     }`; // 前缀标志
                    // const suf_mark =
                    //     `${mark.u ? "</u>" : ""
                    //     }${mark.s ? "~~" : ""
                    //     }${mark.em ? "*" : ""
                    //     }${mark.strong || !isEmptyObject(style) ? "**" : ""
                    //     }`; // 后缀标志

                    /* 生成行级 IAL */
                    if (!isEmptyObject(style)) {
                        ial = createIAL({ style: createStyle(style) });
                    }

                    return p2
                        .replaceAll("\r\n", "\n") // 替换换行符
                        .replaceAll(/\n{2,}/g, "\n\n") // 替换多余的换行符
                        .split("\n\n") // 按块分割
                        .map((block: string) => Output.ZWS + block // 段首添加零宽空格
                            .split("\n") // 按照换行分隔
                            .map(line => {
                                if (line.length > 0) {
                                    /* markdown 标志内测不能存在空白字符 */
                                    // if (mark.u && escaped) // 移除 <u></u> 标签内的转义符号
                                    if (types.length > 0 && escaped) // 移除 <span></span> 标签内的转义符号
                                        line = line.replaceAll(Output.REGEXP.escaped.mark, "\$1");

                                    /* 标志内测添加零宽空格 */
                                    // return `${pre_mark}${Output.ZWS}${line}${Output.ZWS}${suf_mark}${ial}`;
                                    return `${pre_mark}${line}${suf_mark}${ial}`;
                                }
                                else return "";
                            })
                            .join("\n")
                        ) // 添加标志和行级 IAL
                        .join("\n\n");
                }
            );
        return this;
    }

    /* 移除控制台 ANSI 转义序列(保留 \b, \r) */
    removeCmdControlChars() {
        this.text = this.text.replaceAll(Output.REGEXP.ANSIesc, "");
        return this;
    }

    /**
     * 移除控制台 ANSI 转义序列
     * @see {@link https://www.npmjs.com/package/strip-ansi}
     */
    stripAnsi() {
        this.text = stripAnsi(this.text);
        return this;
    }
}
