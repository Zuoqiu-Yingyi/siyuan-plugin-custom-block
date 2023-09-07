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
    KernelSpec,
    Kernel,
    Session,
} from "@jupyterlab/services";

export default {
    JUPYTER_WORKER_FILE_NAME: "jupyter", // web worker 文件名称
    JUPYTER_WORKER_BROADCAST_CHANNEL_NAME: "jupyter-worker", // web worker 任务广播通道名称
    JUPYTER_UNKNOWN_VALUE: "unknown", // 未知值
    JUPYTER_LAST_RUN_TIME_FORMAT: "YYYY-MM-DD HH:mm:ss.SSS", // 上次运行时间格式
    JUPYTER_RUNTIME_FORMAT: "HH:mm:ss.SSS", // 运行用时格式
    JUPYTER_CODE_CELL_ACTION_RUN_CLASS_NAME: "protyle-action__run", // 代码单元格运行按钮类名
    attrs: { // 块属性
        kernel: {
            /**
             * 内核 ID
             * {@link KernelSpec.ISpecModel.id}
             */
            id: "custom-jupyter-kernel-id",

            /**
             * 内核名称
             * {@link KernelSpec.ISpecModel.name}
             */
            name: "custom-jupyter-kernel-name",

            /**
             * 内核语言
             * {@link KernelSpec.ISpecModel.language}
             */
            language: "custom-jupyter-kernel-language",

            /**
             * 内核可读名称
             * {@link KernelSpec.ISpecModel.display_name}
             */
            display_name: 'custom-jupyter-kernel-display-name',

            /**
             * 内核状态
             * {@link Kernel.Status}
             * ```ts
             * type Status = 'unknown' | 'starting' | 'idle' | 'busy' | 'terminating' | 'restarting' | 'autorestarting' | 'dead';
             * ```
             */
            status: 'custom-jupyter-kernel-status',

            /**
             * 连接状态
             * {@link Kernel.ConnectionStatus}
             * ```ts
             * type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';
             * ```
             */
            connection_status: 'custom-jupyter-kernel-connection-status',
        },
        session: {
            /**
             * 会话 ID
             * {@link Session.IModel.id}
             */
            id: "custom-jupyter-session-id",

            /**
             * 会话类型
             * {@link Session.IModel.type}
             */
            type: "custom-jupyter-session-type",

            /**
             * 会话名称
             * {@link Session.IModel.name}
             */
            name: "custom-jupyter-session-name",

            /**
             * 会话路径
             * {@link Session.IModel.path}
             */
            path: "custom-jupyter-session-path",
        },
        code: {
            type: {
                key: "custom-jupyter-block-type",
                value: "code",
            },
            time: "custom-jupyter-time", // 上次运行时间+运行时长
            output: "custom-jupyter-output-block-id", // 对应的输出块 ID
            index: "custom-jupyter-index", // 块运行序号

            execute_input: "custom-jupyter-time-execute-input", // 内核广播 execute_input 消息时间
            execute_reply: "custom-jupyter-time-execute-reply", // 内核广播 execute_reply 消息时间
            busy: "custom-jupyter-time-busy", // 内核状态切换为忙碌的时间
            idle: "custom-jupyter-time-idle", // 内核状态切换为空闲的时间
        },
        output: {
            type: {
                key: "custom-jupyter-block-type",
                value: "output",
            },
            code: "custom-jupyter-code-block-id", // 对应的代码块 ID
            index: "custom-jupyter-index", // 块运行序号
        },
        other: {
            prompt: `custom-prompt`, // 提示文本
        },
    } as const,
    styles: { // 样式
        success: 'color: var(--b3-card-success-color); background-color: var(--b3-card-success-background);',
        info: 'color: var(--b3-card-info-color); background-color: var(--b3-card-info-background);',
        warning: 'color: var(--b3-card-warning-color); background-color: var(--b3-card-warning-background);',
        error: 'color: var(--b3-card-error-color); background-color: var(--b3-card-error-background);',
    } as const,
};
