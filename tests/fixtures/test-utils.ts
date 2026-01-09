/**
 * Shared test utilities for FLAKES debugging demo
 */
import * as os from 'os';

/**
 * Minimal environment logging - call once per test suite
 */
export function logEnv() {
  const ci = process.env.CI ? 'CI' : 'local';
  const mem = Math.round(os.freemem() / 1024 / 1024 / 1024);
  console.log(`\n🖥️ ${process.platform} | ${ci} | ${os.cpus().length} cores | ${mem}GB free\n`);
}

/**
 * Log a specific problem pattern being demonstrated
 */
export function logProblem(pattern: string) {
  console.log(`❌ ${pattern}`);
}

/**
 * Log a correct pattern being demonstrated
 */
export function logCorrect(pattern: string) {
  console.log(`✅ ${pattern}`);
}

/**
 * Log timing information
 */
export function logTiming(label: string, ms: number, threshold?: number) {
  const status = threshold && ms > threshold ? '❌' : '⏱️';
  console.log(`${status} ${label}: ${ms}ms${threshold ? ` (threshold: ${threshold}ms)` : ''}`);
}
