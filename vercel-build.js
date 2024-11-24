import { spawn } from 'child_process';

// Increase memory limit
process.env.NODE_OPTIONS = '--max-old-space-size=3072';

// Run astro build
const build = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ASTRO_TELEMETRY_DISABLED: '1',
    VERCEL_ENV: process.env.VERCEL_ENV || 'development'
  }
});

build.on('error', (err) => {
  console.error('Build error:', err);
  process.exit(1);
});

build.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Build process exited with code ${code}`);
    process.exit(code || 1);
  }
  console.log('Build completed successfully');
  process.exit(0);
});

// Handle process termination
process.on('SIGTERM', () => {
  build.kill();
  process.exit(0);
});