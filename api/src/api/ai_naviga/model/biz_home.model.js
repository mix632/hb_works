'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, formatDate, parseBool } = require('../../../core/baseModel');

class biz_homeModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('biz_home', {
      // id
      id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true, field: 'id', defaultValue: 0, allowNull: false },
      // 板块
      type: { type: sequelize.INTEGER, field: 'type', defaultValue: 0, allowNull: false },
      // 上级
      parent_id: { type: sequelize.INTEGER, field: 'parent_id', defaultValue: 0, allowNull: false },
      // 名称
      title: { type: sequelize.STRING,  field: 'title', defaultValue: '', allowNull: false },
      // 备注
      descript: { type: sequelize.STRING,  field: 'descript', defaultValue: '', allowNull: false },
      // 地址
      url: { type: sequelize.STRING,  field: 'url', defaultValue: '', allowNull: false },
      // 显示icon
      icon: { type: sequelize.STRING,  field: 'icon', defaultValue: '', allowNull: false },
      // 图片
      image: { type: sequelize.STRING,  field: 'image', defaultValue: '', allowNull: false },
      // 显示方式
      show_type: { type: sequelize.INTEGER, field: 'show_type', defaultValue: 0, allowNull: false },
      // 是否有更多
      is_more: { type: sequelize.BOOLEAN, field: 'is_more', defaultValue: false, allowNull: false },
      // 推荐
      is_hot: { type: sequelize.BOOLEAN, field: 'is_hot', defaultValue: false, allowNull: false },
      // 富文本
      html: { type: sequelize.STRING,  field: 'html', defaultValue: '', allowNull: false },
      // 数据配置
      data: { type: sequelize.JSON, field: 'data', defaultValue: false, allowNull: false },
      // 支持平台
      platform: { type: sequelize.JSON, field: 'platform', defaultValue: false, allowNull: false },
      // 排序号
      sort_index: { type: sequelize.INTEGER, field: 'sort_index', defaultValue: 0, allowNull: false },
      // 创建时间
      created_at: { type: sequelize.DATE, field: 'created_at', defaultValue: MIN_DATE, allowNull: false },
      // 更新时间
      updated_at: { type: sequelize.DATE, field: 'updated_at', defaultValue: MIN_DATE, allowNull: false },
      // 删除标记
      deleted: { type: sequelize.BOOLEAN, field: 'deleted', defaultValue: false, allowNull: false },
    }, { timestamps: false, freezeTableName: true, deletedAt: true, });
    /**********手工插入代码 */
    this.model.files = [];
    /**********结束 */
  }
  CopyData(d) {
    d = d || {};
    return {
      id: d.id ? parseInt(d.id) : 0,
      type: d.type ? parseInt(d.type) : 0,
      parent_id: d.parent_id ? parseInt(d.parent_id) : 0,
      title: d.title || '',
      descript: d.descript || '',
      url: d.url || '',
      icon: d.icon || '',
      image: d.image || '',
      show_type: d.show_type ? parseInt(d.show_type) : 0,
      show_type_title: d.show_type_title || '',
      is_more: d.hasOwnProperty('is_more') ? parseBool(d.is_more) : false,
      is_hot: d.hasOwnProperty('is_hot') ? parseBool(d.is_hot) : false,
      html: d.html || '',
      data: d.data || '',
      platform: d.platform || '',
      sort_index: d.sort_index ? parseInt(d.sort_index) : 0,
      created_at: formatDate(d.created_at, 'YYYY-MM-DD HH:mm:ss'),
      updated_at: formatDate(d.updated_at, 'YYYY-MM-DD HH:mm:ss'),
      deleted: d.hasOwnProperty('deleted') ? parseBool(d.deleted) : false,

      /**********手工插入代码 */
      files: d.files || [],
      /**********结束 */
    };
  }
}
module.exports = new biz_homeModel();