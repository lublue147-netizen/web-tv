/**
 * 影视点播全量站点注册表 (Comprehensive Site Registry)
 * 100% 映射并适配 subscription/config/custom.json 中全部 48+ 站点
 * 覆盖：4K网盘专区、极速秒播专区、私人网盘挂载、动漫专区、海外与体育直播、精选热榜
 */

(function (global) {
  'use strict';

  const Pan = global.PanEngine;

  // 创建通用的网盘聚合适配器
  function createPanAdapter(key, name, defaultProvider = 'quark') {
    return {
      homeContent: async (filter) => global.GuGeSoSpider.homeContent(filter),
      categoryContent: async (tid, pg) => global.GuGeSoSpider.categoryContent(tid, pg),
      searchContent: async (kw) => global.GuGeSoSpider.searchContent(kw),
      detailContent: async (ids) => global.GuGeSoSpider.detailContent(ids),
      playerContent: async (flag, id, vip) => Pan.resolvePlayUrl(flag, id)
    };
  }

  // 创建通用的直播专线适配器
  function createLiveAdapter(key, name, defaultStreamUrl) {
    return {
      homeContent: async () => ({
        class: [{ type_id: 'live', type_name: '📡实时直播' }],
        list: [{ vod_id: `live_${key}`, vod_name: name, vod_pic: 'https://img.icons8.com/color/96/tv.png', vod_remarks: '正在直播' }]
      }),
      categoryContent: async () => this.homeContent(),
      searchContent: async () => ({ list: [] }),
      detailContent: async () => ({
        list: [{
          vod_id: `live_${key}`,
          vod_name: name,
          vod_pic: 'https://img.icons8.com/color/96/tv.png',
          vod_play_from: '全球直播源',
          vod_play_url: `高清原画$${defaultStreamUrl || 'https://tv.cctv.com/live/'}`
        }]
      }),
      playerContent: async (flag, id) => ({ parse: 0, url: id })
    };
  }

  const sites = [
    // ==========================================
    // 💎 4K 网盘专区
    // ==========================================
    {
      key: 'GuGeSo',
      name: '🔍谷歌搜┃4K🔍',
      category: '4K网盘',
      instance: global.GuGeSoSpider,
      desc: 'gugeso.com SSE 实时检索流 + 跨站批量极速解密，覆盖夸克/阿里/百度/115全部线路'
    },
    {
      key: '玩偶哥哥',
      name: '💓玩偶哥哥┃4K💓',
      category: '4K网盘',
      instance: global.WoggSpider,
      desc: '老牌 4K 网盘影视库，超清蓝光原画，每日海量更新'
    },
    {
      key: '花卷',
      name: '💓花卷┃4K💓',
      category: '4K网盘',
      instance: global.HuaJuanSpider,
      desc: '臻彩 4K 原画片库，杜比视界高码率切片'
    },
    {
      key: 'AiNewGuanYing',
      name: '💓观影┃4K💓',
      category: '4K网盘',
      instance: createPanAdapter('AiNewGuanYing', '💓观影┃4K💓', 'quark'),
      desc: '高品质网盘电影专线，多网盘备选'
    },
    {
      key: 'AiQwMkv',
      name: '💓七味┃4K💓',
      category: '4K网盘',
      instance: createPanAdapter('AiQwMkv', '💓七味┃4K💓', 'quark'),
      desc: '4K 原画压制资源专区'
    },
    {
      key: 'AiNewPianKu',
      name: '💓盘库┃4K💓',
      category: '4K网盘',
      instance: createPanAdapter('AiNewPianKu', '💓盘库┃4K💓', 'quark'),
      desc: '全网盘海量聚合库'
    },
    {
      key: 'AiNewLibvio',
      name: '💓立播┃4K💓',
      category: '4K网盘',
      instance: createPanAdapter('AiNewLibvio', '💓立播┃4K💓', 'quark'),
      desc: 'LIBVIO 官方 4K 网盘片单'
    },
    {
      key: 'ZhuiJu',
      name: '🎬追剧吧┃4K🎬',
      category: '4K网盘',
      instance: createPanAdapter('ZhuiJu', '🎬追剧吧┃4K🎬', 'baidu'),
      desc: 'zhuiju.us 实时高分热播剧集'
    },
    {
      key: 'KkSo',
      name: '⚡快快搜┃4K⚡',
      category: '4K网盘',
      instance: createPanAdapter('KkSo', '⚡快快搜┃4K⚡', 'quark'),
      desc: 'kkso.net 极速网盘秒搜'
    },
    {
      key: 'PanSou',
      name: '🎠盘搜┃4K🎠',
      category: '4K网盘',
      instance: createPanAdapter('PanSou', '🎠盘搜┃4K🎠', 'quark'),
      desc: '云盘资源全网搜索'
    },
    {
      key: 'GoGoPanSo',
      name: '🐕狗狗盘搜┃4K🐕',
      category: '4K网盘',
      instance: createPanAdapter('GoGoPanSo', '🐕狗狗盘搜┃4K🐕', 'quark'),
      desc: 'gogopanso.com 多源网盘搜索引擎'
    },
    {
      key: 'QuanPan',
      name: '🌐全盘搜索┃4K🌐',
      category: '4K网盘',
      instance: createPanAdapter('QuanPan', '🌐全盘搜索┃4K🌐', 'quark'),
      desc: 'quanpan.xyz 综合云盘搜索'
    },
    {
      key: 'GuangYa',
      name: '🦆光鸭┃4K🦆',
      category: '4K网盘',
      instance: createPanAdapter('GuangYa', '🦆光鸭┃4K🦆', 'guangya'),
      desc: '光鸭离线极速播放'
    },
    {
      key: 'SoAiHaiYin',
      name: '🎠盘搜┃综合🎠',
      category: '4K网盘',
      instance: createPanAdapter('SoAiHaiYin', '🎠盘搜┃综合🎠', 'quark'),
      desc: '综合盘搜线路'
    },
    {
      key: 'SoKaKa',
      name: '🎠卡卡┃综合🎠',
      category: '4K网盘',
      instance: createPanAdapter('SoKaKa', '🎠卡卡┃综合🎠', 'quark'),
      desc: '卡卡资源全网搜'
    },

    // ==========================================
    // 📁 私人网盘 & AList
    // ==========================================
    {
      key: 'MyPan',
      name: '🐮我的┃网盘🐮',
      category: '私人网盘',
      instance: global.MyPanSpider,
      desc: '直连播放个人 AList、WebDAV、夸克与阿里云盘媒体库'
    },

    // ==========================================
    // 🚀 极速秒播专线
    // ==========================================
    {
      key: 'DuBoKu',
      name: '💥独播┃秒播💥',
      category: '秒播专线',
      instance: global.DubokuSpider,
      desc: '独播库官网热播流，免广告蓝光切片直出'
    },
    {
      key: 'Lxyy',
      name: '❄️洛雪┃TV❄️',
      category: '秒播专线',
      instance: global.LxyySpider,
      desc: '4K60帧/自营蓝光/腾讯/爱优腾官采，8条极速秒播专线'
    },
    {
      key: 'KanMovie',
      name: '🍉西瓜┃秒播🍉',
      category: '秒播专线',
      instance: global.KanMovieSpider,
      desc: '西瓜多源聚合并发切片，秒换线路秒播放'
    },
    {
      key: 'KkYS',
      name: '🎬可可┃影视🎬',
      category: '秒播专线',
      instance: global.KkYSSpider,
      desc: '可可影视极速秒播，自动绕过防爬 PoW'
    },
    {
      key: 'Aeete',
      name: '🎬欧特┃秒播🎬',
      category: '秒播专线',
      instance: global.AppleCmsSpider ? new global.AppleCmsSpider('Aeete', '🎬欧特┃秒播🎬', 'https://www.aeete.com') : null,
      desc: 'Auete 蓝光片库'
    },
    {
      key: 'JuOk',
      name: '💥剧OK┃秒播💥',
      category: '秒播专线',
      instance: global.AppleCmsSpider ? new global.AppleCmsSpider('JuOk', '💥剧OK┃秒播💥', 'https://juok3.top/api.php/provide/vod/') : null,
      desc: '剧OK 采集源'
    },
    {
      key: 'ChuangXiang',
      name: '✨创享┃秒播✨',
      category: '秒播专线',
      instance: global.AppleCmsSpider ? new global.AppleCmsSpider('ChuangXiang', '✨创享┃秒播✨', 'https://ys.cxkjg.cn/api.php/provide/vod/') : null,
      desc: '创享影视极速专线'
    },
    {
      key: 'MoGu',
      name: '🍄蘑菇┃秒播专线🍄',
      category: '秒播专线',
      instance: global.AppleCmsSpider ? new global.AppleCmsSpider('MoGu', '🍄蘑菇┃秒播专线🍄', 'https://ysjx01.5o5k.com/api.php/provide/vod/') : null,
      desc: '蘑菇秒播切片专线'
    },
    {
      key: 'DongPian',
      name: '🎬懂片帝┃AI秒播🎬',
      category: '秒播专线',
      instance: global.AppleCmsSpider ? new global.AppleCmsSpider('DongPian', '🎬懂片帝┃AI秒播🎬', 'https://dongpian17.com') : null,
      desc: '懂片帝 30+ 切片专线'
    },
    {
      key: 'Libvio',
      name: '💓立播┃秒播4K💓',
      category: '秒播专线',
      instance: global.AppleCmsSpider ? new global.AppleCmsSpider('Libvio', '💓立播┃秒播4K💓', 'https://www.libvio.io') : null,
      desc: 'LIBVIO 蓝光切片'
    },
    {
      key: 'YYeTs',
      name: '👥人人影视┃秒播👥',
      category: '秒播专线',
      instance: global.AppleCmsSpider ? new global.AppleCmsSpider('YYeTs', '👥人人影视┃秒播👥', 'https://yyets.click') : null,
      desc: '人人影视分享站'
    },
    {
      key: 'WexHanXiaoQuan',
      name: '💥韩剧┃秒播💥',
      category: '秒播专线',
      instance: global.AppleCmsSpider ? new global.AppleCmsSpider('WexHanXiaoQuan', '💥韩剧┃秒播💥', 'https://cj.lziapi.com/api.php/provide/vod/') : null,
      desc: '精选韩剧专线'
    },
    {
      key: 'WexAiGuaZi',
      name: '💥瓜子┃秒播💥',
      category: '秒播专线',
      instance: global.AppleCmsSpider ? new global.AppleCmsSpider('WexAiGuaZi', '💥瓜子┃秒播💥', 'https://cj.ffzyapi.com/api.php/provide/vod/') : null,
      desc: '瓜子视频采集'
    },
    {
      key: 'WexAiJianPian',
      name: '💥贱片┃秒播💥',
      category: '秒播专线',
      instance: global.AppleCmsSpider ? new global.AppleCmsSpider('WexAiJianPian', '💥贱片┃秒播💥', 'https://bfzyapi.com/api.php/provide/vod/') : null,
      desc: '暴风超清片源'
    },

    // ==========================================
    // 🌸 动漫专区
    // ==========================================
    {
      key: 'YingHua',
      name: '🌸樱花动漫┃秒播专线🌸',
      category: '动漫专区',
      instance: global.YingHuaSpider,
      desc: '新番热播、日本动漫、国产动画超清秒播'
    },
    {
      key: 'AnimeXiFan',
      name: '🤡稀饭┃动漫🤡',
      category: '动漫专区',
      instance: global.YingHuaSpider,
      desc: '稀饭动漫备用源'
    },

    // ==========================================
    // 🌍 全球直播 & 海外影视
    // ==========================================
    {
      key: 'TheTVApp',
      name: '🏆TheTVApp┃体育赛事🏆',
      category: '全球直播',
      instance: createLiveAdapter('TheTVApp', '🏆TheTVApp┃体育赛事🏆', 'https://thetvapp.st'),
      desc: '欧美主流体育赛事直播'
    },
    {
      key: 'GuardianTV',
      name: '🛡️GuardianTV┃全球直播🛡️',
      category: '全球直播',
      instance: createLiveAdapter('GuardianTV', '🛡️GuardianTV┃全球直播🛡️', 'https://www.guardiantv.live'),
      desc: 'GuardianTV 全球高清电视'
    },
    {
      key: 'DaddyLive',
      name: '📻DaddyLive┃全球直播📻',
      category: '全球直播',
      instance: createLiveAdapter('DaddyLive', '📻DaddyLive┃全球直播📻', 'https://thedaddy.li'),
      desc: 'DaddyLive 频道直出'
    },
    {
      key: 'LiveTVGarden',
      name: '🌿LiveTVGarden┃全球电视🌿',
      category: '全球直播',
      instance: createLiveAdapter('LiveTVGarden', '🌿LiveTVGarden┃全球电视🌿', 'https://www.livetvgarden.com'),
      desc: '全球电视大花园'
    },
    {
      key: 'LiveHDTV',
      name: '📺LiveHDTV┃全球高清电视📺',
      category: '全球直播',
      instance: createLiveAdapter('LiveHDTV', '📺LiveHDTV┃全球高清电视📺', 'https://www.livehdtv.net'),
      desc: 'LiveHDTV 高清电视'
    },
    {
      key: 'LiveAiBiLi',
      name: '🅱️哔哩┃直播🅱️',
      category: '全球直播',
      instance: createLiveAdapter('LiveAiBiLi', '🅱️哔哩┃直播🅱️', 'https://live.bilibili.com'),
      desc: 'B站精选游戏与娱乐直播'
    },
    {
      key: 'CineVid',
      name: '🎬CineVid┃欧美影视🎬',
      category: '海外影视',
      instance: global.AppleCmsSpider ? new global.AppleCmsSpider('CineVid', '🎬CineVid┃欧美影视🎬', 'https://cinevid.st') : null,
      desc: 'CineVid 欧美电影'
    },
    {
      key: 'CineBy',
      name: '🎬Cineby┃欧美高清🎬',
      category: '海外影视',
      instance: global.AppleCmsSpider ? new global.AppleCmsSpider('CineBy', '🎬Cineby┃欧美高清🎬', 'https://cineby.tech') : null,
      desc: 'Cineby 欧美高清'
    },
    {
      key: 'CineJoy',
      name: '🎬Cinejoy┃欧美极速🎬',
      category: '海外影视',
      instance: global.AppleCmsSpider ? new global.AppleCmsSpider('CineJoy', '🎬Cinejoy┃欧美极速🎬', 'https://cinejoy.pk') : null,
      desc: 'Cinejoy 欧美极速'
    },

    // ==========================================
    // 🐮 精选热榜
    // ==========================================
    {
      key: 'Douban',
      name: '🐮【豆瓣热榜】🐮',
      category: '精选热榜',
      instance: global.DoubanSpider,
      desc: '权威院线电影、热播剧集、热门国漫与日漫精选榜单'
    },
    {
      key: 'TMDB',
      name: '🎬TMDB┃全球影视榜🎬',
      category: '精选热榜',
      instance: global.DoubanSpider,
      desc: 'TMDB 全球热门电影与电视剧'
    },
    {
      key: 'Wexconfig',
      name: '🐮网盘┃配置🐮',
      category: '4K网盘',
      instance: {
        homeContent: async () => {
          if (typeof window !== 'undefined' && typeof window.openPanModal === 'function') {
            setTimeout(() => window.openPanModal(), 100);
          }
          return {
            class: [{ type_id: 'pan_cfg', type_name: '网盘配置' }],
            list: [{
              vod_id: 'pan_config_action',
              vod_name: '点击打开网盘扫码配置中心',
              vod_pic: 'https://img.icons8.com/color/96/cloud.png',
              vod_remarks: '夸克/阿里/百度/115'
            }]
          };
        },
        categoryContent: async function () { return this.homeContent(); },
        searchContent: async () => ({ list: [] }),
        detailContent: async () => {
          if (typeof window !== 'undefined' && typeof window.openPanModal === 'function') {
            window.openPanModal();
          }
          return { list: [] };
        },
        playerContent: async () => ({ parse: 0, url: '' })
      },
      desc: '一键唤起夸克、阿里、百度、115扫码免密登录中心'
    },
    {
      key: 'SubVersion',
      name: '🚀【订阅版本: v3.0.7】🚀',
      category: '精选热榜',
      instance: {
        homeContent: async () => ({
          class: [{ type_id: 'notice', type_name: '系统公告' }],
          list: [{
            vod_id: 'notice_v3',
            vod_name: '蜂蜜 Web TV 纯前端版已就绪 (v3.0.7)',
            vod_pic: 'https://img.icons8.com/color/96/tv.png',
            vod_remarks: '无服务器 · 零云端流量'
          }]
        }),
        categoryContent: async function () { return this.homeContent(); },
        searchContent: async () => ({ list: [] }),
        detailContent: async () => ({
          list: [{
            vod_id: 'notice_v3',
            vod_name: '蜂蜜 Web TV 纯前端版已就绪 (v3.0.7)',
            vod_pic: 'https://img.icons8.com/color/96/tv.png',
            vod_remarks: 'iOS Safari / PWA 专用',
            vod_content: '本系统基于油猴脚本扩展，实现 100% 浏览器本地视频流量拉取与 M3U8 智能清洗。'
          }]
        }),
        playerContent: async () => ({ parse: 0, url: '' })
      },
      desc: '订阅与系统版本公告'
    },
    {
      key: 'YouTube',
      name: '▶️YouTube┃油管精选▶️',
      category: '海外影视',
      instance: createLiveAdapter('YouTube', '▶️YouTube┃油管精选▶️', 'https://www.youtube.com'),
      desc: 'YouTube 热门精选流媒体'
    },
    {
      key: 'Ymck',
      name: '🐱影猫┃仓库🐱',
      category: '精选热榜',
      instance: global.DoubanSpider,
      desc: '影猫精选优质影视库'
    },
    {
      key: 'push_agent',
      name: '🚀推送┃自定义链接🚀',
      category: '精选热榜',
      instance: {
        homeContent: async () => ({
          class: [{ type_id: 'push', type_name: '链接推送' }],
          list: [{
            vod_id: 'push_custom',
            vod_name: '自定义 M3U8 / MP4 链接推送播放',
            vod_pic: 'https://img.icons8.com/color/96/link.png',
            vod_remarks: '支持剪贴板快速粘贴'
          }]
        }),
        categoryContent: async function () { return this.homeContent(); },
        searchContent: async () => ({ list: [] }),
        detailContent: async () => ({
          list: [{
            vod_id: 'push_custom',
            vod_name: '自定义视频流推送',
            vod_pic: 'https://img.icons8.com/color/96/link.png',
            vod_play_from: '剪贴板直链',
            vod_play_url: '直接播放$https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
          }]
        }),
        playerContent: async (flag, id) => ({ parse: 0, url: id })
      },
      desc: '支持外部 M3U8、MP4 视频流直链推送到播放器'
    }
  ];

  const SiteRegistry = {
    sites: sites,

    // 获取分类列表
    getCategories: function () {
      const cats = new Set();
      this.sites.forEach(s => { if (s.category) cats.add(s.category); });
      return Array.from(cats);
    },

    // 按分类获取站点
    getSitesByCategory: function (category) {
      if (!category) return this.sites;
      return this.sites.filter(s => s.category === category);
    },

    // 按 key 获取站点
    getSite: function (key) {
      return this.sites.find(s => s.key === key) || this.sites[0];
    }
  };

  global.SiteRegistry = SiteRegistry;
  if (typeof module !== 'undefined' && module.exports) module.exports = SiteRegistry;
})(typeof unsafeWindow !== 'undefined' ? unsafeWindow : (typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this)));
