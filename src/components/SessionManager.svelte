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
    import type { WorkerHandlers } from "../workers/jupyter";

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

    let session_new: ISessionModel = plugin.ial2session(docIAL, true); // 待新建的会话
    let session: ISessionModel = session_new;

    let flag_session_new: boolean = true; // 当前会话是否为新建会话
    let flag_session_running: boolean = false; // 当前会话是否为正在运行的会话
    let flag_session_connected: boolean = false; // 当前会话是否为已连接的会话
    updateFlag(session);

    $: updateFlag(session);

    function updateFlag(s: ISessionModel) {
        const running = plugin.isSessionRunning(s.id);
        flag_session_new = !running;
        flag_session_running = running;
        flag_session_connected = plugin.doc2session.has(docID);
    }

    /* 可选的会话列表 */
    const session_options = plugin.sessions.map(s => ({
        key: s.id,
        text: s.name,
    }));

    /* 判断对应的会话是否正在运行 */
    if (flag_session_running) {
        // 对应的会话正在运行
        /* 添加一个全新的创建会话选项 */
        session_new = plugin.ial2session({}, true);
        session_options.unshift({
            key: session_new.id,
            text: i18n.settings.sessionSettings.connect.options.new.text,
        });
        session = plugin.sessions.find(s => s.id === session.id) ?? session; // 获取对应的会话
    } else {
        // 非运行的会话
        /* 以文档属性中保存的信息创建会话 */
        session_options.unshift({
            key: session.id,
            text: i18n.settings.sessionSettings.connect.options.new.text,
        });
    }

    /* 可选的内核列表 */
    const kernel_options: { key: string; text: string }[] = []; // 包含复用内核
    const kernel_options_new: { key: string; text: string }[] = []; // 不包含复用内核
    /* 禁用内核 */
    kernel_options.push({
        key: "",
        text: `⏹ ${i18n.settings.sessionSettings.kernel.options.no.text}`,
    });
    /* 启动内核 */
    kernel_options.push(
        ...Array.from(Object.values(plugin.kernelspecs.kernelspecs))
            .filter(k => k !== undefined)
            .map(k => ({
                key: k!.name,
                text: `▶ ${i18n.settings.sessionSettings.kernel.options.new.text} [${k!.language}] ${k!.name}: ${k!.display_name}`,
            })),
    );
    kernel_options_new.push(...kernel_options);
    /* 使用内核 */
    kernel_options.push(
        ...plugin.sessions
            .filter(s => s.kernel)
            .map(s => {
                const spec = plugin.kernelspecs.kernelspecs[s.kernel!.name];
                return {
                    key: s.kernel!.id,
                    text: `♻ ${i18n.settings.sessionSettings.kernel.options.use.text} [${spec?.language}] ${spec?.name}: ${s.name}`,
                };
            }),
    );

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
        try {
            var session_model: Session.IModel | undefined = session;
            if (flag_session_new) {
                if (session.kernel) {
                    // 创建会话并连接
                    session_model = await plugin.bridge?.call<WorkerHandlers["jupyter.sessions.startNew"]>(
                        "jupyter.sessions.startNew",
                        docID,
                        {
                            name: session.name,
                            type: session.type,
                            path: session.path,
                            kernel: {
                                name: session.kernel.name,
                            },
                        },
                        {
                            username: plugin.username,
                            clientId: plugin.clientId,
                        },
                    );
                }
            } else if (!flag_session_connected) {
                if (session.kernel) {
                    // 连接已有会话
                    session_model = await plugin.bridge?.call<WorkerHandlers["jupyter.sessions.connectTo"]>(
                        "jupyter.sessions.connectTo", //
                        docID,
                        {
                            model: session,
                            username: plugin.username,
                            clientId: plugin.newClientId,
                        },
                    );
                }
            } else {
                // 更新发生更改的会话信息
                const session_old = plugin.doc2session.get(docID);
                if (session_old) {
                    if (session.name !== session_old.name) {
                        // 更新会话名称
                        session_model = await plugin.bridge?.call<WorkerHandlers["jupyter.session.connection.setName"]>(
                            "jupyter.session.connection.setName", //
                            session.id, //
                            session.name, //
                        );
                    }
                    if (session.path !== session_old.path) {
                        // 更新会话路径
                        session_model = await plugin.bridge?.call<WorkerHandlers["jupyter.session.connection.setPath"]>(
                            "jupyter.session.connection.setPath", //
                            session.id, //
                            session.path, //
                        );
                    }
                    if (session.type !== session_old.type) {
                        // 更新会话类型
                        session_model = await plugin.bridge?.call<WorkerHandlers["jupyter.session.connection.setType"]>(
                            "jupyter.session.connection.setType", //
                            session.id, //
                            session.type, //
                        );
                    }
                    if (session.kernel) {
                        if (!session_old.kernel || session.kernel.name !== session_old.kernel.name) {
                            // 更换内核为新内核
                            session_model = await plugin.bridge?.call<WorkerHandlers["jupyter.session.connection.changeKernel"]>(
                                "jupyter.session.connection.changeKernel", //
                                session.id, //
                                { name: session.kernel.name }, //
                            );
                        } else if (!session_old.kernel || session.kernel.id !== session_old.kernel.id) {
                            // 更换内核为其他会话的内核
                            session_model = await plugin.bridge?.call<WorkerHandlers["jupyter.session.connection.changeKernel"]>(
                                "jupyter.session.connection.changeKernel", //
                                session.id, //
                                { id: session.kernel.id }, //
                            );
                        }
                    } else {
                        // 禁用内核
                        session_model = await plugin.bridge?.call<WorkerHandlers["jupyter.session.connection.changeKernel"]>(
                            "jupyter.session.connection.changeKernel", //
                            session.id, //
                            {}, //
                        );
                    }
                }
            }

            if (session_model) {
                // 会话创建并连接成功
                session = session_model;
                plugin.relateDoc2Session(docID, session_model);
            } else {
                // 客户端未初始化
                plugin.siyuan.showMessage(i18n.messages.uninitialized.text, undefined, "error");
                return;
            }

            // 写入文档块属性
            await plugin.client.setBlockAttrs({
                id: docID,
                attrs: plugin.session2ial(session, true),
            });
        } catch (error) {
            // 会话创建/连接失败
            plugin.logger.warn(error);
            plugin.siyuan.showMessage(String(error), undefined, "error");
            return;
        }

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
                    if (session_id === session_options[0].key) {
                        session = session_new;
                    } else {
                        const session_selected = plugin.sessions.find(s => s.id === session_id);
                        if (session_selected) {
                            // 连接已存在的会话
                            session = session_selected;
                        }
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
                settingKey="session.kernel"
                settingValue={session.kernel // 是否禁用内核
                    ? plugin.kernels.find(k => k.id === session.kernel?.id)?.id ?? // 使用内核
                      session.kernel?.name ?? // 启动内核
                      plugin.kernelspecs.default // 默认启动内核
                    : ""}
                options={flag_session_new ? kernel_options_new : kernel_options}
                disabled={flag_session_new // 若为新建会话, 可以编辑
                    ? false
                    : !flag_session_connected // 若为未连接且正在运行的会话, 不能编辑
                    ? true
                    : false}
                on:changed={async e => {
                    const key = e.detail.value;
                    if (key === "") {
                        // 禁用内核
                        session.kernel = null;
                        if (flag_session_new) {
                            session_new.kernel = null;
                        }
                    } else if (plugin.kernels.some(k => k.id === key)) {
                        // 使用内核
                        if (session.kernel) {
                            session.kernel.id = key;
                        }
                        if (flag_session_new) {
                            if (session_new.kernel) {
                                session_new.kernel.id = key;
                            }
                        }
                    } else {
                        // 新建内核, 为了避免 key 与已有内核重复, 重新生成内核 id
                        const kernel_id_new = uuid.v4();
                        if (session.kernel) {
                            session.kernel.id = kernel_id_new;
                            session.kernel.name = key;
                        }
                        if (flag_session_new) {
                            if (session_new.kernel) {
                                session_new.kernel.id = kernel_id_new;
                                session_new.kernel.name = key;
                            }
                        }
                    }
                }}
            />
        </Item>
    </Panel>
</Dialog>
