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

import siyuan from "siyuan";
import type {
    BlockID,
    ISiyuanGlobal,
} from "@workspace/types/siyuan";

import manifest from "~/public/plugin.json";

import "./index.less";
import "xterm/css/xterm.css";

import icon_jupyter_client from "./assets/symbols/icon-jupyter-client.symbol?raw";
import icon_jupyter_client_text from "./assets/symbols/icon-jupyter-client-text.symbol?raw";
import icon_jupyter_client_simple from "./assets/symbols/icon-jupyter-client-simple.symbol?raw";
import icon_jupyter_client_terminal from "./assets/symbols/icon-jupyter-client-terminal.symbol?raw";
import icon_jupyter_client_kernelspec from "./assets/symbols/icon-jupyter-client-kernelspec.symbol?raw";
import icon_jupyter_client_kernel from "./assets/symbols/icon-jupyter-client-kernel.symbol?raw";
import icon_jupyter_client_kernel_unknown from "./assets/symbols/icon-jupyter-client-kernel-unknown.symbol?raw";
import icon_jupyter_client_kernel_starting from "./assets/symbols/icon-jupyter-client-kernel-starting.symbol?raw";
import icon_jupyter_client_kernel_idle from "./assets/symbols/icon-jupyter-client-kernel-idle.symbol?raw";
import icon_jupyter_client_kernel_busy from "./assets/symbols/icon-jupyter-client-kernel-busy.symbol?raw";
import icon_jupyter_client_kernel_terminating from "./assets/symbols/icon-jupyter-client-kernel-terminating.symbol?raw";
import icon_jupyter_client_kernel_restarting from "./assets/symbols/icon-jupyter-client-kernel-restarting.symbol?raw";
import icon_jupyter_client_kernel_autorestarting from "./assets/symbols/icon-jupyter-client-kernel-autorestarting.symbol?raw";
import icon_jupyter_client_kernel_dead from "./assets/symbols/icon-jupyter-client-kernel-dead.symbol?raw";
import icon_jupyter_client_session from "./assets/symbols/icon-jupyter-client-session.symbol?raw";
import icon_jupyter_client_session_console from "./assets/symbols/icon-jupyter-client-session-console.symbol?raw";
import icon_jupyter_client_session_notebook from "./assets/symbols/icon-jupyter-client-session-notebook.symbol?raw";

import * as sdk from "@siyuan-community/siyuan-sdk";

import Item from "@workspace/components/siyuan/menu/Item.svelte"
import Settings from "./components/Settings.svelte";
import JupyterDock from "./components/JupyterDock.svelte";
import SessionManager from "./components/SessionManager.svelte";
import XtermOutputElement from "./components/XtermOutputElement";
import { asyncPrompt } from "@workspace/components/siyuan/dialog/prompt";

import {
    FLAG_MOBILE,
} from "@workspace/utils/env/front-end";
import {
    getBlockMenuContext,
    type IBlockMenuContext,
} from "@workspace/utils/siyuan/menu/block";
import {
    getCurrentBlockID,
    isSiyuanBlock,
    isSiyuanDocument,
    isSiyuanDocumentTitle,
} from "@workspace/utils/siyuan/dom";
import { Logger } from "@workspace/utils/logger";
import { fn__code } from "@workspace/utils/siyuan/text/span";
import { mergeIgnoreArray } from "@workspace/utils/misc/merge";
import { WorkerBridgeMaster } from "@workspace/utils/worker/bridge/master";
import { sleep } from "@workspace/utils/misc/sleep";
import { Counter } from "@workspace/utils/misc/iterator";
import uuid from "@workspace/utils/misc/uuid";

import CONSTANTS from "./constants";
import { DEFAULT_SETTINGS } from "./jupyter/settings";
import { DEFAULT_CONFIG } from "./configs/default";
import {
    blockDOM2codeCells,
    buildNewCodeCell,
    getActiveCellBlocks,
    isCodeCell,
    type ICodeCell,
    type ICodeCellBlocks,
    isOutputCell,
} from "./utils/cell";

import type { I18N } from "./utils/i18n";
import type {
    IConfig,
    IJupyterParserOptions,
} from "./types/config";
import type {
    KernelSpec,
    Kernel,
    Session,
} from "@jupyterlab/services";
import type {
    IClickBlockIconEvent,
    IClickEditorContentEvent,
    IClickEditorTitleIconEvent,
} from "@workspace/types/siyuan/events";
import type { THandlersWrapper } from "@workspace/utils/worker/bridge";
import type { WorkerHandlers } from "./workers/jupyter";
import type { ComponentEvents } from "svelte";

declare var globalThis: ISiyuanGlobal;
export type PluginHandlers = THandlersWrapper<JupyterClientPlugin["handlers"]>;
export type TMenuContext = IBlockMenuContext | {
    isDocumentBlock: true,
    isMultiBlock: false,
    id: BlockID,
};

export default class JupyterClientPlugin extends siyuan.Plugin {
    static readonly GLOBAL_CONFIG_NAME = "global-config";

    declare public readonly i18n: I18N;

    public readonly siyuan = siyuan;
    public readonly logger: InstanceType<typeof Logger>;
    public readonly client: InstanceType<typeof sdk.Client>;

    protected readonly SETTINGS_DIALOG_ID: string;

    public config: IConfig = DEFAULT_CONFIG;
    protected worker?: InstanceType<typeof Worker>; // worker
    public bridge?: InstanceType<typeof WorkerBridgeMaster>; // worker 桥

    protected jupyterDock!: {
        // editor: InstanceType<typeof Editor>,
        dock: ReturnType<siyuan.Plugin["addDock"]>,
        model?: siyuan.IDockModel,
        component?: InstanceType<typeof JupyterDock>,
    }; // Jupyter 管理面板

    public readonly doc2session = new Map<string, Session.IModel>(); // 文档 ID 到会话的映射
    public readonly doc2info = new Map<string, sdk.types.kernel.api.block.getDocInfo.IData>(); // 文档 ID 到文档信息的映射
    public readonly session2docs = new Map<string, Set<string>>(); // 会话 ID 到文档 ID 集合的映射
    public readonly handlers; // 插件暴露给 worker 的方法
    public readonly kernelspecs: KernelSpec.ISpecModels = { default: "", kernelspecs: {} };
    public readonly kernels: Kernel.IModel[] = [];
    public readonly sessions: Session.IModel[] = [];
    public readonly kernelName2objectURL = new Map<string, string>(); // 内核名称 -> object URL
    public readonly kernelName2language = new Map<string, string>(); // 内核名称 -> 内核语言名称
    public readonly kernelName2displayName = new Map<string, string>(); // 内核名称 -> 内核显示名称
    public readonly counter = Counter();
    public readonly username = `siyuan-${siyuan.getBackend()}-${siyuan.getFrontend()}`; // 用户名
    public readonly clientId = globalThis.Lute.NewNodeID(); // 客户端 ID

