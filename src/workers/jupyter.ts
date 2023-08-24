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

import {
    Client,
    type types,
} from "@siyuan-community/siyuan-sdk";
import { Logger } from "@workspace/utils/logger";
import { trimSuffix } from "@workspace/utils/misc/string";
import { WorkerBridgeSlave } from "@workspace/utils/worker/bridge/slave";

import CONSTANTS from "@/constants";
import { DEFAULT_CONFIG } from "@/configs/default";
import { IpynbImport } from "@/jupyter/import";
import { Jupyter } from "@/jupyter";

import type { IConfig } from "@/types/config";
import type {
    IHandlers,
    THandlersWrapper,
} from "@workspace/utils/worker/bridge";
import type {
    KernelSpec,
    Kernel,
    Session,
} from "@jupyterlab/services";
import type { BlockID } from "@workspace/types/siyuan";
import type { PluginHandlers } from "..";

const config: IConfig = DEFAULT_CONFIG;
const logger = new Logger(`${self.name}-worker:${CONSTANTS.JUPYTER_WORKER_FILE_NAME}`);
const client = new Client(
    {
        baseURL: trimSuffix(self.location.pathname, `plugins/${self.name}/workers/${CONSTANTS.JUPYTER_WORKER_FILE_NAME}.js`),
    },
    "fetch",
);
var jupyter: InstanceType<typeof Jupyter> | undefined;

/* 👇由插件调用👇 */

/* 加载 */
export async function onload(): Promise<void> {
}

/* 卸载 */
export async function unload(): Promise<void> {
    jupyter?.dispose();
    jupyter = undefined;
}

/* 重置 (加载后与更新设置选项后) */
export function restart(): void {
    jupyter?.dispose();
    jupyter = config.jupyter.server.enable
        ? new Jupyter(
            config.jupyter.server.settings,
            logger,
            (manager: KernelSpec.IManager, models: KernelSpec.ISpecModels) => {
                // logger.debug(models);
                bridge.call<PluginHandlers["updateKernelSpecs"]>(
                    "updateKernelSpecs",
                    models,
                );
            },
            (manager: Kernel.IManager, models: Kernel.IModel[]) => {
                // logger.debug(models);
                bridge.call<PluginHandlers["updateKernels"]>(
                    "updateKernels",
                    models,
                );
            },
            (manager: Session.IManager, models: Session.IModel[]) => {
                // logger.debug(models);
                bridge.call<PluginHandlers["updateSessions"]>(
                    "updateSessions",
                    models,
                );
            },
        )
        : undefined;
}

/* 更新设置选项 */
export function updateConfig(
    config_: IConfig,
): void {
    Object.assign(config, config_);
}

/**
 * 导入 *.ipynb 文件
 * @param id 文档块 ID
 * @param file 文件
 * @param type 写入类型
 */
export async function importIpynb(
    id: BlockID,
    file: File,
    type: "override" | "append",
): Promise<void> {
    const ipynb_import = new IpynbImport(
        client,
        config,
    );
    await ipynb_import.loadFile(file);
    await ipynb_import.parse();

    const kramdown = ipynb_import.kramdown;
    const attrs = ipynb_import.attrs;

    /* 设置文档块属性 */
    await client.setBlockAttrs({
        id,
        attrs,
    });

    /* 更改文档块内容 */
    switch (type) {
        case "override":
            await client.updateBlock({
                id,
                data: kramdown,
                dataType: "markdown",
            });
            break;
        case "append":
            await client.appendBlock({
                parentID: id,
                data: kramdown,
                dataType: "markdown",
            });
            break;
    }
}

function _throw(...args: any[]): never {
    throw new Error(`Jupyter Client not started!`);
}

function _undefined(...args: any[]): undefined {
    return;
}

const handlers = {
    onload: {
        this: self,
        func: onload,
    },
    unload: {
        this: self,
        func: unload,
    },
    restart: {
        this: self,
        func: restart,
    },
    updateConfig: {
        this: self,
        func: updateConfig,
    },
    jupyterRefresh: {
        this: jupyter,
        func: jupyter?.refresh ?? _undefined,
    },
    jupyterKernelspecsRefreshSpecs: {
        this: jupyter?.kernelspecs ?? _undefined,
        func: jupyter?.kernelspecs.refreshSpecs ?? _undefined,
    },
    jupyterKernelsRunning: {
        this: jupyter?.kernels ?? _undefined,
        func: jupyter?.kernels.running ?? _undefined,
    },
    jupyterKernelsRefreshRunning: {
        this: jupyter?.kernels ?? _undefined,
        func: jupyter?.kernels.refreshRunning ?? _undefined,
    },
    jupyterKernelsShutdown: {
        this: jupyter?.kernels ?? _undefined,
        func: jupyter?.kernels.shutdown ?? _undefined,
    },
    jupyterKernelsShutdownAll: {
        this: jupyter?.kernels ?? _undefined,
        func: jupyter?.kernels.shutdownAll ?? _undefined,
    },
    jupyterSessionsRunning: {
        this: jupyter?.sessions ?? _undefined,
        func: jupyter?.sessions.running ?? _undefined,
    },
    jupyterSessionRefreshRunning: {
        this: jupyter?.sessions ?? _undefined,
        func: jupyter?.sessions.refreshRunning ?? _undefined,
    },
    jupyterSessionsShutdown: {
        this: jupyter?.sessions ?? _undefined,
        func: jupyter?.sessions.shutdown ?? _undefined,
    },
    jupyterSessionsShutdownAll: {
        this: jupyter?.sessions ?? _undefined,
        func: jupyter?.sessions.shutdownAll ?? _undefined,
    },
    importIpynb: {
        this: self,
        func: importIpynb,
    }
} as const;

export type WorkerHandlers = THandlersWrapper<typeof handlers>;

const channel = new BroadcastChannel(CONSTANTS.JUPYTER_WORKER_BROADCAST_CHANNEL_NAME);
const bridge = new WorkerBridgeSlave(
    channel,
    logger,
    handlers,
);
