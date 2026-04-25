'use strict';

const BaseService = require('../../../core/baseService');
const MongoDal = require('../../../core/mongoDal');
const { R } = require('../../../core/errors');

class _ParamHelper extends BaseService {
  constructor() {
    super({ service: {}, model: {}, prefix: '/naviga/mongo-test', dto: null });
  }
}

const paramHelper = new _ParamHelper();
const mongoDal = new MongoDal({ collectionName: 'mongo_test_demo' });

class MongoTestService {
  constructor() {
    this.prefix = '/naviga/mongo-test';
  }

  _params(req) {
    return paramHelper._params(req);
  }

  registerRoutes(app) {
    const p = this.prefix;
    app.post(`${p}/create`, { config: { noAuth: true } }, (req, reply) => this.create(req, reply));
    app.get(`${p}/get`, { config: { noAuth: true } }, (req, reply) => this.get(req, reply));
    app.get(`${p}/list`, { config: { noAuth: true } }, (req, reply) => this.list(req, reply));
    app.post(`${p}/update`, { config: { noAuth: true } }, (req, reply) => this.update(req, reply));
    app.post(`${p}/delete`, { config: { noAuth: true } }, (req, reply) => this.delete(req, reply));
  }

  async create(req, reply) {
    void reply;
    try {
      const params = this._params(req);
      const title = params.title ? String(params.title).trim() : '';
      if (!title) return R({ succeed: false, msg: 'title不能为空' });

      const id = await mongoDal.insertOne({
        model: {
          title,
          content: params.content ? String(params.content) : '',
          status: params.status != null ? Number(params.status) || 0 : 0,
          deleted: false,
        },
      });
      const data = await mongoDal.findOne({ id, filter: { deleted: false } });
      return R({ succeed: true, msg: '创建成功', data });
    } catch (err) {
      return R({ succeed: false, msg: err.message || '创建失败', data: null });
    }
  }

  async get(req, reply) {
    void reply;
    try {
      const params = this._params(req);
      if (!params.id) return R({ succeed: false, msg: 'id不能为空', data: null });
      const data = await mongoDal.findOne({ id: params.id, filter: { deleted: false } });
      if (!data) return R({ succeed: false, msg: '数据不存在', data: null });
      return R({ succeed: true, msg: '', data });
    } catch (err) {
      return R({ succeed: false, msg: err.message || '查询失败', data: null });
    }
  }

  async list(req, reply) {
    void reply;
    try {
      const params = this._params(req);
      const pageIndex = Math.max(1, parseInt(params.pageIndex, 10) || 1);
      const onePageCount = Math.max(1, Math.min(100, parseInt(params.onePageCount, 10) || 20));
      const filter = { deleted: false };
      if (params.status != null && params.status !== '') {
        filter.status = Number(params.status) || 0;
      }
      if (params.title) {
        filter.title = { $regex: String(params.title).trim(), $options: 'i' };
      }

      const [items, total] = await Promise.all([
        mongoDal.find({ filter, pageIndex, onePageCount, sort: { _id: -1 } }),
        mongoDal.count({ filter }),
      ]);

      return R({
        succeed: true,
        msg: '',
        data: {
          Items: items,
          DataTotal: total,
          PageIndex: pageIndex,
          OnePageCount: onePageCount,
        },
      });
    } catch (err) {
      return R({ succeed: false, msg: err.message || '列表查询失败', data: null });
    }
  }

  async update(req, reply) {
    void reply;
    try {
      const params = this._params(req);
      if (!params.id) return R({ succeed: false, msg: 'id不能为空', data: null });

      const values = {};
      if (params.title != null) values.title = String(params.title);
      if (params.content != null) values.content = String(params.content);
      if (params.status != null && params.status !== '') values.status = Number(params.status) || 0;
      if (!Object.keys(values).length) {
        return R({ succeed: false, msg: '没有可更新字段', data: null });
      }

      const updated = await mongoDal.updateOne({
        id: params.id,
        filter: { deleted: false },
        values,
      });
      if (!updated) return R({ succeed: false, msg: '更新失败或数据不存在', data: null });

      const data = await mongoDal.findOne({ id: params.id, filter: { deleted: false } });
      return R({ succeed: true, msg: '更新成功', data });
    } catch (err) {
      return R({ succeed: false, msg: err.message || '更新失败', data: null });
    }
  }

  async delete(req, reply) {
    void reply;
    try {
      const params = this._params(req);
      if (!params.id) return R({ succeed: false, msg: 'id不能为空', data: null });
      const deleted = await mongoDal.deleteOne({ id: params.id, filter: { deleted: false } });
      if (!deleted) return R({ succeed: false, msg: '删除失败或数据不存在', data: null });
      return R({ succeed: true, msg: '删除成功', data: params.id });
    } catch (err) {
      return R({ succeed: false, msg: err.message || '删除失败', data: null });
    }
  }
}

module.exports = new MongoTestService();