    constructor(options: any) {
        super(options);

        this.logger = new Logger(this.name);
        this.client = new sdk.Client(undefined, "fetch");

        this.SETTINGS_DIALOG_ID = `${this.name}-settings-dialog`;
        this.handlers = {
            gotoBlock: {
                this: this,
                func: async (
                    blockID: BlockID,
                    clientID: string,
                ) => {
                    if (clientID === this.clientId) {
                        await this.gotoBlock(blockID);
                    }
                },
            },
            inputRequest: {
                this: this,
                func: this.inputRequest,
            },
            updateKernelSpecs: {
                this: this,
                func: this.updateKernelSpecs,
            },
            updateKernels: {
                this: this,
                func: this.updateKernels,
            },
            updateSessions: {
                this: this,
                func: this.updateSessions,
            },
        } as const;

        /**
         * 注册自定义 HTMLElement 组件
         * REF: https://developer.mozilla.org/zh-CN/docs/Web/API/CustomElementRegistry
         * REF: https://developer.mozilla.org/zh-CN/docs/Web/API/CustomElementRegistry/define
        */
        const XtermOutputElementWrap = XtermOutputElement(this);
        globalThis.customElements.get(XtermOutputElementWrap.TAG_NAME)
            ?? globalThis.customElements.define(
                XtermOutputElementWrap.TAG_NAME,
                XtermOutputElementWrap,
            );
    }

    onload(): void {
        // this.logger.debug(this);

        /* 注册图标 */
        this.addIcons([
            icon_jupyter_client,
            icon_jupyter_client_text,
            icon_jupyter_client_simple,
            icon_jupyter_client_terminal,
            icon_jupyter_client_kernelspec,
            icon_jupyter_client_kernel,
            icon_jupyter_client_kernel_unknown,
            icon_jupyter_client_kernel_starting,
            icon_jupyter_client_kernel_idle,
            icon_jupyter_client_kernel_busy,
            icon_jupyter_client_kernel_terminating,
            icon_jupyter_client_kernel_restarting,
            icon_jupyter_client_kernel_autorestarting,
            icon_jupyter_client_kernel_dead,
            icon_jupyter_client_session,
            icon_jupyter_client_session_console,
            icon_jupyter_client_session_notebook,
        ].join(""));

        /* 注册侧边栏 */
        const plugin = this;
        this.jupyterDock = {
            dock: this.addDock({
                config: {
                    position: "LeftTop",
                    size: { width: 256, height: 0 },
                    icon: "icon-jupyter-client",
                    title: this.i18n.dock.title,
                    show: true,
                },
                data: {
                },
                type: "-dock",
                init() {
                    // plugin.logger.debug(this);

                    this.element.classList.add("fn__flex-column");
                    const dock = new JupyterDock({
                        target: this.element,
                        props: {
                            plugin,
                            ...this.data,
                            kernelspecs: plugin.kernelspecs,
                            kernels: plugin.kernels,
                            sessions: plugin.sessions,
                        },
                    });
                    plugin.jupyterDock.model = this;
                    plugin.jupyterDock.component = dock;
                },
                destroy() {
                    plugin.jupyterDock.component?.$destroy();
                    delete plugin.jupyterDock.component;
                    delete plugin.jupyterDock.model;
                },
            }),
        };

        /**
         * 注册快捷键命令
         * 在 onload 结束后即刻解析, 因此不能在回调函数中注册
         */
        this.addCommand({ // 仅运行所选代码单元格 / 光标所在代码块
            langKey: "run-selected-cells",
            langText: this.i18n.commands.runSelectedCells.text,
            hotkey: "⌘↩", // 默认快捷键 Ctrl + Enter
            customHotkey: "⌘↩", // 自定义快捷键
            editorCallback: async () => {
                /* 运行当前所选的块 */
                const blocks = await this.executeSelectedCellBlocks();

                /* 跳转到到最后一个块 */
                const last_cell = blocks.cells.at(-1);
                if (last_cell) {
                    // await sleep(250);
                    await this.gotoBlock(last_cell.id, false);
                }
            },
        });

        this.addCommand({ // 运行所选代码单元格 / 光标所在代码块并跳转到下一个代码单元格
            langKey: "run-selected-cells-and-goto-next",
            langText: this.i18n.commands.runSelectedCellsAndGotoNext.text,
            hotkey: "⇧↩", // 默认快捷键 Shift + Enter
            customHotkey: "⇧↩", // 自定义快捷键
            editorCallback: async () => {
                /* 运行当前所选的块 */
                const blocks = await this.executeSelectedCellBlocks();

                /* 获取下一个代码单元格 */
                const next_cell = await this.getNextCodeCell(blocks);

                if (next_cell) { // 存在下一个代码单元格
                    /* 跳转到下一个代码单元格 */
                    // await sleep(250);
                    await this.gotoBlock(next_cell.id, false);
                }
                else { // 不存在下一个代码单元格
                    /* 插入新代码单元格 */
                    const new_cell = await this.insertNewCodeCell(blocks);

                    /* 跳转到刚刚插入的单元格 */
                    if (new_cell) {
                        // await sleep(250);
                        await this.gotoBlock(new_cell.id, false);
                    }
                }
            },
        });

        this.addCommand({ // 运行所选代码块/光标所在代码块并插入新代码单元格
            langKey: "run-selected-cells-and-insert-below",
            langText: this.i18n.commands.runSelectedCellsAndInsertBelow.text,
            hotkey: "⌥↩", // 默认快捷键 Alt + Enter
            customHotkey: "⌥↩", // 自定义快捷键
            editorCallback: async () => {
                /* 运行当前所选的块 */
                const blocks = await this.executeSelectedCellBlocks();

                /* 插入新代码单元格 */
                const new_cell = await this.insertNewCodeCell(blocks);

                /* 跳转到刚刚插入的单元格 */
                if (new_cell) {
                    // await sleep(250);
                    await this.gotoBlock(new_cell.id, false);
                }
            },
        });

        /* 加载数据 */
        this.loadData(JupyterClientPlugin.GLOBAL_CONFIG_NAME)
            .then(config => {
                this.config = mergeIgnoreArray(DEFAULT_CONFIG, config || {}) as IConfig;
            })
            .catch(error => this.logger.error(error))
            .finally(async () => {
                /* 初始化 channel */
                this.initBridge();
                const runing = await this.isWorkerRunning();

                if (!runing) { // worker 未正常运行
                    /* 初始化 worker */
                    this.initWorker();

                    /* 等待 worker 正常运行 */
                    while (await this.isWorkerRunning()) {
                        await sleep(1_000)
                    }

                    /* 初始化 worker 配置 */
                    await this.bridge?.call<WorkerHandlers["onload"]>(
                        "onload",
                        this.i18n,
                    );
                    await this.updateWorkerConfig(true);
                }
                else { // worker 已正常运行, 强制刷新 jupyter 资源列表
                    await this.jupyterForceRefresh();
                }

                /* 注册事件监听器 */
                this.eventBus.on("click-editortitleicon", this.blockMenuEventListener);
                this.eventBus.on("click-blockicon", this.blockMenuEventListener);
                this.eventBus.on("click-editorcontent", this.clickEditorContentEventListener);
            });
    }

