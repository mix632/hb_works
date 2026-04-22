'use strict';

const { dateFormat, nowStr } = require('../../../utils/dateUtil');
const BaseService = require('../../../core/baseService');
const { R } = require('../../../core/errors');
const repo = require('../dal/biz_home.repo');
const model = require('../model/biz_home.model');
const dto = require('../dto/biz_home.dto');
const util = require('../../../utils');
const config = require('../../../core/serverConfig');
const serviceRegistry = require('../../../core/serviceRegistry');

class HomeService extends BaseService {
  constructor() {
    super({ service: repo, model, prefix: '/ai_naviga/home', dto });
  }

  get factory() {
    return require('../factory');
  }

  // ─── 路由注册（与原 API 路径完全一致） ─────────────────────────
  registerRoutes(app) {
    const p = this.prefix;
    app.get(`${p}/get`, (req, reply) => this.get(req, reply));
    app.delete(`${p}/delete`, (req, reply) => this.delete(req, reply));
    app.get(`${p}/getlist`, (req, reply) => this.getList(req, reply));
    app.post(`${p}/save`, (req, reply) => this.save(req, reply));
    app.post(`${p}/swap`, (req, reply) => this.swap(req, reply));
    app.post(`${p}/copy`, (req, reply) => this.copy(req, reply));
    app.post(`${p}/publish`, (req, reply) => this.publish(req, reply));
    app.post(`${p}/getshow_typeSelect2`, (req, reply) => this.getshow_typeSelect2(req, reply));
  }

  /** 发布（占位）：前端传 type，后续接缓存刷新 / 静态生成等 */
  async publish(req, reply) {
    void reply;
    const params = this._params(req);
    const typeId = Number.parseInt(params.type, 10);
    if (!Number.isFinite(typeId) || typeId <= 0) {
      return R({ succeed: false, msg: 'type参数有误' });
    }

    const typeModel = await this.factory.biz_home_typeRepo.Get({
      id: typeId,
      userId: params.userId,
      isLoadDetailed: false,
    });
    if (!typeModel) {
      return R({ succeed: false, msg: '页面类型不存在' });
    }
    const typeName = typeModel.name || typeModel.title || String(typeId);

    const [homes, platforms] = await Promise.all([
      this.myService.GetList({
        strWhere: 'biz_home.type = :_publishType',
        strParams: { _publishType: typeId },
        strOrder: 'biz_home.parent_id asc, biz_home.sort_index asc, biz_home.id asc',
        isLoadDetailed: false,
        userId: params.userId,
      }),
      this.factory.biz_platformRepo.GetList({
        strOrder: 'biz_platform.sort_index asc, biz_platform.id asc',
        isLoadDetailed: false,
        userId: params.userId,
      }),
    ]);

    if (!platforms || !platforms.length) {
      return R({ succeed: false, msg: '未配置支持平台，发布失败' });
    }

    const result = await this.myService.Transaction(async (db) => {
      const published = [];
      for (const p of platforms) {
        const platformId = Number.parseInt(p.id, 10);
        if (!Number.isFinite(platformId) || platformId <= 0) continue;

        const staticData = this._buildStaticDataForPlatform(homes || [], platformId);
        const staticModel = {
          id: 0,
          type: typeName,
          platform: p.name || p.title || String(platformId),
          is_new: true,
          data: staticData,
        };

        const staticId = await this.factory.biz_home_staticRepo.AddOrUpdate({
          model: staticModel,
          isSaveDetailed: true,
          userId: params.userId,
          db,
        });
        if (this.factory.biz_home_staticRepo.IDIsEmpty(staticId)) {
          return R({ succeed: false, msg: `平台 ${staticModel.platform} 发布失败` });
        }
        published.push({
          id: staticId,
          platform: staticModel.platform,
          count: staticData.length,
        });
      }

      return R({ succeed: true, msg: '发布成功', data: { type: typeName, items: published } });
    });

    return result;
  }

