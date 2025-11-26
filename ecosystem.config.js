module.exports = {
  apps: [
    {
      name: "dalcoomi-frontend",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        APP_ENV: process.env.APP_ENV || "local",
      },
    },
  ],
};
