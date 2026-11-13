/**
 * 影视点播站点注册表 (Site Registry)
 * 聚合 subscription/config/custom.json 中精选站源与纯前端适配器
 */

(function (global) {
  'use strict';

  const SiteRegistry = {
    sites: [
      {
        key: 'duboku',
        name: '💥独播┃秒播💥',
        type: 'spider',
        instance: global.DubokuSpider,
        desc: '官网实时热播流、全网热门影视、无广告蓝光切片直出'
      },
      {
        key: 'douban',
        name: '🐮【豆瓣热榜】🐮',
        type: 'spider',
        instance: global.DoubanSpider,
        desc: '权威院线电影、热播剧集、热门国漫与日漫精选榜单'
      },
      {
        key: 'lz_cms',
        name: '⚡量子┃蓝光秒播⚡',
        type: 'cms',
        instance: global.AppleCmsSpider ? new global.AppleCmsSpider('lz_cms', '⚡量子┃蓝光秒播⚡', 'https://cj.lziapi.com/api.php/provide/vod/') : null,
        desc: '免爬虫 Apple CMS 极速采集源，更新快，秒开'
      },
      {
        key: 'ff_cms',
        name: '⚡非凡┃超清秒播⚡',
        type: 'cms',
        instance: global.AppleCmsSpider ? new global.AppleCmsSpider('ff_cms', '⚡非凡┃超清秒播⚡', 'https://cj.ffzyapi.com/api.php/provide/vod/') : null,
        desc: '免爬虫 Apple CMS 高清片库，覆盖热门剧集与动漫'
      },
      {
        key: 'bf_cms',
        name: '⚡暴风┃极速秒播⚡',
        type: 'cms',
        instance: global.AppleCmsSpider ? new global.AppleCmsSpider('bf_cms', '⚡暴风┃极速秒播⚡', 'https://bfzyapi.com/api.php/provide/vod/') : null,
        desc: '免爬虫 Apple CMS 蓝光原盘线路'
      },
      {
        key: 'juok',
        name: '💥剧OK┃秒播💥',
        type: 'cms',
        instance: global.AppleCmsSpider ? new global.AppleCmsSpider('juok', '💥剧OK┃秒播💥', 'https://juok3.top/api.php/provide/vod/') : null,
        desc: 'subscription 存量秒播专线'
      },
      {
        key: 'chuangxiang',
        name: '✨创享┃秒播✨',
        type: 'cms',
        instance: global.AppleCmsSpider ? new global.AppleCmsSpider('chuangxiang', '✨创享┃秒播✨', 'https://ys.cxkjg.cn/api.php/provide/vod/') : null,
        desc: 'subscription 存量秒播专线'
      }
    ],

    // 获取当前站点
    getSite: function (key) {
      return this.sites.find(s => s.key === key) || this.sites[0];
    },

    // 动态添加自定义采集站
    addCmsSite: function (key, name, apiUrl) {
      if (!global.AppleCmsSpider) return null;
      const spider = new global.AppleCmsSpider(key, name, apiUrl);
      const entry = {
        key,
        name,
        type: 'cms',
        instance: spider,
        desc: '用户自定义 Apple CMS 采集源'
      };
      this.sites.push(entry);
      return entry;
    },

    // 动态注册外部 JS 爬虫
    addCustomSpider: function (key, name, spiderInstance, desc = '') {
      const entry = {
        key,
        name,
        type: 'spider',
        instance: spiderInstance,
        desc
      };
      this.sites.push(entry);
      return entry;
    }
  };

  global.SiteRegistry = SiteRegistry;
  if (typeof module !== 'undefined' && module.exports) module.exports = SiteRegistry;
})(typeof unsafeWindow !== 'undefined' ? unsafeWindow : window);
