'use strict';

const BaseService = require('../../../core/baseService');
const repo = require('../dal/gb_user_status.repo');
const model = require('../model/gb_user_status.model');
const dto = require('../dto/gb_user_status.dto');
const dictCache = require('../../../core/dictCache');

class UserStatusService extends BaseService {
  constructor() {
    super({ service: repo, model, prefix: '/cdp/user_status', dto });
  }

  registerRoutes(app) {
    super.registerRoutes(app);
    // 字典表写操作后自动失效缓存
    const origSave = this.save.bind(this);
    this.save = async (req, reply) => {
      const result = await origSave(req, reply);
      if (result.Succeed) await dictCache.reload('gb_user_status');
      return result;
    };
    const origDelete = this.delete.bind(this);
    this.delete = async (req, reply) => {
      const result = await origDelete(req, reply);
      if (result.Succeed) await dictCache.reload('gb_user_status');
      return result;
    };
  }
}

module.exports = new UserStatusService();
