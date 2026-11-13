# 📺 蜂蜜 Web TV (iOS 原生端 & 纯静态播放系统)

> **专为 iOS Safari（配合官方 Userscripts / Stay 扩展）设计的 “零云端服务器、零后台黑窗口、100% 本地视频流量、100% 本地爬虫解析” 影视系统。**  
> 完美继承并迁移自 `subscription`（TVBox / FongMi 影视源与网盘加速中心）。

---

## ⚡ 核心架构与创新亮点

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
   - 智能识别并剥离插播广告切片；
   - 抓取 `#EXT-X-KEY` 密钥并内联为 `data:application/octet-stream;base64`，突破跨域密钥鉴权；
   - 将相对 TS 切片补全为 CDN 绝对路径；
   - 转为 `data:application/vnd.apple.mpegurl;base64`，避开 iOS `blob:` 进程隔离问题。
4. **全端原生体验**：深度适配 iPhone 灵动岛、安全区域、画中画（PiP）、全屏与倍速播放。

---

## 📁 目录结构

```
web-tv/
├── index.html                       # 纯静态前端播放器 (单页面应用，支持 PWA)
├── kernel/
│   └── catvod-ios-kernel.user.js   # iOS 油猴特权内核 (Userscripts / Stay 脚本)
├── spiders/                         # 迁移自 subscription 的纯 JS 爬虫
│   ├── duboku.js                   # 独播秒播爬虫 (www.dbku.tv)
│   ├── douban.js                   # 豆瓣热榜与推荐引擎
│   ├── cms.js                      # 苹果 CMS (Apple CMS V10) 通用采集源适配器
│   └── registry.js                 # 站点注册表
└── data/
    ├── iptv.m3u                    # 5000+ 电视直播源 (央视、卫视、体育、DaddyLive等)
    └── sites.json                  # subscription 存量 48 个站源映射元数据
```

---

## 🚀 快速上手与使用指南

### 第一步：在 iPhone 上安装油猴扩展与内核

1. 打开 iPhone App Store，下载安装开源免费的 **Userscripts** 扩展（或 **Stay** 扩展）。
2. 在 iOS「设置」->「Safari 浏览器」->「扩展」中，将 **Userscripts** 开启，并将权限设为「始终允许」。
3. 导入内核脚本：
   - 在 Safari 中打开 `kernel/catvod-ios-kernel.user.js`（或点击网页内的“📥 安装内核”按钮）；
   - 在弹出的 Userscripts 安装界面点击确认安装。

### 第二步：运行与打开前端

#### 方式 A：本地直接运行
在当前目录运行极简静态服务：
```bash
# 使用 Python 启动
python3 -m http.server 8080

# 或使用 Node.js serve
npx serve .
```
在手机或电脑浏览器中直接访问：`http://局域网IP:8080` 或 `http://localhost:8080`。

#### 方式 B：一键部署到 GitHub Pages / Cloudflare Pages
本项目为 **100% 纯静态文件**，无需任何构建编译。直接将 `web-tv/` 仓库内容推送到 GitHub，开启 **GitHub Pages** 即可免费拥有全球极速直连的个人专属影视 Web 客户端！

#### 方式 C：添加到 iPhone 主屏幕（PWA）
在 Safari 打开网页后，点击底部「分享」按钮 ->「添加到主屏幕」，即可像原生 App 一样全屏沉浸式看剧。

---

## 📺 迁移自 subscription 的站点映射

| 站点名称 | 对应 subscription 原始文件 | 实现方式 | 状态 |
| :--- | :--- | :--- | :---: |
| **💥独播┃秒播💥** | `com/github/catvod/spider/DuBoKu.java` | `spiders/duboku.js` (解密 player_data 直出 HLS) | 🟢 100% 原生直连 |
| **🐮【豆瓣热榜】🐮** | `config/custom.json` (Douban 站) | `spiders/douban.js` (热门电影/电视剧榜单) | 🟢 聚合搜片秒播 |
| **⚡量子/非凡/暴风秒播⚡**| `config/custom.json` (CMS秒播线) | `spiders/cms.js` (Apple CMS V10 REST API) | 🟢 极速蓝光秒播 |
| **📺 电视直播 (5000+台)**| `subscription/live/iptv.m3u` | `data/iptv.m3u` (央视、卫视、体育、海外) | 🟢 本地流式播放 |
| **✨创享/剧OK/西瓜秒播✨**| `config/custom.json` | 挂载于 `SiteRegistry` (支持自定义扩充) | 🟢 纯前端支持 |

---

## 🛠️ 故障排查

1. **页面上方显示“⚠️ 扩展内核未连接”**：
   - 请检查 Safari 扩展中的 Userscripts / Stay 是否已启用。
   - 在 Userscripts 弹出菜单中，确保当前网页的访问权限为“允许”。
2. **播放无声音或视频不自动播放**：
   - iOS Safari 对网页自动播放有严格策略，首次播放需手动点击一次屏幕中的剧集按钮或播放键。
