'use strict';

const sequelize = require('sequelize');
const { nowStr } = require('../utils/dateUtil');
const { R } = require('./errors');
const CacheMixin = require('./cacheMixin');

let _parentLog = null;

class Dal {
  constructor() {
    this.tableName = '';
    this.defalutOrder = '';
    this.tableTitle = '';
    this.primaryKey = 'id';
    this.deleteKey = '';
    this.dbName = '';
    this.primaryKeyAutoIncrement = true;
    this.baseSql = '';
    this.modelType = null;
    this.myConfig = require('./serverConfig');

    this.createDate = '';
    this.createUserId = '';
    this.updateDate = '';
    this.updateUserId = '';
    this.deleteDate = '';
    this.deleteUserId = '';
    this.sortIndex = '';
    this.emptyPrimaryValue = 0;
  }

  _getSeq() {
    return this.myConfig.sequelize;
  }

  _mapRawResults(datas) {
    for (let i = 0; i < datas.length; i++) {
      datas[i] = this.modelType.CopyData(this.formatModel(datas[i].dataValues || datas[i]));
    }
    return datas;
  }

  // ─── 查询条件构建器 ──────────────────────────────────────────
  safeWhere() {
    const clauses = [];
    const params = {};
    let idx = 0;
    const key = (p) => { idx++; return `${p}_${idx}`; };
    const push = (sql, lk, p) => { clauses.push({ sql, lk }); Object.assign(params, p); };

    return {
      eq(col, val, lk = 'and')    { const k = key('p'); push(`${col} = :${k}`, lk, { [k]: val }); return this; },
      neq(col, val, lk = 'and')   { const k = key('p'); push(`${col} != :${k}`, lk, { [k]: val }); return this; },
      like(col, val, lk = 'and')  { const k = key('p'); push(`${col} like :${k}`, lk, { [k]: `%${val}%` }); return this; },
      gt(col, val, lk = 'and')    { const k = key('p'); push(`${col} > :${k}`, lk, { [k]: val }); return this; },
      gte(col, val, lk = 'and')   { const k = key('p'); push(`${col} >= :${k}`, lk, { [k]: val }); return this; },
      lt(col, val, lk = 'and')    { const k = key('p'); push(`${col} < :${k}`, lk, { [k]: val }); return this; },
      lte(col, val, lk = 'and')   { const k = key('p'); push(`${col} <= :${k}`, lk, { [k]: val }); return this; },
      in(col, vals, lk = 'and')   { const k = key('p'); push(`${col} in (:${k})`, lk, { [k]: vals }); return this; },
      w(col, op, val, lk = 'and') {
        const allowed = { '=':1, '!=':1, '<>':1, '>':1, '>=':1, '<':1, '<=':1, 'like':1, 'not like':1, 'in':1, 'not in':1 };
        const norm = String(op).trim().toLowerCase();
        if (!allowed[norm]) throw new Error(`safeWhere.w: unsupported operator "${op}"`);
        const k = key('p');
        if (norm === 'like' || norm === 'not like') {
          push(`${col} ${norm} :${k}`, lk, { [k]: `%${val}%` });
        } else if (norm === 'in' || norm === 'not in') {
          push(`${col} ${norm} (:${k})`, lk, { [k]: val });
        } else {
          push(`${col} ${norm} :${k}`, lk, { [k]: val });
        }
        return this;
      },
      raw(sql, p = {}, lk = 'and') { push(sql, lk, p); return this; },
      build() {
        let sql = '';
        for (const c of clauses) {
          sql = !sql ? c.sql : `(${sql}) ${c.lk} (${c.sql})`;
        }
        return { sql, params };
      },
    };
  }

