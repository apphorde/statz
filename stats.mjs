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
  const output = sh("df", ["--output=source,fstype,used,avail,target"], {
    encoding: "utf8",
  });

  const lines = output.stdout.trim().split("\n").slice(1).filter(Boolean);

  return lines
    .map((line) => {
      const [device, type, used, available, mountpoint] = line.split(SPACES);
      return {
        device,
        type,
        total: used + available,
        used,
        available,
        mountpoint,
      };
    })
    .sort((a, b) => (a.device < b.device ? -1 : 1));
}
