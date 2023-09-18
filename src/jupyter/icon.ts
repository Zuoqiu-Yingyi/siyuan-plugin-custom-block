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

import light_file from "@jupyter-lsp/theme-vscode/style/icons/light/file.svg?raw";
import light_folder from "@jupyter-lsp/theme-vscode/style/icons/light/folder.svg?raw";
import light_json from "@jupyter-lsp/theme-vscode/style/icons/light/json.svg?raw";
import light_value from "@jupyter-lsp/theme-vscode/style/icons/light/note.svg?raw";
import light_references from "@jupyter-lsp/theme-vscode/style/icons/light/references.svg?raw";
import light_symbol_class from "@jupyter-lsp/theme-vscode/style/icons/light/symbol-class.svg?raw";
import light_symbol_color from "@jupyter-lsp/theme-vscode/style/icons/light/symbol-color.svg?raw";
import light_symbol_constant from "@jupyter-lsp/theme-vscode/style/icons/light/symbol-constant.svg?raw";
import light_symbol_enumerator_member from "@jupyter-lsp/theme-vscode/style/icons/light/symbol-enumerator-member.svg?raw";
import light_symbol_enumerator from "@jupyter-lsp/theme-vscode/style/icons/light/symbol-enumerator.svg?raw";
import light_symbol_event from "@jupyter-lsp/theme-vscode/style/icons/light/symbol-event.svg?raw";
import light_symbol_field from "@jupyter-lsp/theme-vscode/style/icons/light/symbol-field.svg?raw";
import light_symbol_interface from "@jupyter-lsp/theme-vscode/style/icons/light/symbol-interface.svg?raw";
import light_symbol_keyword from "@jupyter-lsp/theme-vscode/style/icons/light/symbol-keyword.svg?raw";
import light_symbol_method from "@jupyter-lsp/theme-vscode/style/icons/light/symbol-method.svg?raw";
import light_symbol_operator from "@jupyter-lsp/theme-vscode/style/icons/light/symbol-operator.svg?raw";
import light_symbol_parameter from "@jupyter-lsp/theme-vscode/style/icons/light/symbol-parameter.svg?raw";
import light_symbol_property from "@jupyter-lsp/theme-vscode/style/icons/light/symbol-property.svg?raw";
import light_symbol_ruler from "@jupyter-lsp/theme-vscode/style/icons/light/symbol-ruler.svg?raw";
import light_symbol_snippet from "@jupyter-lsp/theme-vscode/style/icons/light/symbol-snippet.svg?raw";
import light_symbol_string from "@jupyter-lsp/theme-vscode/style/icons/light/symbol-string.svg?raw";
import light_symbol_structure from "@jupyter-lsp/theme-vscode/style/icons/light/symbol-structure.svg?raw";
import light_symbol_variable from "@jupyter-lsp/theme-vscode/style/icons/light/symbol-variable.svg?raw";

import dark_file from "@jupyter-lsp/theme-vscode/style/icons/dark/file.svg?raw";
import dark_folder from "@jupyter-lsp/theme-vscode/style/icons/dark/folder.svg?raw";
import dark_json from "@jupyter-lsp/theme-vscode/style/icons/dark/json.svg?raw";
import dark_value from "@jupyter-lsp/theme-vscode/style/icons/dark/note.svg?raw";
import dark_references from "@jupyter-lsp/theme-vscode/style/icons/dark/references.svg?raw";
import dark_symbol_class from "@jupyter-lsp/theme-vscode/style/icons/dark/symbol-class.svg?raw";
import dark_symbol_color from "@jupyter-lsp/theme-vscode/style/icons/dark/symbol-color.svg?raw";
import dark_symbol_constant from "@jupyter-lsp/theme-vscode/style/icons/dark/symbol-constant.svg?raw";
import dark_symbol_enumerator_member from "@jupyter-lsp/theme-vscode/style/icons/dark/symbol-enumerator-member.svg?raw";
import dark_symbol_enumerator from "@jupyter-lsp/theme-vscode/style/icons/dark/symbol-enumerator.svg?raw";
import dark_symbol_event from "@jupyter-lsp/theme-vscode/style/icons/dark/symbol-event.svg?raw";
import dark_symbol_field from "@jupyter-lsp/theme-vscode/style/icons/dark/symbol-field.svg?raw";
import dark_symbol_interface from "@jupyter-lsp/theme-vscode/style/icons/dark/symbol-interface.svg?raw";
import dark_symbol_keyword from "@jupyter-lsp/theme-vscode/style/icons/dark/symbol-keyword.svg?raw";
import dark_symbol_method from "@jupyter-lsp/theme-vscode/style/icons/dark/symbol-method.svg?raw";
import dark_symbol_operator from "@jupyter-lsp/theme-vscode/style/icons/dark/symbol-operator.svg?raw";
import dark_symbol_parameter from "@jupyter-lsp/theme-vscode/style/icons/dark/symbol-parameter.svg?raw";
import dark_symbol_property from "@jupyter-lsp/theme-vscode/style/icons/dark/symbol-property.svg?raw";
import dark_symbol_ruler from "@jupyter-lsp/theme-vscode/style/icons/dark/symbol-ruler.svg?raw";
import dark_symbol_snippet from "@jupyter-lsp/theme-vscode/style/icons/dark/symbol-snippet.svg?raw";
import dark_symbol_string from "@jupyter-lsp/theme-vscode/style/icons/dark/symbol-string.svg?raw";
import dark_symbol_structure from "@jupyter-lsp/theme-vscode/style/icons/dark/symbol-structure.svg?raw";
import dark_symbol_variable from "@jupyter-lsp/theme-vscode/style/icons/dark/symbol-variable.svg?raw";

