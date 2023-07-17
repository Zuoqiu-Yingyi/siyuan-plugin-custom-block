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

import type { TooltipsDirection } from "./tooltips";

export interface IBlockIcon {
    icon: string; // svg 图标引用 ID
    none?: boolean; // 是否隐藏 .fn__none (display: none)
    show?: boolean; // 是否显示 .block__icon--show (opacity: 1)
    active?: boolean; // 是否激活 .toolbar__item--active
    disabled?: boolean; // 是否禁用 .toolbar__item--disabled
    type?: string; // data-type
    ariaLabel?: string; // 提示标签内容 aria-label
    tooltipsDirection?: TooltipsDirection; // 提示标签方向
    onClick?: (
        e: MouseEvent,
        element: HTMLElement,
        active: boolean,
    ) => boolean; // 按钮点击回调函数
}
