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
    import { createEventDispatcher, type ComponentEvents } from "svelte";

    import Dialog from "@workspace/components/siyuan/dialog/Dialog.svelte";
    import Panel from "@workspace/components/siyuan/setting/panel/Panel.svelte";
    import Item from "@workspace/components/siyuan/setting/item/Item.svelte";
    import Input from "@workspace/components/siyuan/setting/item/Input.svelte";

    import { ItemType } from "@workspace/components/siyuan/setting/item/item";
    import uuid from "@workspace/utils/misc/uuid";

    import type Plugin from "@/index";
    import type { Session } from "@jupyterlab/services";
    import type { BlockID } from "@workspace/types/siyuan";
    import type { ISessionModel } from "@/types/jupyter";

    export let docID: BlockID; // 文档 ID
    export let docIAL: Record<string, string>; // 文档块 IAL
    export let plugin: InstanceType<typeof Plugin>; // 插件实例

    const i18n = plugin.i18n;
    const dispatcher = createEventDispatcher<{
        cancel: {
            id: BlockID;
            event: MouseEvent;
            session: Session.IModel;
        };
        confirm: {
            id: BlockID;
            event: MouseEvent;
            session: Session.IModel;
        };
    }>();

    const session_new: ISessionModel = plugin.ial2session(docIAL, true); // 待新建的会话
    let session: ISessionModel = session_new;

    $: flag_session_new = !plugin.isSessionRunning(session.id); // 当前会话是否为新建会话
    $: flag_session_running = !flag_session_new; // 当前会话是否为正在运行的会话
    $: flag_session_connected = plugin.doc2session.has(docID); // 当前会话是否为已连接的会话

    /* 可选的会话列表 */
    const session_options = plugin.sessions.map(s => ({
        key: s.id,
        text: s.name,
    }));

    /* 可选的内核列表 */
    const kernel_options = Array.from(Object.values(plugin.kernelspecs.kernelspecs))
        .filter(k => k !== undefined)
        .map(k => ({
            key: k!.name,
            text: `[${k!.language}] ${k!.name}: ${k!.display_name}`,
        }));

    /* 判断对应的会话是否正在运行 */
    if (flag_session_running) {
        // 对应的会话正在运行
        /* 添加一个全新的创建会话选项 */
        session_options.unshift({
            key: uuid.v4(),
            text: i18n.settings.sessionSettings.connect.options.new.text,
        });
        session = plugin.sessions.find(s => s.id === session.id)!; // 获取对应的会话
    } else {
        // 无运行的会话
        /* 以文档属性中保存的信息创建会话 */
        session_options.unshift({
            key: session.id,
            text: i18n.settings.sessionSettings.connect.options.new.text,
        });
    }

    /* 点击取消按钮 */
    async function onCancle(e: ComponentEvents<Dialog>["cancel"]) {
        dispatcher("cancel", {
            id: docID,
            event: e.detail.event,
            session,
        });
    }

    /* 点击确认按钮 */
    async function onConfirm(e: ComponentEvents<Dialog>["confirm"]) {
        if (flag_session_new) {
            // TODO: 创建会话
        } else if (!flag_session_connected) {
            // TODO: 连接会话
        } else {
            // TODO: 更新发生更改的会话信息
        }

        // TODO: 获取会话信息
        // TODO: 写入文档块属性
        dispatcher("confirm", {
            id: docID,
            event: e.detail.event,
            session,
        });
    }
</script>

<Dialog
    on:cancel={onCancle}
    on:confirm={onConfirm}
    confirmButtonText={flag_session_new // 是否新建
        ? i18n.settings.sessionSettings.confirm.new
        : !flag_session_connected // 是否未连接
        ? i18n.settings.sessionSettings.confirm.connect
        : i18n.settings.sessionSettings.confirm.update}
>
    <Panel>
        <!-- 连接会话 -->
        <Item
            title={i18n.settings.sessionSettings.connect.title}
            text={i18n.settings.sessionSettings.connect.description}
        >
            <Input
                slot="input"
                type={ItemType.select}
                settingKey="session.id"
                settingValue={session.id}
                options={session_options}
                on:changed={async e => {
                    const session_id = e.detail.value;
                    const session_selected = plugin.sessions.find(s => s.id === session_id);
                    if (session_id === session_options[0].key) {
                        session = session_new;
                    } else if (session_selected) {
                        // 连接已存在的会话
                        session = session_selected;
                    }
                }}
            />
        </Item>

        <!-- 会话名称 -->
        <Item
            title={i18n.settings.sessionSettings.name.title}
            text={i18n.settings.sessionSettings.name.description}
            block={true}
        >
            <Input
                slot="input"
                block={true}
                type={ItemType.text}
                settingKey="session.name"
                settingValue={session.name}
                disabled={flag_session_new // 若为新建会话, 可以编辑
                    ? false
                    : !flag_session_connected // 若为未连接且正在运行的会话, 不能编辑
                    ? true
                    : false}
                on:changed={async e => {
                    const name = e.detail.value;
                    session.name = name;
                    if (flag_session_new) {
                        session_new.name = name;
                    } else if (flag_session_connected) {
                        // TODO: 重命名会话
                    }
                }}
            />
        </Item>

        <!-- 会话路径 -->
        <Item
            title={i18n.settings.sessionSettings.path.title}
            text={i18n.settings.sessionSettings.path.description}
            block={true}
        >
            <Input
                slot="input"
                block={true}
                type={ItemType.text}
                settingKey="session.path"
                settingValue={session.path}
                disabled={flag_session_new // 若为新建会话, 可以编辑
                    ? false
                    : !flag_session_connected // 若为未连接且正在运行的会话, 不能编辑
                    ? true
                    : false}
                on:changed={async e => {
                    const path = e.detail.value;
                    session.path = path;
                    if (flag_session_new) {
                        session_new.path = path;
                    }
                }}
            />
        </Item>

        <!-- 会话类型 -->
        <Item
            title={i18n.settings.sessionSettings.type.title}
            text={i18n.settings.sessionSettings.type.description}
        >
            <Input
                slot="input"
                type={ItemType.select}
                settingKey="session.type"
                settingValue={session.type}
                options={[
                    { key: "console", text: "console" }, //
                    { key: "notebook", text: "notebook" }, //
                ]}
                disabled={flag_session_new // 若为新建会话, 可以编辑
                    ? false
                    : !flag_session_connected // 若为未连接且正在运行的会话, 不能编辑
                    ? true
                    : false}
                on:changed={async e => {
                    const type = e.detail.value;
                    session.type = type;
                    if (flag_session_new) {
                        session_new.type = type;
                    }
                }}
            />
        </Item>

        <!-- 内核选择 -->
        <Item
            title={i18n.settings.sessionSettings.kernel.title}
            text={i18n.settings.sessionSettings.kernel.description}
            block={true}
        >
            <Input
                slot="input"
                block={true}
                type={ItemType.select}
                settingKey="session.kernel.name"
                settingValue={session.kernel?.name ?? plugin.kernelspecs.default}
                options={kernel_options}
                disabled={flag_session_new // 若为新建会话, 可以编辑
                    ? false
                    : !flag_session_connected // 若为未连接且正在运行的会话, 不能编辑
                    ? true
                    : false}
                on:changed={async e => {
                    const kernel_name = e.detail.value;
                    if (session.kernel) {
                        session.kernel.name = kernel_name;
                    }
                    if (flag_session_new) {
                        if (session_new.kernel) {
                            session_new.kernel.name = kernel_name;
                        }
                    }
                }}
            />
        </Item>
    </Panel>
</Dialog>
