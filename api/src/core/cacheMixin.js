'use strict';

const { LRUCache } = require('lru-cache');

// L1: 单条记录缓存，TTL 15s
const l1 = new LRUCache({ max: 5000, ttl: 1000 * 15 });

// L1-list: 列表/Count 查询缓存，TTL 30s
// 通过 generation 计数器实现写后即失效 —— 任何写操作递增 gen，旧缓存 key 自然失配
const listL1 = new LRUCache({ max: 2000, ttl: 1000 * 30 });
const tableGen = {};

const CacheMixin = {
  _isCacheEnabled() {
    return !!(this.myConfig.redisConfig && this.myConfig.redisConfig.isUse && this.myConfig.redis);
  },

  // ─── 列表 / Count 缓存 ──────────────────────────────────────────
  _listCacheKey(parts) {
    const gen = tableGen[this.tableName] || 0;
    return `${this.tableName}|${gen}|${parts.map(p =>
      p == null ? '' : (typeof p === 'object' ? JSON.stringify(p) : String(p))
    ).join('|')}`;
  },

  _getListCache(parts) {
    return listL1.get(this._listCacheKey(parts));
  },

  _setListCache(parts, data) {
    listL1.set(this._listCacheKey(parts), data);
  },

  _bumpTableGen() {
    tableGen[this.tableName] = (tableGen[this.tableName] || 0) + 1;
  },

  async GetCacheDatas({ ids, db }) {
    if (!ids || !ids.length) return { datas: [], notExistIds: [] };
    if (!this._isCacheEnabled()) return { datas: [], notExistIds: ids };

    const notExistIds = [];
    const datas = [];
    const l2Keys = [];
    const l2Idx = [];

    for (let i = 0; i < ids.length; i++) {
      const cached = l1.get(`${this.tableName}:${ids[i]}`);
      if (cached) { datas.push(cached); }
      else { l2Keys.push(`${this.tableName}.${ids[i]}`); l2Idx.push(i); }
    }
    if (!l2Keys.length) return { datas, notExistIds };

    try {
      const results = await this.myConfig.redis.mget(l2Keys);
      for (let j = 0; j < results.length; j++) {
        if (results[j]) {
          const parsed = JSON.parse(results[j]);
          datas.push(parsed);
          l1.set(`${this.tableName}:${ids[l2Idx[j]]}`, parsed);
        } else {
          notExistIds.push(ids[l2Idx[j]]);
        }
      }
    } catch {
      for (const j of l2Idx) notExistIds.push(ids[j]);
    }
    return { datas, notExistIds };
  },

  async _writeToCache(datas) {
    if (!datas || !datas.length) return;
    for (const item of datas) {
      const id = this.GetModelID({ model: item });
      if (id) l1.set(`${this.tableName}:${id}`, item);
    }
    if (!this._isCacheEnabled()) return;
    try {
      const pipe = this.myConfig.redis.pipeline();
      for (const item of datas) {
        const id = this.GetModelID({ model: item });
        if (id) pipe.setex(`${this.tableName}.${id}`, this.myConfig.redisConfig.ttl || 1800, JSON.stringify(item));
      }
      await pipe.exec();
    } catch { /* swallow */ }
  },

  async _deleteFromCache(ids) {
    if (!ids || !ids.length) return;
    for (const id of ids) l1.delete(`${this.tableName}:${id}`);
    if (!this._isCacheEnabled()) return;
    try { await this.myConfig.redis.del(ids.map(e => `${this.tableName}.${e}`)); } catch { /* swallow */ }
  },

  async _tryReadCache({ ids, isLoadDetailed, isGetValue, userId, db }) {
    if (!this._isCacheEnabled()) return null;
    const data = await this.GetCacheDatas({ ids, db });
    if (!data.datas.length && !data.notExistIds.length) {
      return { cacheDatas: [], notExistIds: [], allCached: true, noneFound: true };
    }
    if (data.datas.length) await this.Load({ datas: data.datas, isLoadDetailed, isGetValue, userId, db });
    const notExist = data.notExistIds.filter(e => !this.IDIsEmpty(e));
    return { cacheDatas: data.datas, notExistIds: notExist, allCached: !notExist.length, noneFound: false };
  },

  _mergeAndSort(datas, cacheDatas, ids) {
    datas = [...datas, ...cacheDatas];
    if (ids) datas.sort((a, b) => ids.indexOf(a[this.primaryKey]) - ids.indexOf(b[this.primaryKey]));
    return datas;
  },
};

module.exports = CacheMixin;
