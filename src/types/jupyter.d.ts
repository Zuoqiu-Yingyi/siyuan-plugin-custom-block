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

import type { Modify } from "@workspace/types/utils/readonly";
import type {
    KernelSpec,
    Kernel,
    Session,
} from "@jupyterlab/services";
import type { IJupyterParserOptions } from "@/types/config";

export type TKernelModel = Modify<Kernel.IModel>;
export type TSessionModel = Modify<Session.IModel>;

export interface ISessionModel extends TSessionModel {
    kernel: TKernelModel | null;
}

export interface IExecuteHorizontalRule {
    id: string; // 水平分割线 ID
    used: boolean; // 是否已使用
}

export interface IExecuteContext {
    client: {
        id: string; // 客户端 ID
        goto: boolean; // 运行时是否跳转到对应代码块
    };
    code: {
        id: string; // 代码块 ID
        attrs: Record<string, string | null>; // 代码块 IAL
    };
    output: {
        id: string; // 输出块 ID
        new: boolean; // 是否为新的输出块
        reply: boolean; // 运行请求是否已回复
        attrs: Record<string, string | null>; // 输出块 IAL
        stream: { // 输出流
            attrs: { // 输出流显示块
                id: string; // 块 ID
                [key: string]: string | null;
            };
            content: string; // 之前输出流的所有内容
            initialized: boolean; // 该块是否已经初始化
        };
        options: IJupyterParserOptions; // 解析选项
        display: Map<string, Set<string>>; // 显示的数据
        kramdown: string; // 初始化的 Markdown 代码
        hrs: { // 分割线
            head: Readonly<IExecuteHorizontalRule>; // 块首
            stream: IExecuteHorizontalRule; // 流输出
            error: IExecuteHorizontalRule; // 错误输出
            display_data: IExecuteHorizontalRule; // 数据显示
            execute_result: IExecuteHorizontalRule; // 运行结果
            execute_reply: IExecuteHorizontalRule; // 运行回复
            tail: Readonly<IExecuteHorizontalRule>; // 块尾
        };
    };
}
