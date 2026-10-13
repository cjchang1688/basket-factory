module.exports = {
  apps: [
    {
      name: "basket-factory",
      script: "node_modules/.bin/next",
      args: "start --port 3001",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
      },
      env_development: {
        NODE_ENV: "development",
        PORT: "3001",
      },
    },
  ],
};
