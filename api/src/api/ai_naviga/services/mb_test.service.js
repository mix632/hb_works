'use strict';

const BaseService = require('../../../core/baseService');
const { R } = require('../../../core/errors');
const repo = require('../dal/mb_test.repo');
const model = require('../model/mb_test.model');
const dto = require('../dto/mb_test.dto');

class MbTestService extends BaseService {
  constructor() {
    super({ service: repo, model, prefix: '/ai_naviga/mb_test', dto });
  }

  registerRoutes(app) {
    const p = this.prefix;
    app.get(`${p}/get`, { config: { noAuth: true } }, (req, reply) => this.get(req, reply));
    app.post(`${p}/save`, { config: { noAuth: true } }, (req, reply) => this.save(req, reply));
    app.post(`${p}/delete`, { config: { noAuth: true } }, (req, reply) => this.delete(req, reply));
    app.get(`${p}/getlist`, { config: { noAuth: true } }, (req, reply) => this.getList(req, reply));
  }

  async get(req, reply) {
    void reply;
    const params = this._params(req);
    let m = params.model;

    if (!this.myService.IDIsEmpty(params.id)) {
      m = await this.myService.Get({ id: params.id });
    }
    if (!m) m = this.myModel.CopyData({});

    m = this._dtoFilter(this._datesToString(m), 'detail');
    return R({ succeed: true, data: m });
  }

  async save(req, reply) {
    void reply;
    const params = this._params(req);
    if (!params.model) return R({ succeed: false, msg: '传入参数有误' });

    const m = this._dtoFilter(params.model, 'save');
    const savedId = await this.myService.AddOrUpdate({ model: m });
    const newModel = await this.myService.Get({ id: savedId });

    return R({
      succeed: !this.myService.IDIsEmpty(savedId),
      msg: !this.myService.IDIsEmpty(savedId) ? '保存成功' : '保存失败',
      data: savedId,
      data1: newModel ? this._dtoFilter(this._datesToString(newModel), 'detail') : null,
    });
  }

  async delete(req, reply) {
    void reply;
    const params = this._params(req);
    const result = await this.myService.Delete({ id: params.id, ids: params.ids });
    return R({ succeed: result.succeed, msg: result.msg });
  }

  async getList(req, reply) {
    void reply;
    const params = this._params(req);
    const filter = this.myService.GetSearchFilter({ searchModel: params });
    const data = R({ succeed: true, data: {} });

    data.data.PageIndex = params.PageIndex ? parseInt(params.PageIndex, 10) : 1;
    data.data.OnePageCount = params.onePageCount ? parseInt(params.onePageCount, 10) : 30;

    const [items, total] = await Promise.all([
      this.myService.GetListForPageIndex({
        filter,
        pageIndex: data.data.PageIndex - 1,
        onePageCount: data.data.OnePageCount,
      }),
      this.myService.Count({ filter }),
    ]);

    data.data.Items = this._dtoFilter(items, 'list');
    data.data.DataTotal = total;
    return this._datesToString(data);
  }
}

module.exports = new MbTestService();