  // ─── SQL 拼接 ─────────────────────────────────────────────────
  JoinSql({ strWhere, strOrder = '', isAll = false }) {
    let sql = this.baseSql;
    const del = isAll || !this.deleteKey ? '' : ` and (${this.tableName}.${this.deleteKey} = 0 or ${this.tableName}.${this.deleteKey} is null)`;
    sql = sql.replace('{0}', del);
    sql = sql.replace('{1}', strWhere ? ` and (${strWhere})` : '');
    sql = sql.replace('{2}', strOrder || this.defalutOrder);
    return sql;
  }

  GetListForPageSql({ sql, pageIndex = 0, onePageCount = 30 }) {
    return `${sql} limit ${pageIndex * onePageCount},${onePageCount}`;
  }

  // ─── 核心 CRUD ────────────────────────────────────────────────
  async Load({ datas, userId, isLoadDetailed = false, isGetValue = true, db = null }) { }

  formatModel(model) { return model; }

  async GetList({ strWhere = '', strParams, ids, strOrder, userId, isLoadDetailed = false, isGetValue = true, isAll = false, db = null }) {
    let datas = [];
    if (ids) {
      ids = Array.isArray(ids) ? ids.filter(e => e) : [];
      if (!ids.length) return [];
      const cache = await this._tryReadCache({ ids, isLoadDetailed, isGetValue, userId, db });
      if (cache) {
        if (cache.noneFound) return [];
        if (cache.allCached) return cache.cacheDatas;
        strWhere = `${this.tableName}.${this.primaryKey} in (:_ids)`;
        datas = await this.GetList({ strWhere, strParams: { _ids: ids }, strOrder, userId, isLoadDetailed, isGetValue, isAll, db });
        return this._mergeAndSort(datas, cache.cacheDatas, ids);
      }
      strWhere = `${this.tableName}.${this.primaryKey} in (:_ids)`;
      strParams = { ...(strParams || {}), _ids: ids };
    }

    const sql = this.JoinSql({ strWhere, strOrder, isAll });
    if (/\sin\s*\(\s*\)/.test(sql)) return datas;

    try {
      datas = await this._getSeq().query(sql, {
        type: sequelize.QueryTypes.SELECT,
        replacements: strParams || {},
        model: this.modelType.model,
        mapToModel: true,
        transaction: db,
      });
    } catch (err) {
      this.log.error({ err, sql: strWhere }, `${this.tableName}.GetList failed`);
    }

    this._mapRawResults(datas);
    await this._writeToCache(datas);
    await this.Load({ datas, isLoadDetailed, isGetValue, userId, db });
    return datas;
  }

  async Get({ strWhere, strParams, id, userId, isLoadDetailed = false, isGetValue = true, isAll = false, db = null }) {
    if (id != null) {
      const cache = await this._tryReadCache({ ids: [id], isLoadDetailed, isGetValue, userId, db });
      if (cache) {
        if (cache.noneFound) return null;
        if (cache.allCached) return cache.cacheDatas[0] || null;
      }
      return this.Get({
        strWhere: `${this.tableName}.${this.primaryKey} = :_id`,
        strParams: { _id: id },
        userId, isLoadDetailed, isGetValue, isAll, db,
      });
    }
    if (!strWhere) return null;

    let sql = this.JoinSql({ strWhere, isAll });
    sql += ' limit 0,1';

    let datas = [];
    try {
      datas = await this._getSeq().query(sql, {
        type: sequelize.QueryTypes.SELECT,
        replacements: strParams || {},
        model: this.modelType.model,
        mapToModel: true,
        transaction: db,
      });
    } catch (err) {
      this.log.error({ err }, `${this.tableName}.Get failed`);
    }

    this._mapRawResults(datas);
    await this._writeToCache(datas);
    await this.Load({ datas, isLoadDetailed, isGetValue, userId, db });
    return datas[0] || null;
  }

