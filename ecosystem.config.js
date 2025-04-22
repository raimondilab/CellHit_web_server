module.exports = {
  apps : [{
    name: 'cell_api',
    script: 'uvicorn',
    args: 'api:app --host 0.0.0.0 --port 8003',
    interpreter: 'python3',
    exec_mode: 'fork',
    env: {
      CONDA_PREFIX: '/data/SW/anaconda3/envs/CLRP/',
      PYTHONHASHSEED: '0'
    }
  }]
};
