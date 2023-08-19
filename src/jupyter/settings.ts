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

import type { IJupyterServerSettings } from "@/types/config";
import type { ServerConnection } from "@jupyterlab/services";

export const DEFAULT_SETTINGS: IJupyterServerSettings = {
    baseUrl: "http://localhost:8888/",
    appUrl: "/app",
    wsUrl: "",
    token: "",
} as const;

export function getWsUrl(baseURL: string): string {
    baseURL = baseURL || DEFAULT_SETTINGS.baseUrl;
    return `ws${baseURL.slice(4)}`;
}

export function makeSettings(settings: IJupyterServerSettings): ServerConnection.ISettings {
    const baseUrl = settings.baseUrl || DEFAULT_SETTINGS.baseUrl;
    const appUrl = settings.appUrl || DEFAULT_SETTINGS.appUrl;
    const wsUrl = settings.wsUrl || getWsUrl(baseUrl);

    return {
        baseUrl,
        appUrl,
        wsUrl,
        token: settings.token,
        appendToken: true,
        init: {
            cache: "no-store",
            credentials: "include",
        },
        fetch,
        Request,
        Headers,
        WebSocket,
    };
}