  /**
   * Count — 自动检测 WHERE 是否引用了 JOIN 表
   * 如果只引用主表列，则跳过 JOIN 直接 COUNT，性能提升 2~5 倍
   */
  async Count({ strWhere, strParams, userId, isAll = false, db = null }) {
    if (!db) {
      const ck = ['count', strWhere, strParams, isAll];
      const cached = this._getListCache(ck);
      if (cached !== undefined) return cached;
    }

    let sql;
    const needsJoin = this._whereNeedsJoin(strWhere);

    if (!needsJoin) {
      const del = isAll || !this.deleteKey ? '' : ` and (${this.tableName}.${this.deleteKey} = 0 or ${this.tableName}.${this.deleteKey} is null)`;
      let where = `${this.tableName}.${this.primaryKey} > 0${del}`;
      if (strWhere) where += ` and (${strWhere})`;
      sql = `select count(*) as count from ${this.dbName}${this.tableName} ${this.tableName} where ${where}`;
    } else {
      sql = this.JoinSql({ strWhere, isAll });
      const from = sql.lastIndexOf(`from ${this.dbName}${this.tableName} ${this.tableName}`);
      if (from <= 0) return 0;
      sql = `select count(*) as count ${sql.substring(from)}`;
      const orderBy = sql.lastIndexOf('order by');
      if (orderBy > 0) sql = sql.substring(0, orderBy);
    }

    let count = 0;
    try {
      const rows = await this._getSeq().query(sql, {
        type: sequelize.QueryTypes.SELECT,
        replacements: strParams || {},
        transaction: db,
      });
      count = rows && rows[0] && rows[0].count ? rows[0].count : 0;
    } catch (err) {
      this.log.error({ err }, `${this.tableName}.Count failed`);
      return 0;
    }

    if (!db) {
      this._setListCache(['count', strWhere, strParams, isAll], count);
    }
    return count;
  }

  _whereNeedsJoin(strWhere) {
    if (!strWhere) return false;
    const refs = strWhere.match(/(\w+)\.\w+/g);
    if (!refs) return false;
    const mainTable = this.tableName;
    return refs.some(ref => ref.split('.')[0] !== mainTable);
  }

  async GetListForPageIndex({ strWhere, strParams, strOrder, pageIndex = 0, onePageCount, userId, isLoadDetailed = false, isGetValue = true, isAll = false, db = null }) {
    onePageCount = onePageCount || this.myConfig.dbConfig.onePageCount;
    pageIndex = Math.max(0, pageIndex);

    if (!db) {
      const ck = ['list', strWhere, strParams, strOrder, pageIndex, onePageCount, isLoadDetailed, userId];
      const cached = this._getListCache(ck);
      if (cached) return cached;
    }

    let sql = this.JoinSql({ strWhere, strOrder, isAll });
    sql = this.GetListForPageSql({ sql, pageIndex, onePageCount });

    let datas = [];
    try {
      datas = await this._getSeq().query(sql, {
        type: sequelize.QueryTypes.SELECT,
        replacements: strParams || {},
        model: this.modelType.model,
        mapToModel: true,
        transaction: db,
      });
    } catch (err) {
      this.log.error({ err, strWhere }, `${this.tableName}.GetListForPageIndex failed`);
    }

    this._mapRawResults(datas);
    await this._writeToCache(datas);
    await this.Load({ datas, isLoadDetailed, isGetValue, userId, db });

    if (!db) {
      this._setListCache(['list', strWhere, strParams, strOrder, pageIndex, onePageCount, isLoadDetailed, userId], datas);
    }
    return datas;
  }

  // ─── 写操作 ────────────────────────────────────────────────────
  GetModelID({ model }) { return model[this.primaryKey]; }
  SetModelID({ model, id }) { model[this.primaryKey] = id; }
  IDIsEmpty(id) { return !id; }
  GetEmptyID() { return this.emptyPrimaryValue; }

  AddOrUpdate_GetIDZeroSql({ model }) { return ''; }
  AddOrUpdate_GetExistSql({ model }) {
    return { sql: `${this.tableName}.${this.primaryKey} = :_existId`, params: { _existId: this.GetModelID({ model }) } };
  }

