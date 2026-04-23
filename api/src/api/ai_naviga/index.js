'use strict';

const path = require('path');
const fs = require('fs');
const dictCache = require('../../core/dictCache');

/**
 * 递归收集 dir 下（含子目录、孙目录…）所有 *.service.js 的绝对路径
 * @param {string} dir
 * @returns {string[]}
 */
function collectServiceFiles(dir) {
  const out = [];
  let names;
  try {
    names = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return out;
  }
  for (const ent of names) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...collectServiceFiles(full));
    } else if (ent.isFile() && ent.name.endsWith('.service.js')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * 优设导航等业务模块 — Fastify 插件
 * 自动注册 services 目录及任意层级子目录下所有 *.service.js
 * （字典缓存若需 gb_user_status，请与 cdp 共用，勿在此重复 register）
 */
async function AiNavigaModule(app) {
  //缓存
  const biz_home_show_typeRepo = require('./dal/biz_home_show_type.repo');
  dictCache.register('biz_home_show_type', biz_home_show_typeRepo);
  const biz_platformRepo = require('./dal/biz_platform.repo');
  dictCache.register('biz_platform', biz_platformRepo);
  const biz_home_typeRepo = require('./dal/biz_home_type.repo');
  dictCache.register('biz_home_type', biz_home_typeRepo);

  const servicesDir = path.join(__dirname, 'services');
  const absPaths = collectServiceFiles(servicesDir).sort((a, b) => a.localeCompare(b));

  for (const abs of absPaths) {
    const rel = path.relative(servicesDir, abs);
    try {
      const svc = require(abs);
      if (typeof svc.registerRoutes === 'function') {
        svc.registerRoutes(app);
        app.log.info(`  service loaded: ${rel}`);
      }
    } catch (err) {
      console.log(err);
      app.log.error({ err }, `  service load failed: ${rel}`);
    }
  }
}

module.exports = AiNavigaModule;