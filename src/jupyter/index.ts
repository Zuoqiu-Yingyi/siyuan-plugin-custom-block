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

import * as jupyterlab from "@jupyterlab/services";
import { makeSettings } from "./settings";

import type { Logger } from "@workspace/utils/logger";
import type { IJupyterServerSettings } from "@/types/config";

/**
 * 裁剪后的 {@link jupyterlab.ServiceManager}
 */
export class Jupyter
    implements Omit<
        jupyterlab.ServiceManager,
        "connectionFailure"
        | "settings"
        | "builder"
        | "contents"
        | "events"
        | "terminals"
        | "user"
        | "workspaces"
        | "nbconvert"
    > {

    /**
     * 服务设置
     * {@inheritDoc jupyterlab.ServiceManager.serverSettings}
     * @see {@link jupyterlab.ServiceManager.serverSettings}
     */
    public readonly serverSettings: jupyterlab.ServerConnection.ISettings;

    /**
     * 内核清单管理
     * {@inheritDoc jupyterlab.ServiceManager.kernelspecs}
     * @see {@link jupyterlab.ServiceManager.kernelspecs}
     */
    public readonly kernelspecs: jupyterlab.KernelSpec.IManager;

    /**
     * 内核管理
     * {@inheritDoc jupyterlab.ServiceManager.kernels}
     * @see {@link jupyterlab.ServiceManager.kernels}
     */
    public readonly kernels: jupyterlab.Kernel.IManager;

    /**
     * 会话管理
     * {@inheritDoc jupyterlab.ServiceManager.sessions}
     * @see {@link jupyterlab.ServiceManager.sessions}
     */
    public readonly sessions: jupyterlab.Session.IManager;

    /**
     * 实例是否销毁
     * {@inheritDoc jupyterlab.ServiceManager._isDisposed}
     * @see {@link jupyterlab.ServiceManager._isDisposed}
     */
    protected _isDisposed = false;

    /**
     * 实例是否就绪
     * {@inheritDoc jupyterlab.ServiceManager._readyPromise}
     * @see {@link jupyterlab.ServiceManager._readyPromise}
     */
    protected _readyPromise: Promise<void>;

    /**
     * 实例是否就绪
     * {@inheritDoc jupyterlab.ServiceManager._isReady}
     * @see {@link jupyterlab.ServiceManager._isReady}
     */
    protected _isReady = false;

    constructor(
        settings: IJupyterServerSettings,
        protected readonly logger: InstanceType<typeof Logger>,
        protected readonly kernelSpecsChangedEventListener: (manager: jupyterlab.KernelSpec.IManager, models: jupyterlab.KernelSpec.ISpecModels) => void,
        protected readonly kernelsChangedEventListener: (manager: jupyterlab.Kernel.IManager, models: jupyterlab.Kernel.IModel[]) => void,
        protected readonly sessionsChangedEventListener: (manager: jupyterlab.Session.IManager, models: jupyterlab.Session.IModel[]) => void,
    ) {
        this.serverSettings = makeSettings(settings);
        const normalized = {
            serverSettings: this.serverSettings,
        };

        this.kernelspecs = new jupyterlab.KernelSpecManager(normalized);
        this.kernels = new jupyterlab.KernelManager(normalized);
        this.sessions = new jupyterlab.SessionManager({
            ...normalized,
            kernelManager: this.kernels,
        });

        const readyList = [
            this.sessions.ready,
            this.kernelspecs.ready,
        ];
        this._readyPromise = Promise.all(readyList).then(() => {
            this._isReady = true;
        });

        this.onload();
    }

    /**
     * 实例是否销毁
     * {@inheritDoc jupyterlab.ServiceManager.ready}
     * @see {@link jupyterlab.ServiceManager.ready}
     */
    public get ready(): Promise<void> {
        return this._readyPromise;
    }

    /**
     * 实例是否销毁
     * {@inheritDoc jupyterlab.ServiceManager.isReady}
     * @see {@link jupyterlab.ServiceManager.isReady}
     */
    public get isReady(): boolean {
        return this._isReady;
    }

    /**
     * 实例是否销毁
     * {@inheritDoc jupyterlab.ServiceManager.isDisposed}
     * @see {@link jupyterlab.ServiceManager.isDisposed}
     */
    public get isDisposed(): boolean {
        return this._isDisposed;
    }


    /**
     * 资源销毁
     * {@inheritDoc jupyterlab.ServiceManager.dispose}
     * @see {@link jupyterlab.ServiceManager.dispose}
     */
    public dispose(): void {
        if (this._isDisposed) return;

        this.unload();

        [
            this.kernelspecs,
            this.sessions,
            this.kernels,

            // this.user,
            // this.contents,
            // this.events,
            // this.terminals,
        ].forEach(prop => {
            try {
                prop.dispose();
            } catch (error) {
                this.logger.warn(error);
            }
        });
        this._isDisposed = true;
    }

    /* 刷新状态 */
    public async refresh(): Promise<void> {
        await Promise.allSettled([
            this.kernelspecs.refreshSpecs(),
            this.kernels.refreshRunning(),
            this.sessions.refreshRunning(),
        ]);
    }

    protected onload(): void {
        this.kernelspecs.specsChanged.connect(this.kernelSpecsChangedEventListener);
        this.kernelspecs.connectionFailure.connect(this.errorEventListener);

        this.kernels.runningChanged.connect(this.kernelsChangedEventListener);
        this.kernels.connectionFailure.connect(this.errorEventListener);

        this.sessions.runningChanged.connect(this.sessionsChangedEventListener);
        this.sessions.connectionFailure.connect(this.errorEventListener);
    }

    protected unload(): void {
        this.kernelspecs.specsChanged.disconnect(this.kernelSpecsChangedEventListener);
        this.kernelspecs.connectionFailure.disconnect(this.errorEventListener);

        this.kernels.runningChanged.disconnect(this.kernelsChangedEventListener);
        this.kernels.connectionFailure.disconnect(this.errorEventListener);

        this.sessions.runningChanged.disconnect(this.sessionsChangedEventListener);
        this.sessions.connectionFailure.disconnect(this.errorEventListener);
    }

    protected readonly errorEventListener = (...args: any[]) => {
        this.logger.warn(...args);
    }
}
