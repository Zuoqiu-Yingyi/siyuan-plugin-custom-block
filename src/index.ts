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

import {
    FLAG_MOBILE,
} from "@workspace/utils/env/front-end";
import {
    getBlockMenuContext,
} from "@workspace/utils/siyuan/menu/block";
import { Logger } from "@workspace/utils/logger";
import { mergeIgnoreArray } from "@workspace/utils/misc/merge";
import { fn__code } from "@workspace/utils/siyuan/text/span";
import { DEFAULT_SETTINGS } from "./jupyter/settings";
import { DEFAULT_CONFIG } from "./configs/default";
import type { I18N } from "./utils/i18n";
import type { IConfig } from "./types/config";
import { Jupyter } from "./jupyter";
import type {
    KernelSpec,
    Kernel,
    Session,
} from "@jupyterlab/services";
import type {
    IClickBlockIconEvent,
    IClickEditorTitleIconEvent,
} from "@workspace/types/siyuan/events";
import { IpynbImport } from "./jupyter/import";
import type { BlockID } from "@workspace/types/siyuan";

export default class TemplatePlugin extends siyuan.Plugin {
    static readonly GLOBAL_CONFIG_NAME = "global-config";

    declare public readonly i18n: I18N;

    public readonly siyuan = siyuan;
    public readonly logger: InstanceType<typeof Logger>;
    public readonly client: InstanceType<typeof Client>;

    protected readonly SETTINGS_DIALOG_ID: string;

    public config: IConfig = DEFAULT_CONFIG;