    onLayoutReady(): void {
    }

    onunload(): void {
        this.eventBus.off("click-editortitleicon", this.blockMenuEventListener);
        this.eventBus.off("click-blockicon", this.blockMenuEventListener);

        if (this.worker) {
            this.bridge
                ?.call<WorkerHandlers["unload"]>("unload")
                .then(() => {
                    this.bridge?.terminate();
                    this.worker?.terminate();
                });
        }
        else {
            this.bridge?.terminate();
        }
    }

    openSetting(): void {
        const that = this;
        const dialog = new siyuan.Dialog({
            title: `${this.i18n.displayName} <code class="fn__code">${this.name}</code>`,
            content: `<div id="${that.SETTINGS_DIALOG_ID}" class="fn__flex-column" />`,
            width: FLAG_MOBILE ? "92vw" : "720px",
            height: FLAG_MOBILE ? undefined : "640px",
        });
        const target = dialog.element.querySelector(`#${that.SETTINGS_DIALOG_ID}`);
        if (target) {
            const settings = new Settings({
                target,
                props: {
                    config: this.config,
                    plugin: this,
                },
            });
        }
    }

    /* 重置插件配置 */
    public async resetConfig(restart: boolean = true): Promise<void> {
        return this.updateConfig(
            mergeIgnoreArray(DEFAULT_CONFIG) as IConfig,
            restart,
        );
    }

    /* 更新插件配置 */
    public async updateConfig(
        config?: IConfig,
        restart: boolean = false,
    ): Promise<void> {
        if (config && config !== this.config) {
            this.config = config;
        }
        await this.updateWorkerConfig(restart);
        await this.saveData(JupyterClientPlugin.GLOBAL_CONFIG_NAME, this.config);
    }

    /* 初始化通讯桥 */
    protected initBridge(): void {
        this.bridge?.terminate();
        this.bridge = new WorkerBridgeMaster(
            new BroadcastChannel(CONSTANTS.JUPYTER_WORKER_BROADCAST_CHANNEL_NAME),
            this.logger,
            this.handlers,
            this.clientId,
        );
    }

    /* 初始化 worker */
    protected initWorker(): void {
        this.worker?.terminate();
        this.worker = new Worker(
            `${globalThis.document.baseURI}plugins/${this.name}/workers/${CONSTANTS.JUPYTER_WORKER_FILE_NAME}.js?v=${manifest.version}`,
            {
                type: "module",
                name: this.name,
                credentials: "same-origin",
            },
        );
    }

    /* web worker 是否正在运行 */
    protected async isWorkerRunning(): Promise<boolean> {
        try {
            /* 若 bridge 未初始化, 需要初始化 */
            if (!this.bridge) this.initBridge();

            /* 检测 Worker 是否已加载完成 */
            await this.bridge!.ping();
            return true;
        }
        catch (error) {
            return false;
        }
    }

    public get baseUrl(): string {
        return this.config?.jupyter.server.settings.baseUrl || DEFAULT_SETTINGS.baseUrl;
    }

    /**
     * 判断一个会话 id 是否为运行的会话
     * @param id 会话 id
     * @returns 是否存在
     */
    public isSessionRunning(id: string): boolean {
        return this.sessions.some(s => s.id === id);
    }

    /**
     * 判断一个会话 id 是否为连接的会话
     * @param id 会话 id
     * @returns 是否存在
     */
    public isSessionConnected(id: string): boolean {
        return this.session2docs.has(id);
    }

    /**
     * 关联一个文档 ID 与 一个会话 model
     * @param docID 文档 ID
     * @param session 会话 model
     */
    public relateDoc2Session(docID: string, session: Session.IModel): void {
        /* 移除原关联 */
        const session_old = this.doc2session.get(docID);
        if (session_old) {
            const doc_set = this.session2docs.get(session_old.id);
            if (doc_set) {
                doc_set.delete(docID);
                if (doc_set.size === 0) {
                    this.session2docs.delete(session_old.id);
                }
            }
        }

        /* 更新 文档 ID -> 会话 Model */
        this.doc2session.set(docID, session);

        /* 更新 会话 ID -> 文档 ID 集合 */
        const doc_set = this.session2docs.get(session.id) ?? new Set<string>();
        doc_set.add(docID);
        this.session2docs.set(session.id, doc_set);
    }

    /* 更新 worker 配置 */
    public async updateWorkerConfig(restart: boolean): Promise<void> {
        await this.bridge?.call<WorkerHandlers["updateConfig"]>(
            "updateConfig",
            this.config,
        );
        if (restart) {
            await this.bridge?.call<WorkerHandlers["restart"]>("restart");
        }
    }

