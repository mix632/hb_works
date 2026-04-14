'use strict';

const dictCache = require('../../core/dictCache');
const userStatusRepo = require('./dal/gb_user_status.repo');

/**
 * CDP 模块 — Fastify 插件
 * 自动注册所有 service 路由 + 字典缓存
 */
async function cdpModule(app) {
  // 注册字典表缓存
  dictCache.register('gb_user_status', userStatusRepo);

  // 加载所有 service 并注册路由
  const services = [
    require('./services/user_status.service'),
    require('./services/product.service'),
    require('./services/customer.service'),
    require('./services/trade_records.service'),
  ];

  for (const svc of services) {
    svc.registerRoutes(app);
  }

  app.log.info('Module [cdp] loaded');
}

module.exports = cdpModule;
