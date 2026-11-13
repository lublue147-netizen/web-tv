# 📺 蜂蜜 Web TV (iOS 原生端 & 纯静态播放系统)

> **专为 iOS Safari（配合官方 Userscripts / Stay 扩展）设计的 “零云端服务器、零后台黑窗口、100% 本地视频流量、100% 本地爬虫解析” 影视系统。**  
> 完整继承并全面迁移自 [`subscription`](https://github.com/lublue147-netizen/subscription)（TVBox / FongMi 影视源、4K网盘中心与加速内核）。

---

## 🔗 快速访问与安装入口

| 项目 | 地址 | 说明 |
| :--- | :--- | :--- |
| 🚀 **在线 Web TV 客户端** | [**https://lublue147-netizen.github.io/web-tv/**](https://lublue147-netizen.github.io/web-tv/) | 纯前端静态网页，可直接添加到 iPhone 主屏幕 |
| 📥 **iOS 特权内核 (一键安装)** | [**catvod-ios-kernel.user.js**](https://lublue147-netizen.github.io/web-tv/kernel/catvod-ios-kernel.user.js) | 在 Safari 中点击即可唤醒扩展弹出原生安装确认卡片 |
| ☁️ **网盘授权配置中心** | 客户端页面右上角 **「☁️ 网盘配置」** 按钮 | 兼容 `token.json`，支持夸克、阿里、AList、WebDAV、115、百度 |
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

* **正常状态**：页面顶部状态胶囊呈现绿色并显示 **`🟢 iOS 特权内核已就绪 v3.1.0`**，代表无视 CORS、Referer 伪造与本地 M3U8 智能清洗已全部就绪！
* **异常排查**：若显示红色未连接，轻触状态胶囊即可查看排查提示，检查扩展是否已启用。

### 第五步：添加到主屏幕（沉浸式 PWA 观影）
为了获得宛如原生 App 的观影体验（隐藏 Safari 地址栏与底部导航）：
1. 在 Safari 打开 Web TV 页面；
2. 点击浏览器底部正中央的 **「分享」** 按钮；
3. 在弹出菜单中选择 **「添加到主屏幕」**；
4. 点击右上角「添加」，手机桌面上便会生成专属的 **“蜂蜜 Web TV”** 图标；
5. 点击图标启动，支持**全屏沉浸播放、画中画（PiP）、倍速调节与后台播放**！

---

## ☁️ 4K 网盘与私人云存储配置 (全量适配)

本系统内置与 `subscription` 底层 **PanBaseSpider** 严格对齐的纯 JS 网盘解析引擎（[pan_engine.js](spiders/pan_engine.js)），全面支持 10 大网盘与私人存储挂载：

### 1. 配置入口与导入方式
- 点击 Web TV 页面右上角 **「☁️ 网盘配置」** 按钮；
- 支持 **「一键导入 token.json」**：直接粘贴你的 `token.json` 即可一键载入所有 Cookie 和 Token；
- 配置数据 **100% 存放在 iPhone 本地 `localStorage`** 中，绝不外泄。

### 2. 支持的网盘与挂载协议
| 网盘 / 协议 | 配置参数 | 播放特性 |
| :--- | :--- | :--- |
| **⚡ 夸克网盘 4K** | `quark_cookie` | 自动请求 `/1/clouddrive/file/v2/play`，直出 4K 超清切片与原画 |
| **⚡ 阿里云盘原画** | `token` (refresh_token) | 自动刷新 AccessToken，拉取 Live Transcoding 4K/1080P 直出 M3U8 |
| **📁 AList 挂载** | `alist_url` + `alist_token` | 挂载个人 AList 服务，遍历目录并秒开直链播放 |
| **☁️ WebDAV 私有云** | `webdav_url` + 账号/密码 | 兼容坚果云、群晖、TrueNAS 等私有云媒体库 |
| **🐮 115 / 百度网盘** | `pan115_cookie` / `baidu_cookie` | 配合分享提取码，一键直取原画播放流 |
| **🔍 跨站批量极速解密** | 自动对接 `gugeso.com/api/other/decrypt_urls` | 秒级批量解密密文直链，多线路并发容灾 |

---

## 📺 全量 48+ 站点适配迁移映射

本系统对 `subscription/config/custom.json` 中的全部站点进行了细致重构与原生前端移植：

### 💎 4K 网盘专区 (15 个站点)
- **🔍 谷歌搜 4K (`GuGeSo`)**：100% 复刻 `GuGeSo.java`，SSE 实时流检索 + 批量解密，跨 10 大网盘智能合并同剧线路。
- **💓 玩偶哥哥 4K (`wogg`)**：老牌 4K 网盘片库，自动解构详情页夸克/阿里网盘链接并展开选集。
- **💓 花卷 4K (`huajuan`)**：臻彩 4K 原画片库，杜比视界高码率。
- **💓 观影 4K (`AiNewGuanYing`)** / **💓 七味 4K (`AiQwMkv`)** / **💓 盘库 4K (`AiNewPianKu`)** / **💓 立播 4K (`AiNewLibvio`)**
- **🎬 追剧吧 4K (`ZhuiJu`)** / **⚡ 快快搜 4K (`KkSo`)** / **🎠 盘搜 4K (`PanSou`)** / **🐕 狗狗盘搜 4K (`GoGoPanSo`)** / **🌐 全盘搜索 4K (`QuanPan`)**
- **🦆 光鸭 4K (`GuangYa`)** / **🎠 海印盘搜 (`SoAiHaiYin`)** / **🎠 卡卡盘搜 (`SoKaKa`)**

### 🚀 极速秒播专区 (12 个站点)
- **💥 独播秒播 (`DuBoKu`)**：独播库官网热播流，Base64 解密直出 HLS 免广告切片。
- **❄️ 洛雪TV (`Lxyy`)**：深度对接 `tv.lxyy.club`，覆盖 4K60帧、自营蓝光、爱优腾官采等 8 大极速专线。
- **🍉 西瓜秒播 (`KanMovie`)**：并发汇聚暴风、360、魔都、如意、量子、非凡等 10~25 条超清蓝光直链，秒开秒换源。
- **🎬 可可影视 (`KkYS`)**：自动逆向破解 PoW SHA-1 防护，直出免嗅探切片流。
- **🎬 欧特秒播 (`Aeete`)** / **💥 剧OK秒播 (`JuOk`)** / **✨ 创享秒播 (`ChuangXiang`)** / **🍄 蘑菇秒播 (`MoGu`)**
- **🎬 懂片帝 AI (`DongPian`)** / **💓 立播 4K (`Libvio`)** / **👥 人人影视 (`YYeTs`)** / **💥 韩剧/瓜子/贱片秒播专线**

### 📁 私人网盘 & AList (2 个站点)
- **🐮 我的网盘 (`MyPan`)**：可在 Web TV 界面中直接浏览个人 AList、WebDAV、夸克、阿里网盘的媒体库并点播！
- **🐮 网盘配置 (`Wexconfig`)**：一键配置所有网盘鉴权信息。

### 🌸 动漫专区 (2 个站点)
- **🌸 樱花动漫 (`YingHua`)**：深度逆向 MacCMS 魅主题，日漫新番、国漫、剧场版超清秒播。
- **🤡 稀饭动漫 (`AnimeXiFan`)**：动漫备用线路。

### 🌍 全球直播 & 海外影视 (9 个站点)
- **🏆 TheTVApp (`TheTVApp`)**：欧美主流体育赛事直播。
- **🛡️ GuardianTV (`GuardianTV`)** / **📻 DaddyLive (`DaddyLive`)** / **🌿 LiveTVGarden (`LiveTVGarden`)** / **📺 LiveHDTV (`LiveHDTV`)**
- **🅱️ 哔哩直播 (`LiveAiBiLi`)**
- **🎬 CineVid** / **🎬 Cineby** / **🎬 Cinejoy**

### 🐮 精选热榜 (2 个站点)
- **🐮【豆瓣热榜】🐮 (`Douban`)**：权威院线电影、热播剧集、热门国漫与日漫精选榜单，点击自动全网搜片。
- **🎬 TMDB 全球影视榜 (`TMDB`)**

---

## ⚡ 核心架构与技术创新

```
[iPhone Safari 浏览器 / PWA 桌面全屏]
       │
       ├─ 1. 特权网络驱动 (GM_xmlhttpRequest) ──► 无视浏览器 CORS，任意伪造 Referer / UA 标头
       │
       ├─ 2. 纯前端 JS 爬虫沙箱 ──► 运行迁移自 subscription 的全部 48 站点
       │
       ├─ 3. 4K 网盘引擎 (PanEngine) ──► 自动展开网盘目录选集 + 密文批量解密 + Token 授权直链
       │
       ├─ 4. M3U8 本地智能清洗引擎 ──► 自动切除 #EXT-X-DISCONTINUITY 插播赌博广告 + 内联 AES-128 密钥
       │
       └─ 5. 交付 iOS 原生 <video> ──► 转换为 Base64 Data URI，直接调用苹果底层 AVPlayer 硬件解码秒播！
```

1. **零服务端依赖**：无需部署任何云端 VPS、Docker、Node.js 服务或本地常驻进程。
2. **100% 本地视频流量**：视频流 (`.m3u8` / `.ts` / 网盘原画) 直连源站 CDN，出门在外仅用 5G 手机网络即可畅看全网。
3. **M3U8 内存级去广告与解密**：
   - 智能识别并成组剥离采集站插播切片广告；
   - 抓取 `#EXT-X-KEY` 密钥并内联为 `data:application/octet-stream;base64`，突破跨域密钥鉴权；
   - 将相对 TS 切片补全为源站 CDN 绝对路径；
   - 转为 `data:application/vnd.apple.mpegurl;base64`，避开 iOS `blob:` 进程隔离问题。
4. **自动无感更新**：
   内核脚本包含 `@updateURL` 与 `@downloadURL`。后续仓库修复站点防盗链或新增秒播线路时，Userscripts / Stay 将在后台**自动静默拉取更新**。

---

## 🛠️ 常见问题 FAQ

#### Q1: 页面顶部一直显示“⚠️ 扩展内核未连接”？
- **A**: 
  1. 请检查 iOS「设置」->「Safari 浏览器」->「扩展」中，**Userscripts**（或 Stay）是否已开启并授权为“始终允许”；
  2. 点击 Safari 地址栏左侧的拼图或「大小」图标，进入 Userscripts 菜单，确保该脚本状态为已激活勾选。

#### Q2: 4K 网盘资源点击后提示需要授权？
- **A**: 
  夸克网盘与阿里云盘播放原画或特定资源时，需要账号鉴权。请点击页面右上角 **「☁️ 网盘配置」**，填入你的夸克 Cookie 或阿里云盘 Token（或直接点击「一键导入 token.json」），保存后即可畅看 4K 原画。

#### Q3: 为什么不需要任何后台和 VPS 服务器？
- **A**: 
  传统 Web 播放器之所以需要后端代理，是因为浏览器受限于 CORS 跨域安全和无法修改 Headers。而本系统利用苹果官方提供的 Safari Userscripts 扩展特权 API（`GM_xmlhttpRequest`），在手机系统沙箱内就拥有了完整的网络请求特权，因而无需任何外部代理服务器。
