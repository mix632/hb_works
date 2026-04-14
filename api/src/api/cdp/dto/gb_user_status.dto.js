'use strict';

/**
 * DTO — 字段白名单
 * list:   列表接口返回的字段
 * detail: 详情接口返回的字段
 * save:   保存接口允许写入的字段
 */
module.exports = {
  list:   ['id', 'title', 'sort_index', 'created_at'],
  detail: ['id', 'title', 'sort_index', 'created_at', 'updated_at', 'deleted'],
  save:   ['id', 'title', 'sort_index'],
};
