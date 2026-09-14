# HomeHold

[English](README.md) | **中文**

守住你的主页——无论普通窗口还是隐私窗口，新标签页永远回到你自己配置的导航页。

HomeHold 是一个小巧的 Firefox 扩展（Manifest V3）。它接管新标签页，把它跳转到你指定的
地址。除此之外什么都没有：不收集遥测、不发起网络请求、不需要账号。配置只保存在你自己
机器上的 `browser.storage.local` 里。

---

## 功能一览

| | |
|---|---|
| **新标签页** | 跳转到你的导航页 |
| **隐私窗口** | 同样生效，但需要你手动授权（见下文） |
| **数据存储** | `browser.storage.local`，仅存本地，绝不上传 |
| **申请权限** | 仅 `storage` |
| **最低版本** | Firefox 109+ |

---

## 安装

### 从源码加载（临时，用于开发）

```bash
git clone https://github.com/Chenghao999/HomeHold.git
cd HomeHold
```

然后在 Firefox 中打开 `about:debugging#/runtime/this-firefox`，点击
**临时载入附加组件…**，选择 `manifest.json`。扩展会一直生效，直到你重启 Firefox。
永久安装需要签名，见[打包](#打包)。

### 使用 web-ext（自动重载的开发流程）

```bash
npm install --global web-ext
cd HomeHold
web-ext run
```

`web-ext run` 会启动一个干净的 Firefox 配置文件并载入扩展，源码变动时自动重载。加上
`--firefox-profile <名称>` 可以复用你自己的配置文件。

---

## 使用

1. 打开设置页 —— `about:addons` → HomeHold → **首选项**，或者在你还没配置任何东西时，
   点击新标签页上显示的 **打开设置** 按钮。
2. 填入你希望每个新标签页打开的地址。必须以 `http://` 或 `https://` 开头。
3. 点击 **保存**，然后打开一个新标签页。

### 隐私窗口

Firefox 不允许扩展自己给自己授予隐私窗口权限——必须由你手动开启，HomeHold 无法代劳：

> `about:addons` → HomeHold → **权限** → 勾选 **在隐私窗口中运行**

设置页会显示该权限的当前状态，并在未开启时重复这段引导。在你开启之前，隐私窗口仍然
使用 Firefox 默认的新标签页。

---

## 开发

扩展是纯 JavaScript，没有构建步骤，也没有任何依赖。改完文件后在 `about:debugging` 里
重新载入附加组件即可生效。

```
.
├── manifest.json            # 扩展声明
├── background.js            # 隐私窗口权限检测（后台）
├── config.js                # 共享的配置默认值 + URL 校验
├── i18n.js                  # 基于 data-i18n 的 DOM 本地化辅助
├── newtab.html/.js/.css     # 被覆盖的新标签页
├── options.html/.js/.css    # 设置页
├── _locales/
│   ├── en/messages.json     # 英文字符串（默认语言）
│   └── zh_CN/messages.json  # 简体中文字符串
├── icons/                   # icon-48.png、icon-96.png
└── tools/make-icons.py      # 重新生成图标
```

### 多语言

Firefox 会根据浏览器的界面语言自动选择文案，所以只有一份设置页，而不是每种语言一份。
字符串放在 `_locales/<语言>/messages.json` 中，HTML 通过 `data-i18n` 属性引用，
由 `i18n.js` 在加载时填充。英文是默认语言，也是任何未翻译条目的兜底。

要新增语言，把 `_locales/en/` 复制成 `_locales/<语言代码>/` 并翻译各条 `message` 的值
即可。键名、占位符和文件结构必须保持一致。

### 重新生成图标

```bash
python3 tools/make-icons.py
```

只用 Python 标准库，不需要装 Pillow。改脚本里的 `SIZES` 可以额外生成其他尺寸。

### 打包

```bash
web-ext lint                # 静态检查
web-ext build               # 在 web-ext-artifacts/ 下生成 zip
```

发布前，请把 `manifest.json` 里 `browser_specific_settings.gecko.id` 的占位值
`homehold@yourdomain.com` 换成你自己掌控的 ID。

在干净的检出上执行 `web-ext lint` 会有两条提示性警告：`strict_min_version` 是 `109.0`，
而 `data_collection_permissions` 直到 Firefox 140 才引入。该属性是增量式的——旧版本会
忽略它——所以扩展在 109 及以上依然正常工作。由于 AMO 现在要求新提交必须包含这项声明，
这里刻意把两者放在一起。如果你更希望 lint 完全干净、且不需要支持旧版本，把
`strict_min_version` 改成 `140.0` 即可。

---

## 隐私

- 只申请 `storage` 权限。不使用 `tabs`、`history`、`webRequest` 或 `cookies`。
- 自身不发起任何网络请求。跳转由浏览器完成，唯一会访问的地址就是你配置的那个。
- 不收集遥测，不向任何地方发送数据。
- 所有配置都保存在扩展的本地存储中。
- 存储的 URL 被限制为 `http:` 和 `https:`，因此一个存进去的值不会变成脚本执行或本地
  文件访问。
- 所有文本都通过 `textContent` 写入页面，从不使用 `innerHTML`。

---

## 已知限制

1. 隐私窗口权限必须由用户手动授予，扩展无法强制。
2. 没有该权限时，覆盖页不会在隐私窗口中加载，会回落到 Firefox 默认的新标签页。
3. `file://` 本地页面可能被 CSP 拦截，建议使用线上地址。
4. `chrome_url_overrides` 在隐私窗口中的行为在不同 Firefox 版本间有过差异，你支持的
   每个版本都值得重新实测。

---

## 后续迭代

- **v1.1** —— 支持多导航页 + 快捷键切换
- **v1.2** —— 配置导入 / 导出
- **v1.3** —— `storage.sync` 跨设备同步
- **v1.4** —— 从书签生成导航页
- **v2.0** —— 可选深色主题与自定义提示页

---

## 许可证

目前尚未选择许可证，因此默认保留所有权利。在分发或接受贡献之前，请先添加 `LICENSE`
文件。
