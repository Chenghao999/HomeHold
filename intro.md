# HomeHold 开发文档

> **一句话定位**：守住你的主页——无论普通窗口还是隐私窗口，新标签页永远回到你自己配置的导航页。

---

## 一、项目概述

| 项 | 内容 |
|----|------|
| 名称 | HomeHold |
| 类型 | Firefox 扩展（WebExtension，MV3） |
| 核心功能 | 覆盖新标签页，跳转到用户自定义导航页 |
| 隐私窗口 | 支持，但需用户手动授权 |
| 数据存储 | `browser.storage.local`，不联网、不上传 |
| 目标版本 | Firefox 109+ |
| 扩展 ID | `homehold@yourdomain.com` |

---

## 二、整体架构图

### 2.1 系统分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户层                                │
│   普通窗口新标签页        隐私窗口新标签页       设置入口      │
└───────────┬─────────────────────┬──────────────────┬────────┘
            │                     │                  │
            ▼                     ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     Firefox 浏览器运行时                     │
│  ┌──────────────────┐   ┌──────────────────┐                │
│  │ chrome_url_      │   │  about:addons    │                │
│  │ overrides        │   │  （权限授权入口） │                │
│  │  .newtab         │   └──────────────────┘                │
│  └────────┬─────────┘                                        │
│           │ 拦截新标签页                                      │
└───────────┼─────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                      扩展层（HomeHold）                      │
│                                                              │
│  ┌────────────┐   读取配置    ┌───────────────────┐         │
│  │ newtab.js  │◄─────────────►│ storage.local     │         │
│  │（跳转逻辑） │               │ { navUrl, enabled,│         │
│  └────────────┘               │   incognitoAllowed}│         │
│                               └─────────▲─────────┘         │
│  ┌────────────┐   读写配置              │                    │
│  │ options.js │───────────────────────┘                    │
│  │（设置页）   │                                            │
│  └────────────┘                                            │
│                                                              │
│  ┌────────────────┐   检测权限    ┌──────────────────┐      │
│  │ background.js  │──────────────►│ isAllowed        │      │
│  │（权限检测）     │               │ IncognitoAccess  │      │
│  └────────────────┘               └──────────────────┘      │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                        外部层                                │
│              用户配置的导航页（https://...）                  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 模块依赖图

```
              manifest.json
        （声明入口、权限、覆盖点）
                    │
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
 newtab.html   options.html   background.js
      │             │             │
      ▼             ▼             │
  newtab.js    options.js         │
      │             │             │
      └──────┬──────┘             │
             ▼                    ▼
      storage.local  ◄────── 权限检测结果
      （共享配置）
```

### 2.3 数据流图（打开新标签页）

```
用户按 Ctrl+T
      │
      ▼
Firefox 触发 newtab 覆盖
      │
      ▼
加载 newtab.html → newtab.js
      │
      ▼
读取 storage.local
      │
      ├── enabled = false ──► 显示"已停用"提示，结束
      │
      └── enabled = true
              │
              ▼
        校验 navUrl
              │
              ├── 无效/为空 ──► 显示默认提示页
              │
              └── 有效
                    │
                    ▼
            location.replace(navUrl)
                    │
                    ▼
              进入用户导航页
```

### 2.4 隐私窗口权限流程图

```
        安装扩展
            │
            ▼
   Firefox 弹出安装确认
            │
   ┌────────┴────────┐
   │                 │
勾选"允许在隐私     未勾选
窗口中运行"              │
   │                 │
   ▼                 ▼
普通窗口 +         仅普通窗口可用
隐私窗口均生效          │
                     ▼
              background.js 检测
              isAllowedIncognitoAccess() = false
                     │
                     ▼
              options 页显示提示：
              "请到 about:addons → HomeHold → 权限
               勾选『在隐私窗口中运行』"
```

### 2.5 时序图（首次使用）

```
用户        Firefox       newtab.js      storage      options.js
 │             │              │              │             │
 │ 安装扩展    │              │              │             │
 ├────────────►│              │              │             │
 │             │  授权隐私窗口 │              │             │
 │◄────────────┤              │              │             │
 │ 打开设置    │              │              │             │
 ├─────────────────────────────────────────────────────────►│
 │             │              │              │  读取配置    │
 │             │              │              │◄────────────┤
 │ 填写 URL    │              │              │             │
 ├─────────────────────────────────────────────────────────►│
 │             │              │              │  保存配置    │
 │             │              │              │◄────────────┤
 │ 按 Ctrl+T   │              │              │             │
 ├────────────►│              │              │             │
 │             │  加载覆盖页  │              │             │
 │             ├─────────────►│  读取配置    │             │
 │             │              ├─────────────►│             │
 │             │              │◄─────────────┤             │
 │             │              │  replace()   │             │
 │             │◄─────────────┤              │             │
 │◄────────────┤ 跳转到导航页 │              │             │
```

