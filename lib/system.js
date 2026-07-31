// lib/system.js — Real system status for the running backend process.
//
// These are genuine Node.js process/OS metrics (uptime, memory, load average)
// for the machine this backend is actually running on. This is intentionally
// scoped to "is my one backend process healthy" — not a fake multi-node
// cluster dashboard, since there is no multi-node infrastructure to report on.

const os = require('os');

const startedAt = Date.now();

function getStatus(req, res) {
  const mem = process.memoryUsage();

  res.json({
    fetchedAt: new Date().toISOString(),
    process: {
      uptimeSeconds: Math.round(process.uptime()),
      startedAt: new Date(startedAt).toISOString(),
      nodeVersion: process.version,
      pid: process.pid,
      memoryUsedMb: Math.round(mem.rss / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024)
    },
    host: {
      platform: os.platform(),
      arch: os.arch(),
      cpuCount: os.cpus().length,
      loadAverage1m: os.loadavg()[0],
      totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
      freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
      hostUptimeSeconds: Math.round(os.uptime())
    },
    notConnected: [
      'Kafka / Airflow monitoring — no pipeline infrastructure deployed yet',
      'Database replication & query monitoring — no multi-node DB deployed yet',
      'Google Analytics 4 / Search Console — no property connected yet'
    ]
  });
}

module.exports = { getStatus };