function wash(svg: string): string {
    const element = document.createElement("span");
    element.innerHTML = svg;
    if (element.firstElementChild instanceof SVGElement) {
        element.firstElementChild.classList.toggle("b3-menu__icon", true);
    }
    return element.innerHTML;
}

export const LIGHT_ICON_MAP = new Map<string, string>([
    ["class", wash(light_symbol_class)],
    ["color", wash(light_symbol_color)],
    ["constant", wash(light_symbol_constant)],
    ["constructor", wash(light_symbol_method)],
    ["enum", wash(light_symbol_enumerator)],
    ["enumMember", wash(light_symbol_enumerator_member)],
    ["event", wash(light_symbol_event)],
    ["field", wash(light_symbol_field)],
    ["file", wash(light_file)],
    ["folder", wash(light_folder)],
    ["function", wash(light_symbol_method)],
    ["instance", wash(light_symbol_variable)], // ➕
    ["interface", wash(light_symbol_interface)],
    ["keyword", wash(light_symbol_keyword)],
    ["method", wash(light_symbol_method)],
    ["module", wash(light_json)],
    ["operator", wash(light_symbol_operator)],
    ["property", wash(light_symbol_property)],
    ["reference", wash(light_references)],
    ["snippet", wash(light_symbol_snippet)],
    ["struct", wash(light_symbol_structure)],
    ["text", wash(light_symbol_string)],
    ["typeParameter", wash(light_symbol_parameter)],
    ["unit", wash(light_symbol_ruler)],
    ["value", wash(light_value)],
    ["variable", wash(light_symbol_variable)],
]);

export const DARK_ICON_MAP = new Map<string, string>([
    ["class", wash(dark_symbol_class)],
    ["color", wash(dark_symbol_color)],
    ["constant", wash(dark_symbol_constant)],
    ["constructor", wash(dark_symbol_method)],
    ["enum", wash(dark_symbol_enumerator)],
    ["enumMember", wash(dark_symbol_enumerator_member)],
    ["event", wash(dark_symbol_event)],
    ["field", wash(dark_symbol_field)],
    ["file", wash(dark_file)],
    ["folder", wash(dark_folder)],
    ["function", wash(dark_symbol_method)],
    ["instance", wash(dark_symbol_variable)], // ➕
    ["interface", wash(dark_symbol_interface)],
    ["keyword", wash(dark_symbol_keyword)],
    ["method", wash(dark_symbol_method)],
    ["module", wash(dark_json)],
    ["operator", wash(dark_symbol_operator)],
    ["property", wash(dark_symbol_property)],
    ["reference", wash(dark_references)],
    ["snippet", wash(dark_symbol_snippet)],
    ["struct", wash(dark_symbol_structure)],
    ["text", wash(dark_symbol_string)],
    ["typeParameter", wash(dark_symbol_parameter)],
    ["unit", wash(dark_symbol_ruler)],
    ["value", wash(dark_value)],
    ["variable", wash(dark_symbol_variable)],
]);
