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

import Settings from "./components/Settings.svelte";
import JupyterDock from "./components/JupyterDock.svelte";

import {
    FLAG_MOBILE,
} from "@workspace/utils/env/front-end";
import { Logger } from "@workspace/utils/logger";
import { mergeIgnoreArray } from "@workspace/utils/misc/merge";
import { DEFAULT_CONFIG } from "./configs/default";
import type { I18N } from "./utils/i18n";
import type { IConfig } from "./types/config";
import { Jupyter } from "./jupyter";
import type {
    KernelSpec,
    Kernel,
    Session,
} from "@jupyterlab/services";
import { DEFAULT_SETTINGS } from "./jupyter/settings";

export default class TemplatePlugin extends siyuan.Plugin {
    static readonly GLOBAL_CONFIG_NAME = "global-config";

    declare public readonly i18n: I18N;

    public readonly siyuan = siyuan;
    public readonly logger: InstanceType<typeof Logger>;
    public readonly client: InstanceType<typeof Client>;

    protected readonly SETTINGS_DIALOG_ID: string;

    protected config: IConfig = DEFAULT_CONFIG;

    public jupyter?: InstanceType<typeof Jupyter>; // jupyter 客户端
    protected jupyterDock: {
        // editor: InstanceType<typeof Editor>,
        dock: ReturnType<siyuan.Plugin["addDock"]>,
        model?: siyuan.IModel,
        component?: InstanceType<typeof JupyterDock>,
    }; // Jupyter 管理面板

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
            });
    }

    onLayoutReady(): void {
        globalThis.jupyter = this;
        this.jupyter = this.config.jupyter.server.enable
            ? new Jupyter(this, this.config.jupyter.server.settings)
            : undefined;
    }

    onunload(): void {
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
};
