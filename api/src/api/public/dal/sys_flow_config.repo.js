'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/sys_flow_config.model');
const factory = require('../factory');

/**
 * sys_flow_config — 核心表
 */
class SysFlowConfigRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'sys_flow_config';
    this.defalutOrder = 'sys_flow_config.id desc';
    this.tableTitle = '流程配置';
    this.primaryKey = 'id';
    this.deleteKey = 'deleted';
    this.createDate = 'created_at';
    this.createUserId = '不选择';
    this.updateDate = 'updated_at';
    this.updateUserId = '不选择';
    this.deleteDate = '';
    this.deleteUserId = '';
    this.sortIndex = '';
    this.emptyPrimaryValue = 0;
    this.baseSql = `
      select sys_flow_config.*
      from sys_flow_config sys_flow_config
      where sys_flow_config.id > 0 {0} {1}
      order by {2}
    `.replace(/\n\s+/g, ' ').trim();
  }

  async Load({ datas, userId, isLoadDetailed = false, isGetValue = true, db = null }) {
    if (!datas || !datas.length) return;
    if (!isLoadDetailed) return;

    const ids = datas.map(e => this.GetModelID({ model: e }));
    if (ids.length) {
    }
  }

  async AddOrUpdate({ model: m, isSaveDetailed = false, userId, db = null }) {
    m.id = await super.AddOrUpdate({ model: m, isSaveDetailed, userId, db });
    if (!isSaveDetailed || !m.id) {
      return m.id;
    }

    return m.id;
  }
  /**
   * 如果在保存数据时，id=0时，可以通过实体的其他值，组成sql，查询唯一性数据库实体
   * @param {object} model 数据实体
   */
  AddOrUpdate_GetIDZeroSql({ model }) {
    return ``;
  }

  GetSearchSQL({ searchModel, userId }) {
    const w = this.safeWhere();
    if (searchModel.Keyword && searchModel.Keyword.trim()) {
      w.w('sys_flow_config.name', searchModel.Keyword, 'like', 'or');
    }
    if (searchModel.id) w.eq('sys_flow_config.id', searchModel.id);
    if (searchModel.ids) w.in('sys_flow_config.id', searchModel.ids);
    return w.build();
  }
}

module.exports = new SysFlowConfigRepo();