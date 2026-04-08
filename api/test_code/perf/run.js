'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { execFileSync } = require('child_process');
const jwt = require('jsonwebtoken');

const rootDir = path.resolve(__dirname, '..', '..');
const scenariosPath = path.join(__dirname, 'scenarios.json');
const standardsPath = path.join(__dirname, 'standards.json');

function parseArgs(argv) {
  const args = {
    scenario: '',
    scenarioFile: process.env.PERF_SCENARIO_FILE || scenariosPath,
    reportOnly: false,
    output: process.env.PERF_OUTPUT || '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--scenario' && argv[i + 1]) {
      args.scenario = argv[i + 1];
      i += 1;
    } else if (arg === '--scenario-file' && argv[i + 1]) {
      args.scenarioFile = path.resolve(rootDir, argv[i + 1]);
      i += 1;
    } else if (arg === '--output' && argv[i + 1]) {
      args.output = path.resolve(rootDir, argv[i + 1]);
      i += 1;
    } else if (arg === '--report-only') {
      args.reportOnly = true;
    }
  }

  return args;
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function max(values) {
  return values.length ? Math.max(...values) : 0;
}

function percentile(sortedValues, p) {
  if (!sortedValues.length) return 0;
  const index = Math.min(sortedValues.length - 1, Math.ceil((p / 100) * sortedValues.length) - 1);
  return sortedValues[index];
}

function buildAuthorizationHeader(auth) {
  if (!auth) return '';
  if (auth.type === 'bearer' && auth.token) return `Bearer ${auth.token}`;
  if (auth.type === 'jwt') {
    const secret = process.env.PERF_JWT_SECRET || auth.secret;
    if (!secret) throw new Error('JWT auth requires a secret or PERF_JWT_SECRET');
    const payload = auth.payload || {};
    return `Bearer ${jwt.sign(payload, secret, { expiresIn: auth.expiresIn || '1h' })}`;
  }
  return '';
}

function sampleProcess(pid) {
  if (!pid) return null;
  try {
    const output = execFileSync('ps', ['-p', String(pid), '-o', '%cpu=,%mem=,rss='], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!output) return null;
    const [cpuPct, memPct, rssKb] = output.split(/\s+/).map(Number);
    if ([cpuPct, memPct, rssKb].some(Number.isNaN)) return null;
    return { cpuPct, memPct, rssKb };
  } catch {
    return null;
  }
}

function compareLevel(metrics, requirements) {
  const checks = [];

  if (typeof requirements.p95MsMax === 'number') {
    checks.push({ metric: 'P95', passed: metrics.latencyMs.p95 <= requirements.p95MsMax, actual: metrics.latencyMs.p95, expected: `<= ${requirements.p95MsMax} ms` });
  }
  if (typeof requirements.p99MsMax === 'number') {
    checks.push({ metric: 'P99', passed: metrics.latencyMs.p99 <= requirements.p99MsMax, actual: metrics.latencyMs.p99, expected: `<= ${requirements.p99MsMax} ms` });
  }
  if (typeof requirements.qpsMin === 'number') {
    checks.push({ metric: 'QPS', passed: metrics.qps >= requirements.qpsMin, actual: metrics.qps, expected: `>= ${requirements.qpsMin}` });
  }
  if (typeof requirements.errorRateMax === 'number') {
    checks.push({ metric: 'ErrorRate', passed: metrics.errorRate <= requirements.errorRateMax, actual: metrics.errorRate, expected: `<= ${requirements.errorRateMax}` });
  }

  return {
    passed: checks.every((item) => item.passed),
    checks,
  };
}

function compareToStandards(metrics, standards, profileName) {
  if (!profileName) {
    return { profile: '', verdict: 'no-profile', levels: [] };
  }

  const profile = standards.profiles[profileName];
  if (!profile) {
    return { profile: profileName, verdict: 'unknown-profile', levels: [] };
  }

  const levels = profile.levels.map((level) => ({
    name: level.name,
    ...compareLevel(metrics, level.requirements),
  }));

  const matched = levels.find((level) => level.passed);
  return {
    profile: profileName,
    description: profile.description,
    verdict: matched ? matched.name : 'below-acceptable',
    levels,
  };
}

