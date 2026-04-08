module.exports = {
  apps: [{
    name: 'api2',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    env: { NODE_ENV: 'production' },
    env_development: { NODE_ENV: 'development' },
  }],
};
