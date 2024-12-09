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

export function disk(type) {
  const args = ["-h"].concat(type ? ["-t", type] : []);
  const output = sh("df", args, { encoding: "utf8" });
  const lines = output.stdout.split("\n").slice(1);

  return lines.map((line) => {
    const [device, total, used, available, _, mountpoint] = line.split(SPACES);
    return {
      device,
      total,
      used,
      available,
      mountpoint,
    };
  });
}
