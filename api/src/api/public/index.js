'use strict';

const serviceRegistry = require('../../core/serviceRegistry');

/**
 * Public 模块 — 占位
 * 后续由生成器产出
 */
async function publicModule(app) {
  serviceRegistry.register('public.runtime', {
    async ping(payload = {}) {
      return {
        module: 'public',
        ok: true,
        defaultLang: payload.defaultLang || 'zh',
        now: new Date().toISOString(),
      };
    },
  });

  app.log.info('Module [public] loaded');
}

module.exports = publicModule;
