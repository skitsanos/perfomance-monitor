// process-monitor.ts
// process-monitor.ts
import {spawnSync} from 'child_process';

export type ProcessStats = {
    cpu: number;    // CPU usage (%)
    memory: number; // Memory in MB
    pid: number;
};

export class ProcessMonitor
{
    private pid: number;
    private prevCpuTime = 0;
    private prevTimestamp = 0;

    constructor(target: number | string)
    {
        this.pid = typeof target === 'string'
                   ? this.resolvePidByName(target)
                   : target;
    }

    getStats(): ProcessStats | null
    {
        if (process.platform === 'win32')
        {
            return this.getWindowsStats();
        }
        else
        {
            return this.getUnixStats();
        }
    }

    private resolvePidByName(name: string): number
    {
        const command = process.platform === 'win32'
                        ? `Get-Process -Name "${name}" | Select-Object -ExpandProperty Id`
                        : `pgrep -x "${name}" || pgrep -f "${name}"`;

        const result = spawnSync(
            process.platform === 'win32' ? 'powershell' : 'sh',
            [
                '-c',
                command
            ],
            {encoding: 'utf-8'}
        );

        const pids = result.stdout.trim().split('\n').filter(Boolean);
        if (pids.length === 0)
        {
            throw new Error(`Process "${name}" not found`);
        }
        return parseInt(pids[0], 10);
    }

    private getWindowsProcessName(): string
    {
        const result = spawnSync('powershell', [
            '-Command',
            `(Get-Process -Id ${this.pid}).Name`
        ], {encoding: 'utf-8'});
        return result.stdout.trim();
    }

    private getWindowsStats(): ProcessStats | null
    {
        const result = spawnSync('powershell', [
            '-Command',
            `Get-Counter '\\Process(${this.getWindowsProcessName()})\\% Processor Time','\\Process(${this.getWindowsProcessName()})\\Working Set' | ForEach-Object { $_.CounterSamples[0].CookedValue }`
        ], {encoding: 'utf-8'});

        const [cpu, memoryBytes] = result.stdout.trim().split('\n').map(parseFloat);

        return {
            cpu: cpu || 0,
            memory: (memoryBytes || 0) / 1024 / 1024,
            pid: this.pid
        };
    }

    private getUnixStats(): ProcessStats | null
    {
        try
        {
            // Use ps command for macOS/Linux compatibility
            const result = spawnSync('ps', [
                '-p',
                this.pid.toString(),
                '-o',
                '%cpu,rss'
            ], {encoding: 'utf-8'});

            const output = result.stdout.trim().split('\n');
            if (output.length < 2)
            {
                return null;
            }

            const [cpuStr, rssStr] = output[1].trim().split(/\s+/);
            const cpu = parseFloat(cpuStr);
            const memory = parseFloat(rssStr) / 1024; // RSS in KB → MB

            return {
                cpu,
                memory,
                pid: this.pid
            };
        }
        catch
        {
            return null;
        }
    }
}

export default ProcessMonitor;