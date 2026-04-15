'use strict';

const path = require('path');
const fs = require('fs');
const dictCache = require('../../core/dictCache');
// const userStatusRepo = require('./dal/gb_user_status.repo');

/**
 * public 模块 — Fastify 插件
 * 自动注册所有 service 路由 + 字典缓存
 */
async function publicModule(app) {
  // dictCache.register('gb_user_status', userStatusRepo);

  const servicesDir = path.join(__dirname, 'services');
  const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('.service.js')).sort();

  for (const file of files) {
    try {
      const svc = require(path.join(servicesDir, file));
      if (typeof svc.registerRoutes === 'function') {
        svc.registerRoutes(app);
        app.log.info(`  service loaded: ${file}`);
      }
    } catch (err) {
      console.log(err);
      app.log.error({ err }, `  service load failed: ${file}`);
    }
  }

  app.log.info(`Module [public] loaded, ${files.length} services scanned`);
}

module.exports = publicModule;
