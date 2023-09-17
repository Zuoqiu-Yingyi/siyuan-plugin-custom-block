<!--
 Copyright (C) 2023 Zuoqiu Yingyi
 
 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.
 
 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.
 
 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
-->

<script
    context="module"
    lang="ts"
>
    import type { ISiyuanGlobal } from "@workspace/types/siyuan";
    declare var globalThis: ISiyuanGlobal;
</script>

<script lang="ts">
    import Bar from "@workspace/components/siyuan/dock/Bar.svelte";
    import { TooltipsDirection } from "@workspace/components/siyuan/misc/tooltips";

    import type { IBar } from "@workspace/components/siyuan/dock/index";
    import type JupyterClientPlugin from "@/index";
    import type { XtermOutputElement } from "./XtermOutputElement";

    /* 标题栏配置 */
    export let plugin: InstanceType<typeof JupyterClientPlugin>; // 插件对象
    export let stream: string = ""; // 使用 base64 编码的数据流

    let xterm: XtermOutputElement;

    const bar: IBar = {
        logo: "#icon-jupyter-client-inspect",
        title: plugin.i18n.inspectDock.title,
        icons: [
            {
                // 最小化
                icon: "#iconMin",
                type: "min",
                ariaLabel: `${globalThis.siyuan.languages.min} ${plugin.siyuan.adaptHotkey("⌘W")}`,
                tooltipsDirection: TooltipsDirection.sw,
            },
        ],
    };
</script>

<Bar {...bar} />
<jupyter-xterm-output
    bind:this={xterm}
    data-stream={stream}
    class="xtrem fn__flex-1"
/>

<style lang="less">
    .xtrem {
        padding: 0.5em;
    }
</style>
