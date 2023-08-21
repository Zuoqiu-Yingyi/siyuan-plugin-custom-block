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

import type { ServerConnection } from "@jupyterlab/services";

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

export interface IJupyterImportParams {
    escaped: boolean; // 是否转义
    cntrl: boolean; // 是否解析控制字符
}

export interface IJupyterImport {
    params: IJupyterImportParams;
}

export interface IJupyter {
    server: IJupyterServer;
    import: IJupyterImport;
}

export interface IConfig {
    jupyter: IJupyter;
}
