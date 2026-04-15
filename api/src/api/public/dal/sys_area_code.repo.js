'use strict';

const { Dal } = require('../../../core/dal');
const util = require('../../../utils');
const model = require('../model/sys_area_code.model');

/**
 * sys_area_code — 核心表
 */
class SysAreaCodeRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'sys_area_code';
    this.defalutOrder = 'sys_area_code.code desc';
    this.tableTitle = '行政区县表';
    this.primaryKey = 'code';
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
      select sys_area_code.*
      from sys_area_code sys_area_code
      where sys_area_code.code > 0 {0} {1}
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
    m.code = await super.AddOrUpdate({ model: m, isSaveDetailed, userId, db });
    if (!isSaveDetailed || !m.code) {
      return m.code;
    }

    return m.code;
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
      w.w('sys_area_code.name', searchModel.Keyword, 'like', 'or');
      w.w('sys_area_code.pinyin', searchModel.Keyword, 'like', 'or');
    }
    if (searchModel.code) w.eq('sys_area_code.code', searchModel.code);
    if (searchModel.ids) w.in('sys_area_code.code', searchModel.ids);
    return w.build();
  }

  // ─── 城市选择器相关方法 ─────────────────────────

  firstLetterKey(name) {
    if (!name || typeof name !== 'string') return '#';
    const c = name.trim()[0];
    if (!c) return '#';
    if (/[a-zA-Z]/.test(c)) return c.toUpperCase();
    return c;
  }

  firstLetterFromRow(row) {
    const py = (row.pinyin && String(row.pinyin).trim()) || '';
    if (py) {
      const c = py[0];
      if (/[a-zA-Z]/.test(c)) return c.toUpperCase();
      return c;
    }
    return this.firstLetterKey(row.name);
  }

  normalizeCodeForJson(c) {
    if (c == null || c === '') return '';
    if (typeof c === 'bigint') return c.toString();
    return String(c);
  }

  rowsToGrouped(rows) {
    const map = new Map();
    for (const r of rows) {
      const letter = this.firstLetterFromRow(r);
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter).push({
        code: this.normalizeCodeForJson(r.code),
        name: r.name,
        level: r.level,
      });
    }
    const letters = Array.from(map.keys()).sort((a, b) => a.localeCompare(b, 'en'));
    return letters.map((letter) => {
      const items = map.get(letter);
      return {
        _id: letter,
        letter,
        name: items.map((i) => i.name),
        code: items.map((i) => i.code),
        level: items.map((i) => i.level),
      };
    });
  }

  /**
   * 城市列表（按拼音首字母分组），供 uni-app 城市选择器使用
   */
  async CityListGrouped({ keyword = '', userId = 0, db = null }) {
    const kw = (keyword || '').trim().replace(/'/g, "''");
    let strWhere;
    if (kw.length) {
      strWhere = `sys_area_code.level = 3 and (sys_area_code.name like '%${kw}%' or sys_area_code.pinyin like '%${kw}%')`;
    } else {
      strWhere = `sys_area_code.level = 1`;
    }
    const rows = await this.GetList({
      strWhere,
      strOrder: 'sys_area_code.pinyin asc, sys_area_code.name asc',
      userId,
      isLoadDetailed: false,
      isGetValue: true,
      db,
    });
    return util.BaseRetrun({ Succeed: true, Data: this.rowsToGrouped(rows) });
  }

  /**
   * 某级区划下的子级列表（分组），用于省→市→县逐级选择
   */
  async ChildrenGrouped({ pcode, keyword = '', userId = 0, db = null }) {
    const parent = pcode != null && pcode !== '' ? String(pcode).replace(/[^\d]/g, '') : '';
    if (!parent) {
      return util.BaseRetrun({ Succeed: false, Message: '缺少父级区划代码 pcode' });
    }
    const kw = (keyword || '').trim().replace(/'/g, "''");
    let strWhere = `sys_area_code.pcode = '${parent}'`;
    if (kw.length) {
      strWhere += ` and (sys_area_code.name like '%${kw}%' or sys_area_code.pinyin like '%${kw}%')`;
    }
    const rows = await this.GetList({
      strWhere,
      strOrder: 'sys_area_code.pinyin asc, sys_area_code.name asc',
      userId,
      isLoadDetailed: false,
      isGetValue: true,
      db,
    });
    return util.BaseRetrun({ Succeed: true, Data: this.rowsToGrouped(rows) });
  }

  /**
   * 根据区县（level=3）代码向上解析 省 / 市 / 区县 名称
   */
  async GetRegionChainByCode({ code, userId = 0, db = null }) {
    const id = String(code || '').replace(/[^\d]/g, '');
    if (!id) {
      return util.BaseRetrun({ Succeed: false, Message: '缺少 code' });
    }
    const curRows = await this.GetList({
      strWhere: `sys_area_code.code = '${id}'`,
      userId, isLoadDetailed: false, isGetValue: true, db,
    });
    if (!curRows || !curRows.length) {
      return util.BaseRetrun({ Succeed: false, Message: '未找到区划' });
    }
    let cur = curRows[0];
    if (parseInt(cur.level, 10) !== 3) {
      return util.BaseRetrun({ Succeed: false, Message: '须选择到区/县（第三级）' });
    }
    const chain = [];
    while (cur) {
      chain.push(cur);
      const pc = cur.pcode != null && cur.pcode !== '' ? String(cur.pcode).replace(/[^\d]/g, '') : '';
      if (!pc || pc === '0') break;
      const parents = await this.GetList({
        strWhere: `sys_area_code.code = '${pc}'`,
        userId, isLoadDetailed: false, isGetValue: true, db,
      });
      if (!parents || !parents.length) break;
      cur = parents[0];
    }
    const byLevel = (n) => chain.find((e) => parseInt(e.level, 10) === n);
    const province = byLevel(1);
    const city = byLevel(2);
    const district = byLevel(3);
    if (!province || !city || !district) {
      return util.BaseRetrun({ Succeed: false, Message: '区划层级不完整，请检查 pcode / level 数据' });
    }
    return util.BaseRetrun({
      Succeed: true,
      Data: {
        province: province.name || '',
        city: city.name || '',
        district: district.name || '',
        codes: {
          province: province.code,
          city: city.code,
          district: district.code,
        },
      },
    });
  }
}

module.exports = new SysAreaCodeRepo();