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
      if (!title) return R({ Succeed: false, Message: 'title不能为空' });

      const id = await mongoDal.insertOne({
        model: {
          title,
          content: params.content ? String(params.content) : '',
          status: params.status != null ? Number(params.status) || 0 : 0,
          deleted: false,
        },
      });
      const data = await mongoDal.findOne({ id, filter: { deleted: false } });
      return R({ Succeed: true, Message: '创建成功', Data: data });
    } catch (err) {
      return R({ Succeed: false, Message: err.message || '创建失败', Data: null });
    }
  }

  async get(req, reply) {
    void reply;
    try {
      const params = this._params(req);
      if (!params.id) return R({ Succeed: false, Message: 'id不能为空', Data: null });
      const data = await mongoDal.findOne({ id: params.id, filter: { deleted: false } });
      if (!data) return R({ Succeed: false, Message: '数据不存在', Data: null });
      return R({ Succeed: true, Message: '', Data: data });
    } catch (err) {
      return R({ Succeed: false, Message: err.message || '查询失败', Data: null });
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
        Succeed: true,
        Message: '',
        Data: {
          Items: items,
          DataTotal: total,
          PageIndex: pageIndex,
          OnePageCount: onePageCount,
        },
      });
    } catch (err) {
      return R({ Succeed: false, Message: err.message || '列表查询失败', Data: null });
    }
  }

  async update(req, reply) {
    void reply;
    try {
      const params = this._params(req);
      if (!params.id) return R({ Succeed: false, Message: 'id不能为空', Data: null });

      const values = {};
      if (params.title != null) values.title = String(params.title);
      if (params.content != null) values.content = String(params.content);
      if (params.status != null && params.status !== '') values.status = Number(params.status) || 0;
      if (!Object.keys(values).length) {
        return R({ Succeed: false, Message: '没有可更新字段', Data: null });
      }

      const updated = await mongoDal.updateOne({
        id: params.id,
        filter: { deleted: false },
        values,
      });
      if (!updated) return R({ Succeed: false, Message: '更新失败或数据不存在', Data: null });

      const data = await mongoDal.findOne({ id: params.id, filter: { deleted: false } });
      return R({ Succeed: true, Message: '更新成功', Data: data });
    } catch (err) {
      return R({ Succeed: false, Message: err.message || '更新失败', Data: null });
    }
  }

  async delete(req, reply) {
    void reply;
    try {
      const params = this._params(req);
      if (!params.id) return R({ Succeed: false, Message: 'id不能为空', Data: null });
      const deleted = await mongoDal.deleteOne({ id: params.id, filter: { deleted: false } });
      if (!deleted) return R({ Succeed: false, Message: '删除失败或数据不存在', Data: null });
      return R({ Succeed: true, Message: '删除成功', Data: params.id });
    } catch (err) {
      return R({ Succeed: false, Message: err.message || '删除失败', Data: null });
    }
  }
}

module.exports = new MongoTestService();
