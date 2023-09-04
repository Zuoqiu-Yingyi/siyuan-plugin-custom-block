<div align="center">
<img alt="图标" src="https://cdn.jsdelivr.net/gh/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client/public/icon.png" style="width: 8em; height: 8em;">

---
[![GitHub 最新发行版本 (最新一次发行/预发行)](https://img.shields.io/github/v/release/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client?include_prereleases)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client/releases/latest)
[![GitHub 最新发行时间](https://img.shields.io/github/release-date/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client/releases/latest)
[![GitHub 许可证](https://img.shields.io/github/license/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client/blob/main/LICENSE)
[![GitHub 最后一次提交时间](https://img.shields.io/github/last-commit/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client/commits/main)
![GitHub 仓库大小](https://img.shields.io/github/repo-size/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client)
<!-- ![查看次数](https://hits.b3log.org/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client.svg) -->
![jsDelivr 查看次數 (GitHub)](https://img.shields.io/jsdelivr/gh/hy/Zuoqiu-Yingyi/siyuan-packages-template)
[![GitHub 发行版本下载次数](https://img.shields.io/github/downloads/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client/total)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client/releases)

---
简体中文 \| [English](./README.md)

---
</div>

# 思源 Jupyter 客户端插件

这是一款在[思源笔记](https://github.com/siyuan-note/siyuan)中连接 [Jupyter](https://jupyter.org/) 服务 ([JupyterHub](https://github.com/jupyterhub/jupyterhub), [JupyterLab](https://github.com/jupyterlab/jupyterlab), [Jupyter Notebook](https://github.com/jupyter/notebook)) 以运行代码块, 显示并保存运行结果的插件。

## 预览

![预览图片](https://cdn.jsdelivr.net/gh/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client/public/preview.png)

## 常见问题

* 初次使用本插件时应如何进行配置？

  * 首先确认 Jupyter 服务已开启且允许第三方应用访问

    * 可能需要设置 Jupyter 配置文件中的如下字段

      * `JupyterLab`: `~/.jupyter/jupyter_lab_config.py`
        `Jupyter Notebook`: `~/.jupyter/jupyter_notebook_config.py`

        ```python
        c.ServerApp.allow_origin = '*'
        c.IdentityProvider.token = '<自定义的访问 Token>'
        ```
  * 打开本插件, 并打开本插件的 <kbd>插件设置面板</kbd>

    * 在 <kbd>插件设置面板</kbd>><kbd>Jupyter 设置</kbd>><kbd>服务</kbd> 选项卡中设置如下选项

      * (可选) `Jupyter 服务 URL`
      * (可选) `Jupyter 服务路径`
      * (可选) `内核 WebSocket URL`
      * (可选) `Jupyter Token`
    * 在 <kbd>插件设置面板</kbd>><kbd>Jupyter 设置</kbd>><kbd>全局</kbd> 选项卡中打开 `启用 Jupyter 客户端` 开关
  * 关闭插件设置面板
  * 打开插件侧边面板 `Jupyter`, 点击侧边面板右上角的刷新按钮, 检查侧边面板中 `Jupyter 资源列表`, `已安装内核` 等列表的下级列表项是否已正常列出

## 介绍

### 功能介绍

#### 会话管理

* 会话管理面板

  * 打开方式

    * <kbd>文档块菜单</kbd>><kbd>插件</kbd>><kbd>Jupyter 客户端</kbd>><kbd>会话</kbd>><kbd>会话设置</kbd>
    * <kbd>本插件侧边面板</kbd>><kbd>文档菜单</kbd>><kbd>会话</kbd>><kbd>会话设置</kbd>
  * 面板功能

    * 新建会话

      * 新建一个全新的会话
      * 启动一个全新的内核
    * 连接已有会话

      * 与其他会话共享同一个内核
      * 会话名称, 会话工作目录与会话类型与所选择的会话保持一致
    * 修改当前会话信息

      * 修改会话名称

        * 可以重命名为一个更可读的名称
      * 修改会话路径

        * 路径所在目录为程序执行时的工作目录
      * 修改会话类型

        * `console`：Jupyter 控制台，交互式运行环境
        * `notebook`：Jupyter 笔记本，`*.ipynb` 文件
      * 切换会话使用的内核

        * 切换内核后若原内核没有会话连接, 则会终止运行
  * 注意事项

    * 当前使用的会话信息与内核信息保存在文档块的块属性中

      * 会话信息

        * `custom-jupyter-session-id`: 会话 ID
        * `custom-jupyter-session-name`: 会话名称
        * `custom-jupyter-session-path`: 会话路径
        * `custom-jupyter-session-type`: 会话类型
      * 内核信息

        * `custom-jupyter-kernel-id`: 内核 ID
        * `custom-jupyter-kernel-name`: 内核名称
        * `custom-jupyter-kernel-display-name`: 内核可读名称
        * `custom-jupyter-kernel-language`: 内核语言
        * `custom-jupyter-kernel-status`: 内核当前状态
        * `custom-jupyter-kernel-connection-status`: 与内核的连接状态
* 关闭会话

  * 调用方式

    * <kbd>文档块菜单</kbd>><kbd>插件</kbd>><kbd>Jupyter 客户端</kbd>><kbd>会话</kbd>><kbd>关闭会话</kbd>
    * <kbd>本插件侧边面板</kbd>><kbd>会话菜单</kbd>><kbd>关闭会话</kbd>
    * <kbd>本插件侧边面板</kbd>><kbd>文档菜单</kbd>><kbd>会话</kbd>><kbd>关闭会话</kbd>
  * 注意事项

    * 关闭会话时会同时终止所使用的内核

#### 内核管理

* 重新连接

  * 调用方式

    * <kbd>文档块菜单</kbd>><kbd>插件</kbd>><kbd>Jupyter 客户端</kbd>><kbd>内核</kbd>><kbd>重新连接</kbd>
    * <kbd>本插件侧边面板</kbd>><kbd>文档菜单</kbd>><kbd>内核</kbd>><kbd>重新连接</kbd>
  * 该操作会关闭当前所使用的 WebSocket 连接并重新创建一个新的连接
* 中断内核

  * 调用方式

    * <kbd>文档块菜单</kbd>><kbd>插件</kbd>><kbd>Jupyter 客户端</kbd>><kbd>内核</kbd>><kbd>中断内核</kbd>
    * <kbd>本插件侧边面板</kbd>><kbd>文档菜单</kbd>><kbd>内核</kbd>><kbd>中断内核</kbd>
  * 若内核当前正在执行程序 (处于忙碌状态), 该操作会中断程序的执行, 抛出一个 `KeyboardInterrupt` 异常, 内核状态转换为就绪状态
* 重启内核

  * 调用方式

    * <kbd>文档块菜单</kbd>><kbd>插件</kbd>><kbd>Jupyter 客户端</kbd>><kbd>内核</kbd>><kbd>重启内核</kbd>
    * <kbd>本插件侧边面板</kbd>><kbd>文档菜单</kbd>><kbd>内核</kbd>><kbd>重启内核</kbd>
  * 关闭当前所使用的内核, 重新启动一个新内核并与其建立连接
  * 注意事项

    * 重启过程中内核中的数据将会丢失
    * 重启前后内核 ID 不发生改变
* 关闭内核

  * 调用方式

    * <kbd>文档块菜单</kbd>><kbd>插件</kbd>><kbd>Jupyter 客户端</kbd>><kbd>内核</kbd>><kbd>关闭内核</kbd>
    * <kbd>本插件侧边面板</kbd>><kbd>文档菜单</kbd>><kbd>内核</kbd>><kbd>关闭内核</kbd>
  * 关闭当前所使用的内核
  * 注意事项

    * 关闭内核时会同时关闭所有使用该内核的会话

#### 运行代码

* 名词定义

  * `代码块`

    * 没有自定义属性 `custom-jupyter-block-type="code"` 的思源代码块
  * `代码单元格`

    * 设置了自定义属性 `custom-jupyter-block-type="code"` 的思源代码块
    * 在代码块的左上角显示上次运行的序号
    * 在代码块的左下角显示上次执行时间与运行用时
* 输出文本处理方案

  * 输出内容至 `Xterm` 模拟终端

    * 将输出的文本保存至一个 `HTML` 块, 该 `HTML` 块将调用 [xterm.js](https://xtermjs.org/) 以富文本样式渲染输出内容
  * 输出转义文本

    * 将输出的文本中的 markdown 标志符号使用 `\` 转义, 以避免其被解析为 markdown 代码
  * 输出原始文本

    * 将输出的文本视为 markdown 代码以进行解析并渲染
  * 解析控制字符

    * 解析输出的文本中使用控制字符 `\e` 设置的富文本样式
  * 忽略控制字符

    * 移除输出的文本中所有使用控制字符 `\e` 设置的富文本样式, 仅保留有效文本
* 代码运行方案

  * 运行文档中所有代码单元格

    * 调用方式

      * <kbd>文档块菜单</kbd>><kbd>插件</kbd>><kbd>Jupyter 客户端</kbd>><kbd>运行</kbd>><kbd>运行所有单元格</kbd>
      * <kbd>本插件侧边面板</kbd>><kbd>文档菜单</kbd>><kbd>运行</kbd>><kbd>运行所有单元格</kbd>
    * 运行时所使用的输出文本处理方案需要次级菜单中选择
  * 重启内核并运行文档中所有代码单元格

    * 调用方式

      * <kbd>文档块菜单</kbd>><kbd>插件</kbd>><kbd>Jupyter 客户端</kbd>><kbd>运行</kbd>><kbd>运行所有单元格 (重启内核)</kbd>
      * <kbd>本插件侧边面板</kbd>><kbd>文档菜单</kbd>><kbd>运行</kbd>><kbd>运行所有单元格 (重启内核)</kbd>
    * 运行时所使用的输出文本处理方案需要次级菜单中选择
  * 运行多个代码单元格

    * 调用方式

      * <kbd>使用鼠标/键盘选择多个块</kbd>><kbd>右键菜单</kbd>><kbd>插件</kbd>><kbd>Jupyter 客户端</kbd>
    * 运行时所使用的输出文本处理方案需要次级菜单中选择
    * 仅运行所选块中的代码单元格
    * 运行顺序为由上到下
  * 运行一个代码单元格/代码块

    * 调用方式

      * <kbd>块菜单</kbd>><kbd>插件</kbd>><kbd>Jupyter 客户端</kbd>
    * 运行时所使用的输出文本处理方案需要次级菜单中选择
    * 若选择的是代码块, 则会将其转换为代码单元格并运行
  * 使用快捷键运行代码单元格/代码块

    * 调用方式

      * <kbd>使用鼠标/键盘选择多个块</kbd>><kbd>Ctrl + Enter</kbd>

        * 仅运行
      * <kbd>使用鼠标/键盘选择多个块</kbd>><kbd>Shift + Enter</kbd>

        * 运行并跳转到下一个代码单元格
        * 若文档下方无其他代码单元格, 则会在下方插入一个新的代码单元格
      * <kbd>使用鼠标/键盘选择多个块</kbd>><kbd>Alt + Enter</kbd>

        * 运行并在下方插入一个新的代码单元格
    * 若在使用快捷键前选择了多个块, 将仅运行所选块中的代码单元格
    * 若在使用快捷键前选择了一个代码块, 则会将其转换为代码单元格并运行
    * 若在使用快捷键前未选择块, 则会运行当前光标所在的代码块
* 注意事项

  * 必须将文档与一个会话建立连接后才能运行代码 (详情请参考 *会话管理* 一节)

#### 导入 `*.ipynb` 文件

* 调用方式

  * <kbd>文档块菜单</kbd>><kbd>插件</kbd>><kbd>Jupyter 客户端</kbd>><kbd>导入文件</kbd>><kbd>覆盖当前文档</kbd>><kbd>选择文件</kbd>
  * <kbd>文档块菜单</kbd>><kbd>插件</kbd>><kbd>Jupyter 客户端</kbd>><kbd>导入文件</kbd>><kbd>追加到当前文档末尾</kbd>><kbd>选择文件</kbd>
* 注意事项

  * 文件中代码单元格的输出内容所使用的解析方案可在 <kbd>插件设置面板</kbd>><kbd>Jupyter 设置</kbd>><kbd>导入</kbd> 选项卡中配置

### 设置项介绍

* 常规设置

  * `重置设置选项`

    * 该按钮将重置所有设置选项为默认选项
    * 重置后将刷新页面
* Jupyter 设置

  * 全局设置

    * `启动 Jupyter 客户端`

      * 开启后将本插件将尝试与 Jupyter 服务建立连接
      * 关闭后将中断所有本插件建立的会话并断开与 Jupyter 服务的连接
  * 服务设置

    * `Jupyter 服务 URL`

      * 这里需要填写 Jupyter 服务的 URL 基址
      * 置空时默认为 `http://localhost:8888/`
    * `Jupyter 服务路径`

      * 这里需要填写 Jupyter 服务的 URL 路径
      * 置空时默认为 `/lab`
    * `内核 WebSocket URL`

      * 这里需要填写与 Jupyter 内核交互时所使用的 WebSocket URL
      * 置空时根据 `Jupyter 服务 URL` 自动生成
    * `Jupyter Token`

      * 这里需要填写在 Jupyter 配置文件中设置的 Jupyter 服务访问 Token
      * 若未开启 Jupyter 服务的访问鉴权, 则可以设置为空
  * 代码运行设置

    * `运行时跳转`

      * 开启后在每次运行代码单元格时都会跳转到该块
    * `输入时跳转`

      * 当代码运行时遇到需要用户输入的情况 (例如调用 `python` 的 `input` 函数), 是否在弹出输入框前跳转到该代码单元格
      * 该选项不会影响请求输入时输出框的弹出
    * `错误中断`

      * 运行代码中遇到未捕获的异常后是否中止执行之后的代码
  * 输出设置

    * 调用菜单项 <kbd>使用自定义配置项运行</kbd> 时所使用的输出文本解析方案
    * `使用 Xterm 渲染输出内容`

      * 是否使用 [xterm.js](https://xtermjs.org/) 以富文本样式渲染代码运行时输出的文本内容
      * 详情请参考 *功能介绍 > 运行代码 > 输出文本处理方案* 一节
    * `转义标志符号`

      * 是否使用 `\` 符号转义输出文本中的 markdown 标志符号
      * 详情请参考 *功能介绍 > 运行代码 > 输出文本处理方案* 一节
    * `解析控制字符`

      * 是否解析使用控制字符 `\e` 设置的富文本样式
      * 详情请参考 *功能介绍 > 运行代码 > 输出文本处理方案* 一节
  * 导入设置

    * 调用菜单项 <kbd>导入文件</kbd> 时所使用的输出文本解析方案
    * `使用 Xterm 渲染输出内容`

      * 详情请参考 *功能介绍 > 运行代码 > 输出文本处理方案* 一节
    * `转义标志符号`

      * 详情请参考 *功能介绍 > 运行代码 > 输出文本处理方案* 一节
    * `解析控制字符`

      * 详情请参考 *功能介绍 > 运行代码 > 输出文本处理方案* 一节

## 更改日志

[CHANGELOG.md](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-jupyter-client/blob/main/CHANGELOG.md)