  AddOrUpdate_SetUpdateCode({ model, userId }) {
    if (this.updateDate) model[this.updateDate] = new Date();
    if (this.updateUserId) model[this.updateUserId] = userId;
  }

  async AddOrUpdate_SetCreateCode({ model, userId, db }) {
    if (this.createDate) model[this.createDate] = new Date();
    if (this.createUserId) model[this.createUserId] = userId;
    if (this.sortIndex && !model[this.sortIndex]) {
      let sql = `SELECT max(${this.sortIndex}) as Max from ${this.dbName}${this.tableName}`;
      if (this.deleteKey) sql += ` where ${this.deleteKey} = 0`;
      const data = await this.RunOneValueSql({ sql, valueName: 'Max', nullValue: 0, db });
      model[this.sortIndex] = data + 1;
    }
  }

  async checkAddOrUpdate({ model, userId, db }) {
    return R({ Succeed: true });
  }

  /**
   * AddOrUpdate — 优化：新增记录（ID 为空且无自定义存在检查）时跳过 SELECT，直接 INSERT
   * 减少一次数据库往返，避免并发 INSERT 的竞态窗口
   */
  async AddOrUpdate({ model, isSaveDetailed = false, userId, db = null, isNotCheckModel = false, isTotalCalc = false }) {
    try {
      if (!model) return this.GetEmptyID();
      model = this.modelType.CopyData(model);

      let existRow = null;

      if (!isNotCheckModel) {
        const id = this.GetModelID({ model });
        const isEmpty = this.IDIsEmpty(id);

        if (isEmpty) {
          const zeroSql = this.AddOrUpdate_GetIDZeroSql({ model });
          if (zeroSql) {
            existRow = await this.Get({ strWhere: zeroSql, isGetValue: false, db });
          }
          // else: 新增 + autoIncrement → 无需 SELECT，直接 INSERT
        } else {
          const exist = this.AddOrUpdate_GetExistSql({ model });
          let strWhere, strParams;
          if (typeof exist === 'object' && exist.sql) { strWhere = exist.sql; strParams = exist.params; }
          else strWhere = exist;
          existRow = strWhere ? await this.Get({ strWhere, strParams, isGetValue: false, db }) : null;
        }
      }

      if (!existRow) {
        await this.AddOrUpdate_SetCreateCode({ model, userId, db });
        this.AddOrUpdate_SetUpdateCode({ model, userId });
        const newModel = this.modelType.CopyData(model);
        const created = await this.modelType.model.create(newModel, { transaction: db });
        model = created;
      } else {
        model = { ...existRow, ...model };
        if (this.IDIsEmpty(this.GetModelID({ model }))) {
          this.SetModelID({ model, id: this.GetModelID({ model: existRow }) });
        }
        this.AddOrUpdate_SetUpdateCode({ model, userId });
        const toSave = this.modelType.CopyData(model);
        await this.modelType.model.update(toSave, {
          where: { [this.primaryKey]: this.GetModelID({ model: toSave }) },
          transaction: db,
        });
        model = toSave;
      }

      const id = this.GetModelID({ model });
      if (id) { await this._deleteFromCache([id]); this._bumpTableGen(); }
      if (id && isTotalCalc) await this.TotalData({ addOrUpdataModel: model, db });
      return id;
    } catch (err) {
      this.log.error({ err }, `${this.tableName}.AddOrUpdate failed`);
      return this.GetEmptyID();
    }
  }

  async TotalData({ addOrUpdataModel, deleteIds, db }) { return R({ Succeed: true }); }

  async AddOrUpdateList({ models, userId, db = null, isNotCheckModel = false }) {
    if (!models || !models.length) return R({ Succeed: true, Message: '无数据' });
    models = this.modelType.CopyDatas(models);

    let ownTx = false;
    if (!db) { db = await this._getSeq().transaction(); ownTx = true; }

    const ids = [];
    try {
      for (const m of models) {
        const id = await this.AddOrUpdate({ model: m, userId, db, isNotCheckModel });
        this.SetModelID({ model: m, id });
        if (this.IDIsEmpty(id)) {
          if (ownTx) await db.rollback();
          return R({ Succeed: false, Message: '数据保存失败' });
        }
        ids.push(id);
      }
      if (ownTx) await db.commit();
      return R({ Succeed: true, Data: ids });
    } catch (err) {
      if (ownTx) await db.rollback();
      return R({ Succeed: false, Message: err.message });
    }
  }