---

## 三、文件结构

```
homehold/
├── manifest.json           # 扩展声明
├── background.js           # 权限检测（后台）
├── newtab.html             # 覆盖的新标签页
├── newtab.js               # 跳转逻辑
├── newtab.css              # 提示样式（可选）
├── options.html            # 设置页
├── options.js              # 配置读写
├── options.css             # 设置页样式
├── icons/
│   ├── icon-48.png
│   └── icon-96.png
└── README.md
```

---

## 四、核心模块设计

### 4.1 manifest.json

```json
{
  "manifest_version": 3,
  "name": "HomeHold",
  "version": "1.0.0",
  "description": "守住你的主页：新标签页始终打开你的自定义导航页，隐私窗口也不例外。",
  "browser_specific_settings": {
    "gecko": {
      "id": "homehold@yourdomain.com",
      "strict_min_version": "109.0"
    }
  },
  "permissions": ["storage"],
  "chrome_url_overrides": {
    "newtab": "newtab.html"
  },
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  },
  "background": {
    "scripts": ["background.js"]
  },
  "icons": {
    "48": "icons/icon-48.png",
    "96": "icons/icon-96.png"
  }
}
```

**要点**：
- 不写 `"incognito": "not_allowed"`，保持默认 `spanning`
- 只申请 `storage` 权限，减少审核阻力
- `chrome_url_overrides.newtab` 是全局覆盖点，普通/隐私窗口共用

### 4.2 newtab.js —— 跳转模块

```javascript
const DEFAULT_HINT = "尚未配置导航页，请打开 HomeHold 设置。";

async function init() {
  let cfg;
  try {
    cfg = await browser.storage.local.get({
      navUrl: "",
      enabled: true
    });
  } catch (e) {
    showHint("读取配置失败：" + e.message);
    return;
  }

  if (!cfg.enabled) {
    showHint("HomeHold 已停用。");
    return;
  }

  const url = (cfg.navUrl || "").trim();
  if (!isValidUrl(url)) {
    showHint(DEFAULT_HINT);
    return;
  }

  // 用 replace 避免返回键回到空白新标签页
  window.location.replace(url);
}

function isValidUrl(u) {
  try {
    const p = new URL(u);
    return p.protocol === "http:" || p.protocol === "https:";
  } catch {
    return false;
  }
}

function showHint(text) {
  document.body.innerHTML =
    `<div class="hint">${escapeHtml(text)}</div>`;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  }[c]));
}

init();
```

**设计说明**：
- 只允许 `http` / `https`，防止 `javascript:` 等危险协议
- 所有提示文本做 HTML 转义，避免注入
- 错误兜底：读配置失败也不白屏

### 4.3 options.js —— 设置模块

```javascript
const $url     = document.getElementById("navUrl");
const $enabled = document.getElementById("enabled");
const $status  = document.getElementById("incognitoStatus");
const $save    = document.getElementById("save");
const $msg     = document.getElementById("msg");

async function load() {
  const cfg = await browser.storage.local.get({
    navUrl: "",
    enabled: true
  });
  $url.value = cfg.navUrl;
  $enabled.checked = cfg.enabled;
  await refreshIncognitoStatus();
}

async function refreshIncognitoStatus() {
  try {
    const allowed = await browser.extension.isAllowedIncognitoAccess();
    $status.textContent = allowed
      ? "✅ 已允许在隐私窗口运行"
      : "⚠️ 未允许在隐私窗口运行，请到 about:addons → HomeHold → 权限 中开启";
    $status.className = allowed ? "ok" : "warn";
  } catch {
    $status.textContent = "无法检测隐私窗口权限。";
  }
}

$save.addEventListener("click", async () => {
  const url = $url.value.trim();
  if (url && !/^https?:\/\//i.test(url)) {
    $msg.textContent = "请输入以 http:// 或 https:// 开头的地址。";
    $msg.className = "err";
    return;
  }
  await browser.storage.local.set({
    navUrl: url,
    enabled: $enabled.checked
  });
  $msg.textContent = "已保存";
  $msg.className = "ok";
  setTimeout(() => ($msg.textContent = ""), 1500);
});

// 页面获得焦点时刷新权限状态
window.addEventListener("focus", refreshIncognitoStatus);

load();
```

