'use strict';

/**
 * sys_menu DTO — 字段白名单
 * list:   列表接口裁剪掉大字段，显著减少传输量
 * detail: 详情接口完整字段 + computed 展示字段
 * save:   保存接口允许写入的字段（防止注入 created_at / deleted 等系统字段）
 */
module.exports = {
  list: [
    'menu_id', 'menu_name', 'parent_id', 'order_num', 'path', 'component', 'query', 'is_frame', 'is_cache', 'menu_type', 'visible', 'status', 'edit_open_new_page', 'open_route', 'perms', 'icon', 'i18n', 'isOpenUrl', 'create_by', 'create_time', 'update_by', 'update_time', 'remark', 
  ],
  detail: [
    'menu_id', 'menu_name', 'parent_id', 'order_num', 'path', 'component', 'query', 'is_frame', 'is_cache', 'menu_type', 'visible', 'status', 'edit_open_new_page', 'open_route', 'perms', 'icon', 'i18n', 'isOpenUrl', 'create_by', 'create_time', 'update_by', 'update_time', 'remark', 
  ],
  save: [
    'menu_id', 'menu_name', 'parent_id', 'order_num', 'path', 'component', 'query', 'is_frame', 'is_cache', 'menu_type', 'visible', 'status', 'edit_open_new_page', 'open_route', 'perms', 'icon', 'i18n', 'isOpenUrl', 'create_by', 'create_time', 'update_by', 'update_time', 'remark', 
  ],
};