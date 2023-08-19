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
    import type { I18N } from "@/utils/i18n";

    export let config: IConfig; // 传入的配置项
    export let plugin: InstanceType<typeof Plugin>; // 插件实例

    const i18n = plugin.i18n as unknown as I18N;

    $: placeholder_wsUrl = getWsUrl(config.jupyter.server.settings.baseUrl);

    async function updated() {
        await plugin.updateConfig(config);
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
        jupyter, // 服务设置
    }

    enum TabKey {
        global, // 全局设置
        service, // 服务设置
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
                            await updated();
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
                            await updated();
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
                            await updated();
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
                            await updated();
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
                            await updated();
                        }}
                    />
                </Item>
            </div>
        </Tabs>
    </Panel>
</Panels>

<style lang="less">
</style>
