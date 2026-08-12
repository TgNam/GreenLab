const PROXY_CONFIG = [
  {
    context: [
      "/api-admin"
    ],
    target: "https://dev.greenlab.vn/api-admin",
    secure: false,
    changeOrigin: true,
    logLevel: "debug"
  }
];

module.exports = PROXY_CONFIG;
