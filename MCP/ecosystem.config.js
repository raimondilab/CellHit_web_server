module.exports = {
  apps: [{
    name: 'cellhit-mcp',
    script: 'cellhit_mcp.py',
    interpreter: '/data/SW/Anaconda3-2025.06-1/envs/cellhit-mcp/bin/python',
    cwd: '/var/www/html/CLRP/MCP',
    exec_mode: 'fork',
    env: {
      COEX_GRAPHQL_URL: 'http://127.0.0.1:8012/graphql'
    },
    autorestart: true,
    max_restarts: 10
  }]
};