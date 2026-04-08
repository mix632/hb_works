# Performance Test Kit

This directory contains a lightweight performance test kit for this API service.

## Files

- `test/perf/run.js`: benchmark runner with latency, throughput, and process sampling
- `test/perf/scenarios.json`: benchmark scenarios
- `test/perf/standards.json`: comparison thresholds for `P95`, `P99`, `QPS`, and error rate

## What It Measures

For each scenario, the runner reports:

- `QPS` and `TPS`
- latency: `avg`, `P50`, `P95`, `P99`, `max`
- error count and HTTP status distribution
- process resource usage if `TARGET_PID` is provided:
  - CPU average and peak
  - memory average and peak
  - RSS average and peak

## Built-in Scenarios

### `health-db-check`

- endpoint: `/health`
- purpose: health endpoint baseline
- note: this endpoint currently performs `sequelize.authenticate()`, so it is not a pure lightweight health check

### `customer-list-read`

- endpoint: `/cdp/customer/getlist?pageIndex=0&onePageCount=10`
- purpose: authenticated business read benchmark
- auth: auto-generates a JWT based on the scenario config

## Quick Start

Start the API service first.

```bash
npm start
```

Run all configured scenarios:

```bash
npm run perf
```

Run a single scenario:

```bash
node test/perf/run.js --scenario customer-list-read
```

Save a JSON report:

```bash
node test/perf/run.js --output test/perf/results/latest.json
```

Measure process resources for a running process:

```bash
TARGET_PID=2299 npm run perf
```

Override base URL or pressure settings:

```bash
PERF_BASE_URL=http://127.0.0.1:9032 \
PERF_CONCURRENCY=100 \
PERF_DURATION_MS=20000 \
TARGET_PID=2299 \
npm run perf
```

## Environment Variables

- `PERF_BASE_URL`: target service base URL
- `PERF_CONCURRENCY`: concurrent workers for every scenario
- `PERF_DURATION_MS`: test duration in milliseconds
- `PERF_TIMEOUT_MS`: single request timeout in milliseconds
- `PERF_OUTPUT`: report output path
- `PERF_JWT_SECRET`: override JWT signing key for auth scenarios
- `PERF_RANDOMIZE_IP=false`: disable random `X-Forwarded-For`
- `TARGET_PID`: process id to sample via `ps`

## Standard Comparison

The runner compares each result against `test/perf/standards.json`.

Current profiles:

- `health`: for lightweight probe endpoints
- `read-light`: for common authenticated read APIs with modest DB work

Each profile has 2 levels:

- `good`
- `acceptable`

If a result does not meet the `acceptable` level, the verdict is `below-acceptable`.

## Recommended Interpretation

Use this rule of thumb when reading the output:

- `P50`: basic median speed
- `P95`: real user experience under normal load
- `P99`: tail latency and stability under stress
- `QPS/TPS`: carrying capacity
- `CPU` and `RSS`: request cost and resource efficiency

Architecturally, `P95` and `P99` should carry more weight than `P50`.

## Suggested Internal Targets

These are practical default targets for this project, not industry absolutes:

### Lightweight probe endpoint

- `P95 <= 30ms`
- `P99 <= 60ms`
- `QPS >= 1500`
- error rate `< 0.1%`

### Authenticated read API

- `P95 <= 40ms`
- `P99 <= 80ms`
- `QPS >= 2000`
- error rate `< 0.1%`

If your result falls into `acceptable` but not `good`, the service is usable but still has optimization headroom.

## Important Caveats

- The script is best for repeatable local or staging benchmarks, not strict laboratory testing.
- Results depend heavily on dataset size, cache hit rate, DB health, and whether PM2 cluster is enabled.
- The current `rate-limit` plugin is IP-based. The runner randomizes `X-Forwarded-For` by default to avoid local single-IP throttling during stress tests.
- If you test write APIs, do it against a safe database and update the scenario carefully.
