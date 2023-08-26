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

<script lang="ts">
    import Panel from "@workspace/components/siyuan/setting/panel/Panel.svelte";
    import Item from "@workspace/components/siyuan/setting/item/Item.svelte";
    import Input from "@workspace/components/siyuan/setting/item/Input.svelte";

    import type Plugin from "@/index";
    import { ItemType } from "@workspace/components/siyuan/setting/item/item";
    import type { Session } from "@jupyterlab/services";

    export let docID: string; // 文档 ID
    export let docIAL: Record<string, string>; // 文档块 IAL
    export let plugin: InstanceType<typeof Plugin>; // 插件实例
    const i18n = plugin.i18n;

    let session: Session.IModel = {
        id: "",
        name: "",
        path: "",
        type: "",
        kernel: null,
    };

    /* 获取文档块属性保存的会话信息 */
    plugin.client.getBlockAttrs({id: docID})
        .then(response => {
            const attrs = response.data;
        });

    /* 获取当前所连接内核的会话信息 */
</script>

<Panel>
    <!-- 连接会话 -->
    <Item
        title={i18n.settings.sessionSettings.connect.title}
        text={i18n.settings.sessionSettings.connect.description}
    >
        <Input
            slot="input"
            type={ItemType.select}
            settingKey="session.name"
            settingValue={i18n.settings.generalSettings.reset.text}
            options={[

            ]}
            on:clicked={async e => {
                // TODO: 设置会话
            }}
        />
    </Item>
</Panel>