  // ─── 删除 ─────────────────────────────────────────────────────
  async DeleteFront({ dataIds, userId, db }) {
    if (this.deleteKey && dataIds && dataIds.length) {
      const sets = [];
      const params = { _delFrontIds: dataIds };
      if (this.deleteDate) {
        sets.push(`${this.deleteDate} = :_delDate`);
        params._delDate = nowStr();
      }
      if (this.deleteUserId && userId) {
        sets.push(`${this.deleteUserId} = :_delUserId`);
        params._delUserId = userId;
      }
      if (sets.length) {
        const sql = `update ${this.tableName} set ${sets.join(',')} where ${this.primaryKey} in (:_delFrontIds)`;
        await this._getSeq().query(sql, { type: sequelize.QueryTypes.UPDATE, replacements: params, transaction: db });
      }
    }
    return R({ Succeed: true });
  }

  async DeleteFinish({ dataIds, userId, db }) { return R({ Succeed: true }); }

  async Delete({ strWhere, id, ids, strParams, forceExecute = false, userId, db = null }) {
    let ownTx = false;
    let isCommit = false;
    if (!db) { db = await this._getSeq().transaction(); ownTx = true; }

    try {
      if (forceExecute) {
        const sql = this.deleteKey
          ? `update ${this.tableName} set ${this.deleteKey} = 1 where ${strWhere}`
          : `delete from ${this.dbName}${this.tableName} where ${strWhere}`;
        await this._getSeq().query(sql, {
          type: this.deleteKey ? sequelize.QueryTypes.UPDATE : sequelize.QueryTypes.DELETE,
          replacements: strParams || {},
          transaction: db,
        });
        this._bumpTableGen();
        isCommit = true;
        return R({ Succeed: true, Message: '删除成功' });
      }

      if (id) ids = [id];
      if (!ids) {
        if (!strWhere) return R({ Succeed: false, Message: '不能删除所有数据' });
        const datas = await this.GetList({ strWhere, strParams, isGetValue: false, userId, db });
        ids = datas.map(e => e[this.primaryKey]);
      }
      if (!ids.length) return R({ Succeed: true, Message: '满足条件的数据个数为0' });

      let result = await this.DeleteFront({ dataIds: ids, userId, db });
      if (!result.Succeed) return result;

      let deleteCount = 0;
      if (this.deleteKey) {
        const sql = `update ${this.tableName} set ${this.deleteKey} = 1 where ${this.primaryKey} in (:_delIds)`;
        const rtn = await this._getSeq().query(sql, { type: sequelize.QueryTypes.UPDATE, replacements: { _delIds: ids }, transaction: db });
        deleteCount = rtn[1];
      } else {
        deleteCount = await this.modelType.model.destroy({ where: { [this.primaryKey]: ids }, transaction: db });
      }

      await this._deleteFromCache(ids);
      this._bumpTableGen();
      result = await this.DeleteFinish({ dataIds: ids, userId, db });
      if (!result.Succeed) return result;

      isCommit = deleteCount === ids.length;
      return R({ Succeed: isCommit, Message: isCommit ? '删除成功' : '删除失败' });
    } catch (err) {
      return R({ Succeed: false, Message: err.message });
    } finally {
      if (ownTx) { isCommit ? await db.commit() : await db.rollback(); }
    }
  }