    /**
     * jupyter 请求
     * @param pathname 请求路径
     * @param init 请求参数
     * @returns 响应体
     */
    public async jupyterFetch(
        pathname: string,
        init: RequestInit = {},
    ): Promise<Response> {
        const url = new URL(this.baseUrl);
        if (pathname.startsWith("/")) {
            url.pathname = pathname;
        }
        else {
            url.pathname = `${url.pathname}/${pathname}`;
        }

        const headers: Record<string, string> = {
            Authorization: `token ${this.config.jupyter.server.settings.token}`,
        };

        if (init.headers) {
            Object.assign(headers, init.headers);
        }
        else {
            init.headers = headers;
        }

        return globalThis.fetch(
            url,
            init,
        );
    }

    /**
     * 强制刷新 jupyter 资源列表
     */
    public async jupyterForceRefresh(): Promise<void> {
        const results = await Promise.allSettled([
            this.bridge?.call<WorkerHandlers["jupyter.kernelspecs.specs"]>(
                "jupyter.kernelspecs.specs",
            ),
            this.bridge?.call<WorkerHandlers["jupyter.kernels.running"]>(
                "jupyter.kernels.running",
            ),
            this.bridge?.call<WorkerHandlers["jupyter.sessions.running"]>(
                "jupyter.sessions.running",
            ),
        ]);

        if (results[0].status === "fulfilled" && results[0].value) {
            this.updateKernelSpecs(results[0].value);
        }
        if (results[1].status === "fulfilled" && results[1].value) {
            this.updateKernels(results[1].value);
        }
        if (results[2].status === "fulfilled" && results[2].value) {
            this.updateSessions(results[2].value);
        }
    }

    /**
     * 加载内核图标
     * @param spec 内核清单
     * @param defaultIcon 默认图标
     * @returns 内核图标引用 ID
     */
    public async loadKernelSpecIcon(
        spec: KernelSpec.ISpecModel,
        defaultIcon: string = "#icon-jupyter-client-kernelspec",
    ): Promise<string> {
        const pathname = (() => {
            switch (true) {
                case "logo-svg" in spec.resources:
                    return spec.resources["logo-svg"];
                case "logo-32x32" in spec.resources:
                    return spec.resources["logo-32x32"];
                case "logo-64x64" in spec.resources:
                    return spec.resources["logo-64x64"];
                default:
                    if (Object.keys(spec.resources).length > 0) {
                        return Object.values(spec.resources)[0];
                    } else {
                        return "";
                    }
            }
        })();

        if (pathname) {
            const response = await this.jupyterFetch(pathname, {
                method: "GET",
            });
            const blob = await response.blob();

            if (this.kernelName2objectURL.has(spec.name)) {
                return this.kernelName2objectURL.get(spec.name)!;
            } else {
                const objectURL = URL.createObjectURL(blob);
                this.kernelName2objectURL.set(spec.name, objectURL);
                return objectURL;
            }
        } else {
            return defaultIcon;
        }
    }

    /**
     * 将会话属性转换为文档块 IAL
     * @param session 会话属性
     * @param remove 是否移除空属性
     */
    public session2ial(
        session: Session.IModel,
        remove: boolean = false,
    ): Record<string, string | null> {
        return {
            [CONSTANTS.attrs.session.id]: session.id,
            [CONSTANTS.attrs.session.name]: session.name,
            [CONSTANTS.attrs.session.path]: session.path,
            [CONSTANTS.attrs.session.type]: session.type,
            ...this.kernel2ial(session.kernel, remove),
        };
    }
    /**
     * 将文档块 IAL 转换为会话属性
     * @param ial 块属性
     * @param init 若块属性为空, 是否对其进行初始化
     */
    public ial2session(
        ial: Record<string, string>,
        init: boolean = false,
    ): Session.IModel {
        const count = this.counter.next().value;
        const id = ial[CONSTANTS.attrs.session.id]
            ?? (init
                ? uuid.v4()
                : CONSTANTS.JUPYTER_UNKNOWN_VALUE
            );
        const name = ial[CONSTANTS.attrs.session.name]
            ?? (init
                ? `siyuan-console-${count}`
                : CONSTANTS.JUPYTER_UNKNOWN_VALUE
            );
        const path = ial[CONSTANTS.attrs.session.path]
            ?? (init
                ? `siyuan-console-${count}-${globalThis.Lute.NewNodeID()}`
                : CONSTANTS.JUPYTER_UNKNOWN_VALUE
            );
        const type = ial[CONSTANTS.attrs.session.type]
            ?? (init
                ? "console"
                : CONSTANTS.JUPYTER_UNKNOWN_VALUE
            );
        const kernel = this.ial2kernel(ial, init);

        return {
            id,
            type,
            name,
            path,
            kernel,
        };
    }

    /**
     * 将内核属性转换为文档块 IAL
     * @param session 内核属性
     * @param remove 是否移除空属性
     */
    public kernel2ial(
        kernel: Kernel.IModel | null,
        remove: boolean = false,
    ): Record<string, string | null | undefined> {
        const kernelspec = (kernel && this.kernelspecs.kernelspecs[kernel.name]) || undefined;
        return {
            [CONSTANTS.attrs.kernel.id]: kernel?.id
                ?? (remove
                    ? null
                    : undefined
                ),
            [CONSTANTS.attrs.kernel.name]: kernel?.name
                ?? (remove
                    ? null
                    : undefined
                ),
            [CONSTANTS.attrs.kernel.language]: kernelspec?.language
                ?? (remove
                    ? null
                    : undefined
                ),
            [CONSTANTS.attrs.kernel.display_name]: kernelspec?.display_name
                ?? (remove
                    ? null
                    : undefined
                ),
        };
    }
    /**
     * 将文档块 IAL 转换为内核属性
     * @param ial 块属性
     * @param init 若为空是否使用默认值
     */
    public ial2kernel(
        ial: Record<string, string>,
        init: boolean = false,
    ): Kernel.IModel | null {
        const id = ial[CONSTANTS.attrs.kernel.id]
            ?? (init
                ? uuid.v4()
                : CONSTANTS.JUPYTER_UNKNOWN_VALUE
            );
        const name = ial[CONSTANTS.attrs.kernel.name]
            ?? (init
                ? this.kernelspecs.default
                : CONSTANTS.JUPYTER_UNKNOWN_VALUE
            );

        return {
            id,
            name,
        };
    }

