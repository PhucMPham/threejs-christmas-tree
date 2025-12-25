module.exports = {
  apps: [{
    name: 'threejs-app',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    node_args: '--experimental-modules',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '500M',
    watch: false,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 1000
  }]
};