  // ─── 工具方法 ──────────────────────────────────────────────────
  async swap({ models, userId, db }) {
    const sortIndexes = models.map(e => e[this.sortIndex]).sort((a, b) => a - b);
    for (let i = 0; i < models.length; i++) models[i][this.sortIndex] = sortIndexes[i];
    const result = await this.AddOrUpdateList({ models, userId, db });
    return R({ Succeed: result.Succeed, Message: result.Succeed ? '交换成功' : '交换失败' });
  }

  async Transaction(call) {
    const db = await this._getSeq().transaction();
    let rolled = false;
    try {
      const rtn = await call(db);
      if (rtn.Succeed) await db.commit(); else { rolled = true; await db.rollback(); }
      return rtn;
    } catch (err) {
      if (!rolled) await db.rollback();
      return R({ Succeed: false, Message: err.toString() });
    }
  }

  async RunSql({ sql, strParams, db, type = sequelize.QueryTypes.SELECT }) {
    if (!sql) return R({ Succeed: false, Message: 'sql不能为空' });
    try {
      const data = await this._getSeq().query(sql, { type, replacements: strParams || {}, transaction: db });
      return R({ Succeed: true, Data: data });
    } catch (err) {
      this.log.error({ err, sql }, 'RunSql failed');
      return R({ Succeed: false, Message: err.message });
    }
  }

  async RunOneValueSql({ sql, valueName, nullValue, defalutValue = null, db }) {
    const data = await this.RunSql({ sql, db });
    if (data && data.Succeed && data.Data.length > 0 && valueName in data.Data[0]) {
      return data.Data[0][valueName] || nullValue;
    }
    return defalutValue;
  }

  async getFields({ id, names, db }) {
    const model = await this.Get({ id, db });
    if (!model) return R({ Succeed: false, Message: '获取数据失败' });
    const values = { id: model.id };
    for (const n of names) {
      if (Object.prototype.hasOwnProperty.call(model, n)) values[n] = model[n];
    }
    return R({ Succeed: true, Data: values });
  }

  async setFields({ id, values, userId, db }) {
    const model = await this.Get({ id, isGetValue: false, db });
    if (!model) return R({ Succeed: false, Message: '获取数据失败' });
    Object.assign(model, values);
    model.id = await this.AddOrUpdate({ model, userId, db });
    if (!model.id) return R({ Succeed: false, Message: '数据存储失败' });
    return R({ Succeed: true, Message: '设置成功' });
  }

  async setValues({ datas, dataIdName, dataValueName, idName, valueName, strWhere, setValueNameFun, userId, db, isGetValue = false }) {
    const ids = datas.map(e => e[dataIdName]).filter(Boolean);
    if (!ids.length) return;
    const models = strWhere
      ? await this.GetList({ strWhere: `${strWhere} in (:_svIds)`, strParams: { _svIds: ids }, userId, isGetValue: false, db })
      : await this.GetList({ ids, userId, isGetValue, db });
    for (const item of datas) {
      const model = models.find(e => e[idName] == item[dataIdName]);
      if (!model) continue;
      if (setValueNameFun) { setValueNameFun({ model, data: item }); continue; }
      const names = dataValueName.split(',').map(e => e.trim());
      const vals = valueName.split(',').map(e => e.trim());
      for (let j = 0; j < names.length; j++) item[names[j]] = model[vals[j]];
    }
  }

  async getSelect2({ selectID, strWhere, strParams, tableName, primaryKey, titleName, titleName2, pageIndex, onePageCount = 30, isAddZero = true, mustIncludeSelectItem = true, ZeroTitle = '不选择', userId, db, isGetValue = false }) {
    const datas = await this.GetListForPageIndex({ strWhere, strParams, isGetValue, pageIndex, onePageCount, userId, db });
    const dataTotal = await this.Count({ strWhere, strParams, userId, db });

    if (pageIndex <= 0 && selectID) {
      const key = selectID;
      const existing = datas.find(e => e[primaryKey] == key);
      const filtered = datas.filter(e => e[primaryKey] != key);
      let selected = existing;
      if (!selected && mustIncludeSelectItem) {
        selected = await this.Get({ strWhere: `${tableName}.${primaryKey} = :_sk`, strParams: { _sk: key }, isGetValue: false });
      }
      if (selected) filtered.unshift(selected);
      datas.length = 0;
      datas.push(...filtered);
    }

    const result = {
      dataTotal,
      items: datas.map(e => ({
        id: e[primaryKey],
        text: e[titleName] + (titleName2 && e[titleName2] ? ` (${e[titleName2]})` : ''),
      })),
    };
    if (pageIndex === 0 && isAddZero) result.items.unshift({ id: 0, text: ZeroTitle });
    return result;
  }

