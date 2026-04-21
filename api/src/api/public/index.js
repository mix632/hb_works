'use strict';

const path = require('path');
const fs = require('fs');
const dictCache = require('../../core/dictCache');
const serviceRegistry = require('../../core/serviceRegistry');
// const userStatusRepo = require('./dal/gb_user_status.repo');

/**
 * public 模块 — Fastify 插件
 * 自动注册所有 service 路由 + 字典缓存
 * 同时向 serviceRegistry 暴露可供其他模块跨模块调用的 DAL / Service
 */
async function publicModule(app) {
  // dictCache.register('gb_user_status', userStatusRepo);

  // ─── 跨模块暴露：遍历 dal/ 下所有 *.repo.js，自动注册到 serviceRegistry ───
  // 命名规则：system_file.repo.js → serviceRegistry key = 'public.system_fileRepo'
  // serviceRegistry.register('public.system_file_typeRepo', require('./dal/system_file_type.repo'));
  const dalDir = path.join(__dirname, 'dal');
  const repoFiles = fs.readdirSync(dalDir).filter(f => f.endsWith('.repo.js'));
  for (const file of repoFiles) {
    const key = 'public.' + file.replace('.repo.js', '') + 'Repo';
    serviceRegistry.register(key, require(path.join(dalDir, file)));
  }

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
