module.exports = {
  apps: [{
    name: "automation-factory",
    cwd: "/www/wwwroot/automation-factory/content-factory",
    script: ".next/standalone/server.js",
    env: { NODE_ENV: "production", PORT: 3000, HOSTNAME: "127.0.0.1" },
    instances: 1,
    autorestart: true,
    max_memory_restart: "512M",
    error_file: "/www/wwwlogs/automation-factory.error.log",
    out_file: "/www/wwwlogs/automation-factory.out.log",
    time: true,
  }],
};