    /**
     * 构造 jupyter 文档菜单
     * @param id 文档块 ID
     * @param ial 文档块 IAL
     * @param session 菜单项上下文
     * @param context 菜单项上下文
     * @returns 菜单项列表
     */
    public buildJupyterDocumentMenuItems(
        id: string,
        ial: Record<string, string>,
        session: Session.IModel | undefined,
        context: TMenuContext,
    ): siyuan.IMenuItemOption[] {
        const submenu: siyuan.IMenuItemOption[] = [];

        const session_ial = this.ial2session(ial, false);
        const kernel_name = session?.kernel?.name
            ?? session_ial.kernel!.name;
        const kernel_language = this.kernelName2language.get(kernel_name)
            ?? ial[CONSTANTS.attrs.kernel.language]
            ?? CONSTANTS.JUPYTER_UNKNOWN_VALUE;
        const kernel_display_name = this.kernelName2displayName.get(kernel_name)
            ?? ial[CONSTANTS.attrs.kernel.display_name]
            ?? CONSTANTS.JUPYTER_UNKNOWN_VALUE;

        /* 会话管理 */
        submenu.push({
            icon: "icon-jupyter-client-session",
            label: this.i18n.menu.session.label,
            accelerator: session // 当前连接的会话名称
                ? fn__code(session.name)
                : undefined,
            submenu: [
                { // 会话设置
                    icon: "iconSettings",
                    label: this.i18n.menu.session.submenu.settings.label,
                    click: () => {
                        const dialog = new siyuan.Dialog({
                            title: `Jupyter ${this.i18n.settings.sessionSettings.title} <code class="fn__code">${this.name}</code>`,
                            content: `<div id="${this.SETTINGS_DIALOG_ID}" class="fn__flex-column" />`,
                            width: FLAG_MOBILE ? "92vw" : "720px",
                        });
                        const target = dialog.element.querySelector(`#${this.SETTINGS_DIALOG_ID}`);
                        if (target) {
                            const manager = new SessionManager({
                                target,
                                props: {
                                    docID: id,
                                    docIAL: ial,
                                    plugin: this,
                                },
                            });
                            manager.$on("cancel", (e: ComponentEvents<SessionManager>["cancel"]) => {
                                dialog.destroy();
                            });
                            manager.$on("confirm", (e: ComponentEvents<SessionManager>["confirm"]) => {
                                dialog.destroy();
                                this.updateDockFocusItem(id);
                            });
                        }
                    },
                },
                { // 关闭会话
                    icon: "iconRefresh",
                    label: this.i18n.menu.session.submenu.shutdown.label,
                    disabled: !session,
                    click: () => {
                        if (session) {
                            this.bridge?.call<WorkerHandlers["jupyter.sessions.shutdown"]>(
                                "jupyter.sessions.shutdown",
                                session.id,
                            )
                        }
                    },
                },
                {
                    type: "separator",
                },
                {
                    type: "readonly",
                    iconHTML: "",
                    label: this.i18n.menu.session.submenu.info.label
                        .replaceAll("${1}", fn__code(session?.id ?? session_ial.id))
                        .replaceAll("${2}", fn__code(session?.name ?? session_ial.name))
                        .replaceAll("${3}", fn__code(session?.path ?? session_ial.path))
                        .replaceAll("${4}", fn__code(session?.type ?? session_ial.type)),
                    disabled: !session,
                },
            ],
        });

        /* 内核管理 */
        submenu.push({
            icon: "icon-jupyter-client-kernel",
            label: this.i18n.menu.kernel.label,
            accelerator: session?.kernel // 当前连接的内核名称
                ? fn__code(session.kernel.name)
                : undefined,
            submenu: [
                { // 重新连接
                    icon: "iconRefresh",
                    label: this.i18n.menu.kernel.submenu.reconnect.label,
                    disabled: !session?.kernel,
                    click: async () => {
                        if (session?.kernel) {
                            await this.bridge?.call<WorkerHandlers["jupyter.session.kernel.connection.reconnect"]>(
                                "jupyter.session.kernel.connection.reconnect", //
                                session.id, //
                            );
                        }
                    },
                },
                { // 中断内核
                    icon: "iconPause",
                    label: this.i18n.menu.kernel.submenu.interrupt.label,
                    disabled: !session?.kernel,
                    click: async () => {
                        if (session?.kernel) {
                            await this.bridge?.call<WorkerHandlers["jupyter.session.kernel.connection.interrupt"]>(
                                "jupyter.session.kernel.connection.interrupt", //
                                session.id, //
                            );
                        }
                    },
                },
                { // 重启内核
                    icon: "iconRefresh",
                    label: this.i18n.menu.kernel.submenu.restart.label,
                    disabled: !session?.kernel,
                    click: async () => {
                        if (session?.kernel) {
                            await this.bridge?.call<WorkerHandlers["jupyter.session.kernel.connection.restart"]>(
                                "jupyter.session.kernel.connection.restart", //
                                session.id, //
                            );
                        }
                    },
                },
                { // 关闭内核
                    icon: "iconClose",
                    label: this.i18n.menu.kernel.submenu.shutdown.label,
                    disabled: !session?.kernel,
                    click: async () => {
                        if (session?.kernel) {
                            await this.bridge?.call<WorkerHandlers["jupyter.session.kernel.connection.shutdown"]>(
                                "jupyter.session.kernel.connection.shutdown", //
                                session.id, //
                            );
                        }
                    },
                },
                {
                    type: "separator",
                },
                {
                    type: "readonly",
                    iconHTML: "",
                    label: this.i18n.menu.kernel.submenu.info.label
                        .replaceAll("${1}", fn__code(session?.kernel?.id ?? session_ial.kernel!.id))
                        .replaceAll("${2}", fn__code(kernel_name))
                        .replaceAll("${3}", fn__code(kernel_language))
                        .replaceAll("${4}", fn__code(kernel_display_name)),
                    disabled: !session?.kernel,
                },
            ],
        });

        submenu.push({ type: "separator" });

        /* 运行 */
        submenu.push({
            icon: "iconPlay",
            label: this.i18n.menu.run.label,
            submenu: [
                { // 运行所有单元格
                    icon: "iconPlay",
                    label: this.i18n.menu.run.submenu.all.label,
                    disabled: !session?.kernel,
                    submenu: this.buildExecuteMenuItems(
                        false,
                        session,
                        context,
                    ),
                },
                { // 重启内核并运行所有单元格
                    icon: "iconRefresh",
                    label: this.i18n.menu.run.submenu.restart.label,
                    accelerator: this.i18n.menu.run.submenu.restart.accelerator,
                    disabled: !session?.kernel,
                    submenu: this.buildExecuteMenuItems(
                        true,
                        session,
                        context,
                    ),
                },
            ],
        });

        submenu.push({ type: "separator" });

        /* *.ipynb 文件导入 */
        submenu.push({
            icon: "iconUpload",
            label: this.i18n.menu.import.label,
            accelerator: fn__code(this.i18n.menu.import.accelerator),
            submenu: [
                { // 覆写
                    element: globalThis.document.createElement("div"), // 避免生成其他内容
                    bind: element => {
                        /* 挂载一个 svelte 菜单项组件 */
                        const item = new Item({
                            target: element,
                            props: {
                                file: true,
                                icon: "#iconEdit",
                                label: this.i18n.menu.import.submenu.override.label,
                                accept: ".ipynb",
                                multiple: false,
                                webkitdirectory: false,
                            },
                        });

                        item.$on("selected", async (e: ComponentEvents<Item>["selected"]) => {
                            // this.plugin.logger.debug(e);
                            const files = e.detail.files;
                            const file = files.item(0);
                            if (file) {
                                await this.bridge?.call<WorkerHandlers["importIpynb"]>(
                                    "importIpynb",
                                    id,
                                    file,
                                    "override",
                                );
                            }
                        });
                    },
                },
                { // 追加
                    element: globalThis.document.createElement("div"), // 避免生成其他内容
                    bind: element => {
                        /* 挂载一个 svelte 菜单项组件 */
                        const item = new Item({
                            target: element,
                            props: {
                                file: true,
                                icon: "#iconAfter",
                                label: this.i18n.menu.import.submenu.append.label,
                                accept: ".ipynb",
                                multiple: false,
                                webkitdirectory: false,
                            },
                        });

                        item.$on("selected", async e => {
                            // this.plugin.logger.debug(e);
                            const files = e.detail.files;
                            const file = files.item(0);
                            if (file) {
                                await this.bridge?.call<WorkerHandlers["importIpynb"]>(
                                    "importIpynb",
                                    id,
                                    file,
                                    "append",
                                );
                            }
                        });
                    },
                },
            ],
        });

        return submenu;
    }

