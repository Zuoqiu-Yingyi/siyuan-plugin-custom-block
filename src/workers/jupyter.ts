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
import { AsyncLockQueue } from "@workspace/utils/structure/async-lock-queue";

import CONSTANTS from "@/constants";
import { DEFAULT_CONFIG } from "@/configs/default";
import { IpynbImport } from "@/jupyter/import";
import { Jupyter } from "@/jupyter";

import type { IConfig } from "@/types/config";
import type {
    IFunction,
    THandlersWrapper,
} from "@workspace/utils/worker/bridge";
import type {
    KernelSpec,
    Kernel,
    Session,
    KernelMessage,
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
const id_2_session_connection = new Map<string, Session.ISessionConnection>(); // 会话 ID -> 会话连接
var jupyter: InstanceType<typeof Jupyter> | undefined;

const kernel_status_queue = new AsyncLockQueue<{ docID: string, status: string }>(
    async item => client.setBlockAttrs({
        id: item.docID,
        attrs: {
            [CONSTANTS.attrs.kernel.status]: item.status,
        },
    }),
    (...args) => logger.warns(...args),
);

/**
 * 内核状态更改信号监听器
 * {@linkcode Session.ISessionConnection.statusChanged}
 * {@linkcode Kernel.IKernelConnection.statusChanged}
 * @param docID 文档块 ID
 * @param connection 会话/内核连接
 * @param status 内核状态
 */
async function kernelStatusChanged(
    docID: string,
    connection: Session.ISessionConnection | Kernel.IKernelConnection,
    status: KernelMessage.Status,
): Promise<void> {
    // logger.debugs(["statusChanged", status], [docID, connection.name, connection.id]);
    kernel_status_queue.enqueue({
        docID,
        status,
    });
}

/**
 * 内核连接状态更改信号监听器
 * {@linkcode Session.ISessionConnection.connectionStatusChanged}
 * {@linkcode Kernel.IKernelConnection.connectionStatusChanged}
 * @param docID 文档块 ID
 * @param connection 会话/内核连接
 * @param status 内核连接状态
*/
async function kernelConnectionStatusChanged(
    docID: string,
    connection: Session.ISessionConnection | Kernel.IKernelConnection,
    status: Kernel.ConnectionStatus,
): Promise<void> {
    // logger.debugs(["connectionStatusChanged", status], [docID, connection.name, connection.id]);

    await client.setBlockAttrs({
        id: docID,
        attrs: {
            [CONSTANTS.attrs.kernel.connection_status]: status,
        },
    });
}

/**
 * 等待输入信号监听器
 * {@linkcode Session.ISessionConnection.pendingInput}
 * {@linkcode Kernel.IKernelConnection.pendingInput}
 * @param docID 文档块 ID
 * @param connection 会话/内核连接
 * @param pending 是否正等待输入
 */
async function kernelPendingInput(
    docID: string,
    connection: Session.ISessionConnection | Kernel.IKernelConnection,
    pending: boolean,
): Promise<void> {
    logger.debugs(["pendingInput", pending], [docID, connection.name, connection.id]);
    // TODO: 输入信号处理
}

/**
 * 输入输出消息信号监听器
 * {@linkcode Session.ISessionConnection.iopubMessage}
 * {@linkcode Kernel.IKernelConnection.iopubMessage}
 * @param docID 文档块 ID
 * @param connection 会话/内核连接
 * @param message 输入输出消息
 */
async function kernelIopubMessage(
    docID: string,
    connection: Session.ISessionConnection | Kernel.IKernelConnection,
    message: KernelMessage.IIOPubMessage,
): Promise<void> {
    logger.debugs(["iopubMessage", message], [docID, connection.name, connection.id]);
    // TODO:输出输入消息处理
}

/**
 * 所有消息监听器
 * {@linkcode Session.ISessionConnection.anyMessage}
 * {@linkcode Kernel.IKernelConnection.anyMessage}
 * @param docID 文档块 ID
 * @param connection 会话/内核连接
 * @param message 内核消息
 */
async function kernelAnyMessage(
    docID: string,
    connection: Session.ISessionConnection | Kernel.IKernelConnection,
    message: Kernel.IAnyMessageArgs,
): Promise<void> {
    // logger.debugs(["anyMessage", message], [docID, connection.name, connection.id]);
}

/**
 * 未处理消息监听器
 * {@linkcode Session.ISessionConnection.unhandledMessage}
 * {@linkcode Kernel.IKernelConnection.unhandledMessage}
 * @param docID 文档块 ID
 * @param connection 会话/内核连接
 * @param message 未处理的内核消息
 */
async function kernelUnhandledMessage(
    docID: string,
    connection: Session.ISessionConnection | Kernel.IKernelConnection,
    message: KernelMessage.IMessage,
): Promise<void> {
    // logger.debugs(["unhandledMessage", message], [docID, connection.name, connection.id]);
}

/**
 * 绑定会话连接信号监听器
 * @param docID 文档块 ID
 * @param connection 会话连接
 */
function bindSessionConnectionSignalListener(
    docID: string,
    connection: Session.ISessionConnection,
): void {
    connection.statusChanged.connect((...args) => kernelStatusChanged(docID, ...args));
    connection.connectionStatusChanged.connect((...args) => kernelConnectionStatusChanged(docID, ...args));
    connection.pendingInput.connect((...args) => kernelPendingInput(docID, ...args));
    connection.iopubMessage.connect((...args) => kernelIopubMessage(docID, ...args));
    connection.anyMessage.connect((...args) => kernelAnyMessage(docID, ...args));
    connection.unhandledMessage.connect((...args) => kernelUnhandledMessage(docID, ...args));
}

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

/* 客户端未启动时抛出的异常 */
function _throw<P extends IFunction>(...args: Parameters<P>): never {
    throw new Error(`Jupyter Client not started!`);
}

/* 客户端未启动时返回 undefined */
function _undefined<P extends IFunction>(...args: Parameters<P>): undefined {
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
    "jupyter.refresh": { // 刷新资源
        get this() { return jupyter },
        get func() { return jupyter?.refresh ?? _undefined<Jupyter["refresh"]> },
    },
    "jupyter.kernelspecs.refreshSpecs": { // 刷新内核清单
        get this() { return jupyter?.kernelspecs },
        get func() { return jupyter?.kernelspecs.refreshSpecs ?? _undefined<Jupyter["kernelspecs"]["refreshSpecs"]> },
    },
    "jupyter.kernels.running": { // 获取正在运行的内核
        this: self,
        func(): Kernel.IModel[] {
            return jupyter?.kernels.running
                ? Array.from(jupyter.kernels.running())
                : [];
        },
    },
    "jupyter.kernels.refreshRunning": { // 刷新正在运行的内核
        get this() { return jupyter?.kernels },
        get func() { return jupyter?.kernels.refreshRunning ?? _undefined<Jupyter["kernels"]["refreshRunning"]> },
    },
    "jupyter.kernels.shutdown": { // 关闭指定内核
        get this() { return jupyter?.kernels },
        get func() { return jupyter?.kernels.shutdown ?? _undefined<Jupyter["kernels"]["shutdown"]> },
    },
    "jupyter.kernels.shutdownAll": { // 关闭所有内核
        get this() { return jupyter?.kernels },
        get func() { return jupyter?.kernels.shutdownAll ?? _undefined<Jupyter["kernels"]["shutdownAll"]> },
    },
    "jupyter.sessions.running": { // 获取正在运行的会话
        this: self,
        func(): Session.IModel[] {
            return jupyter?.sessions.running
                ? Array.from(jupyter.sessions.running())
                : [];
        },
    },
    "jupyter.sessions.refreshRunning": { // 刷新正在运行的会话
        get this() { return jupyter?.sessions },
        get func() { return jupyter?.sessions.refreshRunning ?? _undefined<Jupyter["sessions"]["refreshRunning"]> },
    },
    "jupyter.sessions.startNew": { // 创建新会话并连接
        this: self,
        async func(
            docID: string,
            ...args: Parameters<Jupyter["sessions"]["startNew"]>
        ): Promise<Session.IModel | undefined> {
            const connection = await jupyter?.sessions.startNew(...args);
            if (connection) {
                id_2_session_connection.set(connection.id, connection);
                bindSessionConnectionSignalListener(docID, connection);
                return connection.model;
            }
        },
    },
    "jupyter.sessions.connectTo": { // 连接到正在运行的会话
        this: self,
        async func(
            docID: string,
            ...args: Parameters<Jupyter["sessions"]["connectTo"]>
        ): Promise<Session.IModel | undefined> {
            const connection = await jupyter?.sessions.connectTo(...args);
            if (connection) {
                id_2_session_connection.set(connection.id, connection);
                bindSessionConnectionSignalListener(docID, connection);
                return connection.model;
            }
        },
    },
    "jupyter.sessions.shutdown": { // 关闭指定会话
        get this() { return jupyter?.sessions },
        get func() { return jupyter?.sessions.shutdown ?? _undefined<Jupyter["sessions"]["shutdown"]> },
    },
    "jupyter.sessions.shutdownAll": { // 关闭所有会话
        get this() { return jupyter?.sessions },
        get func() { return jupyter?.sessions.shutdownAll ?? _undefined<Jupyter["sessions"]["shutdownAll"]> },
    },
    "jupyter.session.connection.setName": { // 设置会话名称
        this: self,
        async func(
            id: string, // 会话 ID
            name: string, // 会话新名称
        ): Promise<Session.IModel | undefined> {
            const connection = id_2_session_connection.get(id);
            if (connection) {
                await connection.setName(name);
            }
            return connection?.model;
        },
    },
    "jupyter.session.connection.setPath": { // 设置会话路径
        this: self,
        async func(
            id: string, // 会话 ID
            path: string, // 会话新路径
        ): Promise<Session.IModel | undefined> {
            const connection = id_2_session_connection.get(id);
            if (connection) {
                await connection.setPath(path);
            }
            return connection?.model;
        },
    },
    "jupyter.session.connection.setType": { // 设置会话类型
        this: self,
        async func(
            id: string, // 会话 ID
            type: string, // 会话新类型
        ): Promise<Session.IModel | undefined> {
            const connection = id_2_session_connection.get(id);
            if (connection) {
                await connection.setType(type);
            }
            return connection?.model;
        },
    },
    "jupyter.session.connection.changeKernel": { // 更改会话内核
        this: self,
        async func(
            id: string, // 会话 ID
            kernel: { id: string } | { name: string } | {}, // 会话内核 ID/名称
        ): Promise<Session.IModel | undefined> {
            const connection = id_2_session_connection.get(id);
            if (connection) {
                const connection_kernel = await connection.changeKernel(kernel);
            }
            return connection?.model;
        },
    },
    "jupyter.session.kernel.connection.reconnect": { // 重建与内核的连接
        this: self,
        async func(
            id: string, // 会话 ID
        ): Promise<Session.IModel | undefined> {
            const connection = id_2_session_connection.get(id);
            if (connection) {
                await connection.kernel?.reconnect();
            }
            return connection?.model;
        },
    },
    "jupyter.session.kernel.connection.interrupt": { // 中止内核运行
        this: self,
        async func(
            id: string, // 会话 ID
        ): Promise<Session.IModel | undefined> {
            const connection = id_2_session_connection.get(id);
            if (connection) {
                await connection.kernel?.interrupt();
            }
            return connection?.model;
        },
    },
    "jupyter.session.kernel.connection.restart": { // 重启内核
        this: self,
        async func(
            id: string, // 会话 ID
        ): Promise<Session.IModel | undefined> {
            const connection = id_2_session_connection.get(id);
            if (connection) {
                await connection.kernel?.restart();
            }
            return connection?.model;
        },
    },
    "jupyter.session.kernel.connection.shutdown": { // 关闭内核
        this: self,
        async func(
            id: string, // 会话 ID
        ): Promise<Session.IModel | undefined> {
            const connection = id_2_session_connection.get(id);
            if (connection) {
                await connection.kernel?.shutdown();
            }
            return connection?.model;
        },
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
