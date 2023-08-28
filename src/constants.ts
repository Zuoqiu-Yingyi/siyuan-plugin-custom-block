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
export default {
    JUPYTER_WORKER_FILE_NAME: "jupyter", // web worker 文件名称
    JUPYTER_WORKER_BROADCAST_CHANNEL_NAME: "jupyter-worker", // web worker 任务广播通道名称
    JUPYTER_UNKNOWN_VALUE: "unknown", // 未知值
    attrs: { // 块属性
        kernel: {
            id: "custom-jupyter-kernel-id", // 内核 ID
            name: "custom-jupyter-kernel-name", // 内核名称
            language: "custom-jupyter-kernel-language", // 内核语言
            display_name: 'custom-jupyter-kernel-display-name', // 内核友好名称
            status: 'custom-jupyter-kernel-status', // 内核状态
            connection_status: 'custom-jupyter-kernel-connection-status', // 内核连接
        },
        session: {
            id: "custom-jupyter-session-id", // 会话 ID
            type: "custom-jupyter-session-type", // 会话类型
            name: "custom-jupyter-session-name", // 会话名称
            path: "custom-jupyter-session-path", // 会话路径
        },
        code: {
            type: {
                key: "custom-jupyter-block-type",
                value: "code",
            },
            time: "custom-jupyter-time", // 上次运行时间+运行时长
            output: "custom-jupyter-output-block-id", // 对应的输出块 ID
            index: "custom-jupyter-index", // 块运行序号
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
