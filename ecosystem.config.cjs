module.exports = {
  apps: [
    {
      name: "dalcoomi-frontend",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        APP_ENV: "local",
      },
      env_dev: {
        NODE_ENV: "production",
        APP_ENV: "dev",
      },
      env_prod: {
        NODE_ENV: "production",
        APP_ENV: "prod",
      },
    },
  ],
};
