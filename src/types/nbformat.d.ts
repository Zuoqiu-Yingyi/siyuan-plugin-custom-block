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

/**
 * Jupyter Notebook v4.5 JSON schema.
 * REF: https://github.com/jupyter/nbformat/blob/main/nbformat/v4/nbformat.v4.schema.json
 */
export interface Notebook {
    /**
     * Array of cells of the current notebook.
     */
    cells: Cell[];
    /**
     * Notebook root-level metadata.
     */
    metadata: NotebookMetadata;
    /**
     * Notebook format (major number). Incremented between backwards incompatible changes to the
     * notebook format.
     */
    nbformat: number;
    /**
     * Notebook format (minor number). Incremented for backward compatible changes to the
     * notebook format.
     */
    nbformat_minor: number;
}

/**
 * Notebook raw nbconvert cell.
 *
 * Notebook markdown cell.
 *
 * Notebook code cell.
 */
export interface Cell {
    attachments?: { [key: string]: { [key: string]: string[] | string } };
    /**
     * String identifying the type of cell.
     */
    cell_type: CellType;
    id: string;
    /**
     * Cell-level metadata.
     */
    metadata: CellMetadata;
    source: string[] | string;
    /**
     * The code cell's prompt number. Will be null if the cell has not been run.
     */
    execution_count?: number | null;
    /**
     * Execution, display, or stream outputs.
     */
    outputs?: Output[];
}

/**
 * String identifying the type of cell.
 */
export type CellType = "raw" | "markdown" | "code";

/**
 * Cell-level metadata.
 */
export interface CellMetadata {
    /**
     * Raw cell metadata format for nbconvert.
     */
    format?: string;
    /**
     * Official Jupyter Metadata for Raw Cells
     *
     * Official Jupyter Metadata for Markdown Cells
     *
     * Official Jupyter Metadata for Code Cells
     */
    jupyter?: { [key: string]: any };
    name?: string;
    tags?: string[];
    /**
     * Whether the cell's output is collapsed/expanded.
     */
    collapsed?: boolean;
    /**
     * Execution time for the code in the cell. This tracks time at which messages are received
     * from iopub or shell channels
     */
    execution?: Execution;
    /**
     * Whether the cell's output is scrolled, unscrolled, or autoscrolled.
     */
    scrolled?: boolean | ScrolledEnum;
    [property: string]: any;
}

/**
 * Execution time for the code in the cell. This tracks time at which messages are received
 * from iopub or shell channels
 */
export interface Execution {
    /**
     * header.date (in ISO 8601 format) of iopub channel's execute_input message. It indicates
     * the time at which the kernel broadcasts an execute_input message to connected frontends
     */
    "iopub.execute_input"?: string;
    /**
     * header.date (in ISO 8601 format) of iopub channel's kernel status message when the status
     * is 'busy'
     */
    "iopub.status.busy"?: string;
    /**
     * header.date (in ISO 8601 format) of iopub channel's kernel status message when the status
     * is 'idle'. It indicates the time at which kernel finished processing the associated
     * request
     */
    "iopub.status.idle"?: string;
    /**
     * header.date (in ISO 8601 format) of the shell channel's execute_reply message. It
     * indicates the time at which the execute_reply message was created
     */
    "shell.execute_reply"?: string;
    [property: string]: any;
}

export type ScrolledEnum = "auto";

/**
 * Result of executing a code cell.
 *
 * Data displayed as a result of code cell execution.
 *
 * Stream output from a code cell.
 *
 * Output of an error that occurred during code cell execution.
 */
export interface Output {
    data?: { [key: string]: string[] | string };
    /**
     * A result's prompt number.
     */
    execution_count?: number | null;
    metadata?: { [key: string]: any };
    /**
     * Type of cell output.
     */
    output_type: OutputType;
    /**
     * The name of the stream (stdout, stderr).
     */
    name?: string;
    /**
     * The stream's text output, represented as an array of strings.
     */
    text?: string[] | string;
    /**
     * The name of the error.
     */
    ename?: string;
    /**
     * The value, or message, of the error.
     */
    evalue?: string;
    /**
     * The error's traceback, represented as an array of strings.
     */
    traceback?: string[];
}

/**
 * Type of cell output.
 */
export type OutputType = "execute_result" | "display_data" | "stream" | "error";

/**
 * Notebook root-level metadata.
 */
export interface NotebookMetadata {
    /**
     * The author(s) of the notebook document
     */
    authors?: any[];
    /**
     * Kernel information.
     */
    kernelspec?: Kernelspec;
    /**
     * Kernel information.
     */
    language_info?: LanguageInfo;
    /**
     * Original notebook format (major number) before converting the notebook between versions.
     * This should never be written to a file.
     */
    orig_nbformat?: number;
    /**
     * The title of the notebook document
     */
    title?: string;
    [property: string]: any;
}

/**
 * Kernel information.
 */
export interface Kernelspec {
    /**
     * Name to display in UI.
     */
    display_name: string;
    /**
     * Name of the kernel specification.
     */
    name: string;
    [property: string]: any;
}

/**
 * Kernel information.
 */
export interface LanguageInfo {
    /**
     * The codemirror mode to use for code in this language.
     */
    codemirror_mode?: { [key: string]: any } | string;
    /**
     * The file extension for files in this language.
     */
    file_extension?: string;
    /**
     * The mimetype corresponding to files in this language.
     */
    mimetype?: string;
    /**
     * The programming language which this kernel runs.
     */
    name: string;
    /**
     * The pygments lexer to use for code in this language.
     */
    pygments_lexer?: string;
    [property: string]: any;
}
