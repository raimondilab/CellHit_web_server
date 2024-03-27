module.exports = {
  apps : [{
    name: 'integrar2_api',
    script: 'uvicorn',
    args: 'api:app --host 0.0.0.0 --port 8002',
    interpreter: 'python3',
    exec_mode: 'fork'
  }]
};
