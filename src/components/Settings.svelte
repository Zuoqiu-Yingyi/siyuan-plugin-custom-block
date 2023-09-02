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

<!-- 设置面板 -->

<script lang="ts">
    import Panels from "@workspace/components/siyuan/setting/panel/Panels.svelte";
    import Panel from "@workspace/components/siyuan/setting/panel/Panel.svelte";
    import Tabs from "@workspace/components/siyuan/setting/tab/Tabs.svelte";
    import Item from "@workspace/components/siyuan/setting/item/Item.svelte";
    import Input from "@workspace/components/siyuan/setting/item/Input.svelte";

    import { ItemType } from "@workspace/components/siyuan/setting/item/item";
    import { type ITab } from "@workspace/components/siyuan/setting/tab";

    import { DEFAULT_SETTINGS, getWsUrl } from "@/jupyter/settings";
    import type Plugin from "@/index";

    import type { IConfig } from "@/types/config";

    export let config: IConfig; // 传入的配置项
    export let plugin: InstanceType<typeof Plugin>; // 插件实例

    const i18n = plugin.i18n;

    $: placeholder_wsUrl = getWsUrl(config.jupyter.server.settings.baseUrl);

    /**
     * 更新并保存设置项
     * @param restart 是否需要重启 juptyer 客户端
     */
    async function updated(restart: boolean = false) {
        await plugin.updateConfig(config, restart);
    }

    function resetOptions() {
        plugin.siyuan.confirm(
            i18n.settings.generalSettings.reset.title, // 标题
            i18n.settings.generalSettings.reset.description, // 文本
            async () => {
                await plugin.resetConfig(); // 重置配置
                globalThis.location.reload(); // 刷新页面
            }, // 确认按钮回调
        );
    }

    enum PanelKey {
        general, // 常规设置
        jupyter, // Jupyter 设置
        xterm, // Xterm 设置
    }

    enum TabKey {
        global, // 全局设置
        service, // 服务设置
        execute, // 运行设置
        output, // 输出设置
        import, // 导入设置
    }

    let panels_focus_key = PanelKey.general;
    const panels: ITab[] = [
        {
            key: PanelKey.general,
            text: i18n.settings.generalSettings.title,
            name: i18n.settings.generalSettings.title,
            icon: "#iconSettings",
        },
        {
            key: PanelKey.jupyter,
            text: i18n.settings.jupyterSettings.title,
            name: i18n.settings.jupyterSettings.title,
            icon: "#icon-jupyter-client",
        },
        {
            key: PanelKey.xterm,
            text: i18n.settings.xtermSettings.title,
            name: i18n.settings.xtermSettings.title,
            icon: "#icon-jupyter-client-terminal",
        },
    ];

    let jupyter_settings_tabs_focus_key = TabKey.global;
    const tabs = {
        jupyter: [
            {
                key: TabKey.global,
                text: i18n.settings.jupyterSettings.globalTab.title,
                name: i18n.settings.jupyterSettings.globalTab.title,
                icon: "⚙",
            },
            {
                key: TabKey.service,
                text: i18n.settings.jupyterSettings.serviceTab.title,
                name: i18n.settings.jupyterSettings.serviceTab.title,
                icon: "🌐",
            },
            {
                key: TabKey.execute,
                text: i18n.settings.jupyterSettings.executeTab.title,
                name: i18n.settings.jupyterSettings.executeTab.title,
                icon: "▶",
            },
            {
                key: TabKey.output,
                text: i18n.settings.jupyterSettings.outputTab.title,
                name: i18n.settings.jupyterSettings.outputTab.title,
                icon: "🖨️",
            },
            {
                key: TabKey.import,
                text: i18n.settings.jupyterSettings.importTab.title,
                name: i18n.settings.jupyterSettings.importTab.title,
                icon: "📤︎",
            },
        ] as ITab[],
    };
</script>

<Panels
    {panels}
    focus={panels_focus_key}
    let:focus={focusPanel}