  async tableArrayAddDelete({ factory, dataKeyId, dataKeyName, dataIds, dataName, deleteSqlFun, modelFun, deleteForceExecute, db }) {
    const existModels = await factory.GetList({ strWhere: `${factory.tableName}.${dataKeyName} = :_arrKey`, strParams: { _arrKey: dataKeyId }, db });
    const deletes = existModels.filter(e => !dataIds.includes(e[dataName]));
    if (deletes.length) {
      const deleteIds = deletes.map(e => e[factory.primaryKey]);
      let deleteSql, deleteParams;
      if (deleteSqlFun) {
        deleteSql = deleteSqlFun(deletes);
        deleteParams = {};
      } else {
        deleteSql = `${factory.tableName}.${factory.primaryKey} in (:_arrDelIds)`;
        deleteParams = { _arrDelIds: deleteIds };
      }
      const result = await factory.Delete({ strWhere: deleteSql, strParams: deleteParams, forceExecute: deleteForceExecute, db });
      if (!result.Succeed) return R({ Succeed: false, Message: `${factory.tableTitle}保存失败` });
    }
    const adds = dataIds.filter(e => !existModels.some(r => r[dataName] === e)).map(e => modelFun(e));
    if (adds.length) {
      const result = await factory.AddOrUpdateList({ models: adds, db, isNotCheckModel: true });
      if (!result.Succeed) return R({ Succeed: false, Message: `${factory.tableTitle}保存失败` });
    }
    return R({ Succeed: true });
  }

  /**
   * tableMaxKey — 使用 FOR UPDATE 行级锁防止并发生成相同流水号
   * 必须在事务内调用（传入 db 参数）
   */
  async tableMaxKey({ tableName, noFieldName, noDataPrefix, noStringLength, addOne = 1, strWhere, db }) {
    const w = strWhere
      ? `${strWhere} and ${noFieldName} like :_noPrefix`
      : `${noFieldName} like :_noPrefix`;
    const sql = `select substring(${noFieldName}, ${noDataPrefix.length + 1}, ${noStringLength})+0 as no `
      + `from ${this.dbName}${tableName} where ${w} order by no desc limit 1 for update`;
    let data = await this._getSeq().query(sql, {
      type: sequelize.QueryTypes.SELECT,
      replacements: { _noPrefix: `%${noDataPrefix}%` },
      transaction: db,
    });
    let num = (!data.length) ? 0 : (parseInt(data[0].no) || 0);
    if (addOne) num += addOne;
    return `${noDataPrefix}${String(num).padStart(noStringLength, '0')}`;
  }

  getOrderString(sortObj) {
    if (!sortObj || !Array.isArray(sortObj)) return '';
    const validOrder = /^(asc|desc)$/i;
    const validField = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;
    return sortObj
      .filter(e => validField.test(e.field) && validOrder.test(e.order))
      .map(e => `${e.field} ${e.order}`)
      .join(',');
  }

  GetSearchSQL({ searchModel, userId, db }) { return { sql: '', params: {} }; }

  get log() {
    if (!this._log) {
      if (!_parentLog) _parentLog = require('pino')({ name: 'dal' });
      this._log = _parentLog.child({ table: this.tableName });
    }
    return this._log;
  }
}

Object.assign(Dal.prototype, CacheMixin);

module.exports = { Dal };
