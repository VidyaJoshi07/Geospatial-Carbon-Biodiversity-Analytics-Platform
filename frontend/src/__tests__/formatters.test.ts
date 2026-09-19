import { formatNumber, formatHectares, formatCarbon, formatDate } from '../utils/formatters';

// Simple lightweight assertion runner
function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

console.log('Running formatters tests...');

assert(formatNumber(1234.56, 1) === '1,234.6', 'formatNumber single decimal');
assert(formatNumber(0) === '0', 'formatNumber zero');
assert(formatHectares(500.25) === '500.25 ha', 'formatHectares string');
assert(formatCarbon(1250) === '1,250.0 tCO₂e', 'formatCarbon string');
assert(formatDate('2026-09-19') !== '', 'formatDate valid date');

console.log('✓ All formatters tests passed successfully!');
