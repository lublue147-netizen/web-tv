# 📺 蜂蜜 Web TV (iOS 原生端 & 纯静态播放系统)

> **专为 iOS Safari（配合官方 Userscripts / Stay 扩展）设计的 “零云端服务器、零后台黑窗口、100% 本地视频流量、100% 本地爬虫解析” 影视系统。**  
> 完美继承并迁移自 [`subscription`](https://github.com/lublue147-netizen/subscription)（TVBox / FongMi 影视源与网盘加速中心）。

---

## 🔗 快速访问与安装入口

| 项目 | 地址 | 说明 |
| :--- | :--- | :--- |
| 🚀 **在线 Web TV 客户端** | [**https://lublue147-netizen.github.io/web-tv/**](https://lublue147-netizen.github.io/web-tv/) | 纯前端静态网页，可直接添加到 iPhone 主屏幕 |
| 📥 **iOS 特权内核 (一键安装)** | [**catvod-ios-kernel.user.js**](https://lublue147-netizen.github.io/web-tv/kernel/catvod-ios-kernel.user.js) | 在 Safari 中点击即可唤醒扩展弹出原生安装确认卡片 |
| 📦 **GitHub 源码仓** | [**lublue147-netizen/web-tv**](https://github.com/lublue147-netizen/web-tv) | 100% 开源，GitHub Actions 自动化部署 |

---

## 📱 详细安装与使用指导 (iOS Safari)

整个配置过程仅需操作一次，后续所有爬虫和去广告更新均由 GitHub **自动静默下发**。

### 第一步：安装 iOS Safari 油猴扩展 (二选一)
在 iPhone / iPad 的 App Store 搜索并下载安装以下任意一款开源免费扩展：
- 🌟 **[Userscripts](https://apps.apple.com/app/userscripts/id1463298887)**（首选推荐，官方开源、极简轻量、零内购无广告）
- 🚀 **[Stay - 浏览器脚本扩展](https://apps.apple.com/app/stay-userscript-extension/id1591620924)**（功能丰富、界面现代）

### 第二步：开启 Safari 扩展权限
1. 打开 iPhone 的 **「系统设置」** -> 下滑找到 **「Safari 浏览器」**；
2. 点击 **「扩展」**，找到刚下载的 **Userscripts**（或 Stay）；
3. 将开关置为 **开启**；
4. 点击进入该扩展设置，将权限设为 **「所有网站」->「始终允许」**（确保能够为任意采集站与 M3U8 切片提供特权跨域支持）。

### 第三步：一键安装特权内核脚本
1. 在 iPhone Safari 浏览器中，直接点击下方安装链接：  
   👉 [**https://lublue147-netizen.github.io/web-tv/kernel/catvod-ios-kernel.user.js**](https://lublue147-netizen.github.io/web-tv/kernel/catvod-ios-kernel.user.js)
2. Safari 会**自动拦截并唤起扩展的原生安装界面**，展示脚本名称及权限清单：
   - `@name 蜂蜜影视 iOS 纯前端全功能内核 (强化版)`
   - `@grant GM_xmlhttpRequest` (特权网络穿透)
3. 点击底部的 **「安装 / Install」** 按钮，即刻生效！

### 第四步：进入客户端并验证内核
在 Safari 中打开客户端地址：  
👉 [**https://lublue147-netizen.github.io/web-tv/**](https://lublue147-netizen.github.io/web-tv/)

* **正常状态**：页面顶部状态胶囊呈现绿色并显示 **`🟢 iOS 特权内核已就绪 v3.0.0`**，代表无视 CORS、Referer 伪造与本地 M3U8 智能清洗已全部就绪！
* **异常排查**：若显示红色未连接，轻触状态胶囊即可查看排查提示，检查扩展是否已启用。

### 第五步：添加到主屏幕（沉浸式 PWA 观影）
为了获得宛如原生 App 的观影体验（隐藏 Safari 地址栏与底部导航）：
1. 在 Safari 打开 Web TV 页面；
2. 点击浏览器底部正中央的 **「分享」** 按钮；
3. 在弹出菜单中选择 **「添加到主屏幕」**；
4. 点击右上角「添加」，手机桌面上便会生成专属的 **“蜂蜜 Web TV”** 图标；
5. 点击图标启动，支持**全屏沉浸播放、画中画（PiP）、倍速调节与后台播放**！

---

## 💻 桌面端 / Android 端安装指引

本系统同样 100% 兼容 PC / Mac 电脑与 Android 浏览器：

1. **安装浏览器油猴插件**：
   - Chrome / Edge / Firefox / 360极速：安装 [Tampermonkey (篡改猴)](https://www.tampermonkey.net/) 或 [ScriptCat (脚本猫)](https://scriptcat.org/)。
2. **安装内核**：
   - 点击 [catvod-ios-kernel.user.js](https://lublue147-netizen.github.io/web-tv/kernel/catvod-ios-kernel.user.js)，插件将自动打开安装界面，点击「安装」；
3. **打开网页看剧**：
   - 访问 [https://lublue147-netizen.github.io/web-tv/](https://lublue147-netizen.github.io/web-tv/) 即可全屏看片。

---

## ⚡ 核心架构与技术创新

```
[iPhone Safari 浏览器 / PWA 桌面全屏]
       │
       ├─ 1. 特权网络驱动 (GM_xmlhttpRequest) ──► 无视浏览器 CORS，任意伪造 Referer / UA 标头
       │
       ├─ 2. 纯前端 JS 爬虫沙箱 ──► 运行迁移自 subscription 的站点 (独播库、豆瓣热榜、Apple CMS等)
       │
       ├─ 3. M3U8 本地智能清洗引擎 ──► 自动切除 #EXT-X-DISCONTINUITY 插播赌博广告 + 内联 AES-128 密钥
       │
       └─ 4. 交付 iOS 原生 <video> ──► 转换为 Base64 Data URI，直接调用苹果底层 AVPlayer 硬件解码秒播！
```

1. **零服务端依赖**：无需部署任何云端 VPS、Docker、Node.js 服务或本地常驻进程。
2. **100% 本地视频流量**：视频流 (`.m3u8` / `.ts`) 直连源站 CDN，出门在外仅用 5G 手机网络即可畅看全网。
3. **M3U8 内存级去广告与解密**：
   - 智能识别并成组剥离采集站插播切片广告；
   - 抓取 `#EXT-X-KEY` 密钥并内联为 `data:application/octet-stream;base64`，突破跨域密钥鉴权；
   - 将相对 TS 切片补全为源站 CDN 绝对路径；
   - 转为 `data:application/vnd.apple.mpegurl;base64`，避开 iOS `blob:` 进程隔离问题。
4. **自动无感更新**：
   内核脚本包含 `@updateURL` 与 `@downloadURL`。后续仓库修复站点防盗链或新增秒播线路时，Userscripts / Stay 将在后台**自动静默拉取更新**。

---

## 📺 迁移自 `subscription` 的站点映射

| 站点名称 | 对应 subscription 原始文件 | 纯前端迁移适配方案 | 状态 |
| :--- | :--- | :--- | :---: |
| **💥独播┃秒播💥** | `com/github/catvod/spider/DuBoKu.java` | 移植为纯 JS [duboku.js](spiders/duboku.js)，使用原生 `atob` 与 `decodeURIComponent` 解密 `player_data` 直出 HLS 切片流 | 🟢 100% 原生直连秒播 |
| **🐮【豆瓣热榜】🐮** | `config/custom.json` (Douban 站) | 编写为 [douban.js](spiders/douban.js)，直接对接热门剧集、院线电影、日本动画榜单，点击自动全网搜片 | 🟢 聚合推荐与秒搜 |
| **⚡量子/非凡/暴风秒播⚡** | `config/custom.json` (存量秒播线) | 封装 [cms.js](spiders/cms.js) 标准 Apple CMS V10 REST API，纯 JSON 直连无广告切片 | 🟢 免爬虫极速蓝光 |
| **✨创享/剧OK/西瓜秒播✨** | `config/custom.json` (存量秒播线) | 预置在 [registry.js](spiders/registry.js) 中，同时支持在设置中自定义扩展任意 CMS 采集站 | 🟢 纯前端秒级切台 |
| **📺 电视直播 (5000+台)** | `subscription/live/iptv.m3u` | 映射为 [iptv.m3u](data/iptv.m3u)，支持央视IPV4、卫视、港澳台、体育竞技等毫秒级切台 | 🟢 纯前端虚拟流渲染 |

---

## 🛠️ 常见问题 FAQ

#### Q1: 页面顶部一直显示“⚠️ 扩展内核未连接”？
- **A**: 
  1. 请检查 iOS「设置」->「Safari 浏览器」->「扩展」中，**Userscripts**（或 Stay）是否已开启并授权为“始终允许”；
  2. 点击 Safari 地址栏左侧的拼图或「大小」图标，进入 Userscripts 菜单，确保该脚本状态为已激活勾选。

#### Q2: 点击剧集播放后，播放器一直黑屏转圈？
- **A**: 
  1. iOS Safari 对流媒体首次播放有安全策略，轻触播放器中心或点击播放键即可；
  2. 极少数特殊视频源若出现源站服务器下线，可尝试切换其他线路（如从独播秒播切换至量子或非凡秒播线）。

#### Q3: 为什么不需要任何后台和 VPS 服务器？
- **A**: 
  传统 Web 播放器之所以需要后端代理，是因为浏览器受限于 CORS 跨域安全和无法修改 Headers。而本系统利用苹果官方提供的 Safari Userscripts 扩展特权 API（`GM_xmlhttpRequest`），在手机系统沙箱内就拥有了完整的网络请求特权，因而无需任何外部代理服务器。
