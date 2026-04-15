'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/sys_role.model');

/**
 * sys_role — 核心表
 */
class SysRoleRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'sys_role';
    this.defalutOrder = 'sys_role.role_id desc';
    this.tableTitle = '角色';
    this.primaryKey = 'role_id';
    this.deleteKey = '';
    this.createDate = '';
    this.createUserId = '';
    this.updateDate = '';
    this.updateUserId = '';
    this.deleteDate = '';
    this.deleteUserId = '';
    this.sortIndex = '';
    this.emptyPrimaryValue = 0;
    this.baseSql = `
      select sys_role.*
      from sys_role sys_role
      where sys_role.role_id > 0 {0} {1}
      order by {2}
    `.replace(/\n\s+/g, ' ').trim();
  }

  async Load({ datas, userId, isLoadDetailed = false, isGetValue = true, db = null }) {
    if (!datas || !datas.length) return;
    if (!isLoadDetailed) return;

    const factory = require('../factory');
    const ids = datas.map(e => this.GetModelID({ model: e }));
    if (ids.length) {
    }
  }

  async AddOrUpdate({ model: m, isSaveDetailed = false, userId, db = null }) {
    m.role_id = await super.AddOrUpdate({ model: m, isSaveDetailed, userId, db });
    if (!isSaveDetailed || !m.role_id) {
      return m.role_id;
    }

    return m.role_id;
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
      w.w('sys_role.role_name', searchModel.Keyword, 'like', 'or');
      w.w('sys_role.role_key', searchModel.Keyword, 'like', 'or');
      w.w('sys_role.data_scope', searchModel.Keyword, 'like', 'or');
      w.w('sys_role.status', searchModel.Keyword, 'like', 'or');
      w.w('sys_role.del_flag', searchModel.Keyword, 'like', 'or');
      w.w('sys_role.create_by', searchModel.Keyword, 'like', 'or');
      w.w('sys_role.update_by', searchModel.Keyword, 'like', 'or');
      w.w('sys_role.remark', searchModel.Keyword, 'like', 'or');
    }
    if (searchModel.role_id) w.eq('sys_role.role_id', searchModel.role_id);
    if (searchModel.ids) w.in('sys_role.role_id', searchModel.ids);
    return w.build();
  }
}

module.exports = new SysRoleRepo();