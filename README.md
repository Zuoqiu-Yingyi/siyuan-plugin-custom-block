<div align="center">
<img alt="icon" src="https://cdn.jsdelivr.net/gh/Zuoqiu-Yingyi/siyuan-plugin-custom-block/public/icon.png" style="width: 8em; height: 8em;">

---
[![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/Zuoqiu-Yingyi/siyuan-plugin-custom-block?include_prereleases&style=flat-square)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-custom-block/releases/latest)
[![GitHub Release Date](https://img.shields.io/github/release-date/Zuoqiu-Yingyi/siyuan-plugin-custom-block?style=flat-square)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-custom-block/releases/latest)
[![GitHub License](https://img.shields.io/github/license/Zuoqiu-Yingyi/siyuan-plugin-custom-block?style=flat-square)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-custom-block/blob/main/LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/Zuoqiu-Yingyi/siyuan-plugin-custom-block?style=flat-square)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-custom-block/commits/main)
![GitHub repo size](https://img.shields.io/github/repo-size/Zuoqiu-Yingyi/siyuan-plugin-custom-block?style=flat-square)
![hits](https://hits.b3log.org/Zuoqiu-Yingyi/siyuan-plugin-custom-block.svg)
[![GitHub all releases](https://img.shields.io/github/downloads/Zuoqiu-Yingyi/siyuan-plugin-custom-block/total?style=flat-square)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-custom-block/releases)

---
[简体中文](./README_zh_CN.md) \| English

---
</div>

# SiYuan Custom Block

A plugin for [SiYuan Note](https://github.com/siyuan-note/siyuan) that can use custom block attributes to style blocks.

## PREVIEW

![preview image](https://cdn.jsdelivr.net/gh/Zuoqiu-Yingyi/siyuan-plugin-custom-block/public/preview.png)

## Q & A

1. If I am unable to click on a block label in the list map view, how do I open the block menu?

    Use the shortcut key <kbd>Shift + ↑</kbd> to select the specific block, then use the shortcut key <kbd>Ctrl + /</kbd> to open the block menu for that block.

## INTRODUCTION

### Function Introduction

Use <kbd>Block Menu</kbd> > <kbd>Plugins</kbd> > <kbd>Custom Block Styles</kbd> to configure the supported styles for the selected block.

| Menu Item Name        | Block Attribute                                                           | Function Introduction                                                                                                                                                                                                                                                                                                                                                              | Document Block | Super Block | Quote Block | List Block | List Item | Heading Block | Paragraph Block | Formula Block | Table Block | Code Block | HTML Block | Divider | Audio Block | Video Block | Iframe Block | Widget Block | Embed Block |
| --------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------: | :---------: | :---------: | :--------: | :-------: | :-----------: | :-------------: | :-----------: | :---------: | :--------: | :--------: | :-----: | :---------: | :---------: | :----------: | :----------: | :---------: |
| Block Style           | `style`                                                                   | Customize the `style` attribute of the block<br/>For more details, please refer to: [style - HTML: HyperText Markup Language \| MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/style)                                                                                                                                                                    |                |      √      |      √      |     √      |     √     |       √       |        √        |       √       |      √      |     √      |     √      |    √    |      √      |      √      |      √       |      √       |      √      |
| Full Width            | `block-width`:`full`                                                      | Set the width of the block to the width of the document                                                                                                                                                                                                                                                                                                                            |                |             |             |            |           |               |                 |               |             |            |            |         |      √      |      √      |      √       |      √       |             |
| Full Screen           | None                                                                      | Display the block in full screen                                                                                                                                                                                                                                                                                                                                                   |       √        |      √      |      √      |     √      |     √     |       √       |        √        |       √       |      √      |     √      |     √      |    √    |      √      |      √      |      √       |      √       |      √      |
| Danmaku               | `block-render`:`danmaku`                                                  | Document Block: Display all blocks in this document as danmaku<br/>Other Blocks: Display the block as danmaku                                                                                                                                                                                                                                                                      |       √        |      √      |      √      |     √      |     √     |       √       |        √        |       √       |      √      |     √      |     √      |    √    |      √      |      √      |      √       |      √       |      √      |
| Scroll Display        | `block-render`:`scroll`                                                   | Document Block: Display vertical scrollbar for blocks that exceed a certain height in this document<br/>Other Blocks: Display vertical scrollbar for the block if it exceeds a certain height                                                                                                                                                                                      |       √        |      √      |      √      |     √      |     √     |       √       |        √        |       √       |      √      |     √      |     √      |    √    |      √      |      √      |      √       |      √       |      √      |
| Display Block ID      | `block-render`:`id`                                                       | Document Block: Display block ID for all blocks in this document<br/>Other Blocks: Display block ID for the block and its subblocks                                                                                                                                                                                                                                                |       √        |      √      |      √      |     √      |     √     |       √       |        √        |       √       |      √      |     √      |     √      |    √    |      √      |      √      |      √       |      √       |      √      |
| Display Block Index   | `block-render`:`index`                                                    | Display the index of top-level blocks in the document                                                                                                                                                                                                                                                                                                                              |       √        |             |             |            |           |               |                 |               |             |            |            |         |             |             |              |              |             |
| Display Block Content | `block-render`:`content`                                                  | Document Block: Display hidden content for all blocks in this document<br/>Other Blocks: Display hidden content for all blocks within the block<br/>Display link address for hyperlinks<br/>Display formula text for inline formulas<br/>Display note text for inline notes<br/>Display formula text for formula blocks<br/>Display corresponding text for other renderable blocks |       √        |      √      |      √      |     √      |     √     |       √       |        √        |       √       |      √      |     √      |     √      |         |             |             |              |              |      √      |
| Display Block Outline | `block-render`:`outline`                                                  | Document Block: Display outline for all blocks in this document<br/>Other Blocks: Display outline for this block                                                                                                                                                                                                                                                                   |       √        |      √      |      √      |     √      |     √     |       √       |        √        |       √       |      √      |     √      |     √      |    √    |      √      |      √      |      √       |      √       |      √      |
| Layout Mode           | `block-writing-mode`:`vertical-rl`<br/>`block-writing-mode`:`vertical-lr` | Document Block: Switch the writing mode for all blocks in this document<br/>Other Blocks: Switch the writing mode for the block and its subblocks<br/>`vertical-rl`: Display text vertically from right to left<br/>`vertical-lr`: Display text vertically from left to right                                                                                                      |       √        |      √      |      √      |     √      |     √     |       √       |        √        |               |      √      |            |            |         |             |             |              |              |             |
| Table - Default Width | None                                                                      | Default style<br/>Columns in the table without manually adjusted width will not wrap                                                                                                                                                                                                                                                                                               |                |             |             |            |           |               |                 |               |      √      |            |            |         |             |             |              |              |             |
| Table - Auto Width    | `block-table-width`:`auto`                                                | Table maximum width is the same as the width of the document<br/>Content in table cells wraps automatically                                                                                                                                                                                                                                                                        |                |             |             |            |           |               |                 |               |      √      |            |            |         |             |             |              |              |             |
| Table - Equal Width   | `block-table-width`:`equal`                                               | All table cells have fixed width                                                                                                                                                                                                                                                                                                                                                   |                |             |             |            |           |               |                 |               |      √      |            |            |         |             |             |              |              |             |
| List - Default View   | None                                                                      | Default style<br/>Document Block: Display all lists in this document as an outline<br/>List Block: Display the list as an outline                                                                                                                                                                                                                                                  |       √        |      √      |      √      |     √      |           |               |                 |               |             |            |            |         |             |             |              |              |      √      |
| List - Mindmap View   | `block-list-view`:`map`                                                   | Document Block: Display all lists in this document as a mind map<br/>List Block: Display the list as a mind map                                                                                                                                                                                                                                                                    |       √        |      √      |      √      |     √      |           |               |                 |               |             |            |            |         |             |             |              |              |      √      |
| List - Table View     | `block-list-view`:`table`                                                 | Document Block: Display all lists in this document as a table<br/>List Block: Display the list as a table                                                                                                                                                                                                                                                                          |       √        |      √      |      √      |     √      |           |               |                 |               |             |            |            |         |             |             |              |              |      √      |
| List - Board View     | `block-list-view`:`board`                                                 | Document Block: Display all lists in this document as a board<br/>List Block: Display the list as a board                                                                                                                                                                                                                                                                          |       √        |      √      |      √      |     √      |           |               |                 |               |             |            |            |         |             |             |              |              |      √      |

### Setting Introduction

* `General Settings`

  * `Reset Settings Options`

    * This is a button
    * Reset all settings options to their default values
    * Clicking this button will trigger a confirmation dialog

      * Clicking the confirm button in the dialog will reset all options of this plugin to their default values and automatically refresh the current interface
* `Menu Settings`

  * `Menu`

    * This is a switch
    * Default state: *On*
    * Turn off the switch to disable the corresponding menu items
  * `Style`

    * This is a switch
    * Default state: *On*
    * Turn off the switch to disable the built-in styles of the plugin
    * If the theme is compatible with the corresponding style, you can turn off this switch

## CHANGELOG

[CHANGELOG.md](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-custom-block/blob/main/CHANGELOG.md)
