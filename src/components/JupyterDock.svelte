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
    import { onDestroy, type ComponentEvents } from "svelte";
    import Bar from "@workspace/components/siyuan/dock/Bar.svelte";
    import FileTree from "@workspace/components/siyuan/tree/file/FileTree.svelte";
    import Node from "@workspace/components/siyuan/tree/file/Node.svelte";

    import { TooltipsDirection } from "@workspace/components/siyuan/misc/tooltips";
    import { washMenuItems } from "@workspace/utils/siyuan/menu/wash";
    import moment from "@workspace/utils/date/moment";

    import type { IBar } from "@workspace/components/siyuan/dock/index";
    import type Plugin from "@/index";
    import { FileTreeNodeType, type IFileTreeFileNode, type IFileTreeRootNode } from "@workspace/components/siyuan/tree/file";
    import type { KernelSpec, Kernel, Session } from "@jupyterlab/services";
    import { get } from "svelte/store";

    export let plugin: InstanceType<typeof Plugin>; // 插件对象
    export let kernelspecs: KernelSpec.ISpecModels = {
        default: "",
        kernelspecs: {},
    }; // 内核清单
    export let kernels: Kernel.IModel[] = []; // 活动的内核列表
    export let sessions: Session.IModel[] = []; // 活动的会话列表

    const ROOT_DIRECTORY = "/"; // 根目录

    const KERNELSPECS_DIRECTORY = "/kernelspecs"; // 内核清单目录
    const KERNELSPECS_ICON = "#icon-jupyter-client-kernelspec"; // 内核清单默认图标

    const KERNELS_DIRECTORY = "/kernels"; // 内核目录
    const KERNELS_ICON = "#icon-jupyter-client-kernel"; // 内核默认图标

    const SESSIONS_DIRECTORY = "/sessions"; // 会话目录
    const SESSIONS_ICON = "#icon-jupyter-client-session"; // 会话默认图标

    /* 内核名称 -> object URL */
    const kernelName2objectURL = new Map<string, string>();
    const kernelName2language = new Map<string, string>();

    async function kernelspecs2node(kernelspecs: KernelSpec.ISpecModels): Promise<IFileTreeFileNode[]> {
        const nodes: IFileTreeFileNode[] = [];
        for (const [name, spec] of Object.entries(kernelspecs.kernelspecs)) {
            const node: IFileTreeFileNode = {
                type: FileTreeNodeType.File,
                name,
                path: `${KERNELSPECS_DIRECTORY}/${name}`,
                directory: KERNELSPECS_DIRECTORY,
                icon: KERNELSPECS_ICON,
                text: name,
                textAriaLabel: spec.display_name,
            };

            /* 设置图标 */
            const icon = kernelName2objectURL.get(name);
            if (icon) {
                node.icon = icon;
            } else {
                const pathname = (() => {
                    switch (true) {
                        case "logo-svg" in spec.resources:
                            return spec.resources["logo-svg"];
                        case "logo-32x32" in spec.resources:
                            return spec.resources["logo-32x32"];
                        case "logo-64x64" in spec.resources:
                            return spec.resources["logo-64x64"];
                        default:
                            if (Object.keys(spec.resources).length > 0) {
                                return Object.values(spec.resources)[0];
                            } else {
                                return "";
                            }
                    }
                })();
                if (pathname) {
                    const response = await plugin.jupyterFetch(pathname, {
                        method: "GET",
                    });
                    const blob = await response.blob();
                    const objectURL = URL.createObjectURL(blob);

                    kernelName2objectURL.set(name, objectURL);
                    node.icon = objectURL;
                }
            }
            node.iconAriaLabel = spec.language;
            kernelName2language.set(name, spec.language);

            nodes.push(node);
        }

        return nodes;
    }

    function kernels2node(kernels: Kernel.IModel[]): IFileTreeFileNode[] {
        const nodes: IFileTreeFileNode[] = [];
        for (const kernel of kernels) {
            const datetime = moment(kernel.last_activity);
            nodes.push({
                type: FileTreeNodeType.File,
                name: kernel.id,
                path: `${KERNELS_DIRECTORY}/${kernel.id}`,
                directory: KERNELS_DIRECTORY,
                icon: kernelName2objectURL.get(kernel.name) ?? KERNELS_ICON,
                iconAriaLabel: kernelName2language.get(kernel.name),
                text: kernel.name,
                textAriaLabel: `${datetime.format("YYYY-MM-DD hh:mm:ss")}<br/>${datetime.fromNow()}`,
                count: kernel.connections,
                countAriaLabel: kernel.execution_state,
                title: kernel.id,
            });
        }
        return nodes;
    }

    function sessions2node(sessions: Session.IModel[]): IFileTreeFileNode[] {
        const nodes: IFileTreeFileNode[] = [];
        for (const session of sessions) {
            nodes.push({
                type: FileTreeNodeType.File,
                name: session.id,
                path: `${SESSIONS_DIRECTORY}/${session.id}`,
                directory: SESSIONS_DIRECTORY,

                icon: kernelName2objectURL.get(session.kernel.name) ?? SESSIONS_ICON,
                iconAriaLabel: kernelName2language.get(session.kernel.name),
                text: session.name,
                textAriaLabel: `${session.kernel.name}<br/>${session.path}`,
                symlink: true,
                symlinkIcon: `#icon-jupyter-client-${session.type}`,
                symlinkAriaLabel: session.type,
                count: session.kernel.connections,
                countAriaLabel: session.kernel.execution_state,
                title: session.id,
            });
        }
        return nodes;
    }

    /* 标题栏配置 */
    const bar: IBar = {
        logo: "#icon-jupyter-client",
        title: plugin.i18n.dock.title,
        icons: [
            {
                // 刷新
                icon: "#iconRefresh",
                type: "refresh",
                ariaLabel: plugin.i18n.dock.refresh.ariaLabel,
                tooltipsDirection: TooltipsDirection.sw,
                onClick: (_e, _element, _props) => {
                    plugin.jupyter?.refresh();
                },
            },
            {
                // 最小化
                icon: "#iconMin",
                type: "min",
                ariaLabel: `${globalThis.siyuan.languages.min} ${plugin.siyuan.adaptHotkey("⌘W")}`,
                tooltipsDirection: TooltipsDirection.sw,
            },
        ],
    };

    /* 根节点列表 */
    let roots: IFileTreeRootNode[] = [
        {
            type: FileTreeNodeType.Root,
            name: "kernelspec",
            path: KERNELSPECS_DIRECTORY,
            directory: ROOT_DIRECTORY,
            depth: 0,
            folded: false,
            icon: KERNELSPECS_ICON,
            text: plugin.i18n.dock.kernelspecs.text,
        },
        {
            type: FileTreeNodeType.Root,
            name: "kernels",
            path: KERNELS_DIRECTORY,
            directory: ROOT_DIRECTORY,
            depth: 0,
            folded: false,
            icon: KERNELS_ICON,
            text: plugin.i18n.dock.kernels.text,
        },
        {
            type: FileTreeNodeType.Root,
            name: "sessions",
            path: SESSIONS_DIRECTORY,
            directory: ROOT_DIRECTORY,
            depth: 0,
            folded: false,
            icon: SESSIONS_ICON,
            text: plugin.i18n.dock.sessions.text,
        },
    ];

    /* 动态更新 jupyter 服务状态 */
    $: {
        roots[0].count = Object.keys(kernelspecs.kernelspecs).length;
        kernelspecs2node(kernelspecs).then(children => {
            /* 确保内核图标已加载 */
            roots[0].children = children;
            roots[1].children = kernels2node(kernels);
            roots[2].children = sessions2node(sessions);
        });
    }

    $: {
        roots[1].count = kernels.length;
        roots[1].children = kernels2node(kernels);
    }

    $: {
        roots[2].count = sessions.length;
        roots[2].children = sessions2node(sessions);
    }

    /* 回收资源 */
    onDestroy(() => {
        for (const objectURL of kernelName2objectURL.values()) {
            URL.revokeObjectURL(objectURL);
        }
    });

    /* 折叠文件夹 */
    function fold(e: ComponentEvents<Node>["fold"]) {
        // plugin.logger.debug(e);
        const node = e.detail.props;
        node.folded.set(true);
    }

    /* 展开文件夹 */
    async function unfold(e: ComponentEvents<Node>["unfold"]) {
        // plugin.logger.debug(e);
        const node = e.detail.props;
        node.folded.set(false);
    }

    /* 菜单 */
    function menu(e: ComponentEvents<Node>["menu"]) {
        // plugin.logger.debug(e);
        const node = e.detail.props;
        const name = get(node.name);
        const path = get(node.path);
        const directory = get(node.directory);

        const items: import("siyuan").IMenuItemOption[] = [];

        if (path === KERNELSPECS_DIRECTORY) {
            // 可用内核目录
            items.push({
                icon: "iconRefresh",
                label: plugin.i18n.dock.refresh.label,
                click: async () => {
                    await plugin.jupyter?.kernelspecs.refreshSpecs();
                },
            });
        }

        if (path === KERNELS_DIRECTORY) {
            // 内核目录
            items.push({
                icon: "iconRefresh",
                label: plugin.i18n.dock.refresh.label,
                click: async () => {
                    await plugin.jupyter?.kernels.refreshRunning();
                },
            });
            items.push({ type: "separator" });
            items.push({
                icon: "iconClose",
                label: plugin.i18n.dock.menu.shutdownAllKernels.label,
                click: async () => {
                    await plugin.jupyter?.kernels.shutdownAll();
                },
            });
        }

        if (directory === KERNELS_DIRECTORY) {
            // 内核
            items.push({
                icon: "iconClose",
                label: plugin.i18n.dock.menu.shutdownKernel.label,
                click: async () => {
                    await plugin.jupyter?.kernels.shutdown(name);
                },
            });
        }

        if (path === SESSIONS_DIRECTORY) {
            // 会话目录
            items.push({
                icon: "iconRefresh",
                label: plugin.i18n.dock.refresh.label,
                click: async () => {
                    await plugin.jupyter?.sessions.refreshRunning();
                },
            });
            items.push({ type: "separator" });
            items.push({
                icon: "iconClose",
                label: plugin.i18n.dock.menu.shutdownAllSessions.label,
                click: async () => {
                    await plugin.jupyter?.sessions.shutdownAll();
                },
            });
        }

        if (directory === SESSIONS_DIRECTORY) {
            // 会话
            items.push({
                icon: "iconClose",
                label: plugin.i18n.dock.menu.shutdownSession.label,
                click: async () => {
                    await plugin.jupyter?.sessions.shutdown(name);
                },
            });
        }

        washMenuItems(items);
        if (items.length > 0) {
            const menu = new plugin.siyuan.Menu();
            items.forEach(item => menu.addItem(item));

            const event = e.detail.e;
            menu.open({
                x: event.clientX,
                y: event.clientY,
                isLeft: false,
            });
        }
    }
</script>

<Bar {...bar} />
<FileTree
    on:menu={menu}
    on:fold={fold}
    on:unfold={unfold}
    {roots}
/>
