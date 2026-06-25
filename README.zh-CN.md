# Inbound Stay Ops Kit

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md)

面向经常接待外国住客的住宿房东的开源多语言住客帮助工具包。

它可以帮助房东把已确认的房源说明和入住规则整理成移动端住客指南，并按照住客的语言显示。额外问题可以进入安全的代理流程，或通过Telegram转交给房东确认。

## 它是什么

```text
房东确认过的房源信息
-> 翻译后的入住指南
-> 移动端住客页面
-> 可选的Telegram房东确认流程
```

## 它不是什么

- 不是Airbnb爬虫
- 不是Airbnb inbox机器人
- 不是预订、付款、退款或评价自动化工具
- 不是把Airbnb住客转移到平台外的工具
- 不是Kakao / LINE / WhatsApp自动化 starter

## 免费开源范围

- 静态住客帮助页面
- 基于房东确认过的Airbnb或预订平台文本生成的翻译入住指南
- 供代理和Telegram bot使用的内部FAQ / 回答库
- 面向Airbnb或其他预订平台链接的房东确认来源流程
- 针对阻止问题和房东确认问题的安全规则
- Telegram Bot adapter
- Local Wi-Fi QR generator without external QR API calls
- 通过Telegram发送给房东的确认工单
- 可选的Hermes Agent集成指南
- 面向使用Codex或Claude的非开发者的工作簿和提示词

## 付费 / 定制范围

- Kakao自动集成
- LINE自动集成
- WhatsApp自动集成
- 按房源定制实施
- 定价诊断报告

免费工具包允许手动记录官方房源链接作为参考。Telegram以外的消息平台自动集成不包含在免费范围内。

## 快速链接

- 韩语 quickstart: `docs/quickstart-ko.md`
- 英语 quickstart: `docs/quickstart-en.md`
- 日语 quickstart: `docs/quickstart-ja.md`
- Airbnb政策边界: `docs/airbnb-policy-boundary.md`
- 房东内容流程: `docs/host-content-workflow.md`
- 语言路由: `docs/language-routing.md`
- Telegram dry-run: `docs/telegram-dry-run-rehearsal.md`
- 示例: `samples/`

## 安全模型

这个工具包不会抓取Airbnb或其他预订平台。

平台链接只作为来源参考保存。机器人只使用房东复制、检查并在 `config.json` 中确认过的文本。

对于Airbnb住宿，除非Airbnb在你的具体情况下明确允许，否则不要把这个外部指南链接放进Airbnb房源描述或Airbnb消息线程。你可以用这个工具包生成可粘贴回Airbnb的翻译说明，或把它作为房源内QR码等可选入住资源提供。

请查看 `docs/airbnb-policy-boundary.md`。

这个工具包不会：

- 索要Airbnb密码
- 登录预订平台
- 抓取私密住客消息
- 自动发送预订、退款、取消、付款、法律或安全判断
- 把预订/付款/退款流程移出预订平台
- 强制住客离开Airbnb、安装Telegram或创建其他账号才能入住

## 快速开始

在此文件夹中启动本地静态服务器，然后打开：

```text
host-setup.html
```

1. 从本地Web服务器打开 `host-setup.html`。
2. 粘贴房东确认过的房源文本和住宿规则。
3. 复制生成的Codex / Hermes提示词。
4. 请Codex或Hermes生成供审核的 `config.json`。
5. 发布前检查 `approvedStayGuide`。住客会以自己的语言看到这部分内容。
6. 运行 `npm test`。
7. 从本地Web服务器打开 `index.html`，或部署为静态网站。
8. 如果使用Telegram，请按照 `docs/telegram-host-handoff.md` 操作。

也可以使用文档式工作簿流程：

1. 将 `config.example.json` 复制为 `config.json`。
2. 填写 `host-workbook/host-info-form.md`。
3. 将公开房源文本粘贴到 `host-workbook/platform-source-form.md`。
4. 请Codex或Claude运行 `ai-prompts/01-build-config-from-host-workbook.md`。

完整的房东内容流程见 `docs/host-content-workflow.md`。

住客语言自动选择方式见 `docs/language-routing.md`。

## 试用示例

```bash
cp samples/seoul-guesthouse.config.json config.json
```

然后打开：

```text
index.html?lang=en
index.html?lang=ja
index.html?lang=ko
```

## 文件夹结构

```text
config.example.json              房东确认过的房源配置和翻译指南示例
index.html                       住客帮助页面
host-setup.html                  面向房东的浏览器设置向导
assets/                          浏览器UI
lib/                             共享guest-ops逻辑
tests/                           安全和语言路由测试
adapters/telegram/               免费Telegram Bot adapter
host-workbook/                   房东填写的表单
ai-prompts/                      Codex或Claude提示词
docs/                            设置和边界文档
templates/                       可复用的政策和Hermes提示词
```

## 命令

```bash
npm test
node --check assets/app.js
node --check assets/host-setup.js
node --check lib/guest-ops.js
node --check lib/language.js
node --check lib/setup-builder.js
```

Telegram adapter:

```bash
cd adapters/telegram
node dry-run-handoff.mjs
npm start
```

## 发布

发布前请查看 `RELEASE_CHECKLIST.md`。
