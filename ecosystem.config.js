module.exports = {
  apps : [{
    name: 'cell_api',
    script: 'uvicorn',
    args: 'api:app --host 0.0.0.0 --port 8003',
    interpreter: 'python3',
    exec_mode: 'fork',
    env: {
      CONDA_PREFIX: '/data/SW/Anaconda3-2025.06-1/envs/cellhit/',
      PYTHONHASHSEED: '0'
    }
  }]
};
