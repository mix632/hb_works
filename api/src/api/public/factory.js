'use strict';

const path = require('path');
const fs = require('fs');

/**
 * 懒加载工厂 — 自动扫描 dal 目录下所有 *.repo.js
 * 文件名 biz_customer.repo.js → 属性名 biz_customerRepo
 * 首次访问时才 require，避免循环依赖
 */
class PublicFactory {
  static _init() {
    if (this._initialized) return;
    this._initialized = true;

    const dalDir = path.join(__dirname, 'dal');
    const files = fs.readdirSync(dalDir).filter(f => f.endsWith('.repo.js'));

    for (const file of files) {
      const propName = file.replace('.repo.js', '') + 'Repo';
      const filePath = path.join(dalDir, file);
      let cached = null;

      Object.defineProperty(this, propName, {
        get() {
          if (!cached) cached = require(filePath);
          return cached;
        },
        enumerable: true,
        configurable: false,
      });
    }
  }
}

PublicFactory._init();

module.exports = PublicFactory;
