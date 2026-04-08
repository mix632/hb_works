'use strict';

const BaseService = require('../../../core/baseService');
const repo = require('../dal/biz_product.repo');
const model = require('../model/biz_product.model');
const dto = require('../dto/biz_product.dto');

class ProductService extends BaseService {
  constructor() {
    super({ service: repo, model, prefix: '/cdp/product', dto });
  }

  registerRoutes(app) {
    super.registerRoutes(app);
    // 额外的自定义路由放这里
  }
}

module.exports = new ProductService();