function humanizeComparison(comparison) {
  if (comparison.verdict === 'no-profile') return 'no profile';
  if (comparison.verdict === 'unknown-profile') return `unknown profile: ${comparison.profile}`;
  return comparison.verdict;
}

function formatStatusCounts(statusCounts) {
  const entries = Object.entries(statusCounts);
  if (!entries.length) return 'none';
  return entries.map(([code, count]) => `${code}:${count}`).join(', ');
}

async function runScenario(scenario, defaults, standards, shared) {
  const baseUrl = process.env.PERF_BASE_URL || scenario.baseUrl || defaults.baseUrl;
  const durationMs = Number(process.env.PERF_DURATION_MS || scenario.durationMs || defaults.durationMs || 15000);
  const concurrency = Number(process.env.PERF_CONCURRENCY || scenario.concurrency || defaults.concurrency || 50);
  const timeoutMs = Number(process.env.PERF_TIMEOUT_MS || scenario.timeoutMs || defaults.timeoutMs || 30000);
  const randomizeForwardedFor = String(process.env.PERF_RANDOMIZE_IP || scenario.randomizeForwardedFor || defaults.randomizeForwardedFor) !== 'false';
  const pid = process.env.TARGET_PID || '';
  const method = (scenario.method || 'GET').toUpperCase();
  const target = new URL(scenario.path, baseUrl);
  const authorization = buildAuthorizationHeader(scenario.auth);
  const latencies = [];
  const processSamples = [];
  const statusCounts = new Map();
  let errors = 0;
  let completed = 0;
  let sequence = 1;
  const transport = target.protocol === 'https:' ? https : http;
  const agent = shared.agents[target.protocol] || new (target.protocol === 'https:' ? https.Agent : http.Agent)({
    keepAlive: true,
    maxSockets: concurrency,
  });
  shared.agents[target.protocol] = agent;

  function takeSample() {
    const sample = sampleProcess(pid);
    if (sample) processSamples.push(sample);
  }

  function singleRequest() {
    return new Promise((resolve) => {
      const startedAt = process.hrtime.bigint();
      const headers = Object.assign({}, scenario.headers || {});
      if (authorization) headers.Authorization = authorization;
      if (randomizeForwardedFor) {
        headers['X-Forwarded-For'] = `10.${Math.floor(sequence / 60000) % 250}.${Math.floor(sequence / 250) % 250}.${sequence % 250 || 1}`;
      }
      const body = scenario.body ? JSON.stringify(scenario.body) : '';
      if (body) headers['Content-Type'] = 'application/json';
      if (body) headers['Content-Length'] = Buffer.byteLength(body);
      sequence += 1;

      const req = transport.request({
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port,
        path: `${target.pathname}${target.search}`,
        method,
        headers,
        agent,
        timeout: timeoutMs,
      }, (res) => {
        res.on('data', () => {});
        res.on('end', () => {
          const latencyMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
          latencies.push(latencyMs);
          statusCounts.set(res.statusCode, (statusCounts.get(res.statusCode) || 0) + 1);
          completed += 1;
          resolve();
        });
      });

      req.on('timeout', () => {
        req.destroy(new Error('request timeout'));
      });

      req.on('error', () => {
        const latencyMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        latencies.push(latencyMs);
        errors += 1;
        completed += 1;
        resolve();
      });

      if (body) req.write(body);
      req.end();
    });
  }

  async function worker(endAt) {
    while (Date.now() < endAt) {
      await singleRequest();
    }
  }

  const startedAt = Date.now();
  const endAt = startedAt + durationMs;
  takeSample();
  const sampler = setInterval(takeSample, 1000);
  await Promise.all(Array.from({ length: concurrency }, () => worker(endAt)));
  clearInterval(sampler);
  takeSample();

  latencies.sort((a, b) => a - b);
  const elapsedMs = Date.now() - startedAt;
  const errorRate = completed ? errors / completed : 0;
  const metrics = {
    scenario: scenario.name,
    description: scenario.description || '',
    method,
    url: target.toString(),
    durationMs: elapsedMs,
    concurrency,
    requests: completed,
    qps: Number((completed / (elapsedMs / 1000)).toFixed(2)),
    tps: Number((completed / (elapsedMs / 1000)).toFixed(2)),
    errors,
    errorRate: Number(errorRate.toFixed(6)),
    statusCounts: Object.fromEntries([...statusCounts.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))),
    latencyMs: {
      avg: Number(average(latencies).toFixed(2)),
      p50: Number(percentile(latencies, 50).toFixed(2)),
      p95: Number(percentile(latencies, 95).toFixed(2)),
      p99: Number(percentile(latencies, 99).toFixed(2)),
      max: Number(percentile(latencies, 100).toFixed(2)),
    },
    process: {
      cpuPctAvg: Number(average(processSamples.map((item) => item.cpuPct)).toFixed(2)),
      cpuPctMax: Number(max(processSamples.map((item) => item.cpuPct)).toFixed(2)),
      memPctAvg: Number(average(processSamples.map((item) => item.memPct)).toFixed(2)),
      memPctMax: Number(max(processSamples.map((item) => item.memPct)).toFixed(2)),
      rssKbAvg: Math.round(average(processSamples.map((item) => item.rssKb))),
      rssKbMax: Math.round(max(processSamples.map((item) => item.rssKb))),
      sampleCount: processSamples.length,
    },
  };

  metrics.comparison = compareToStandards(metrics, standards, scenario.standardProfile);
  return metrics;
}

