import { spawnSync as sh } from "node:child_process";
import { machine, totalmem, type, uptime } from "node:os";
import { loadavg, freemem, cpus, networkInterfaces } from "os";

const SPACES = /\s+/;

export function memory() {
  return {
    free: freemem(),
    total: totalmem(),
  };
}

export function os() {
  return {
    type: type(),
    machine: machine(),
    uptime: uptime(),
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
    const [device, size, used, available, _, mountpoint] = line.split(SPACES);
    return {
      device,
      size,
      used,
      available,
      mountpoint,
    };
  });
}