    /**
     * 构造运行菜单
     * @param restart 是否重启内核
     * @param session 菜单项上下文
     * @param context 菜单项上下文
     * @returns 菜单项列表
     */
    public buildExecuteMenuItems(
        restart: boolean,
        session: Session.IModel | undefined,
        context: TMenuContext,
    ): siyuan.IMenuItemOption[] {
        const disabled = !session?.kernel;
        const flag_cell = context.isDocumentBlock || context.isMultiBlock;
        const execute = async (options: IJupyterParserOptions) => {
            if (restart) {
                await this.bridge?.call<WorkerHandlers["jupyter.session.kernel.connection.restart"]>(
                    "jupyter.session.kernel.connection.restart",
                    session!.id,
                );
            }

            const html = await this.getBlockDOM(context);
            const cells = blockDOM2codeCells(html, flag_cell);
            await this.requestExecuteCells(
                cells,
                session!,
                options,
            );
        };

        const buildCntrlMenuItems = (options: IJupyterParserOptions) => {
            const submenu: siyuan.IMenuItemOption[] = [
                {
                    icon: "iconTheme",
                    label: this.i18n.menu.run.submenu.cntrl.enable.label,
                    accelerator: this.i18n.menu.run.submenu.cntrl.enable.accelerator,
                    disabled,
                    click: async () => {
                        options.cntrl = true;
                        await execute(options);
                    },
                },
                {
                    icon: "icon-jupyter-client-text",
                    label: this.i18n.menu.run.submenu.cntrl.disable.label,
                    accelerator: this.i18n.menu.run.submenu.cntrl.disable.accelerator,
                    disabled,
                    click: async () => {
                        options.cntrl = false;
                        await execute(options);
                    },
                },
            ];
            return submenu;
        };

        const submenu: siyuan.IMenuItemOption[] = [
            {
                icon: "iconPlay",
                label: this.i18n.menu.run.submenu.custom.label,
                disabled,
                click: async () => {
                    const options = this.config.jupyter.execute.output.parser;
                    await execute(options);
                },
            },
            {
                icon: "iconCode",
                label: this.i18n.menu.run.submenu.terminal.label,
                accelerator: fn__code("Xterm"),
                disabled,
                click: async () => {
                    const options = { xterm: true, escaped: false, cntrl: false };
                    await execute(options);
                },
            },
            {
                icon: "icon-jupyter-client-text",
                label: this.i18n.menu.run.submenu.escape.enable.label,
                accelerator: this.i18n.menu.run.submenu.escape.enable.accelerator,
                disabled,
                submenu: buildCntrlMenuItems({ xterm: false, escaped: true, cntrl: true }),
            },
            {
                icon: "iconMarkdown",
                label: this.i18n.menu.run.submenu.escape.disable.label,
                accelerator: this.i18n.menu.run.submenu.escape.disable.accelerator,
                disabled,
                submenu: buildCntrlMenuItems({ xterm: false, escaped: false, cntrl: true }),
            },
        ];
        return submenu;
    }

    /**
     * 构造文档打开菜单
     * @param id 文档块 ID
     * @returns 菜单项列表
     */
    public buildOpenDocumentMenuItems(
        id: string,
    ): siyuan.IMenuItemOption[] {
        const submenu: siyuan.IMenuItemOption[] = [];

        /* 在新页签中打开 */
        submenu.push({
            icon: "iconAdd",
            label: this.i18n.menu.openTab.label,
            click: () => {
                siyuan.openTab({
                    app: this.app,
                    doc: {
                        id,
                        action: [
                            "cb-get-focus", // 光标定位到块
                            "cb-get-hl", // 高亮块
                        ],
                    },
                    keepCursor: false, // 焦点跳转到新 tab
                    removeCurrentTab: false, // 不移除原页签
                });
            },
        });
        /* 在后台页签中打开 */
        submenu.push({
            icon: "iconMin",
            label: this.i18n.menu.openTabBackground.label,
            click: () => {
                siyuan.openTab({
                    app: this.app,
                    doc: {
                        id,
                        action: [
                            "cb-get-focus", // 光标定位到块
                            "cb-get-hl", // 高亮块
                        ],
                    },
                    keepCursor: true, // 焦点不跳转到新 tab
                    removeCurrentTab: false, // 不移除原页签
                });
            },
        });
        /* 在页签右侧打开 */
        submenu.push({
            icon: "iconLayoutRight",
            label: this.i18n.menu.openTabRight.label,
            click: () => {
                siyuan.openTab({
                    app: this.app,
                    doc: {
                        id,
                        action: [
                            "cb-get-focus", // 光标定位到块
                            "cb-get-hl", // 高亮块
                        ],
                    },
                    position: "right",
                    keepCursor: false, // 焦点跳转到新 tab
                    removeCurrentTab: false, // 不移除原页签
                });
            },
        });
        /* 在页签下侧打开 */
        submenu.push({
            icon: "iconLayoutBottom",
            label: this.i18n.menu.openTabBottom.label,
            click: () => {
                siyuan.openTab({
                    app: this.app,
                    doc: {
                        id,
                        action: [
                            "cb-get-focus", // 光标定位到块
                            "cb-get-hl", // 高亮块
                        ],
                    },
                    position: "bottom",
                    keepCursor: false, // 焦点跳转到新 tab
                    removeCurrentTab: false, // 不移除原页签
                });
            },
        });

        return submenu;
    }