### 4.4 background.js —— 权限检测模块

```javascript
async function syncIncognitoFlag() {
  try {
    const allowed = await browser.extension.isAllowedIncognitoAccess();
    await browser.storage.local.set({ incognitoAllowed: allowed });
  } catch {
    // 忽略
  }
}

browser.runtime.onStartup.addListener(syncIncognitoFlag);
browser.runtime.onInstalled.addListener(syncIncognitoFlag);
```

> 注意：`isAllowedIncognitoAccess()` 的返回值仅供 UI 展示，扩展无法通过代码改变它。

---

## 五、数据模型

`browser.storage.local` 中存储的键：

| 键 | 类型 | 默认值 | 说明 |
|----|------|--------|------|
| `navUrl` | string | `""` | 用户导航页地址 |
| `enabled` | boolean | `true` | 是否启用扩展 |
| `incognitoAllowed` | boolean | `false` | 隐私窗口权限缓存（只读展示用） |

结构示例：

```json
{
  "navUrl": "https://my-nav.example.com",
  "enabled": true,
  "incognitoAllowed": true
}
```

---

## 六、开发步骤

| 阶段 | 任务 | 产出 |
|------|------|------|
| 1 | 搭建骨架 | manifest + newtab.html，`about:debugging` 能加载 |
| 2 | 实现跳转 | newtab.js 读配置 + replace |
| 3 | 实现设置页 | options.html/js 可保存 URL |
| 4 | 加入权限检测 | background.js + 设置页提示 |
| 5 | 隐私窗口实测 | 授权后验证跳转 |
| 6 | 打包上架 | `web-ext build` → AMO |

**本地调试命令**：

```bash
npm install -g web-ext
cd homehold
web-ext run                 # 自动启动 Firefox 调试
web-ext build               # 打包 zip
web-ext lint                # 静态检查
```

---

## 七、测试清单

| # | 场景 | 预期 |
|---|------|------|
| 1 | 普通窗口新标签页 | 跳转到导航页 |
| 2 | 隐私窗口新标签页（已授权） | 跳转到导航页 |
| 3 | 隐私窗口新标签页（未授权） | Firefox 默认新标签页 |
| 4 | 未填写 URL | 显示"尚未配置"提示 |
| 5 | 填写非法 URL（如 `javascript:`） | 显示提示，不跳转 |
| 6 | 关闭 enabled | 显示"已停用" |
| 7 | 跳转后按返回键 | 不回到空白新标签页 |
| 8 | 设置页保存后立刻打开新标签页 | 使用新地址 |
| 9 | 设置页未授权提示 | 显示引导文案 |
| 10 | 断网状态打开新标签页 | 浏览器正常报错，扩展不崩溃 |

---

## 八、安全与隐私

- 不申请 `tabs`、`history`、`webRequest` 等敏感权限
- 不发起任何网络请求（跳转由浏览器完成）
- 不收集遥测数据
- 所有配置仅存本地
- 对 URL 做协议白名单校验，防注入
- 提示文本做 HTML 转义

---

## 九、已知限制

1. 隐私窗口权限**必须用户手动授权**，扩展无法强制。
2. 隐私窗口未授权时，覆盖页不会加载，会回落到 Firefox 默认新标签页。
3. `file://` 本地页面可能被 CSP 拦截，建议用线上地址。
4. 部分 Firefox 版本对 `chrome_url_overrides` 在隐私窗口的行为有差异，需实测。
5. AMO 对新标签页覆盖类扩展审核较严，需在描述中声明无数据收集。

---

## 十、后续迭代

- v1.1：支持多导航页 + 快捷键切换
- v1.2：导入 / 导出配置
- v1.3：`storage.sync` 跨设备同步
- v1.4：从书签生成导航页
- v2.0：可选深色主题与自定义提示页

---

需要我把这些文件直接整理成一份**可加载的完整源码包结构**（包含 manifest、newtab、options、background 全部文件内容），还是先补一份 **AMO 上架用的描述与隐私声明**？
