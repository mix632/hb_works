'use strict';

const { dateFormat, nowStr } = require('../../../utils/dateUtil');
const BaseService = require('../../../core/baseService');
const { R } = require('../../../core/errors');
const repo = require('../dal/biz_customer.repo');
const model = require('../model/biz_customer.model');
const dto = require('../dto/biz_customer.dto');
const util = require('../../../utils');
const config = require('../../../core/serverConfig');
const serviceRegistry = require('../../../core/serviceRegistry');

class CustomerService extends BaseService {
  constructor() {
    super({ service: repo, model, prefix: '/cdp/customer', dto });
  }

  get factory() {
    return require('../factory');
  }

  // ─── 路由注册（与原 API 路径完全一致） ─────────────────────────
  registerRoutes(app) {
    const p = this.prefix;
    app.get(`${p}/get`, (req, reply) => this.get(req, reply));
    app.post(`${p}/save`, (req, reply) => this.save(req, reply));
    app.post(`${p}/delete`, (req, reply) => this.delete(req, reply));
    app.get(`${p}/getlist`, (req, reply) => this.getList(req, reply));
    app.get(`${p}/save`, (req, reply) => {
      if (req.model?.batchAdd) {
        return this.batchAdd(req, reply);
      }
      else {
        return this.save(req, reply);
      }
    });
    app.get(`${p}/getproduct_idSelect2`, (req, reply) => this.getproduct_idSelect2(req, reply));
    app.get(`${p}/getrepayment_statusSelect2`, (req, reply) => this.getrepayment_statusSelect2(req, reply));
    app.get(`${p}/getstatusSelect2`, (req, reply) => this.getstatusSelect2(req, reply));
    app.get(`${p}/getFields`, (req, reply) => this.getFieldsAction(req, reply));
    app.post(`${p}/setFields`, (req, reply) => this.setFieldsAction(req, reply));
    app.post(`${p}/next_action`, (req, reply) => this.next_action(req, reply));
    app.get(`${p}/getSelect2`, (req, reply) => this.getSelect2Action(req, reply));
    app.get(`${p}/setValues`, (req, reply) => this.setValuesAction(req, reply));
    app.post(`${p}/swap`, (req, reply) => this.swapAction(req, reply));
  }

  // ─── GET /cdp/customer/get ────────────────────────────────────
  async get(req, reply) {
    const params = this._params(req);
    let m = params.model;

    if (!this.myService.IDIsEmpty(params.id)) {
      m = await this.myService.Get({ id: params.id, isLoadDetailed: true, userId: params.userId });
    }
    if (!m) m = this.myModel.CopyData({});
    m = this._dtoFilter(this._datesToString(m), 'detail');
    return R({ Succeed: true, Data: m });
  }

  // ─── POST /cdp/customer/save ──────────────────────────────────
  async save(req, reply) {
    const params = this._params(req);
    if (!params.model) return R({ Succeed: false, Message: '传入参数有误' });

    const result = await this.myService.Transaction(async (db) => {
      return this._saveImpl(params, db, params.hasOwnProperty('isSaveDetailed') ? params.isSaveDetailed : true);
    });
    return result;
  }

  async _saveImpl(params, db, isSaveDetailed = false) {
    const m = this._dtoFilter(params.model, 'save');
    const isAdd = this.myService.IDIsEmpty(m.id);

    // JSON 字段兼容字符串传入
    const tryParse = (v, fallback = null) => {
      if (typeof v !== 'string') return v;
      try { return JSON.parse(v); } catch { return fallback; }
    };
    m.action_data = tryParse(m.action_data);
    m.ocr_data = tryParse(m.ocr_data);
    m.user_data = tryParse(m.user_data);
    m.images = tryParse(m.images);

    // 新增时生成流水号
    if (isAdd) {
      m.no = await this.myService.tableMaxKey({
        tableName: 'biz_customer',
        noFieldName: 'no',
        noDataPrefix: `${nowStr('YYYYMMDD')}-${util.formatZero(m.product_id || 0, 3)}-`,
        noStringLength: 5,
        addOne: 1,
        db,
      });
      if (!m.no) return R({ Succeed: false, Message: '生成流水号失败' });
    }

    m.id = await this.myService.AddOrUpdate({ model: m, userId: params.userId, isSaveDetailed, db });
    let newModel = await this.myService.Get({ id: m.id, isLoadDetailed: true, userId: params.userId, db });
    if (newModel) newModel = this._dtoFilter(this._datesToString(newModel), 'detail');
    return R({
      Succeed: !this.myService.IDIsEmpty(m.id),
      Message: !this.myService.IDIsEmpty(m.id) ? '保存成功' : '保存失败',
      Data: m.id,
      Data1: newModel,
    });
  }

