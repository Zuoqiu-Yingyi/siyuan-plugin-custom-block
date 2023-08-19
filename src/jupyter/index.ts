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
    ServiceManager,
    type KernelSpec,
    type Kernel,
    type Session,
} from "@jupyterlab/services";
import { makeSettings } from "./settings";

import type Plugin from "@/index";
import type { IJupyterServerSettings } from "../types/config";

export class Jupyter extends ServiceManager {
    constructor(
        protected plugin: InstanceType<typeof Plugin>,
        settings: IJupyterServerSettings,
    ) {
        super({
            serverSettings: makeSettings(settings),
        });
        this.onload();
    }

    protected onload(): void {
        this.kernelspecs.specsChanged.connect(this.plugin.kernelSpecsChangedEventListener);
        this.kernelspecs.connectionFailure.connect(this.errorEventListener);

        this.kernels.runningChanged.connect(this.plugin.kernelsChangedEventListener);
        this.kernels.connectionFailure.connect(this.errorEventListener);

        this.sessions.runningChanged.connect(this.plugin.sessionsChangedEventListener);
        this.sessions.connectionFailure.connect(this.errorEventListener);
    }

    protected unload(): void {
        this.kernelspecs.specsChanged.disconnect(this.plugin.kernelSpecsChangedEventListener);
        this.kernelspecs.connectionFailure.disconnect(this.errorEventListener);

        this.kernels.runningChanged.disconnect(this.plugin.kernelsChangedEventListener);
        this.kernels.connectionFailure.disconnect(this.errorEventListener);

        this.sessions.runningChanged.disconnect(this.plugin.sessionsChangedEventListener);
        this.sessions.connectionFailure.disconnect(this.errorEventListener);
    }

    protected readonly errorEventListener = (...args) => {
        this.plugin.logger.warns(...args);
    }

    /* 刷新状态 */
    public async refresh(): Promise<void> {
        await Promise.allSettled([
            this.kernelspecs.refreshSpecs(),
            this.kernels.refreshRunning(),
            this.sessions.refreshRunning(),
        ]);
    }

    /* 资源销毁 */
    dispose(): void {
        this.unload();

        [
            this.kernels,
            this.kernelspecs,
            this.user,

            // this.contents,
            // this.events,
            // this.sessions,
            // this.terminals,
        ].forEach(prop => {
            try {
                prop.dispose();
            } catch (error) {
                this.plugin.logger.warn(error);
            }
        });

        try {
            super.dispose();
        } catch (error) {
            this.plugin.logger.warn(error);
        }
    }
}
