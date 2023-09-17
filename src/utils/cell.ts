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

import { getActiveBlocks, isSiyuanBlock } from "@workspace/utils/siyuan/dom";
import CONSTANTS from "@/constants";

import type {
    BlockID,
    ISiyuanGlobal,
} from "@workspace/types/siyuan";
import { createIAL } from "@workspace/utils/siyuan/ial";

declare var globalThis: ISiyuanGlobal;

export interface ICodeCell {
    id: BlockID;
    code: string;
}

export interface ICodeCellBlocks {
    cells: ICodeCell[]; // 代码单元列表
    elements: HTMLElement[]; // 代码单元 DOM 所在的元素列表 (非代码单元 DOM)
}

/**
 * 将块 DOM 转换为代码单元
 * @param html 块 DOM 字符串
 * @param isCell 是否仅提取 custom-jupyter-type="code" 的代码块
 * @returns 代码单元列表
 */
export function blockDOM2codeCells(
    html: string,
    isCell: boolean,
): ICodeCell[] {
    const element = document.createElement("div");
    element.innerHTML = html;
    const blocks = Array.from(element.querySelectorAll<HTMLDivElement>("div.code-block[data-node-id]"));
    return blocks
        .filter(block => (isCell
            ? block.getAttribute(CONSTANTS.attrs.code.type.key) === CONSTANTS.attrs.code.type.value
            : true
        ))
        .map(block => ({
            id: block.dataset.nodeId!,
            code: globalThis.Lute.BlockDOM2Content(block.outerHTML),
        }));
}

/**
 * 获取当前活跃的代码块
 * @returns 代码单元列表
 */
export function getActiveCellBlocks(): ICodeCellBlocks {
    const cells: ICodeCellBlocks = {
        cells: [],
        elements: getActiveBlocks(),
    };

    switch (cells.elements.length) {
        case 0:
            break;
        case 1:
            cells.cells = blockDOM2codeCells(
                cells.elements[0].outerHTML,
                false,
            );
            break;
        default:
            cells.cells = blockDOM2codeCells(
                cells.elements.reduce(
                    (htmls, block) => {
                        htmls.push(block.outerHTML);
                        return htmls;
                    },
                    [] as string[],
                ).join(""),
                true,
            );
            break;
    }
    return cells;
}

/**
 * 构造新的代码单元格
 * @param lang 代码语言
 * @param index 单元格序号
 * @returns kramdown 文本
 */
export function buildNewCodeCell(
    lang: string = globalThis.siyuan?.storage?.["local-codelang"] ?? "",
    index: string = " ",
): string {
    return [
        `\`\`\`${lang}`,
        "",
        "```",
        createIAL({
            [CONSTANTS.attrs.code.type.key]: CONSTANTS.attrs.code.type.value,
            [CONSTANTS.attrs.code.index]: index,
        }),
    ].join("\n");
}

/**
 * 判断一个元素是否为代码单元格元素
 * @param element HTML 元素
 * @returns 是否为单元格元素
 */
export function isCodeCell(element: any): boolean {
    return isSiyuanBlock(element)
        && element instanceof HTMLElement
        && element.getAttribute(CONSTANTS.attrs.code.type.key) === CONSTANTS.attrs.code.type.value
        && element.dataset.type === "NodeCodeBlock"
        && element.classList.contains("code-block");
}

/**
 * 判断一个元素是否为输出单元格元素
 * @param element HTML 元素
 * @returns 是否为单元格元素
 */
export function isOutputCell(element: any): boolean {
    return isSiyuanBlock(element)
        && element instanceof HTMLElement
        && element.getAttribute(CONSTANTS.attrs.output.type.key) === CONSTANTS.attrs.output.type.value
        && element.dataset.type === "NodeSuperBlock";
}

/**
 * 判断一个元素是否为单元格元素
 * @param element HTML 元素
 * @returns 是否为单元格元素
 */
export function isCell(element: any): boolean {
    return isCodeCell(element) || isOutputCell(element);
}
