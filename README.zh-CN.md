# HomeHold

[English](README.md) | **中文**

守住你的主页——无论普通窗口还是隐私窗口，新标签页永远回到你自己配置的导航页。

HomeHold 是一个小巧的 Firefox 扩展（Manifest V3）。它接管新标签页，把它跳转到你指定的
地址。除此之外什么都没有：不收集遥测、不发起网络请求、不需要账号。配置只保存在你自己
机器上的 `browser.storage.local` 里。

---

## 下载

> **仅支持 Firefox。** 这是一个 Firefox 扩展，Chrome、Edge 和 Safari 都装不了。在没装
> Firefox 的电脑上双击 `.xpi` 不会有任何反应——系统里没有程序注册了这个文件类型。请先
> 安装 [Firefox](https://www.mozilla.org/firefox/)。

**[⬇ 下载 `homehold.xpi`](https://github.com/Chenghao999/HomeHold/releases/latest/download/homehold.xpi)**

这个链接永远指向最新构建——不用编译、不用 npm、不用装 Node。下载后在 Firefox 里：
`about:addons` → 齿轮图标 → **从文件安装附加组件…** → 选择该文件。

> **下载的是未签名版本。** Firefox 开发者版、Nightly 和 ESR 可以永久安装。正式版和
> Beta 版会拒绝永久安装未签名的包，报"文件似乎已损坏"——这是 Mozilla 的安全策略，不是
> 包坏了。在正式版上你可以先用 `about:debugging` 临时加载，或者[给它签名](#2-装进-firefox)
> （免费，签完可以在任意 Firefox 上一键安装）。

每个版本也都会列在 [Releases 页面](https://github.com/Chenghao999/HomeHold/releases)上，
CI 每次推送都会重新构建。

---

## 功能一览

| | |
|---|---|
| **配置方式** | 点工具栏图标即可，无需编辑配置文件 |
| **新标签页** | 跳转到你的导航页 |
| **隐私窗口** | 同样生效，但需要你手动授权（见下文） |
| **主题** | 默认跟随系统，也可强制浅色 / 深色 |
| **提示页** | 无法跳转时，显示你自己写的标题和正文 |
| **备份** | 配置可导出为 JSON 文件，也可再导入 |
| **数据存储** | `browser.storage.local`，仅存本地，绝不上传 |
| **申请权限** | 仅 `storage` |
| **最低版本** | Firefox 109+ |

---

## 安装

### 1. 拿到安装包

打包产物是一个 **`.xpi`** 文件。这就是 Firefox 的扩展包格式——本质是一个改了后缀名的
ZIP——也就是你要安装的那个文件。

**直接下载。** 每次推送到 `main` 都会自动构建一次。打开
[Actions 页面](https://github.com/Chenghao999/HomeHold/actions)，点进最新一次 **Build**
运行，下载 **homehold-xpi** 这个 artifact。打标签发布的版本还会把 `.xpi` 直接附到
[Releases 页面](https://github.com/Chenghao999/HomeHold/releases)上，那条路更短。

**或者本地自己构建：**

```bash
npm install
npm run build        # -> dist/homehold-<版本>.xpi
```

### 2. 装进 Firefox

Firefox 对**未签名**的包只允许临时安装，所以用哪种方式取决于你用的是哪个版本的
Firefox：

| 包 | 安装方式 | 有效期 |
|---|---|---|
| 未签名 | `about:debugging` → **本 Firefox** → **临时载入附加组件…** → 选择 `.xpi` | 重启 Firefox 即失效 |
| 已签名 | 任意 Firefox：`about:addons` → 齿轮图标 → **从文件安装附加组件…** | 永久 |
| 未签名 | **开发者版 / Nightly / ESR**：`about:addons` → 齿轮图标 → **从文件安装附加组件…** | 永久 |

正式版和 Beta 版的 Firefox 会拒绝永久安装未签名的包，报"文件似乎已损坏"。这是 Firefox
的安全策略，不是构建出了问题。

要拿到签名的 `.xpi`，把包提交给 Mozilla 签名即可。这一步免费，而且选择 `unlisted`
渠道意味着扩展会被签名，但**不会**公开上架到扩展商店：

```bash
# 先在这里创建一次 API 密钥：https://addons.mozilla.org/developers/addon/api/key/
npm run sign -- --api-key="$AMO_JWT_ISSUER" --api-secret="$AMO_JWT_SECRET"
```

签名后的 `.xpi` 会出现在 `dist/` 下，可以永久安装到任意 Firefox。

如果想让 CI 代劳，把密钥存成仓库 secret（**Settings → Secrets and variables → Actions**
里的 `AMO_JWT_ISSUER`、`AMO_JWT_SECRET`），然后在 Actions 页面手动运行 **Sign**
工作流，签名后的包会作为 workflow artifact 返回。

签名会把扩展 ID 注册到 Mozilla，所以请在第一次签发版本之前就把 ID 定下来——见[打包](#打包)。

### 3. 在浏览器里配置

可以——所有配置都在 Firefox 里完成，不需要编辑任何配置文件。

点击**工具栏上的 HomeHold 图标**，填入地址，按 **保存** 即可。设置存在 Firefox 的扩展
存储中，从下一个新标签页开始生效，不用重启。完整设置页见[使用](#使用)。

### 开发调试

```bash
npm install
npm start            # web-ext run：干净的配置文件，改动即自动重载
```

加上 `-- --firefox-profile <名称>` 可以复用你自己的配置文件。如果想直接加载未打包的
源码，打开 `about:debugging#/runtime/this-firefox`，点 **临时载入附加组件…**，选择
`manifest.json`。

---

## 使用

没有配置文件。所有设置都在 Firefox 里点着改。

**最快的方式——工具栏弹窗。** 点击工具栏上的 HomeHold 图标，填入地址，按 **保存**
（或者直接按回车）。流程就这一步：设置会写进浏览器的扩展存储，从下一个新标签页开始
生效，不用重启。

**完整设置页。** 点击弹窗里的 **更多设置**，或者走 `about:addons` → HomeHold →
**首选项**。字段一样，另外多了隐私窗口权限的状态显示。新标签页在无法跳转时（还没配置
地址、或者 HomeHold 被关闭）也会显示 **打开设置** 按钮。

地址必须以 `http://` 或 `https://` 开头。其他协议——`javascript:`、`data:`、`file:`
——会被直接拒绝、不会存进去，所以一个存下来的值永远不会变成脚本执行或本地文件访问。

设置页上所有的字段都由同一个**保存**按钮统一写入，包括下面这几项。

### 外观

主题默认是**跟随系统**。想固定成浅色或深色就手动选——比如系统是浅色但你想让浏览器界面
一直是深色，反过来也一样。

这个选择对 HomeHold 的三个界面都生效：新标签页提示、工具栏弹窗、设置页。切换下拉框会立刻
预览效果，按**保存**之后才真正写进存储。

### 提示页

当新标签页无法跳转时——还没填地址，或者 HomeHold 被关闭——会显示一个说明原因的页面。
标题和正文都可以替换成你自己的话，如果你更想看到一句提醒而不是诊断信息，这一项就有用。

两个字段任一留空，就使用默认文案（会跟随浏览器语言翻译）。**打开设置**按钮始终保留，
所以自定义提示页不会把你锁在设置外面。

### 备份

**导出**会把当前配置下载成 `homehold-settings.json`。**导入**读取这样的文件并立即生效
——它是整体替换而不是合并，导入后上面的字段会刷新成载入的内容。

导入的文件被当作不可信输入，而不是事实。不符合 `http(s)` 规则的地址会被丢弃，无法识别的
主题会退回 `auto`，过长的提示文案会被截断；而一个不含任何 HomeHold 配置项的 JSON 文件会
被直接拒绝，而不是悄悄把所有设置重置成默认值。

### 隐私窗口

Firefox 不允许扩展自己给自己授予隐私窗口权限——必须由你手动开启，HomeHold 无法代劳：

> `about:addons` → HomeHold → **权限** → 勾选 **在隐私窗口中运行**

设置页会显示该权限的当前状态，并在未开启时重复这段引导。在你开启之前，隐私窗口仍然
使用 Firefox 默认的新标签页。

---

## 开发

扩展本身是纯 JavaScript——没有构建步骤、没有框架、没有运行时依赖。`npm` 只用来跑打包
工具。改完文件重新载入附加组件即可生效。

```
.
├── manifest.json            # 扩展声明
├── background.js            # 隐私窗口权限检测（后台）
├── defaults.js              # 共享的配置默认值、URL 规则、导入导出
├── theme.js                 # 在首次绘制前套用已存的浅色/深色选择
├── i18n.js                  # 基于 data-i18n 的 DOM 本地化辅助
├── newtab.html/.js/.css     # 被覆盖的新标签页
├── popup.html/.js/.css      # 工具栏弹窗（快速改 URL）
├── options.html/.js/.css    # 完整设置页
├── _locales/
│   ├── en/messages.json     # 英文字符串（默认语言）
│   └── zh_CN/messages.json  # 简体中文字符串
├── icons/                   # icon-48.png、icon-96.png
├── tools/make-icons.py      # 重新生成图标
├── scripts/build.sh         # 构建 dist/homehold-<版本>.xpi
├── .web-ext-config.mjs      # web-ext 共享配置（哪些进包、哪些不进）
└── .github/workflows/       # CI：每次推送自动构建 .xpi
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
npm run lint         # 静态检查
npm run build        # -> dist/homehold-<版本>.xpi
npm run sign         # 签名版 .xpi，需要 AMO API 密钥（见「安装」）
```

忽略清单写在 `.web-ext-config.mjs` 里，`lint` 和 `build` 共用，所以检查器和打包器对
"扩展包含哪些文件"的判断永远不会出现分歧。注意 `.xpi` 是**故意不提交**的——`dist/`
已在 gitignore 中，由 CI 重新构建。

扩展 ID 是 `homehold@chenghao999.github.io`，写在 `browser_specific_settings.gecko.id`
里。请把它当作永久值：一旦注册到 Mozilla，换成别的 ID 就等于换了一个扩展，已安装的用户
不会跟过来。

### 发布一个版本

推一个 `v*` 标签，CI 会自动把 `.xpi` 附到 GitHub Release 上：

```bash
git tag v1.0.1
git push origin v1.0.1
```

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

**1.1.0 已完成**：配置导入 / 导出、浅色深色手动切换、可自定义的提示页。

还没做的，按大致价值排序：

- `storage.sync` 跨设备同步
- 支持多导航页 + 快捷键切换
- 从书签生成导航页

---

## 许可证

[MIT](LICENSE) © 2026 Chenghao999

你可以自由使用、修改和再分发这份代码，包括用于商业用途，只需保留版权声明和许可声明。
本软件不提供任何担保。