  _buildStaticDataForPlatform(homes, platformId) {
    let _parsePlatformIds = (value) => {
      if (Array.isArray(value)) {
        return value
          .map((v) => Number.parseInt(v, 10))
          .filter((n) => Number.isFinite(n) && n > 0);
      }
      if (typeof value === 'string') {
        const s = value.trim();
        if (!s) return [];
        try {
          const parsed = JSON.parse(s);
          return _parsePlatformIds(parsed);
        } catch (_) {
          return s
            .split(',')
            .map((v) => Number.parseInt(v.trim(), 10))
            .filter((n) => Number.isFinite(n) && n > 0);
        }
      }
      if (value && typeof value === 'object') {
        return Object.keys(value)
          .filter((k) => value[k])
          .map((k) => Number.parseInt(k, 10))
          .filter((n) => Number.isFinite(n) && n > 0);
      }
      return [];
    }
    const validHomes = (homes || []).filter((item) => _parsePlatformIds(item ? item.platform : null).includes(Number(platformId)));
    const parents = validHomes.filter((item) => Number(item.parent_id) <= 0);
    const children = validHomes.filter((item) => Number(item.parent_id) > 0);

    const childMap = new Map();
    for (const child of children) {
      const pid = Number.parseInt(child.parent_id, 10) || 0;
      if (!childMap.has(pid)) childMap.set(pid, []);
      childMap.get(pid).push(child);
    }
    let _normalizeImage = (raw) => {
      if (Array.isArray(raw)) return raw[0] || '';
      if (typeof raw !== 'string') return raw || '';
      const v = raw.trim();
      if (!v) return '';
      if ((v.startsWith('[') && v.endsWith(']')) || (v.startsWith('{') && v.endsWith('}'))) {
        try {
          const parsed = JSON.parse(v);
          if (Array.isArray(parsed)) return parsed[0] || '';
          if (typeof parsed === 'string') return parsed;
        } catch (_) {
          return v;
        }
      }
      return v;
    }
    let _toStaticRow = (item) => {
      return {
        title: item.title || '',
        descript: item.descript || '',
        image: _normalizeImage(item.image),
        icon: item.icon || '',
        url: item.url || '',
        hot: !!item.is_hot,
      };
    }
    return parents.map((parent) => {
      const row = _toStaticRow(parent);
      const list = (childMap.get(parent.id) || []).map((child) => _toStaticRow(child));
      if (list.length) row.list = list;
      return row;
    });
  }

  async get(req, reply) {
    const params = this._params(req);
    let m = params.model;

    if (!this.myService.IDIsEmpty(params.id)) {
      m = await this.myService.Get({ id: params.id, isLoadDetailed: true, userId: params.userId });
    }
    if (!m) m = this.myModel.CopyData({
    });

    m = this._dtoFilter(this._datesToString(m), 'detail');
    return R({ succeed: true, data: m });
  }

  async _saveImpl(params, db, isSaveDetailed = false) {
    const m = this._dtoFilter(params.model, 'save');
    const isAdd = this.myService.IDIsEmpty(m.id);

    m.id = await this.myService.AddOrUpdate({ model: m, userId: params.userId, isSaveDetailed, db });
    let newModel = await this.myService.Get({ id: m.id, isLoadDetailed: true, userId: params.userId, db });
    if (newModel) newModel = this._dtoFilter(this._datesToString(newModel), 'detail');
    return R({
      succeed: !this.myService.IDIsEmpty(m.id),
      msg: !this.myService.IDIsEmpty(m.id) ? '保存成功' : '保存失败',
      data: m.id,
      data1: newModel,
    });
  }

  async getList(req, reply) {
    const params = this._params(req);
    const search = await this.myService.GetSearchSQL({ searchModel: params, userId: params.userId });
    const strOrder = this.myService.getOrderString(params.sortObj);
    const isLoadDetailed = params.isLoadDetailed != null ? params.isLoadDetailed : true;

    const data = R({ succeed: true, data: {} });

    if (params.isAllData) {
      const MAX_ALL = 5000;
      data.data.Items = await this.myService.GetListForPageIndex({
        strWhere: search.sql, strParams: search.params,
        strOrder, pageIndex: 0, onePageCount: MAX_ALL, isLoadDetailed, userId: params.userId,
      });
      data.data.DataTotal = data.data.Items.length;
    } else {
      data.data.PageIndex = params.PageIndex ? parseInt(params.PageIndex) : 1;
      data.data.OnePageCount = params.onePageCount ? parseInt(params.onePageCount) : this.myService.myConfig.dbConfig.onePageCount;

      const cachedTotal = params.DataTotal && params.DataTotal > 0 ? parseInt(params.DataTotal) : 0;
      const [items, total] = await Promise.all([
        this.myService.GetListForPageIndex({
          strWhere: search.sql, strParams: search.params,
          strOrder, pageIndex: data.data.PageIndex - 1,
          onePageCount: data.data.OnePageCount, isLoadDetailed, userId: params.userId,
        }),
        cachedTotal ? Promise.resolve(cachedTotal) : this.myService.Count({
          strWhere: search.sql, strParams: search.params, userId: params.userId,
        }),
      ]);
      data.data.Items = items;
      data.data.DataTotal = total;
    }

    data.data.Items = this._dtoFilter(data.data.Items, 'list');
    return this._datesToString(data);
  }
  async getshow_typeSelect2(req, reply) {
    const params = this._params(req);
    return this.myService.getshow_typeSelect2({
      key: params.key || '',
      selectID: params.selectID,
      currentModel: params.model,
      pageIndex: params.pageIndex,
      userId: params.userId,
    });
  }
  async copy(req, reply) {
    const params = this._params(req);
    var model = await this.myService.Get({ id: params.id, isLoadDetailed: true });
    if (!model) {
      return util.BaseRetrun({ succeed: false, msg: '未能找到复制源数据' });
    }
    model.files = [];
    model.sort_index = 0;
    model.id = 0;
    return await this.myService.Transaction(async (db) => {
      let params2 = {
        model: model,
        userId: params.userId,
        spId: params.spId,
      };
      let succeed = await this.saveImpl(params2, db, true);
      if (!succeed.succeed) {
        return succeed;
      }
      return util.BaseRetrun({ succeed: succeed.succeed, data: succeed.data });
    });
  }
}

module.exports = new HomeService();
