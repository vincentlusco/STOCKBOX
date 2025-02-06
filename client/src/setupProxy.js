const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:2008',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api', // Don't rewrite /api paths
      },
      onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).json({ error: 'Proxy Error' });
      },
      logLevel: 'debug'
    })
  );
}; 