  // ─── POST /cdp/customer/delete ────────────────────────────────
  async delete(req, reply) {
    const params = this._params(req);
    const result = await this.myService.Transaction(async (db) => {
      if (params.ids && params.ids.length) {
        return this.myService.Delete({ ids: params.ids, userId: params.userId, db });
      }
      if (params.id && !this.myService.IDIsEmpty(params.id)) {
        return this.myService.Delete({ id: params.id, userId: params.userId, db });
      }
      return R({ Succeed: false, Message: '传入参数有误' });
    });
    return result;
  }

  // ─── GET /cdp/customer/getlist ────────────────────────────────
  async getList(req, reply) {
    const params = this._params(req);
    const search = await this.myService.GetSearchSQL({ searchModel: params, userId: params.userId });
    const strOrder = this.myService.getOrderString(params.sortObj);
    const isLoadDetailed = params.isLoadDetailed != null ? params.isLoadDetailed : false;

    const data = R({ Succeed: true, Data: {} });

    if (params.isAllData) {
      const MAX_ALL = 5000;
      data.Data.Items = await this.myService.GetListForPageIndex({
        strWhere: search.sql, strParams: search.params,
        strOrder, pageIndex: 0, onePageCount: MAX_ALL, isLoadDetailed, userId: params.userId,
      });
      data.Data.DataTotal = data.Data.Items.length;
    } else {
      data.Data.PageIndex = params.PageIndex ? parseInt(params.PageIndex) : 1;
      data.Data.OnePageCount = params.onePageCount ? parseInt(params.onePageCount) : this.myService.myConfig.dbConfig.onePageCount;

      const cachedTotal = params.DataTotal && params.DataTotal > 0 ? parseInt(params.DataTotal) : 0;
      const [items, total] = await Promise.all([
        this.myService.GetListForPageIndex({
          strWhere: search.sql, strParams: search.params,
          strOrder, pageIndex: data.Data.PageIndex - 1,
          onePageCount: data.Data.OnePageCount, isLoadDetailed, userId: params.userId,
        }),
        cachedTotal ? Promise.resolve(cachedTotal) : this.myService.Count({
          strWhere: search.sql, strParams: search.params, userId: params.userId,
        }),
      ]);
      data.Data.Items = items;
      data.Data.DataTotal = total;
    }

    data.Data.Items = this._dtoFilter(data.Data.Items, 'list');
    return this._datesToString(data);
  }

  getPublicRuntimeService() {
    return serviceRegistry.get('public.runtime');
  }

  // ─── GET /cdp/customer/public-example ──────────────────────────
  async getPublicExample(req, reply) {
    const params = this._params(req);
    const publicRuntime = this.getPublicRuntimeService();

    if (!publicRuntime) {
      return R({
        Succeed: true,
        Message: 'public 模块未注册，已自动降级',
        Data: {
          serviceFound: false,
          fallback: true,
          availableServices: serviceRegistry.list(),
        },
      });
    }

    try {
      const remoteData = await publicRuntime.ping({
        from: 'cdp.customer',
        userId: params.userId,
        defaultLang: config.currentConfig.defaultLang,
      });

      return R({
        Succeed: true,
        Message: '调用 public.runtime 成功',
        Data: {
          serviceFound: true,
          fallback: false,
          remoteData,
          availableServices: serviceRegistry.list(),
        },
      });
    } catch (err) {
      req.log.warn({ err }, 'public.runtime call failed');
      return R({
        Succeed: true,
        Message: 'public 模块调用失败，已自动降级',
        Data: {
          serviceFound: true,
          fallback: true,
          error: err.message,
          availableServices: serviceRegistry.list(),
        },
      });
    }
  }

  // ─── GET /cdp/customer/getproduct_idSelect2 ───────────────────
  async getproduct_idSelect2(req, reply) {
    const params = this._params(req);
    return this.myService.getproduct_idSelect2({
      key: params.key || '',
      selectID: params.selectID,
      pageIndex: params.pageIndex,
      userId: params.userId,
    });
  }

  // ─── GET /cdp/customer/getrepayment_statusSelect2 ─────────────
  async getrepayment_statusSelect2(req, reply) {
    const params = this._params(req);
    return this.myService.getrepayment_statusSelect2({
      key: params.key || '',
      selectID: params.selectID,
      pageIndex: params.pageIndex,
      userId: params.userId,
    });
  }

  // ─── GET /cdp/customer/getstatusSelect2 ───────────────────────
  async getstatusSelect2(req, reply) {
    const params = this._params(req);
    return this.myService.getstatusSelect2({
      key: params.key || '',
      selectID: params.selectID,
      pageIndex: params.pageIndex,
      userId: params.userId,
    });
  }