function printReport(results) {
  console.log('');
  console.log('Performance Report');
  console.log('==================');

  for (const result of results) {
    console.log('');
    console.log(`[${result.scenario}] ${result.description}`);
    console.log(`URL: ${result.url}`);
    console.log(`Concurrency: ${result.concurrency}, Duration: ${result.durationMs} ms`);
    console.log(`Requests: ${result.requests}, QPS: ${result.qps}, Errors: ${result.errors}, Status: ${formatStatusCounts(result.statusCounts)}`);
    console.log(`Latency(ms): avg=${result.latencyMs.avg}, p50=${result.latencyMs.p50}, p95=${result.latencyMs.p95}, p99=${result.latencyMs.p99}, max=${result.latencyMs.max}`);
    console.log(`Process: cpuAvg=${result.process.cpuPctAvg}% cpuMax=${result.process.cpuPctMax}% rssAvg=${result.process.rssKbAvg}KB rssMax=${result.process.rssKbMax}KB`);
    console.log(`Standard: ${humanizeComparison(result.comparison)} (${result.comparison.profile || 'n/a'})`);

    for (const level of result.comparison.levels || []) {
      const checks = level.checks.map((item) => `${item.metric}:${item.passed ? 'pass' : 'fail'} (${item.actual} vs ${item.expected})`);
      console.log(`  - ${level.name}: ${level.passed ? 'pass' : 'fail'} | ${checks.join(', ')}`);
    }
  }
}

function saveOutput(filePath, payload) {
  if (!filePath) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const scenarioConfig = loadJson(args.scenarioFile);
  const standards = loadJson(standardsPath);
  const scenarios = (scenarioConfig.scenarios || []).filter((item) => !args.scenario || item.name === args.scenario);

  if (!scenarios.length) {
    throw new Error(args.scenario ? `Scenario not found: ${args.scenario}` : 'No scenarios configured');
  }

  const shared = { agents: {} };
  const results = [];
  for (const scenario of scenarios) {
    const result = await runScenario(scenario, scenarioConfig.defaults || {}, standards, shared);
    results.push(result);
  }

  printReport(results);
  saveOutput(args.output, {
    generatedAt: new Date().toISOString(),
    scenarioFile: args.scenarioFile,
    results,
  });

  if (args.reportOnly) {
    console.log('');
    console.log('Report only mode completed.');
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
