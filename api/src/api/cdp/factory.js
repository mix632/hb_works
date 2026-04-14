'use strict';

/**
 * 懒加载工厂 — 避免循环依赖，按需加载 repo
 */
class CdpFactory {
  static get biz_customerRepo() {
    return this._biz_customerRepo || (this._biz_customerRepo = require('./dal/biz_customer.repo'));
  }
  static get biz_productRepo() {
    return this._biz_productRepo || (this._biz_productRepo = require('./dal/biz_product.repo'));
  }
  static get gb_user_statusRepo() {
    return this._gb_user_statusRepo || (this._gb_user_statusRepo = require('./dal/gb_user_status.repo'));
  }
  // ─── 以下 repo 由生成器产出后启用 ─────────────────────────────
  static get biz_customer_statusRepo() {
    return this._biz_customer_statusRepo || (this._biz_customer_statusRepo = require('./dal/biz_customer_status.repo'));
  }
  static get biz_repayment_statusRepo() {
    return this._biz_repayment_statusRepo || (this._biz_repayment_statusRepo = require('./dal/biz_repayment_status.repo'));
  }
  static get gb_userRepo() {
    return this._gb_userRepo || (this._gb_userRepo = require('./dal/gb_user.repo'));
  }
  static get gb_user_closureRepo() {
    return this._gb_user_closureRepo || (this._gb_user_closureRepo = require('./dal/gb_user_closure.repo'));
  }
  static get biz_commission_recordRepo() {
    return this._biz_commission_recordRepo || (this._biz_commission_recordRepo = require('./dal/biz_commission_record.repo'));
  }
}

module.exports = CdpFactory;