    /**
     * 请求运行代码块
     * @param code 代码
     * @param codeID 代码块 ID
     * @param sessionID 会话 ID
     * @param options 代码块解析选项
     * @param goto 运行时跳转到对应的代码块
     */
    protected async requestExecuteCell(
        code: string,
        codeID: string,
        sessionID: string,
        options: IJupyterParserOptions,
        goto: boolean = this.config.jupyter.execute.goto,
    ): Promise<void> {
        await this.bridge?.call<WorkerHandlers["jupyter.session.kernel.connection.requestExecute"]>(
            "jupyter.session.kernel.connection.requestExecute",
            this.clientId,
            code,
            codeID,
            sessionID,
            options,
            goto,
        );
    }

    /**
     * 请求运行多个代码块
     * @param blocks 按照执行顺序排序的多个代码块
     * @param session 会话
     * @param options 代码块解析选项
     * @param goto 运行时跳转到对应的代码块
     */
    protected async requestExecuteCells(
        cells: ICodeCell[],
        session: Session.IModel,
        options: IJupyterParserOptions,
        goto: boolean = this.config.jupyter.execute.goto,
    ): Promise<void> {
        for (const cele of cells) {
            /* 运行该代码块 */
            await this.requestExecuteCell(
                cele.code,
                cele.id,
                session.id,
                options,
                goto,
            );
        }
    }

    /**
     * 运行所选代码块
     * @returns 所选代码块
     */
    protected async executeSelectedCellBlocks(): Promise<ICodeCellBlocks> {
        const blocks = getActiveCellBlocks();
        if (blocks.cells.length > 0) {
            const cell = blocks.cells[0];
            const response = await this.client.getBlockInfo({
                id: cell.id,
            });
            const session = this.doc2session.get(response.data.rootID);
            if (session) {
                await this.requestExecuteCells(
                    blocks.cells,
                    session,
                    this.config.jupyter.execute.output.parser,
                    false,
                );
            }
            else {
                // 当前文档未连接会话
                this.siyuan.showMessage(this.i18n.messages.sessionNotConnected.text);
            }
        }
        else {
            // 未选择有效的块
            this.siyuan.showMessage(this.i18n.messages.noValidBlockSelected.text);
        }
        return blocks;
    }

    /**
     * 获取下一个代码单元格
     * @param blocks 当前选择的块
     * @returns 下一个代码单元格的块 ID
     */
    protected async getNextCodeCell(blocks: ICodeCellBlocks): Promise<void | ICodeCell> {
        const last_cell = blocks.cells.at(-1);
        if (last_cell) {
            /* 获取最后一个单元格所在文档 */
            const response_getBlockInfo = await this.client.getBlockInfo({
                id: last_cell.id,
            });
            const block_info = response_getBlockInfo.data;

            /* 获取文档内容 */
            const response_getDoc = await this.client.getDoc({ id: block_info.rootID });
            const html = response_getDoc.data.content;

            /* 获取下一个代码单元格 ID */
            const cells = blockDOM2codeCells(html, true);
            const current_cell_index = cells.findIndex(cell => cell.id === last_cell.id);
            if (current_cell_index >= 0) {
                const next_cell = cells.at(current_cell_index + 1);
                return next_cell;
            }
        }
    }

    /**
     * 插入一个新的代码单元格
     * @param blocks 当前选择的块
     * @returns 新代码块块信息
     */
    protected async insertNewCodeCell(blocks: ICodeCellBlocks): Promise<
        void
        | sdk.types.kernel.api.block.insertBlock.IOperation
        | sdk.types.kernel.api.block.appendBlock.IOperation
    > {
        const payload: sdk.types.kernel.api.block.insertBlock.IPayload = {
            data: buildNewCodeCell(),
            dataType: "markdown",
        };

        switch (blocks.elements.length) {
            case 0: { // 插入到当前块后
                const id = getCurrentBlockID();
                if (id) { // 成功获取到当前块
                    payload.previousID = id;
                    break;
                }
                else return;
            }
            default: { // 插入到所选择的块后
                const element = blocks.elements.at(-1)!;
                if (!isSiyuanBlock(element)) return;

                if (isCodeCell(element)) { // 所选块为代码单元格
                    const nextElement = element.nextElementSibling;
                    switch (true) {
                        case isOutputCell(nextElement): // 下一个块为输出单元格
                            payload.previousID = (nextElement as HTMLElement).dataset.nodeId; // 插入到下一个块后
                            break;

                        case isCodeCell(nextElement): // 下一个块为代码单元格
                        case isSiyuanBlock(nextElement): // 下一个块为思源块
                            payload.nextID = (nextElement as HTMLElement).dataset.nodeId; // 插入到下一个块前
                            break;

                        default: { // 该块为当前容器最后一个块
                            const parentElement = element.parentElement;
                            let parentID;
                            switch (true) {
                                case isSiyuanDocument(parentElement): { // 上层是文档块
                                    const previousElement = parentElement?.previousElementSibling;
                                    if (isSiyuanDocumentTitle(previousElement)) {
                                        parentID = (parentElement as HTMLElement).dataset.nodeId! // 追加到容器块末尾
                                        break;
                                    }
                                    else return;
                                }

                                case isSiyuanBlock(parentElement): // 上层也是思源块
                                    parentID = (parentElement as HTMLElement).dataset.nodeId!; // 追加到容器块末尾
                                    break;

                                default:
                                    return;
                            }
                            try {
                                /* 在容器后方插入块 */
                                const response = await this.client.appendBlock({
                                    ...payload,
                                    parentID,
                                });
                                return response.data[0]?.doOperations[0];
                            }
                            catch (error) {
                                return;
                            }
                        }
                    }
                }
                else { // 所选块非代码单元格
                    payload.previousID = element.dataset.nodeId; // 插入到该块后
                    break;
                }
                break;
            }
        }

        try {
            /* 在指定块前/后插入块 */
            const response = await this.client.insertBlock(payload);
            return response.data[0]?.doOperations[0];
        }
        catch (error) {
            return;
        }
    }

