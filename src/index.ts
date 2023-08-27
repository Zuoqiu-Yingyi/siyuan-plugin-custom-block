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
import type { ISiyuanGlobal } from "@workspace/types/siyuan";

import manifest from "~/public/plugin.json";

import "./index.less";
import icon_jupyter_client from "./assets/symbols/icon-jupyter-client.symbol?raw";
import icon_jupyter_client_simple from "./assets/symbols/icon-jupyter-client-simple.symbol?raw";
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

import {
    Client,
    type types,
} from "@siyuan-community/siyuan-sdk";

import Item from "@workspace/components/siyuan/menu/Item.svelte"
import Settings from "./components/Settings.svelte";
import JupyterDock from "./components/JupyterDock.svelte";
import SessionManager from "./components/SessionManager.svelte";

import {
    FLAG_MOBILE,
} from "@workspace/utils/env/front-end";
import {
    getBlockMenuContext,
} from "@workspace/utils/siyuan/menu/block";
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

import type { I18N } from "./utils/i18n";
import type { IConfig } from "./types/config";
import type {
    KernelSpec,
    Kernel,
    Session,
} from "@jupyterlab/services";
import type {
    IClickBlockIconEvent,
    IClickEditorTitleIconEvent,
} from "@workspace/types/siyuan/events";
import type {
    THandlersWrapper,
} from "@workspace/utils/worker/bridge";
import type { WorkerHandlers } from "./workers/jupyter";
import type { ComponentEvents } from "svelte";

declare var globalThis: ISiyuanGlobal;
export type PluginHandlers = THandlersWrapper<TemplatePlugin["handlers"]>;

export default class TemplatePlugin extends siyuan.Plugin {
    static readonly GLOBAL_CONFIG_NAME = "global-config";

    declare public readonly i18n: I18N;

    public readonly siyuan = siyuan;
    public readonly logger: InstanceType<typeof Logger>;
    public readonly client: InstanceType<typeof Client>;

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
    public readonly doc2info = new Map<string, types.kernel.api.block.getDocInfo.IData>(); // 文档 ID 到文档信息的映射
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
        this.client = new Client(undefined, "fetch");

        this.SETTINGS_DIALOG_ID = `${this.name}-settings-dialog`;
        this.handlers = {
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
    }

    onload(): void {
        // this.logger.debug(this);

        /* 注册图标 */
        this.addIcons([
            icon_jupyter_client,
            icon_jupyter_client_simple,
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

        this.loadData(TemplatePlugin.GLOBAL_CONFIG_NAME)
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
                    await this.bridge?.call<WorkerHandlers["onload"]>("onload");
                    await this.updateWorkerConfig();
                }

                this.eventBus.on("click-editortitleicon", this.blockMenuEventListener);
                this.eventBus.on("click-blockicon", this.blockMenuEventListener);
            });
    }

    onLayoutReady(): void {
        // @ts-ignore
        // globalThis.jupyter = new Jupyter(
        //     this.config.jupyter.server.settings,
        //     this.logger,
        //     (...args: any[]) => null,
        //     (...args: any[]) => null,
        //     (...args: any[]) => null,
        // );
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
    public async resetConfig(): Promise<void> {
        return this.updateConfig(mergeIgnoreArray(DEFAULT_CONFIG) as IConfig);
    }

    /* 更新插件配置 */
    public async updateConfig(config?: IConfig): Promise<void> {
        if (config && config !== this.config) {
            this.config = config;
        }
        await this.updateWorkerConfig();
        await this.saveData(TemplatePlugin.GLOBAL_CONFIG_NAME, this.config);
    }

    /* 初始化通讯桥 */
    protected initBridge(): void {
        this.bridge?.terminate();
        this.bridge = new WorkerBridgeMaster(
            new BroadcastChannel(CONSTANTS.JUPYTER_WORKER_BROADCAST_CHANNEL_NAME),
            this.logger,
            this.handlers,
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
    public async updateWorkerConfig(): Promise<void> {
        await this.bridge?.call<WorkerHandlers["updateConfig"]>(
            "updateConfig",
            this.config,
        );
        await this.bridge?.call<WorkerHandlers["restart"]>("restart");
    }

    /**
     * jupyter 请求
     */
    public jupyterFetch(
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
     * @returns 菜单项列表
     */
    public buildJupyterDocumentMenuItems(
        id: string,
        ial: Record<string, string>,
    ): siyuan.IMenuItemOption[] {
        const submenu: siyuan.IMenuItemOption[] = [];

        const session = this.doc2session.get(id);
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
                    click: () => {
                        // TODO: 运行所有单元格
                    },
                },
                { // 重启内核并运行所有单元格
                    icon: "iconRefresh",
                    label: this.i18n.menu.run.submenu.restart.label,
                    accelerator: this.i18n.menu.run.submenu.restart.accelerator,
                    disabled: !session?.kernel,
                    click: () => {
                        // TODO: 重启内核并运行所有单元格
                    },
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
                    keepCursor: false, // 焦点不跳转到新 tab
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
                    keepCursor: false, // 焦点不跳转到新 tab
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
                    keepCursor: false, // 焦点不跳转到新 tab
                    removeCurrentTab: false, // 不移除原页签
                });
            },
        });

        return submenu;
    }

    /* 块菜单菜单弹出事件监听器 */
    protected readonly blockMenuEventListener = (e: IClickBlockIconEvent | IClickEditorTitleIconEvent) => {
        // this.logger.debug(e);

        const detail = e.detail;
        const context = getBlockMenuContext(detail); // 获取块菜单上下文
        if (context) {
            const submenu: siyuan.IMenuItemOption[] = [];
            if (context.isDocumentBlock) {
                submenu.push(...this.buildJupyterDocumentMenuItems(context.id, context.data.ial));
            }

            detail.menu.addItem({
                submenu,
                icon: "icon-jupyter-client-simple",
                label: this.i18n.displayName,
                accelerator: this.name,
            });
        }
    };

    /**
     * 加载内核图标
     * @param spec 内核清单
     * @param defaultIcon 默认图标
     * @returns 内核图标引用 ID
     */
    async loadKernelSpecIcon(
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
