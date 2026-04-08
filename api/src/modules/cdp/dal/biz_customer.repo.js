'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/biz_customer.model');

/**
 * biz_customer — 核心大表
 * baseSql 使用 LEFT JOIN 消灭 N+1 查询
 */
class BizCustomerRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'biz_customer';
    this.defalutOrder = 'biz_customer.id desc';
    this.tableTitle = '客户';
    this.primaryKey = 'id';
    this.deleteKey = '';
    this.createDate = 'created_at';
    this.updateDate = 'updated_at';
    this.emptyPrimaryValue = 0;

    this.baseSql = `
      select biz_customer.*,
             _user.title as user_id_title,
             _product.title as product_id_title,
             _repay.title as repayment_status_title,
             _status.title as status_title,
             _status.name as status_name
      from biz_customer biz_customer
      left join gb_user _user on _user.id = biz_customer.user_id
      left join biz_product _product on _product.id = biz_customer.product_id
      left join biz_repayment_status _repay on _repay.id = biz_customer.repayment_status
      left join biz_customer_status _status on _status.id = biz_customer.status
      where biz_customer.id > 0 {0} {1}
      order by {2}
    `.replace(/\n\s+/g, ' ').trim();
  }

  async Load({ datas, userId, isLoadDetailed = false, isGetValue = true, db = null }) {
    if (!datas || !datas.length) return;
    if (!isLoadDetailed) return;

    const factory = require('../factory');
    const ids = datas.map(e => this.GetModelID({ model: e }));

    // 加载 next_actions（角色过滤在 service 层处理）
    try {
      const allStatus = await factory.biz_customer_statusRepo.GetList({ strWhere: '', isLoadDetailed: true, db });
      for (const item of datas) {
        item.images = item.images || {};
        item.review_image = item.images.review_image || [];
        const matched = allStatus.find(e => e.id === item.status);
        item.next_actions = matched?.next_actions || [];
      }
    } catch {
      for (const item of datas) {
        item.images = item.images || {};
        item.review_image = item.images.review_image || [];
        item.next_actions = [];
      }
    }
  }

  async AddOrUpdate({ model: m, isSaveDetailed = false, userId, db = null }) {
    m.images = m.images || {};
    m.images.review_image = m.review_image || [];
    m.id = await super.AddOrUpdate({ model: m, isSaveDetailed, userId, db });
    return m.id;
  }

  GetSearchSQL({ searchModel, userId }) {
    const w = this.safeWhere();
    if (searchModel.Keyword && searchModel.Keyword.trim()) {
      w.like('biz_customer.no', searchModel.Keyword, 'or');
      w.like('biz_customer.title', searchModel.Keyword, 'or');
      w.like('biz_customer.phone', searchModel.Keyword, 'or');
      w.like('biz_customer.id_card', searchModel.Keyword, 'or');
    }
    if (searchModel.id != null) w.eq('biz_customer.id', searchModel.id);
    if (searchModel.ids) w.in('biz_customer.id', searchModel.ids);
    if (searchModel.product_id && parseInt(searchModel.product_id)) {
      w.in('biz_customer.product_id', Array.isArray(searchModel.product_id) ? searchModel.product_id : [searchModel.product_id]);
    }
    if (searchModel.repayment_status && parseInt(searchModel.repayment_status)) {
      w.in('biz_customer.repayment_status', Array.isArray(searchModel.repayment_status) ? searchModel.repayment_status : [searchModel.repayment_status]);
    }
    if (searchModel.status && parseInt(searchModel.status)) {
      w.in('biz_customer.status', Array.isArray(searchModel.status) ? searchModel.status : [searchModel.status]);
    }
    if (searchModel.dateRange && searchModel.dateRange.length === 2) {
      w.gte('biz_customer.date', searchModel.dateRange[0]);
      w.lt('biz_customer.date', searchModel.dateRange[1]);
    }
    return w.build();
  }

  // ─── Select2 方法 ─────────────────────────────────────────────
  async getproduct_idSelect2({ key, selectID, pageIndex, onePageCount = 30, userId }) {
    const factory = require('../factory');
    const repo = factory.biz_productRepo;
    const strWhere = key ? `biz_product.title like :_key` : '';
    const strParams = key ? { _key: `%${key}%` } : {};
    return repo.getSelect2({
      selectID, strWhere, strParams,
      tableName: repo.tableName, primaryKey: repo.primaryKey,
      titleName: 'title', pageIndex, onePageCount, userId,
    });
  }

  async getrepayment_statusSelect2({ key, selectID, pageIndex, onePageCount = 30, userId }) {
    const factory = require('../factory');
    const repo = factory.biz_repayment_statusRepo;
    const strWhere = key ? `biz_repayment_status.title like :_key` : '';
    const strParams = key ? { _key: `%${key}%` } : {};
    return repo.getSelect2({
      selectID, strWhere, strParams,
      tableName: repo.tableName, primaryKey: repo.primaryKey,
      titleName: 'title', pageIndex, onePageCount, userId,
    });
  }

  async getstatusSelect2({ key, selectID, pageIndex, onePageCount = 30, userId }) {
    const factory = require('../factory');
    const repo = factory.biz_customer_statusRepo;
    const strWhere = key ? `biz_customer_status.title like :_key` : '';
    const strParams = key ? { _key: `%${key}%` } : {};
    return repo.getSelect2({
      selectID, strWhere, strParams,
      tableName: repo.tableName, primaryKey: repo.primaryKey,
      titleName: 'title', pageIndex, onePageCount, userId,
    });
  }
}

module.exports = new BizCustomerRepo();
