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

import type { Logger } from "@workspace/utils/logger";
import type { IJupyterServerSettings } from "@/types/config";

export class Jupyter extends ServiceManager {
    constructor(
        settings: IJupyterServerSettings,
        protected readonly logger: InstanceType<typeof Logger>,
        protected readonly kernelSpecsChangedEventListener: (manager: KernelSpec.IManager, models: KernelSpec.ISpecModels) => void,
        protected readonly kernelsChangedEventListener: (manager: Kernel.IManager, models: Kernel.IModel[]) => void,
        protected readonly sessionsChangedEventListener: (manager: Session.IManager, models: Session.IModel[]) => void,
    ) {
        super({
            serverSettings: makeSettings(settings),
        });
        this.onload();
    }

    protected onload(): void {
        this.connectionFailure.connect(this.errorEventListener);

        this.kernelspecs.specsChanged.connect(this.kernelSpecsChangedEventListener);
        this.kernelspecs.connectionFailure.connect(this.errorEventListener);

        this.kernels.runningChanged.connect(this.kernelsChangedEventListener);
        this.kernels.connectionFailure.connect(this.errorEventListener);

        this.sessions.runningChanged.connect(this.sessionsChangedEventListener);
        this.sessions.connectionFailure.connect(this.errorEventListener);
    }

    protected unload(): void {
        this.connectionFailure.disconnect(this.errorEventListener);

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
                this.logger.warn(error);
            }
        });

        try {
            super.dispose();
        } catch (error) {
            this.logger.warn(error);
        }
    }
}
