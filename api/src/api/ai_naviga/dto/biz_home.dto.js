'use strict';

/**
 * biz_home DTO — 字段白名单
 * list:   列表接口裁剪掉大字段，显著减少传输量
 * detail: 详情接口完整字段 + computed 展示字段
 * save:   保存接口允许写入的字段（防止注入 created_at / deleted 等系统字段）
 */
module.exports = {
  list: [
    'id', 'type', 'title', 'descript', 'url', 'icon', 'show_type', 'is_more', 'is_hot', 'sort_index', 
  ],
  detail: [
    'id', 'type', 'parent_id', 'title', 'descript', 'url', 'icon', 'image', 'show_type', 'is_more', 'is_hot', 'html', 'data', 'platform', 'sort_index', 'created_at', 'updated_at', 'deleted', 
  ],
  save: [
    'id', 'type', 'parent_id', 'title', 'descript', 'url', 'icon', 'image', 'show_type', 'is_more', 'is_hot', 'html', 'data', 'platform', 'sort_index', 'created_at', 'updated_at', 'deleted', 
  ],
};