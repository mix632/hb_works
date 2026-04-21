'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/biz_home.model');

/**
 * biz_home — 核心表
 */
class BizHomeRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'biz_home';
    this.defalutOrder = 'biz_home.sort_index asc';
    this.tableTitle = '页面配置';
    this.primaryKey = 'id';
    this.deleteKey = 'deleted';
    this.createDate = 'created_at';
    this.createUserId = '';
    this.updateDate = 'updated_at';
    this.updateUserId = '';
    this.deleteDate = '';
    this.deleteUserId = '';
    this.sortIndex = 'sort_index';
    this.emptyPrimaryValue = 0;
    this.baseSql = `
      select biz_home.*,
             _home_show_type.title as show_type_title
      from biz_home biz_home
      left join biz_home_show_type _home_show_type on _home_show_type.id = biz_home.show_type
      where biz_home.id > 0 {0} {1}
      order by {2}
    `.replace(/\n\s+/g, ' ').trim();
  }

  async Load({ datas, userId, isLoadDetailed = false, isGetValue = true, db = null }) {
    if (!datas || !datas.length) return;
    if (!isLoadDetailed) return;

    const ids = datas.map(e => this.GetModelID({ model: e }));
    if (ids.length) {
      const files = await this.getRepo('public.system_fileRepo').GetFilesForName({
        fileType: 'biz_home',
        TargetIDs: ids,
        userId,
        db,
      });
      for (const i of datas) {
        i.files = files.filter((e) => e.TargetID == i.id);
        i.files = i.files.map(e => {
          return {
            name: e.FileName,
            path: e.FileMd5,
            ...e,
          }
        })
      }
    }
  }

  async AddOrUpdate({ model: m, isSaveDetailed = false, userId, db = null }) {
    m.image = (m.files && m.files.length) ? JSON.stringify(m.files.map(e => e.path)) : '[]';
    m.id = await super.AddOrUpdate({ model: m, isSaveDetailed, userId, db });
    if (!isSaveDetailed || !m.id) {
      return m.id;
    }

    if (m.files?.length) {
      m.files = m.files.map(e => {
        return {
          FileName: e.FileName || e.name,
          FileMd5: e.FileMd5 || e.path,
          ...e,
        }
      })
      for (const i of m.files) {
        i.TargetID = m.id;
      }
    }
    await this.getRepo('public.system_fileRepo').AddOrUpdateMulti({
      files: m.files,
      name: 'biz_home',
      tableId: m.id,
      userId,
      db,
    });
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
      w.w('biz_home.title', 'like', searchModel.Keyword, 'or');
      w.w('biz_home.descript', 'like', searchModel.Keyword, 'or');
      w.w('biz_home.url', 'like', searchModel.Keyword, 'or');
    }
    if (searchModel.id) w.eq('biz_home.id', searchModel.id);
    if (searchModel.ids) w.in('biz_home.id', searchModel.ids);
    if (searchModel.type) w.eq('biz_home.type', searchModel.type);
    if (searchModel.parent_id) w.eq('biz_home.parent_id', searchModel.parent_id);
    return w.build();
  }
  async getshow_typeSelect2({ key, selectID, pageIndex, onePageCount = 30, userId }) {
    const factory = require('../factory');
    const repo = factory.biz_home_show_typeRepo;
    const strWhere = key ? `biz_home_show_type.title like :_key` : '';
    const strParams = key ? { _key: `%${key}%` } : {};
    return repo.getSelect2({
      selectID, strWhere, strParams,
      tableName: repo.tableName, primaryKey: repo.primaryKey,
      titleName: 'title', pageIndex, onePageCount, userId,
    });
  }
}

module.exports = new BizHomeRepo();