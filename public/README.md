<div align="center">
<img alt="icon" src="https://cdn.jsdelivr.net/gh/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client/public/icon.png" style="width: 8em; height: 8em;">

---
[![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client?include_prereleases)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client/releases/latest)
[![GitHub Release Date](https://img.shields.io/github/release-date/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client/releases/latest)
[![GitHub License](https://img.shields.io/github/license/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client/blob/main/LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client/commits/main)
![GitHub repo size](https://img.shields.io/github/repo-size/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client)
<!-- ![hits](https://hits.b3log.org/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client.svg) -->
![jsDelivr hits (GitHub)](https://img.shields.io/jsdelivr/gh/hy/Zuoqiu-Yingyi/siyuan-packages-template)
[![GitHub all releases](https://img.shields.io/github/downloads/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client/total)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client/releases)

---
[简体中文](./README_zh_CN.md) \| English

---
</div>

# SiYuan Jupyter Client Plugin

This is a plugin for [SiYuan Note](https://github.com/siyuan-note/siyuan) that connects to [Jupyter](https://jupyter.org/) services ([JupyterHub](https://github.com/jupyterhub/jupyterhub), [JupyterLab](https://github.com/jupyterlab/jupyterlab), [Jupyter Notebook](https://github.com/jupyter/notebook)) to run code blocks, display and save the execution results.

## Preview

![Preview Image](https://cdn.jsdelivr.net/gh/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client/public/preview.png)

## Frequently Asked Questions

* How should I configure the plugin when using it for the first time?

  * First, make sure the Jupyter service is running and allows third-party applications access

    * You may need to set the following fields in the Jupyter configuration file

      * `JupyterLab`: `~/.jupyter/jupyter_lab_config.py`
        `Jupyter Notebook`: `~/.jupyter/jupyter_notebook_config.py`

        ```python
        c.ServerApp.allow_origin = '*'
        c.ServerApp.disable_check_xsrf = True
        c.IdentityProvider.token = '<Custom Asset Token>'
        ```
  * Open the plugin and open the <kbd>Plugin Settings Panel</kbd>

    * In the <kbd>Plugin Settings Panel</kbd> > <kbd>Jupyter Settings</kbd> > <kbd>Server</kbd> tab, set the following options

      * (optional) `Jupyter Server URL`
      * (optional) `Jupyter Server Path`
      * (optional) `Kernel WebSocket URL`
      * (optional) `Jupyter Token`
    * In the <kbd>Plugin Settings Panel</kbd> > <kbd>Jupyter Settings</kbd> > <kbd>Global</kbd> tab, enable the `Enable Jupyter Client` switch
  * Close the plugin settings panel
  * Open the plugin sidebar panel `Jupyter`, click the refresh button in the upper right corner of the sidebar panel, and check if the sub-items in the `Jupyter Resources List`, `Installed Kernels`, etc. are listed correctly.

## Introduction

### Feature Introduction

#### Session Management

* Session management panel

  * Open method

    * <kbd>Block Menu</kbd> > <kbd>Plugin</kbd> > <kbd>Jupyter Client</kbd> > <kbd>Session</kbd> > <kbd>Session Settings</kbd>
    * <kbd>Plugin Sidebar Panel</kbd> > <kbd>Document Menu</kbd> > <kbd>Session</kbd> > <kbd>Session Settings</kbd>
  * Panel features

    * Create a new session

      * Create a fresh session
      * Start a fresh kernel
    * Connect to an existing session

      * Share the same kernel with another session
      * Keep the session name, session working directory, and session type consistent with the selected session
    * Modify current session information

      * Modify session name

        * It can be renamed to a more readable name
      * Modify session path

        * The path directory is the working directory when the program is executed
      * Modify session type

        * `console`: Jupyter Console, an interactive runtime environment
        * `notebook`: Jupyter Notebook, a `*.ipynb` file
      * Switch the kernel used by the session

        * If the original kernel has no session connection after switching, it will be terminated
  * Notes

    * The current session information and kernel information are saved in the block attributes of the document block

      * Session information

        * `custom-jupyter-session-id`: Session ID
        * `custom-jupyter-session-name`: Session name
        * `custom-jupyter-session-path`: Session path
        * `custom-jupyter-session-type`: Session type
      * Kernel information

        * `custom-jupyter-kernel-id`: Kernel ID
        * `custom-jupyter-kernel-name`: Kernel name
        * `custom-jupyter-kernel-display-name`: Kernel human-readable name
        * `custom-jupyter-kernel-language`: Kernel language
        * `custom-jupyter-kernel-status`: Current kernel status
        * `custom-jupyter-kernel-connection-status`: Connection status with the kernel
* Close session

  * Calling method

    * <kbd>Block Menu</kbd> > <kbd>Plugin</kbd> > <kbd>Jupyter Client</kbd> > <kbd>Session</kbd> > <kbd>Close Session</kbd>
    * <kbd>Plugin Sidebar Panel</kbd> > <kbd>Session Menu</kbd> > <kbd>Close Session</kbd>
    * <kbd>Plugin Sidebar Panel</kbd> > <kbd>Document Menu</kbd> > <kbd>Session</kbd> > <kbd>Close Session</kbd>
  * Notes

    * Closing the session will also terminate the kernel being used

#### Kernel Management

* Reconnect

  * Calling method

    * <kbd>Block Menu</kbd> > <kbd>Plugin</kbd> > <kbd>Jupyter Client</kbd> > <kbd>Kernel</kbd> > <kbd>Reconnect</kbd>
    * <kbd>Plugin Sidebar Panel</kbd> > <kbd>Document Menu</kbd> > <kbd>Kernel</kbd> > <kbd>Reconnect</kbd>
  * This operation will close the current WebSocket connection and create a new connection
* Interrupt kernel

  * Calling method

    * <kbd>Block Menu</kbd> > <kbd>Plugin</kbd> > <kbd>Jupyter Client</kbd> > <kbd>Kernel</kbd> > <kbd>Interrupt Kernel</kbd>
    * <kbd>Plugin Sidebar Panel</kbd> > <kbd>Document Menu</kbd> > <kbd>Kernel</kbd> > <kbd>Interrupt Kernel</kbd>
  * If the kernel is currently running a program (in a busy state), this operation will interrupt the execution of the program, throw a `KeyboardInterrupt` exception, and change the kernel status to ready.
* Restart kernel

  * Calling method

    * <kbd>Block Menu</kbd> > <kbd>Plugin</kbd> > <kbd>Jupyter Client</kbd> > <kbd>Kernel</kbd> > <kbd>Restart Kernel</kbd>
    * <kbd>Plugin Sidebar Panel</kbd> > <kbd>Document Menu</kbd> > <kbd>Kernel</kbd> > <kbd>Restart Kernel</kbd>
  * Close the current kernel, restart a new kernel, and establish a connection with it
  * Notes

    * Data in the kernel during the restart process will be lost
    * The kernel ID does not change before and after the restart
* Close kernel

  * Calling method

    * <kbd>Block Menu</kbd> > <kbd>Plugin</kbd> > <kbd>Jupyter Client</kbd> > <kbd>Kernel</kbd> > <kbd>Close Kernel</kbd>
    * <kbd>Plugin Sidebar Panel</kbd> > <kbd>Document Menu</kbd> > <kbd>Kernel</kbd> > <kbd>Close Kernel</kbd>
  * Close the current kernel
  * Notes

    * Closing the kernel will also close all sessions using that kernel

#### Run Code

* Noun definition

  * `Code Block`

    * A SiYuan code block without the custom attribute `custom-jupyter-block-type="code"`
  * `Code Cell`

    * A SiYuan code block with the custom attribute `custom-jupyter-block-type="code"`
    * The last run number is displayed in the upper left corner of the code block
    * The last execution time and runtime are displayed in the lower left corner of the code block
* Output text handling solutions

  * Output content to `Xterm` terminal emulator

    * Save the output text to a `HTML` block, and this `HTML` block will use [xterm.js](https://xtermjs.org/) to render the output content with rich text styles
  * Escape the output text

    * Escape the markdown symbols in the output text using `\` to avoid them being interpreted as markdown code
  * Output raw text

    * Treat the output text as markdown code for parsing and rendering
  * Parse control characters

    * Parse rich text styles set using the control character `\e` in the output text
  * Ignore control characters

    * Remove all rich text styles set using the control character `\e` in the output text, leaving only the valid text
* Code execution solutions

  * Run all code cells in the document

    * Calling method

      * <kbd>Block Menu</kbd> > <kbd>Plugin</kbd> > <kbd>Jupyter Client</kbd> > <kbd>Run</kbd> > <kbd>Run All Cells</kbd>
      * <kbd>Plugin Sidebar Panel</kbd> > <kbd>Document Menu</kbd> > <kbd>Run</kbd> > <kbd>Run All Cells</kbd>
    * The output text handling solution used at runtime needs to be selected in the sub-menu
  * Restart the kernel and run all code cells in the document

    * Calling method

      * <kbd>Block Menu</kbd> > <kbd>Plugin</kbd> > <kbd>Jupyter Client</kbd> > <kbd>Run</kbd> > <kbd>Run All Cells (Restart Kernel)</kbd>
      * <kbd>Plugin Sidebar Panel</kbd> > <kbd>Document Menu</kbd> > <kbd>Run</kbd> > <kbd>Run All Cells (Restart Kernel)</kbd>
    * The output text handling solution used at runtime needs to be selected in the sub-menu
  * Run multiple code cells

    * Calling method

      * <kbd>Select multiple blocks using mouse/keyboard</kbd> > <kbd>Right-click menu</kbd> > <kbd>Plugin</kbd> > <kbd>Jupyter Client</kbd>
    * The output text handling solution used at runtime needs to be selected in the sub-menu
    * Only run the code cells in the selected blocks
    * The running order is from top to bottom
  * Run a code cell/code block

    * Calling method

      * <kbd>Block Menu</kbd> > <kbd>Plugin</kbd> > <kbd>Jupyter Client</kbd>
    * The output text handling solution used at runtime needs to be selected in the sub-menu
    * If a code block is selected, it will be converted to a code cell and executed
  * Run code cells/code blocks using keyboard shortcuts

    * Calling method

      * <kbd>Select multiple blocks using mouse/keyboard</kbd> > <kbd>Ctrl + Enter</kbd>

        * Run only
      * <kbd>Select multiple blocks using mouse/keyboard</kbd> > <kbd>Shift + Enter</kbd>

        * Run and jump to the next code cell
        * If there are no other code cells below the document, a new code cell will be inserted below
      * <kbd>Select multiple blocks using mouse/keyboard</kbd> > <kbd>Alt + Enter</kbd>

        * Run and insert a new code cell below
    * If multiple blocks are selected before using the keyboard shortcut, only the code cells in the selected blocks will be run
    * If a code block is selected before using the keyboard shortcut, it will be converted to a code cell and executed
    * If no blocks are selected before using the keyboard shortcut, the code block where the cursor is will be run
* Notes

  * The code cannot be executed until the document is connected to a session (see the *Session Management* section for details)

#### Import `*.ipynb` Files

* Calling method

  * <kbd>Block Menu</kbd> > <kbd>Plugin</kbd> > <kbd>Jupyter Client</kbd> > <kbd>Import File</kbd> > <kbd>Overwrite Current Document</kbd> > <kbd>Select File</kbd>
  * <kbd>Block Menu</kbd> > <kbd>Plugin</kbd> > <kbd>Jupyter Client</kbd> > <kbd>Import File</kbd> > <kbd>Append to Current Document</kbd> > <kbd>Select File</kbd>
* Notes

  * The output text parsing solution used in code cell is configurable in the <kbd>Plugin Settings Panel</kbd> > <kbd>Jupyter Settings</kbd> > <kbd>Import</kbd> tab

### Setting Item Introduction

* General settings

  * `Reset Settings Options`

    * This button will reset all settings options to the default options
    * The page will be refreshed after resetting
* Jupyter settings

  * Global settings

    * `Enable Jupyter Client`

      * When enabled, this plugin will attempt to connect to the Jupyter service
      * When disabled, all sessions created by this plugin will be interrupted and disconnected from the Jupyter service
  * Server settings

    * `Jupyter Server URL`

      * This should be the URL base of the Jupyter server
      * Default is `http://localhost:8888/` when empty
    * `Jupyter Server Path`

      * This should be the URL path of the Jupyter server
      * Default is `/lab` when empty
    * `Kernel WebSocket URL`

      * This should be the WebSocket URL used when interacting with Jupyter kernels
      * Automatically generated based on the `Jupyter Server URL` when empty
    * `Jupyter Token`

      * This should be the Jupyter service access token set in the Jupyter configuration file
      * Set to empty if Jupyter service access authentication is not enabled
  * Code execution settings

    * `Jump to Runtime`

      * When enabled, it will jump to the block every time a code cell is executed
    * `Jump on Input`

      * Whether to jump to the code cell before the input box pops up when encountering a situation that requires user input during code execution (such as calling the `input` function in Python)
      * This option does not affect the pop-up of the output box when requesting input
    * `Error Interrupt`

      * Whether to terminate the execution of the code after encountering an uncaught exception in the code execution
  * Output settings

    * The output text parsing solution used when calling the menu item <kbd>Run with Custom Configuration</kbd>
    * `Render Output Content with Xterm`

      * Whether to use [xterm.js](https://xtermjs.org/) to render the output text content with rich text styles during code execution
      * Refer to the *Feature Introduction > Run Code > Output Text Handling Solutions* section for details
    * `Escape Symbols`

      * Whether to escape the markdown symbols in the output text
      * Refer to the *Feature Introduction > Run Code > Output Text Handling Solutions* section for details
    * `Parse Control Characters`

      * Whether to parse rich text styles set with the control character `\e` in the output text
      * Refer to the *Feature Introduction > Run Code > Output Text Handling Solutions* section for details
  * Import settings

    * The output text parsing solution used when calling the menu item <kbd>Import File</kbd>
    * `Render Output Content with Xterm`

      * Refer to the *Feature Introduction > Run Code > Output Text Handling Solutions* section for details
    * `Escape Symbols`

      * Refer to the *Feature Introduction > Run Code > Output Text Handling Solutions* section for details
    * `Parse Control Characters`

      * Refer to the *Feature Introduction > Run Code > Output Text Handling Solutions* section for details

## Change Log

[CHANGELOG.md](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client/blob/main/CHANGELOG.md)
