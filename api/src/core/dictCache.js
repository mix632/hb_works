'use strict';

const { LRUCache } = require('lru-cache');

class DictCache {
  constructor() {
    this._cache = new LRUCache({ max: 500, ttl: 1000 * 60 * 5 });
    this._factories = {};
  }

  register(tableName, factory) { this._factories[tableName] = factory; }

  async loadAll(log) {
    for (const [name, factory] of Object.entries(this._factories)) {
      try {
        const rows = await factory.GetList({ isGetValue: false });
        this._cache.set(name, rows);
        if (log) log.info(`dictCache: ${name} → ${rows.length} rows`);
      } catch (err) {
        if (log) log.error({ err }, `dictCache load failed: ${name}`);
      }
    }
  }

  getTitle(tableName, id, field = 'title') {
    const rows = this._cache.get(tableName);
    if (!rows) return '';
    const row = rows.find(e => e.id == id);
    return row ? (row[field] || '') : '';
  }

  getAll(tableName) { return this._cache.get(tableName) || []; }

  invalidate(tableName) { this._cache.delete(tableName); }

  async reload(tableName) {
    const f = this._factories[tableName];
    if (!f) return;
    try {
      this._cache.set(tableName, await f.GetList({ isGetValue: false }));
    } catch { /* swallow */ }
  }
}

module.exports = new DictCache();
