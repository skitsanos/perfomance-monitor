import ProcessMonitor from './process-monitor.ts';
import StatsCollector from './stas-collector.ts';

console.log('Performance Monitor');

const target = Bun.argv[2];
if (!target)
{
    console.log('Usage: bun performance-monitor <pid|name>');
    process.exit(1);
}

// console.log(`Monitoring ${target}...`);
//
// const monitor = new ProcessMonitor(isNaN(Number(target)) ? target : Number(target));
//
// setInterval(async () =>
// {
//     const stats = await monitor.getStats();
//     if (!stats)
//     {
//         console.log('Process exited');
//         process.exit(0);
//     }
//     console.log(`\x1B[1A\x1B[KCPU: ${stats.cpu.toFixed(1)}% | Memory: ${stats.memory.toFixed(2)}MB`);
// }, 1000);

// CLI Usage
const collector = new StatsCollector(target);
collector.start();

console.log('Monitoring started. Press Ctrl+C to stop...');
console.log('Initial Stats:');
collector.printStats(collector['initialStats']); // Access via reflection
