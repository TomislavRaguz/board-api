const PORT = 8080
module.exports = {
  apps : [{
    name: 'API',
    script: './dist/api.js',
    exec_mode : "cluster",
    instances: 0,
    waitReady: true,
    env_production: {
      NODE_ENV: "production"
    },
    env_development: {
      NODE_ENV: "development"
    }
  }]
};
