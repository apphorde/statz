import { spawnSync as sh } from "node:child_process";
import { machine, totalmem, type, uptime } from "node:os";
import { loadavg, freemem, cpus, networkInterfaces } from "os";

const SPACES = /\s+/;

export function memory() {
  const total = totalmem();
  const free = freemem();

  return {
    free,
    total,
    used: total - free,
  };
}

export function os() {
  return {
    type: type(),
    machine: machine(),
    uptime: uptime(),
  };
}

export function cpu() {
  return {
    cpus: cpus(),
    loadAverage: loadavg(),
  };
}

export function network() {
  return networkInterfaces();
}

export function disk() {
  const output = sh(
    "df",
    ["-h", "--output=source,fstype,size,used,avail,target"],
    {
      encoding: "utf8",
    }
  );

  const lines = output.stdout.trim().split("\n").slice(1).filter(Boolean);

  return lines
    .map((line) => {
      const [device, type, total, used, available, mountpoint] =
        line.split(SPACES);

      return {
        device,
        type,
        total,
        used,
        available,
        mountpoint,
      };
    })
    .sort((a, b) => (a.device < b.device ? -1 : 1));
}

const psMatcher =
  /^(?<pid>\S+)\s+(?<user>\S+)\s+(?<pr>\S+)\s+(?<ni>\S+)\s+(?<virt>\S+)\s+(?<res>\S+)\s+(?<shr>\S+)\s+(?<s>\S+)\s+(?<cpu>\S+)\s+(?<mem>\S+)\s+(?<time>\S+)\s+(?<command>\S+)$/;

export function ps() {
  const output = sh("top", ["-b", "-n1", "-Em", "-o", "%CPU"], {
    encoding: "utf8",
  });

  const lines = output.stdout.trim().split("\n").slice(7, 20).filter(Boolean);

  return lines
    .map((line) => {
      // PID USER PR NI VIRT RES SHR S %CPU %MEM TIME+ COMMAND
      const groups = psMatcher.exec(line)?.groups;

      if (groups) {
        const { pid, user, cpu, mem, time, command } = groups;
        return { pid, user, cpu, mem, time, command };
      }
    })
    .filter(Boolean);
}