    public jupyter?: InstanceType<typeof Jupyter>; // jupyter 客户端
    protected jupyterDock: {
        // editor: InstanceType<typeof Editor>,
        dock: ReturnType<siyuan.Plugin["addDock"]>,
        model?: siyuan.IModel,
        component?: InstanceType<typeof JupyterDock>,
    }; // Jupyter 管理面板
    public readonly attrs = {
        kernel: {
            id: "custom-jupyter-kernel-id", // 内核 ID
            name: "custom-jupyter-kernel-name", // 内核名称
            language: "custom-jupyter-kernel-language", // 内核语言
            display_name: 'custom-jupyter-kernel-display-name', // 内核友好名称
        },
        session: {
            id: "custom-jupyter-session-id", // 会话 ID
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
    } as const; // 块属性
    public readonly styles = {
        success: 'color: var(--b3-card-success-color); background-color: var(--b3-card-success-background);',
        info: 'color: var(--b3-card-info-color); background-color: var(--b3-card-info-background);',
        warning: 'color: var(--b3-card-warning-color); background-color: var(--b3-card-warning-background);',
        error: 'color: var(--b3-card-error-color); background-color: var(--b3-card-error-background);',
    } as const; // 样式

    constructor(options: any) {
        super(options);

        this.logger = new Logger(this.name);
        this.client = new Client(undefined, "fetch");

        this.SETTINGS_DIALOG_ID = `${this.name}-settings-dialog`;
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

                    (this.element as HTMLElement).classList.add("fn__flex-column");
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
            .finally(() => {
                this.eventBus.on("click-editortitleicon", this.blockMenuEventListener);
                this.eventBus.on("click-blockicon", this.blockMenuEventListener);
            });
    }

    onLayoutReady(): void {
        globalThis.jupyter = this;
        this.jupyter = this.config.jupyter.server.enable
            ? new Jupyter(this, this.config.jupyter.server.settings)
            : undefined;
    }

    onunload(): void {
        this.eventBus.off("click-editortitleicon", this.blockMenuEventListener);
        this.eventBus.off("click-blockicon", this.blockMenuEventListener);
    }

    openSetting(): void {
        const that = this;
        const dialog = new siyuan.Dialog({
            title: `${this.i18n.displayName} <code class="fn__code">${this.name}</code>`,
            content: `<div id="${that.SETTINGS_DIALOG_ID}" class="fn__flex-column" />`,
            width: FLAG_MOBILE ? "92vw" : "720px",
            height: FLAG_MOBILE ? undefined : "640px",
        });
        const settings = new Settings({
            target: dialog.element.querySelector(`#${that.SETTINGS_DIALOG_ID}`),
            props: {
                config: this.config,
                plugin: this,
            },
        });
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

        this.jupyter?.dispose();
        this.jupyter = this.config.jupyter.server.enable
            ? new Jupyter(this, this.config.jupyter.server.settings)
            : undefined;

        await this.saveData(TemplatePlugin.GLOBAL_CONFIG_NAME, this.config);
    }

    public get baseUrl(): string {
        return this.config?.jupyter.server.settings.baseUrl || DEFAULT_SETTINGS.baseUrl;
    }

    public get newNodeID(): string {
        return globalThis.Lute.NewNodeID();
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

    /* 块菜单菜单弹出事件监听器 */
    protected readonly blockMenuEventListener = (e: IClickBlockIconEvent | IClickEditorTitleIconEvent) => {
        // this.logger.debug(e);

        const detail = e.detail;
        const context = getBlockMenuContext(detail); // 获取块菜单上下文
        if (context) {
            const submenu: siyuan.IMenuItemOption[] = [];
            if (context.isDocumentBlock) {
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
                                        label: this.i18n.menu.override.label,
                                        accept: ".ipynb",
                                        multiple: false,
                                        webkitdirectory: false,
                                    },
                                });

                                item.$on("selected", async e => {
                                    // this.plugin.logger.debug(e);
                                    const files = e.detail.files;
                                    if (files.length > 0) {
                                        const file = files.item(0);
                                        await this.importIpynb(
                                            context.id,
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
                                        label: this.i18n.menu.append.label,
                                        accept: ".ipynb",
                                        multiple: false,
                                        webkitdirectory: false,
                                    },
                                });

                                item.$on("selected", async e => {
                                    // this.plugin.logger.debug(e);
                                    const files = e.detail.files;
                                    if (files.length > 0) {
                                        const file = files.item(0);
                                        await this.importIpynb(
                                            context.id,
                                            file,
                                            "append",
                                        );
                                    }
                                });
                            },
                        },
                    ]
                })
                submenu.push();
            }

            detail.menu.addItem({
                submenu,
                icon: "icon-jupyter-client-simple",
                label: this.i18n.displayName,
                accelerator: this.name,
            });
        }
    };

    /* 内核清单更改 */
    public readonly kernelSpecsChangedEventListener = (manager: KernelSpec.IManager, models: KernelSpec.ISpecModels) => {
        // this.logger.debug(models);
        this.jupyterDock.component?.$set({
            kernelspecs: models,
        });
    }

    /* 活动的内核列表更改 */
    public readonly kernelsChangedEventListener = (manager: Kernel.IManager, models: Kernel.IModel[]) => {
        // this.logger.debug(models);
        this.jupyterDock.component?.$set({
            kernels: models,
        });
    }

    /* 活动的会话列表更改 */
    public readonly sessionsChangedEventListener = (manager: Session.IManager, models: Session.IModel[]) => {
        // this.logger.debug(models);
        this.jupyterDock.component?.$set({
            sessions: models,
        });
    }

    /**
     * 导入 *.ipynb 文件
     * @param id 文档块 ID
     * @param file 文件
     * @param type 写入类型
     */
    public async importIpynb(
        id: BlockID,
        file: File,
        type: "override" | "append",
    ): Promise<void> {
        const ipynb_import = new IpynbImport(this);
        await ipynb_import.loadFile(file)
        await ipynb_import.parse();
        const kramdown = ipynb_import.kramdown;
        const attrs = ipynb_import.attrs;

        /* 设置文档块属性 */
        await this.client.setBlockAttrs({
            id,
            attrs,
        });

        /* 更改文档块内容 */
        switch (type) {
            case "override":
                await this.client.updateBlock({
                    id,
                    data: kramdown,
                    dataType: "markdown",
                });
                break;
            case "append":
                await this.client.appendBlock({
                    parentID: id,
                    data: kramdown,
                    dataType: "markdown",
                });
                break;
        }
    }
};
