'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/sys_role_dept.model');
const factory = require('../factory');

/**
 * sys_role_dept — 核心表
 */
class SysRoleDeptRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'sys_role_dept';
    this.defalutOrder = 'sys_role_dept.role_id desc';
    this.tableTitle = '部门角色';
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
      select sys_role_dept.*
      from sys_role_dept sys_role_dept
      where sys_role_dept.role_id > 0 {0} {1}
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
    return {
      sql: 'sys_role_dept.role_id = :_role_id and sys_role_dept.dept_id = :_dept_id',
      params: { _role_id: model.role_id, _dept_id: model.dept_id },
    };
  }
  AddOrUpdate_GetExistSql({ model }) {
    return {
      sql: 'sys_role_dept.role_id = :_rid and sys_role_dept.dept_id = :_did',
      params: { _rid: model.role_id, _did: model.dept_id },
    };
  }

  GetSearchSQL({ searchModel, userId }) {
    const w = this.safeWhere();
    if (searchModel.Keyword && searchModel.Keyword.trim()) {
    }
    if (searchModel.role_id) w.eq('sys_role_dept.role_id', searchModel.role_id);
    if (searchModel.ids) w.in('sys_role_dept.role_id', searchModel.ids);
    return w.build();
  }
}

module.exports = new SysRoleDeptRepo();