  // ─── POST /cdp/customer/next_action ───────────────────────────
  async next_action(req, reply) {
    const params = this._params(req);
    const factory = this.factory;

    const m = await this.myService.Get({ id: params.id });
    if (!m) return R({ Succeed: false, Message: '获取客户失败' });
    if (m.status != params.prevStatus) return R({ Succeed: false, Message: '流程数据已更新，请刷新后重试' });
    if (params.actionId == null) return R({ Succeed: false, Message: '请选择要执行的操作' });

    const statusList = await factory.biz_customer_statusRepo.GetList({ ids: [m.status, params.actionId] });
    const preStatus = statusList.find(e => e.id == params.prevStatus);
    if (preStatus && !preStatus.next.includes(params.actionId)) {
      return R({ Succeed: false, Message: '流程参数错误，请联系管理员' });
    }

    const nextStatus = statusList.find(e => e.id == params.actionId);
    const commissions = [];

    // 放款状态 → 自动计算佣金
    if (nextStatus && nextStatus.name === 'disbursement') {
      if (!m.real_loan_amount) return R({ Succeed: false, Message: '实际贷款金额未设置无法放款' });

      const product = await factory.biz_productRepo.Get({ id: m.product_id });
      if (!product) return R({ Succeed: false, Message: '获取产品信息失败' });
      if (!product.commission_rate) return R({ Succeed: false, Message: '产品未配置佣金比例' });

      // 业务员佣金
      const sales = await factory.gb_userRepo.Get({ id: m.user_id });
      let salesCommission = await factory.biz_commission_recordRepo.Get({
        strWhere: `user_id = :uid and customer_id = :cid and product_id = :pid and type = 1`,
        strParams: { uid: m.user_id, cid: m.id, pid: m.product_id },
      });
      if (!salesCommission) {
        salesCommission = {
          date: new Date(),
          user_id: m.user_id,
          type: 1,
          customer_id: m.id,
          product_id: m.product_id,
        };
      }
      salesCommission.loan_amount = m.real_loan_amount;
      salesCommission.commission_rate = product.commission_rate * (sales?.sales_commission_rate || 0);
      salesCommission.commission_amount = salesCommission.loan_amount * salesCommission.commission_rate;
      if (!salesCommission.is_issued) commissions.push(salesCommission);

      // 推广员佣金（闭包表 depth 1~3）
      const promoters = await factory.gb_user_closureRepo.GetList({
        strWhere: `gb_user_closure.descendant_id = :did and gb_user_closure.ancestor_id != :did and gb_user_closure.depth > 0 and gb_user_closure.depth <= 3`,
        strParams: { did: m.user_id },
      });
      if (promoters.length) {
        const users = await factory.gb_userRepo.GetList({ ids: promoters.map(e => e.ancestor_id) });
        for (const p of promoters) {
          const user = users.find(e => e.id == p.ancestor_id);
          const level = user?.promoter_commission_rate?.find(e => e.level == p.depth);
          if (level?.ratePercent) {
            let pc = await factory.biz_commission_recordRepo.Get({
              strWhere: `user_id = :uid and customer_id = :cid and product_id = :pid and type = 2`,
              strParams: { uid: user.id, cid: m.id, pid: m.product_id },
            });
            if (!pc) {
              pc = {
                date: new Date(),
                user_id: user.id,
                sales_id: m.user_id,
                type: 2,
                customer_id: m.id,
                product_id: m.product_id,
                level: level.level,
              };
            }
            pc.loan_amount = m.real_loan_amount;
            pc.commission_rate = product.commission_rate * level.ratePercent;
            pc.commission_amount = pc.loan_amount * pc.commission_rate;
            if (!pc.is_issued) commissions.push(pc);
          }
        }
      }
    }

    // 记录操作日志
    m.action_data = m.action_data || [];
    m.action_data.push({
      date: new Date(),
      user_id: params.userId,
      pre_status: m.status,
      next_status: params.actionId,
      descript: params.actionDescript,
    });
    m.status = params.actionId;

    const result = await this.myService.Transaction(async (db) => {
      m.id = await this.myService.AddOrUpdate({ model: m, db });
      if (!m.id) return R({ Succeed: false, Message: '状态改变失败' });

      if (commissions.length) {
        const cr = await factory.biz_commission_recordRepo.AddOrUpdateList({ models: commissions, db });
        if (!cr.Succeed) return R({ Succeed: false, Message: '佣金保存失败' });
      }
      return R({ Succeed: true, Message: '操作成功' });
    });
    return result;
  }
}

module.exports = new CustomerService();
