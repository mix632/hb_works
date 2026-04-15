'use strict';

const crypto = require('crypto');

/** SQL 字符串中单引号转义 */
function sqlEsc(s) {
  return String(s ?? '').replace(/'/g, "''");
}

function md5Hex(str) {
  return crypto.createHash('md5').update(String(str || ''), 'utf8').digest('hex');
}

/**
 * 若依 PUT 常在 body 根上带表单字段；各 public 模块的 save 需要 params.model
 */
function ensureRuoyiModelBody(req) {
  const b = req.body;
  if (!b || typeof b !== 'object' || b.model !== undefined) return;
  req.body = { ...b, model: { ...b } };
}

/** 扁平部门列表 → 树（id / pid / label / children，与 test/public user.deptTree 一致） */
function buildDeptTreeFromFlat(flat) {
  const nodes = flat.map((d) => ({
    id: d.id,
    pid: d.pid,
    label: d.label,
    children: [],
  }));
  const byId = new Map(nodes.map((n) => [String(n.id), n]));
  const roots = [];
  for (const n of nodes) {
    const pid = n.pid;
    const isRoot = pid == null || pid === '' || String(pid) === '0';
    if (isRoot) {
      roots.push(n);
    } else {
      const p = byId.get(String(pid));
      if (p) p.children.push(n);
      else roots.push(n);
    }
  }
  return roots;
}

module.exports = { sqlEsc, md5Hex, ensureRuoyiModelBody, buildDeptTreeFromFlat };
