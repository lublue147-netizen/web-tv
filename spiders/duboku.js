/**
 * 独播秒播 (www.dbku.tv) 纯前端 JS 爬虫
 * 完美适配 iOS 油猴特权内核 (req / pdfh / pdfa)
 * 迁移自 subscription/spider_source/src/com/github/catvod/spider/DuBoKu.java
 */

(function (global) {
  'use strict';

  const DubokuSpider = {
    key: 'duboku',
    name: '💥独播┃秒播💥',
    siteUrl: 'https://www.dbku.tv',

    init: async function (ext) {
      if (ext && typeof ext === 'string' && ext.startsWith('http')) {
        this.siteUrl = ext.replace(/\/+$/, '');
      }
    },

    homeContent: async function (filter) {
      const classes = [
        { type_id: '2', type_name: '连续剧' },
        { type_id: '1', type_name: '电影' },
        { type_id: '3', type_name: '综艺' },
        { type_id: '4', type_name: '动漫' },
        { type_id: '21', type_name: '微短剧' }
      ];

      try {
        const fetcher = global.req || global.gmFetch;
        const res = await fetcher(this.siteUrl + '/');
        const html = res.content || (res.text ? await res.text() : '');
        const list = this._parseVodList(html);

        return { class: classes, list: list };
      } catch (e) {
        console.error('[Duboku] homeContent 异常:', e);
        return { class: classes, list: [] };
      }
    },

    categoryContent: async function (tid, pg = 1, filter, extend = {}) {
      const page = parseInt(pg) || 1;
      const url = `${this.siteUrl}/vodshow/${tid}--------${page}---.html`;

      try {
        const fetcher = global.req || global.gmFetch;
        const res = await fetcher(url);
        const html = res.content || (res.text ? await res.text() : '');
        const list = this._parseVodList(html);

        return {
          page: page,
          pagecount: 999,
          limit: 20,
          total: 9999,
          list: list
        };
      } catch (e) {
        console.error('[Duboku] categoryContent 异常:', e);
        return { page: page, pagecount: 1, limit: 20, total: 0, list: [] };
      }
    },

    detailContent: async function (ids) {
      if (!ids || !ids.length) return { list: [] };
      const id = ids[0];
      const url = `${this.siteUrl}/voddetail/${id}.html`;

      try {
        const fetcher = global.req || global.gmFetch;
        const res = await fetcher(url);
        const html = res.content || (res.text ? await res.text() : '');

        // 解析详情
        const titleMatch = html.match(/<h1[^>]*class=["']title["'][^>]*>([^<]+)<\/h1>/i) || html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        const name = titleMatch ? titleMatch[1].trim() : '未知片名';

        const picMatch = html.match(/class=["'][^"']*myui-content__thumb[^"']*["'][\s\S]*?<img[^>]+(?:data-original|src)=["']([^"']+)["']/i);
        let pic = picMatch ? picMatch[1].trim() : '';
        if (pic.startsWith('//')) pic = 'https:' + pic;
        else if (pic.startsWith('/')) pic = this.siteUrl + pic;

        const descMatch = html.match(/class=["'][^"']*sketch[^"']*["'][^>]*>([\s\S]*?)<\/span>/i) ||
                          html.match(/class=["'][^"']*data[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
        const desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';

        // 提取剧集列表
        const epRegex = /<a[^>]+href=["'](\/vodplay\/[^"']+\.html)["'][^>]*>([^<]+)<\/a>/gi;
        const episodes = [];
        let m;
        while ((m = epRegex.exec(html)) !== null) {
          const href = m[1];
          const text = m[2].trim();
          if (text && !text.includes('立即播放') && !text.includes('展开')) {
            episodes.push(`${text}$${href}`);
          }
        }

        return {
          list: [{
            vod_id: id,
            vod_name: name,
            vod_pic: pic,
            vod_content: desc,
            vod_play_from: '独播极速线路',
            vod_play_url: episodes.join('#')
          }]
        };
      } catch (e) {
        console.error('[Duboku] detailContent 异常:', e);
        return { list: [] };
      }
    },

    playerContent: async function (flag, id, vipFlags) {
      try {
        // 如果已是直链则直接返回
        if (id.includes('.m3u8') || id.includes('.mp4')) {
          return {
            parse: 0,
            url: id,
            header: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0',
              'Referer': this.siteUrl + '/'
            }
          };
        }

        const playPageUrl = id.startsWith('http') ? id : (this.siteUrl + id);
        const fetcher = global.req || global.gmFetch;
        const res = await fetcher(playPageUrl);
        const html = res.content || (res.text ? await res.text() : '');

        const match = html.match(/var\s+player_data\s*=\s*(\{[\s\S]*?\})(?:<\/script>|;)/i);
        let streamUrl = '';

        if (match && match[1]) {
          try {
            const pData = JSON.parse(match[1]);
            const encrypt = pData.encrypt || 0;
            const rawUrl = pData.url || '';

            if (encrypt === 2) {
              const decoded = atob(rawUrl);
              streamUrl = decodeURIComponent(decoded);
            } else if (encrypt === 1) {
              streamUrl = decodeURIComponent(rawUrl);
            } else {
              streamUrl = rawUrl;
            }
          } catch (pe) {
            console.error('[Duboku] player_data 解密失败:', pe);
          }
        }

        if (streamUrl && streamUrl.startsWith('http')) {
          return {
            parse: 0,
            url: streamUrl,
            header: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0',
              'Referer': this.siteUrl + '/'
            }
          };
        }

        return { parse: 1, url: playPageUrl };
      } catch (e) {
        console.error('[Duboku] playerContent 异常:', e);
        return { parse: 1, url: id };
      }
    },

    searchContent: async function (key, quick) {
      try {
        const url = `${this.siteUrl}/vodsearch/-------------.html?wd=${encodeURIComponent(key)}`;
        const fetcher = global.req || global.gmFetch;
        const res = await fetcher(url);
        const html = res.content || (res.text ? await res.text() : '');
        const list = this._parseVodList(html);
        return { list: list };
      } catch (e) {
        console.error('[Duboku] searchContent 异常:', e);
        return { list: [] };
      }
    },

    _parseVodList: function (html) {
      const list = [];
      const seen = new Set();
      const regex = /<a[^>]+href=["']\/voddetail\/(\d+)\.html["'][^>]+title=["']([^"']+)["'][^>]+(?:data-original|src)=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let m;

      while ((m = regex.exec(html)) !== null) {
        const vid = m[1];
        const title = m[2].trim();
        let pic = m[3].trim();
        const inner = m[4];

        if (pic.startsWith('//')) pic = 'https:' + pic;
        else if (pic.startsWith('/')) pic = this.siteUrl + pic;

        if (!seen.has(vid)) {
          seen.add(vid);
          let remarks = '';
          const remM = inner.match(/<span[^>]*class=["'][^"']*pic-text[^"']*["'][^>]*>([^<]+)<\/span>/i) ||
                       inner.match(/<span[^>]*class=["']tag["'][^>]*>([^<]+)<\/span>/i);
          if (remM) remarks = remM[1].trim();

          list.push({
            vod_id: vid,
            vod_name: title,
            vod_pic: pic,
            vod_remarks: remarks
          });
        }
      }
      return list;
    }
  };

  // 挂载到全局
  global.DubokuSpider = DubokuSpider;
  if (typeof module !== 'undefined' && module.exports) module.exports = DubokuSpider;
})(typeof unsafeWindow !== 'undefined' ? unsafeWindow : window);