>
    <!-- 常规设置面板 -->
    <Panel display={panels[0].key === focusPanel}>
        <!-- 重置设置 -->
        <Item
            title={i18n.settings.generalSettings.reset.title}
            text={i18n.settings.generalSettings.reset.description}
        >
            <Input
                slot="input"
                type={ItemType.button}
                settingKey="Reset"
                settingValue={i18n.settings.generalSettings.reset.text}
                on:clicked={resetOptions}
            />
        </Item>
    </Panel>

    <!-- jupyter 设置面板 -->
    <Panel display={panels[1].key === focusPanel}>
        <Tabs
            focus={jupyter_settings_tabs_focus_key}
            tabs={tabs.jupyter}
            let:focus={focusTab}
        >
            <!-- 标签页 1 - 全局设置 -->
            <div
                data-type={tabs.jupyter[0].name}
                class:fn__none={tabs.jupyter[0].key !== focusTab}
            >
                <!-- connect -->
                <Item
                    title={i18n.settings.jupyterSettings.globalTab.enable.title}
                    text={i18n.settings.jupyterSettings.globalTab.enable.description}
                >
                    <Input
                        slot="input"
                        type={ItemType.checkbox}
                        settingKey="enable"
                        settingValue={config.jupyter.server.enable}
                        on:changed={async e => {
                            config.jupyter.server.enable = e.detail.value;
                            await updated(true);
                        }}
                    />
                </Item>
            </div>

            <!-- 标签页 2 - 服务设置 -->
            <div
                data-type={tabs.jupyter[1].name}
                class:fn__none={tabs.jupyter[1].key !== focusTab}
            >
                <!-- base url -->
                <Item
                    title={i18n.settings.jupyterSettings.serviceTab.baseUrl.title}
                    text={i18n.settings.jupyterSettings.serviceTab.baseUrl.description}
                    block={true}
                >
                    <Input
                        slot="input"
                        type={ItemType.text}
                        settingKey="baseUrl"
                        settingValue={config.jupyter.server.settings.baseUrl}
                        placeholder={DEFAULT_SETTINGS.baseUrl}
                        block={true}
                        on:changed={async e => {
                            config.jupyter.server.settings.baseUrl = e.detail.value;
                            await updated(true);
                        }}
                    />
                </Item>

                <!-- app url -->
                <Item
                    title={i18n.settings.jupyterSettings.serviceTab.appUrl.title}
                    text={i18n.settings.jupyterSettings.serviceTab.appUrl.description}
                    block={true}
                >
                    <Input
                        slot="input"
                        type={ItemType.text}
                        settingKey="appUrl"
                        settingValue={config.jupyter.server.settings.appUrl}
                        placeholder={DEFAULT_SETTINGS.appUrl}
                        block={true}
                        on:changed={async e => {
                            config.jupyter.server.settings.appUrl = e.detail.value;
                            await updated(true);
                        }}
                    />
                </Item>

                <!-- websocket url -->
                <Item
                    title={i18n.settings.jupyterSettings.serviceTab.wsUrl.title}
                    text={i18n.settings.jupyterSettings.serviceTab.wsUrl.description}
                    block={true}
                >
                    <Input
                        slot="input"
                        type={ItemType.text}
                        settingKey="wsUrl"
                        settingValue={config.jupyter.server.settings.wsUrl}
                        placeholder={placeholder_wsUrl}
                        block={true}
                        on:changed={async e => {
                            config.jupyter.server.settings.wsUrl = e.detail.value;
                            await updated(true);
                        }}
                    />
                </Item>

                <!-- token -->
                <Item
                    title={i18n.settings.jupyterSettings.serviceTab.token.title}
                    text={i18n.settings.jupyterSettings.serviceTab.token.description}
                    block={true}
                >
                    <Input
                        slot="input"
                        type={ItemType.text}
                        settingKey="token"
                        settingValue={config.jupyter.server.settings.token}
                        block={true}
                        on:changed={async e => {
                            config.jupyter.server.settings.token = e.detail.value;
                            await updated(true);
                        }}
                    />
                </Item>
            </div>

            <!-- 标签页 3 - 运行设置 -->
            <div
                data-type={tabs.jupyter[2].name}
                class:fn__none={tabs.jupyter[2].key !== focusTab}
            >
                <!-- 运行时跳转 -->
                <Item
                    title={i18n.settings.jupyterSettings.executeTab.executeGoto.title}
                    text={i18n.settings.jupyterSettings.executeTab.executeGoto.description}
                >
                    <Input
                        slot="input"
                        type={ItemType.checkbox}
                        settingKey="goto"
                        settingValue={config.jupyter.execute.goto}
                        on:changed={async e => {
                            config.jupyter.execute.goto = e.detail.value;
                            await updated();
                        }}
                    />
                </Item>

                <!-- 输入时跳转 -->
                <Item
                    title={i18n.settings.jupyterSettings.executeTab.inputGoto.title}
                    text={i18n.settings.jupyterSettings.executeTab.inputGoto.description}
                >
                    <Input
                        slot="input"
                        type={ItemType.checkbox}
                        settingKey="input.goto"
                        settingValue={config.jupyter.execute.input.goto}
                        on:changed={async e => {
                            config.jupyter.execute.input.goto = e.detail.value;
                            await updated();
                        }}
                    />
                </Item>

                <!-- 错误中断 -->
                <Item
                    title={i18n.settings.jupyterSettings.executeTab.stopOnError.title}
                    text={i18n.settings.jupyterSettings.executeTab.stopOnError.description}
                >
                    <Input
                        slot="input"
                        type={ItemType.checkbox}
                        settingKey="content.stop_on_error"
                        settingValue={config.jupyter.execute.content.stop_on_error}
                        on:changed={async e => {
                            config.jupyter.execute.content.stop_on_error = e.detail.value;
                            await updated();
                        }}
                    />
                </Item>
            </div>

            <!-- 标签页 4 - 输出设置 -->
            <div
                data-type={tabs.jupyter[3].name}
                class:fn__none={tabs.jupyter[3].key !== focusTab}
            >
                <!-- 使用 Xterm 渲染输出内容 -->
                <Item
                    title={i18n.settings.jupyterSettings.outputTab.xterm.title}
                    text={i18n.settings.jupyterSettings.outputTab.xterm.description}
                >
                    <Input
                        slot="input"
                        type={ItemType.checkbox}
                        settingKey="output.parser.xterm"
                        settingValue={config.jupyter.execute.output.parser.xterm}
                        on:changed={async e => {
                            config.jupyter.execute.output.parser.xterm = e.detail.value;
                            await updated();
                        }}
                    />
                </Item>

                <!-- 转义标志符号 -->
                <Item
                    title={i18n.settings.jupyterSettings.outputTab.escaped.title}
                    text={i18n.settings.jupyterSettings.outputTab.escaped.description}
                >
                    <Input
                        slot="input"
                        type={ItemType.checkbox}
                        settingKey="output.parser.escaped"
                        settingValue={config.jupyter.execute.output.parser.escaped}
                        on:changed={async e => {
                            config.jupyter.execute.output.parser.escaped = e.detail.value;
                            await updated();
                        }}
                    />
                </Item>

                <!-- 解析控制字符 -->
                <Item
                    title={i18n.settings.jupyterSettings.outputTab.cntrl.title}
                    text={i18n.settings.jupyterSettings.outputTab.cntrl.description}
                >
                    <Input
                        slot="input"
                        type={ItemType.checkbox}
                        settingKey="output.parser.cntrl"
                        settingValue={config.jupyter.execute.output.parser.cntrl}
                        on:changed={async e => {
                            config.jupyter.execute.output.parser.cntrl = e.detail.value;
                            await updated();
                        }}
                    />
                </Item>
            </div>

            <!-- 标签页 5 - 导入设置 -->
            <div
                data-type={tabs.jupyter[4].name}
                class:fn__none={tabs.jupyter[4].key !== focusTab}
            >
                <!-- 使用 Xterm 渲染输出内容 -->
                <Item
                    title={i18n.settings.jupyterSettings.importTab.xterm.title}
                    text={i18n.settings.jupyterSettings.importTab.xterm.description}
                >
                    <Input
                        slot="input"
                        type={ItemType.checkbox}
                        settingKey="import.parser.xterm"
                        settingValue={config.jupyter.import.parser.xterm}
                        on:changed={async e => {
                            config.jupyter.import.parser.xterm = e.detail.value;
                            await updated();
                        }}
                    />
                </Item>

                <!-- 转义标志符号 -->
                <Item
                    title={i18n.settings.jupyterSettings.importTab.escaped.title}
                    text={i18n.settings.jupyterSettings.importTab.escaped.description}
                >
                    <Input
                        slot="input"
                        type={ItemType.checkbox}
                        settingKey="import.parser.escaped"
                        settingValue={config.jupyter.import.parser.escaped}
                        on:changed={async e => {
                            config.jupyter.import.parser.escaped = e.detail.value;
                            await updated();
                        }}
                    />
                </Item>

                <!-- 解析控制字符 -->
                <Item
                    title={i18n.settings.jupyterSettings.importTab.cntrl.title}
                    text={i18n.settings.jupyterSettings.importTab.cntrl.description}
                >
                    <Input
                        slot="input"
                        type={ItemType.checkbox}
                        settingKey="import.parser.cntrl"
                        settingValue={config.jupyter.import.parser.cntrl}
                        on:changed={async e => {
                            config.jupyter.import.parser.cntrl = e.detail.value;
                            await updated();
                        }}
                    />
                </Item>
            </div>
        </Tabs>
    </Panel>

    <!-- xterm 设置面板 -->
    <Panel display={panels[2].key === focusPanel}>
        <!-- 字体设置 -->
        <Item
            title={i18n.settings.xtermSettings.fontFamily.title}
            text={i18n.settings.xtermSettings.fontFamily.description}
        >
            <Input
                slot="input"
                type={ItemType.text}
                settingKey="fontFamily"
                settingValue={config.xterm.options.fontFamily}
                on:changed={async e => {
                    config.xterm.options.fontFamily = e.detail.value;
                    await updated();
                }}
            />
        </Item>
    </Panel>
</Panels>

<style lang="less">
</style>
