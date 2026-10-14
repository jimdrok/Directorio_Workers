import { spawn } from 'node:child_process';
const children = [
  spawn('python3', ['server.py'], { stdio: 'inherit' }),
  spawn('npm', ['run', 'dev:frontend'], { stdio: 'inherit' }),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => child.kill('SIGTERM'));
  process.exitCode = code;
}
children.forEach((child) => {
  child.on('error', (error) => {
    console.error(error);
    stop(1);
  });
  child.on('exit', (code) => stop(code ?? 1));
});
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