    /**
     * 转到块
     * @param id 块 ID
     * @param heightlight 是否高亮块
     * @param afterOpen 打开后回调
     */
    public async gotoBlock(
        id: BlockID,
        heightlight: boolean = true,
        afterOpen?: () => void | Promise<void>,
    ): Promise<void> {
        await siyuan.openTab({
            app: this.app,
            doc: {
                id,
                action: [
                    heightlight
                        ? "cb-get-hl" // 高亮块
                        : "cb-get-focus", // 光标定位到块
                ],
            },
            keepCursor: false, // 焦点跳转到新 tab
            removeCurrentTab: false, // 不移除原页签
            afterOpen,
        });
    }

    /**
     * 获取块 DOM
     * @param context 菜单项上下文
     * @returns 块 DOM 字符串
     */
    protected async getBlockDOM(
        context: TMenuContext,
    ): Promise<string> {
        var html: string;
        if (context.isDocumentBlock) { // 文档块
            const response = await this.client.getDoc({ id: context.id });
            html = response.data.content;
        }
        else { // 非文档块
            const htmls: string[] = [];
            for (const block of context.blocks) {
                htmls.push(block.element.outerHTML);
            }
            html = htmls.join("");
        }
        return html;
    }

    /* 更新侧边栏当前文档对应的项 */
    protected updateDockFocusItem(docID: BlockID): void {
        const session = this.doc2session.get(docID);
        this.jupyterDock.component?.$set({
            currentSpec: session?.kernel?.name,
            currentKernel: session?.kernel?.id,
            currentSession: session?.id,
            currentDocument: docID,
        });
    }

    /* 块菜单菜单弹出事件监听器 */
    protected readonly blockMenuEventListener = (e: IClickBlockIconEvent | IClickEditorTitleIconEvent) => {
        // this.logger.debug(e);

        const detail = e.detail;
        const context = getBlockMenuContext(detail); // 获取块菜单上下文
        if (context) {
            const session = this.doc2session.get(context.protyle.block.rootID!);
            const submenu: siyuan.IMenuItemOption[] = [];
            if (context.isDocumentBlock) { // 文档块菜单
                submenu.push(...this.buildJupyterDocumentMenuItems(
                    context.id,
                    context.data.ial,
                    session,
                    context,
                ));
            }
            else { // 其他块菜单
                submenu.push(...this.buildExecuteMenuItems(
                    false,
                    session,
                    context,
                ));
            }

            detail.menu.addItem({
                submenu,
                icon: "icon-jupyter-client-simple",
                label: this.i18n.displayName,
                accelerator: this.name,
            });

            this.updateDockFocusItem(context.protyle.block.rootID!);
        }
    };

    /* 编辑器点击事件监听器 */
    protected readonly clickEditorContentEventListener = (e: IClickEditorContentEvent) => {
        // this.logger.debug(e);
        const protyle = e.detail.protyle;
        if (protyle.background?.ial?.[CONSTANTS.attrs.kernel.language]) {
            if (globalThis.siyuan?.storage) {
                /* 设置代码块语言 */
                globalThis.siyuan.storage["local-codelang"] = protyle.background.ial[CONSTANTS.attrs.kernel.language];
            }
        }

        this.updateDockFocusItem(protyle.block.rootID!);
    }

    /**
     * 请求输入
     * @param blockID 块 ID
     * @param clientID 客户端 ID
     * @param prompt 输入提示
     */
    public readonly inputRequest = async (
        blockID: BlockID,
        clientID: string,
        prompt: string = "",
    ) => {
        if (clientID === this.clientId) {
            /* 定位到请求输入块 */
            if (this.config.jupyter.execute.input.goto) {
                await this.gotoBlock(blockID);
            }

            try {
                /* 输入框 */
                const value = await asyncPrompt(
                    this.siyuan.Dialog,
                    {
                        title: this.i18n.messages.inputRequest.title,
                        text: prompt
                            ? fn__code(prompt)
                            : undefined,
                        cancel: () => false,
                    },
                );
                return value;
            } catch (error) {
                return;
            }
        }
    }

    /* 内核清单更改 */
    public readonly updateKernelSpecs = (kernelspecs: KernelSpec.ISpecModels) => {
        // this.logger.debug(kernelspecs);

        Object.assign(this.kernelspecs, kernelspecs);
        for (const [name, spec] of Object.entries(kernelspecs.kernelspecs)) {
            if (spec) {
                this.kernelName2language.set(name, spec.language);
                this.kernelName2displayName.set(name, spec.display_name);
            }
        }
        this.jupyterDock.component?.$set({
            kernelspecs,
        });
    }

    /* 活动的内核列表更改 */
    public readonly updateKernels = (kernels: Kernel.IModel[]) => {
        // this.logger.debug(kernels);

        this.kernels.length = 0;
        this.kernels.push(...kernels);
        this.jupyterDock.component?.$set({
            kernels,
        });
    }

    /* 活动的会话列表更改 */
    public readonly updateSessions = (sessions: Session.IModel[]) => {
        // this.logger.debug(sessions);

        const session_id_set = new Set(sessions.map(s => s.id));
        for (const session_id of this.session2docs.keys()) {
            if (!session_id_set.has(session_id)) {
                /* 删除已被关闭的会话 */
                const doc_set = this.session2docs.get(session_id);
                if (doc_set) {
                    doc_set.forEach(id => this.doc2session.delete(id)); // 删除 doc ID -> session model
                }
                this.session2docs.delete(session_id); // 删除 session ID -> doc ID set
            }
        }

        this.sessions.length = 0;
        this.sessions.push(...sessions);
        this.jupyterDock.component?.$set({
            sessions,
        });
    }
};
