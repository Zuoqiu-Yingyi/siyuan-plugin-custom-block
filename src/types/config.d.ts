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

import type {
    ServerConnection,
    KernelMessage,
} from "@jupyterlab/services";
import type xterm from "xterm";

export interface IJupyterServerSettings extends Partial<ServerConnection.ISettings> {
    baseUrl: string; // The base url of the server.
    appUrl: string; // The app url of the JupyterLab application.
    wsUrl: string; // The base ws url of the server.
    token: string; // The authentication token for requests.  Use an empty string to disable.
}

export interface IJupyterServer {
    enable: boolean; // 是否启用客户端
    settings: IJupyterServerSettings;
}

/* 解析器参数 */
export interface IJupyterParserOptions {
    xterm: boolean; // 是否启用 xterm 显示输出流
    escaped: boolean; // 是否转义
    cntrl: boolean; // 是否解析控制字符
}

export interface IJupyterExecute {
    goto: boolean; // 运行时是否默认跳转到对应的代码块 (使用命令运行时忽略该选项)
    content: Omit<KernelMessage.IExecuteRequestMsg["content"], "code">;
    input: IJupyterInput;
    output: IJupyterOutput;
}

export interface IJupyterOutput {
    parser: IJupyterParserOptions;
}

export interface IJupyterInput {
    goto: boolean; // 输入请求时是否跳转到对应的代码块
}

export interface IJupyterInspect {
    detail_level: KernelMessage.IInspectRequestMsg["content"]["detail_level"];
}

export interface IJupyter {
    server: IJupyterServer;
    execute: IJupyterExecute;
    inspect: IJupyterInspect;
    import: IJupyterImport;
}

export interface IXterm {
    options: xterm.ITerminalOptions;
}

export interface IConfig {
    jupyter: IJupyter;
    xterm: IXterm;
}
