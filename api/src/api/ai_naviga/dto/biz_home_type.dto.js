'use strict';

/**
 * biz_home_type DTO — 字段白名单
 * list:   列表接口裁剪掉大字段，显著减少传输量
 * detail: 详情接口完整字段 + computed 展示字段
 * save:   保存接口允许写入的字段（防止注入 created_at / deleted 等系统字段）
 */
module.exports = {
  list: [
    'id', 'title', 'sort_index', 
  ],
  detail: [
    'id', 'title', 'sort_index', 'created_at', 'updated_at', 'deleted', 
  ],
  save: [
    'id', 'title', 'sort_index', 'created_at', 'updated_at', 'deleted', 
  ],
};