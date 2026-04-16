'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/sys_user.model');
const factory = require('../factory');

/**
 * sys_user — 核心表
 */
class SysUserRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'sys_user';
    this.defalutOrder = 'sys_user.user_id desc';
    this.tableTitle = '系统用户';
    this.primaryKey = 'user_id';
    this.deleteKey = 'del_flag';
    this.createDate = 'create_time';
    this.createUserId = 'create_by';
    this.updateDate = 'update_time';
    this.updateUserId = 'update_by';
    this.deleteDate = '';
    this.deleteUserId = '';
    this.sortIndex = '';
    this.emptyPrimaryValue = 0;
    this.baseSql = `
      select sys_user.*
      from sys_user sys_user
      where sys_user.user_id > 0 {0} {1}
      order by {2}
    `.replace(/\n\s+/g, ' ').trim();
  }

  async Load({ datas, userId, isLoadDetailed = false, isGetValue = true, db = null }) {
    if (!datas || !datas.length) return;
    if (!isLoadDetailed) return;

    const ids = datas.map(e => this.GetModelID({ model: e }));
    if (ids.length) {
      const files = await factory.system_fileRepo.GetFilesForName({
        fileType: 'sys_user',
        TargetIDs: ids,
        userId,
        db,
      });
      for (const i of datas) {
        i.files = files.filter((e) => e.TargetID == i.user_id);
      }
    }
  }

  async AddOrUpdate({ model: m, isSaveDetailed = false, userId, db = null }) {
    m.user_id = await super.AddOrUpdate({ model: m, isSaveDetailed, userId, db });
    if (!isSaveDetailed || !m.user_id) {
      return m.user_id;
    }

    if (m.files?.length) {
      for (const i of m.files) {
        i.TargetID = m.user_id;
      }
    }
    await factory.system_fileRepo.AddOrUpdateMulti({
      files: m.files,
      name: 'sys_user',
      tableId: m.user_id,
      userId,
      db,
    });
    return m.user_id;
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
      w.w('sys_user.user_name', searchModel.Keyword, 'like', 'or');
      w.w('sys_user.nick_name', searchModel.Keyword, 'like', 'or');
      w.w('sys_user.user_type', searchModel.Keyword, 'like', 'or');
      w.w('sys_user.email', searchModel.Keyword, 'like', 'or');
      w.w('sys_user.phonenumber', searchModel.Keyword, 'like', 'or');
      w.w('sys_user.sex', searchModel.Keyword, 'like', 'or');
      w.w('sys_user.avatar', searchModel.Keyword, 'like', 'or');
      w.w('sys_user.password', searchModel.Keyword, 'like', 'or');
      w.w('sys_user.status', searchModel.Keyword, 'like', 'or');
      w.w('sys_user.del_flag', searchModel.Keyword, 'like', 'or');
      w.w('sys_user.login_ip', searchModel.Keyword, 'like', 'or');
      w.w('sys_user.create_by', searchModel.Keyword, 'like', 'or');
      w.w('sys_user.update_by', searchModel.Keyword, 'like', 'or');
      w.w('sys_user.remark', searchModel.Keyword, 'like', 'or');
    }
    if (searchModel.user_id) w.eq('sys_user.user_id', searchModel.user_id);
    if (searchModel.ids) w.in('sys_user.user_id', searchModel.ids);
    return w.build();
  }
}

module.exports = new SysUserRepo();