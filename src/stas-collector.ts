// process-monitor.ts
import {ProcessMonitor, type ProcessStats} from './process-monitor.ts'; // Assuming previous class

class StatsCollector
{
    private monitor: ProcessMonitor;
    private initialStats: ProcessStats | null = null;
    private peakStats: ProcessStats | null = null;
    private currentStats: ProcessStats | null = null;

    constructor(target: number | string)
    {
        this.monitor = new ProcessMonitor(isNaN(Number(target)) ? target : Number(target));
        this.initialStats = this.monitor.getStats();
        this.peakStats = {...this.initialStats} as ProcessStats;
    }

    start(intervalMs = 1000)
    {
        const timer = setInterval(() =>
        {
            this.currentStats = this.monitor.getStats();

            if (!this.currentStats)
            {
                clearInterval(timer);
                return;
            }

            // Update peak values
            if (this.currentStats.cpu > this.peakStats.cpu)
            {
                this.peakStats.cpu = this.currentStats.cpu;
            }
            if (this.currentStats.memory > this.peakStats.memory)
            {
                this.peakStats.memory = this.currentStats.memory;
            }
        }, intervalMs);

        // Handle shutdown signals
        const handleShutdown = () =>
        {
            clearInterval(timer);
            this.printFinalReport();
            process.exit(0);
        };

        process.on('SIGINT', handleShutdown);  // Ctrl+C
        process.on('SIGTERM', handleShutdown); // kill command
    }

    private printFinalReport()
    {
        console.log('\n===== Monitoring Report =====');
        console.log('Initial Stats:');
        this.printStats(this.initialStats);

        console.log('\nPeak Stats:');
        this.printStats(this.peakStats);

        console.log('\nFinal Stats:');
        this.printStats(this.currentStats);
    }

    private printStats(stats: ProcessStats | null)
    {
        if (!stats)
        {
            console.log('Process not running');
            return;
        }

        console.log(`- CPU: ${stats.cpu.toFixed(1)}%`);
        console.log(`- Memory: ${stats.memory.toFixed(2)}MB`);
        console.log(`- PID: ${stats.pid}`);
    }
}

export default StatsCollector;