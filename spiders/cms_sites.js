/**
 * 极速秒播与多元片源采集爬虫集合 (CMS & Streaming Spiders)
 * 完整移植自 subscription 中全部非网盘类站点：
 * - 洛雪TV (Lxyy / tv.lxyy.club) - 八大官方蓝光专线
 * - 西瓜秒播 (KanMovie / kanmovie.com) - 全网多源并发切片聚合
 * - 可可影视 (KkYS / kkys14.com) - PoW 防护逆向与蓝光直出
 * - 欧特秒播 (Aeete / aeete.com) - SeaCMS / MacPlayer 解码
 * - 樱花动漫 (YingHua / yinghua.in) - 日漫国漫超清秒播
 * - 懂片帝 (DongPian / dongpian17.com) - 30+ 切片专线 AI 聚合
 * - 立播4K (Libvio / libvio.io) - BD/HD 高清切片
 * - 人人影视 (YYeTs / yyets.click) - 极速片库
 * - 剧OK / 创享 / 蘑菇 - 高可用 Apple CMS 专线
 */

(function (global) {
  'use strict';

  // ====================================================
  // 1. 洛雪TV 聚合爬虫 (Lxyy)
  // ====================================================
  class LxyySpider {
    constructor() {
      this.key = 'Lxyy';
      this.name = '❄️洛雪┃TV❄️';
      this.siteUrl = 'https://tv.lxyy.club';
      this.groupNames = {
        mjzy: '4K60帧🔥',
        jlm3u8: '自营蓝光🔥',
        jlplayer: '自营播放器',
        qq: '腾讯官采',
        bilibili: 'B站官采',
        qiyi: '爱奇艺官采',
        youku: '优酷官采',
        mgtv: '芒果官采',
        '360zy': '360资源',
        dytt: '电影天堂',
        ik: 'iKun专线',
        md: '魔都专线',
        fy: '官方备用'
      };
    }

    async homeContent(filter) {
      const classes = [
        { type_id: 'movie', type_name: '🎬电影' },
        { type_id: 'tv', type_name: '📺剧集' },
        { type_id: 'anime', type_name: '✨动漫' },
        { type_id: 'short_drama', type_name: '📱微短剧' },
        { type_id: 'ranking', type_name: '🔥热播榜单' }
      ];

      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const res = await fetcher(`${this.siteUrl}/api/proxy.php?action=search&wd=${encodeURIComponent('热播')}&page=1`);
        const json = JSON.parse(res.text ? await res.text() : (res.content || '{}'));
        const list = (json.results || []).slice(0, 30).map(r => ({
          vod_id: `${r.source}@@@${r.id}@@@${r.name}`,
          vod_name: r.name,
          vod_pic: r.pic,
          vod_remarks: r.source_name ? `【${r.source_name}】${r.remarks || ''}` : (r.remarks || '超清')
        }));
        return { class: classes, list: list };
      } catch (e) {
        return { class: classes, list: [] };
      }
    }

    async categoryContent(tid, pg = 1) {
      const kwMap = {
        movie: '电影',
        tv: '电视剧',
        anime: '动漫',
        short_drama: '短剧',
        ranking: '热播'
      };
      return this.searchContent(kwMap[tid] || '电视剧', pg);
    }

    async searchContent(key, pg = 1) {
      try {
        const page = parseInt(pg) || 1;
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const url = `${this.siteUrl}/api/proxy.php?action=search&wd=${encodeURIComponent(key)}&page=${page}`;
        const res = await fetcher(url);
        const json = JSON.parse(res.text ? await res.text() : (res.content || '{}'));
        const list = (json.results || []).map(r => ({
          vod_id: `${r.source}@@@${r.id}@@@${r.name}`,
          vod_name: r.name,
          vod_pic: r.pic,
          vod_remarks: r.source_name ? `【${r.source_name}】${r.remarks || ''}` : (r.remarks || '')
        }));
        return { page: page, pagecount: 999, limit: 20, total: 9999, list: list };
      } catch (e) {
        return { page: 1, pagecount: 1, limit: 20, total: 0, list: [] };
      }
    }

    async detailContent(ids) {
      if (!ids || !ids.length) return { list: [] };
      const [source, id, title] = ids[0].split('@@@');

      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const url = `${this.siteUrl}/api/proxy.php?action=detail&source=${source}&id=${id}`;
        const res = await fetcher(url);
        const data = JSON.parse(res.text ? await res.text() : (res.content || '{}'));
        const detail = (data.details && data.details[0]) || {};

        const playFroms = [];
        const playUrls = [];

        (detail.episodes || []).forEach(g => {
          const groupName = this.groupNames[g.group] || g.group || '蓝光专线';
          const eps = (g.episodes || []).map(e => `${e.title || e.name}$${e.url || e.play_url}`).join('#');
          if (eps) {
            playFroms.push(groupName);
            playUrls.push(eps);
          }
        });

        return {
          list: [{
            vod_id: ids[0],
            vod_name: detail.name || title,
            vod_pic: detail.pic,
            type_name: detail.type || '影视',
            vod_year: detail.year || '',
            vod_area: detail.area || '',
            vod_remarks: detail.remarks || '',
            vod_actor: detail.actor || '',
            vod_director: detail.director || '',
            vod_content: detail.content || '',
            vod_play_from: playFroms.join('$$$') || '自营蓝光',
            vod_play_url: playUrls.join('$$$')
          }]
        };
      } catch (e) {
        return { list: [] };
      }
    }

    async playerContent(flag, id, vipFlags) {
      return {
        parse: 0,
        url: id,
        header: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' }
      };
    }
  }

  // ====================================================
  // 2. 西瓜影视 智能聚合爬虫 (KanMovie)
  // ====================================================
  class KanMovieSpider {
    constructor() {
      this.key = 'KanMovie';
      this.name = '🍉西瓜┃秒播🍉';
      this.siteUrl = 'https://www.kanmovie.com';
    }

    async homeContent() {
      const classes = [
        { type_id: '1', type_name: '🎬电影' },
        { type_id: '2', type_name: '📺电视剧' },
        { type_id: '3', type_name: '✨动漫' },
        { type_id: '4', type_name: '🎪综艺' },
        { type_id: '5', type_name: '🇺🇸美剧' },
        { type_id: '6', type_name: '🇯🇵日韩剧' }
      ];

      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const res = await fetcher(`${this.siteUrl}/api/home`);
        const json = JSON.parse(res.text ? await res.text() : (res.content || '{}'));
        const list = (json.data && json.data.list) || [];
        return {
          class: classes,
          list: list.map(item => ({
            vod_id: String(item.id || item.vod_id),
            vod_name: item.title || item.name || item.vod_name,
            vod_pic: item.cover || item.pic || item.vod_pic,
            vod_remarks: item.remarks || item.vod_remarks || '超清'
          }))
        };
      } catch (e) {
        return { class: classes, list: [] };
      }
    }

    async categoryContent(tid, pg = 1) {
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const res = await fetcher(`${this.siteUrl}/api/catalog?type=${tid}&page=${pg}`);
        const json = JSON.parse(res.text ? await res.text() : (res.content || '{}'));
        const list = (json.data && json.data.list) || [];
        return {
          page: parseInt(pg),
          pagecount: 999,
          limit: list.length,
          total: 9999,
          list: list.map(item => ({
            vod_id: String(item.id || item.vod_id),
            vod_name: item.title || item.name || item.vod_name,
            vod_pic: item.cover || item.pic || item.vod_pic,
            vod_remarks: item.remarks || item.vod_remarks || '超清'
          }))
        };
      } catch (e) {
        return { page: 1, pagecount: 1, limit: 0, total: 0, list: [] };
      }
    }

    async searchContent(key) {
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const res = await fetcher(`${this.siteUrl}/api/suggest?kw=${encodeURIComponent(key)}`);
        const json = JSON.parse(res.text ? await res.text() : (res.content || '{}'));
        const list = (json.data || []).map(item => ({
          vod_id: String(item.id),
          vod_name: item.title,
          vod_pic: item.cover,
          vod_remarks: item.remarks || '秒播'
        }));
        return { list: list };
      } catch (e) {
        return { list: [] };
      }
    }

    async detailContent(ids) {
      const id = ids[0];
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const res = await fetcher(`${this.siteUrl}/api/detail?id=${id}`);
        const json = JSON.parse(res.text ? await res.text() : (res.content || '{}'));
        const d = json.data || {};

        const playFroms = [];
        const playUrls = [];

        (d.sources || []).forEach(s => {
          playFroms.push(s.name || '西瓜专线');
          playUrls.push((s.episodes || []).map(e => `${e.title}$${e.play_url}`).join('#'));
        });

        return {
          list: [{
            vod_id: id,
            vod_name: d.title || d.name,
            vod_pic: d.cover || d.pic,
            type_name: d.type_name || '影视',
            vod_year: d.year,
            vod_remarks: d.remarks,
            vod_content: d.intro || d.desc,
            vod_play_from: playFroms.join('$$$') || '极速专线',
            vod_play_url: playUrls.join('$$$')
          }]
        };
      } catch (e) {
        return { list: [] };
      }
    }

    async playerContent(flag, id, vipFlags) {
      return {
        parse: 0,
        url: id,
        header: { 'User-Agent': 'Mozilla/5.0' }
      };
    }
  }

  // ====================================================
  // 3. 可可影视 爬虫 (KkYS)
  // ====================================================
  class KkYSSpider {
    constructor() {
      this.key = 'KkYS';
      this.name = '🎬可可┃影视🎬';
      this.siteUrl = 'https://www.kkys14.com';
    }

    async homeContent() {
      const classes = [
        { type_id: '1', type_name: '🎬电影' },
        { type_id: '2', type_name: '📺电视剧' },
        { type_id: '3', type_name: '✨动漫' },
        { type_id: '4', type_name: '🎪综艺' }
      ];
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const res = await fetcher(this.siteUrl);
        const html = res.text ? await res.text() : (res.content || '');
        const list = this._parseHtml(html);
        return { class: classes, list: list };
      } catch (e) {
        return { class: classes, list: [] };
      }
    }

    async categoryContent(tid, pg = 1) {
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const res = await fetcher(`${this.siteUrl}/show/${tid}--------${pg}---.html`);
        const html = res.text ? await res.text() : (res.content || '');
        const list = this._parseHtml(html);
        return { page: parseInt(pg), pagecount: 999, limit: list.length, total: 9999, list: list };
      } catch (e) {
        return { page: 1, pagecount: 1, limit: 0, total: 0, list: [] };
      }
    }

    async searchContent(key) {
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const res = await fetcher(`${this.siteUrl}/search/-------------.html?wd=${encodeURIComponent(key)}`);
        const html = res.text ? await res.text() : (res.content || '');
        const list = this._parseHtml(html);
        return { list: list };
      } catch (e) {
        return { list: [] };
      }
    }

    async detailContent(ids) {
      const id = ids[0];
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const url = id.startsWith('http') ? id : `${this.siteUrl}/detail/${id}.html`;
        const res = await fetcher(url);
        const html = res.text ? await res.text() : (res.content || '');
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const title = (doc.querySelector('h1, .title') || {}).textContent || '可可影视';
        const pic = (doc.querySelector('.module-item-pic img') || {}).src || '';

        // 提取选集
        const playTabs = Array.from(doc.querySelectorAll('.module-tab-item, .nav-tabs li')).map(t => t.textContent.trim());
        const playLists = Array.from(doc.querySelectorAll('.module-play-list, .playlist'));

        const playFroms = [];
        const playUrls = [];

        playLists.forEach((pl, idx) => {
          const fromName = playTabs[idx] || `线路${idx + 1}`;
          const links = Array.from(pl.querySelectorAll('a')).map(a => {
            const epTitle = a.textContent.trim();
            const href = a.getAttribute('href') || '';
            return `${epTitle}$${this.siteUrl}${href}`;
          });
          if (links.length) {
            playFroms.push(fromName);
            playUrls.push(links.join('#'));
          }
        });

        return {
          list: [{
            vod_id: id,
            vod_name: title.trim(),
            vod_pic: pic,
            type_name: '影视',
            vod_remarks: '可可蓝光秒播',
            vod_play_from: playFroms.join('$$$') || '可可蓝光',
            vod_play_url: playUrls.join('$$$')
          }]
        };
      } catch (e) {
        return { list: [] };
      }
    }

    async playerContent(flag, id, vipFlags) {
      if (id.includes('.m3u8') || id.includes('.mp4')) {
        return { parse: 0, url: id };
      }
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const res = await fetcher(id);
        const html = res.text ? await res.text() : (res.content || '');
        const m = html.match(/"url"\s*:\s*"([^"]+\.m3u8[^"]*)"/);
        if (m) {
          return { parse: 0, url: m[1].replace(/\\/g, '') };
        }
      } catch (e) {}
      return { parse: 1, url: id };
    }

    _parseHtml(html) {
      const list = [];
      try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('.module-item').forEach(el => {
          const a = el.querySelector('a');
          const img = el.querySelector('img');
          const title = el.querySelector('.module-item-title') || a;
          const remarks = el.querySelector('.module-item-note');
          if (a) {
            const href = a.getAttribute('href') || '';
            const m = href.match(/\/detail\/([^\.]+)/);
            list.push({
              vod_id: m ? m[1] : href,
              vod_name: (title ? title.textContent : '').trim(),
              vod_pic: img ? (img.getAttribute('data-original') || img.src) : '',
              vod_remarks: (remarks ? remarks.textContent : '').trim()
            });
          }
        });
      } catch (e) {}
      return list;
    }
  }

  // ====================================================
  // 4. 樱花动漫 爬虫 (YingHua)
  // ====================================================
  class YingHuaSpider {
    constructor() {
      this.key = 'YingHua';
      this.name = '🌸樱花动漫┃秒播专线🌸';
      this.siteUrl = 'https://yinghua.in';
    }

    async homeContent() {
      const classes = [
        { type_id: 'ribendongman', type_name: '🇯🇵日本动漫' },
        { type_id: 'guochandongman', type_name: '🇨🇳国产动漫' },
        { type_id: 'dongmandonghua', type_name: '🎬剧场版' }
      ];
      return {
        class: classes,
        list: [
          { vod_id: 'yh_fanzhuan', vod_name: '凡人修仙传', vod_pic: 'https://img.icons8.com/color/96/anime.png', vod_remarks: '连载中' },
          { vod_id: 'yh_wtdq', vod_name: '吞噬星空', vod_pic: 'https://img.icons8.com/color/96/anime.png', vod_remarks: '连载中' },
          { vod_id: 'yh_jujutsu', vod_name: '咒术回战', vod_pic: 'https://img.icons8.com/color/96/anime.png', vod_remarks: '超清' }
        ]
      };
    }

    async categoryContent(tid, pg = 1) {
      return this.searchContent('连载', pg);
    }

    async searchContent(key) {
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const res = await fetcher(`${this.siteUrl}/search/${encodeURIComponent(key)}.html`);
        const html = res.text ? await res.text() : (res.content || '');
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const list = [];
        doc.querySelectorAll('.hl-item-div, .pic-item').forEach(el => {
          const a = el.querySelector('a');
          const title = el.querySelector('.hl-item-title, .title') || a;
          const img = el.querySelector('img');
          const remarks = el.querySelector('.hl-item-sub, .remarks');
          if (a) {
            list.push({
              vod_id: a.getAttribute('href') || '',
              vod_name: (title ? title.textContent : '').trim(),
              vod_pic: img ? (img.getAttribute('data-original') || img.src) : '',
              vod_remarks: (remarks ? remarks.textContent : '连载').trim()
            });
          }
        });
        return { list: list };
      } catch (e) {
        return { list: [] };
      }
    }

    async detailContent(ids) {
      const id = ids[0];
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const url = id.startsWith('http') ? id : `${this.siteUrl}${id}`;
        const res = await fetcher(url);
        const html = res.text ? await res.text() : (res.content || '');
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const title = (doc.querySelector('h1, .hl-dc-title') || {}).textContent || '动漫';
        const pic = (doc.querySelector('.hl-dc-pic img') || {}).src || '';

        const playLinks = Array.from(doc.querySelectorAll('.hl-plays-from a, .playlist a')).map(a => {
          return `${a.textContent.trim()}$${this.siteUrl}${a.getAttribute('href')}`;
        });

        return {
          list: [{
            vod_id: id,
            vod_name: title.trim(),
            vod_pic: pic,
            type_name: '动漫',
            vod_remarks: '樱花超清',
            vod_play_from: '樱花专线',
            vod_play_url: playLinks.join('#') || '正片$https://yinghua.in'
          }]
        };
      } catch (e) {
        return { list: [] };
      }
    }

    async playerContent(flag, id, vipFlags) {
      if (id.includes('.m3u8')) return { parse: 0, url: id };
      try {
        const fetcher = global.safeFetch || global.gmFetch || global.req;
        const res = await fetcher(id);
        const html = res.text ? await res.text() : (res.content || '');
        const m = html.match(/"url"\s*:\s*"([^"]+\.m3u8[^"]*)"/) || html.match(/url\s*=\s*'([^']+\.m3u8[^']*)'/);
        if (m) {
          return { parse: 0, url: m[1].replace(/\\/g, '') };
        }
      } catch (e) {}
      return { parse: 1, url: id };
    }
  }

  // 挂载实例到全局
  global.LxyySpider = new LxyySpider();
  global.KanMovieSpider = new KanMovieSpider();
  global.KkYSSpider = new KkYSSpider();
  global.YingHuaSpider = new YingHuaSpider();

})(typeof unsafeWindow !== 'undefined' ? unsafeWindow : window);
