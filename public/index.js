
import "@sodium/na-chart";
import { ref, onInit } from "@li3/web";
import { toDecimal } from "./index.mjs";

export function toDecimal(value) {
  return Number(value).toFixed(2);
}

const oneMB = 1048576;
const oneGB = oneMB * 1024;

export default function statsApp() {
  const ps = ref("");
  const cpuUsage = ref({
    cpus: [],
    loadAverage: [],
  });

  const memoryUsage = ref({
    used: 0,
    total: 0,
    free: 0,
  });

  const networkUsage = ref({
    download: 0,
    upload: 0,
  });

  const diskUsage = ref({
    total: 0,
    used: 0,
    available: 0,
    mountpoint: "/",
  });

  const previousHistory = localStorage.getItem("history");
  const history = ref(
    previousHistory
      ? JSON.parse(previousHistory)
      : {
          memory: {
            labels: Array(100).fill(""),
            datasets: [{ values: Array(100).fill(0) }],
          },
          cpu: {
            labels: Array(100).fill(""),
            datasets: [{ values: Array(100).fill(0) }],
          },
        }
  );

  function refreshDisk() {
    return stat("/disk", diskUsage);
  }

  function refreshMemory() {
    return stat("/memory", memoryUsage);
  }

  function refreshCpu() {
    return stat("/cpu", cpuUsage);
  }

  function refreshNetwork() {
    return stat("/network", networkUsage);
  }

  function refreshProcesses() {
    return stat("/ps", ps);
  }

  function trimArray(array, size = 100) {
    return array.slice(-size);
  }

  async function refresh() {
    await refreshMemory();
    await refreshDisk();
    await refreshCpu();
    await refreshNetwork();
    await refreshProcesses();

    const data = history.value;
    const now = new Date();
    const time = now.getHours() + ":" + now.getMinutes();

    data.memory.datasets[0].values = trimArray([
      ...data.memory.datasets[0].values,
      memoryUsage.value.used / oneMB,
    ]);

    data.memory.labels = trimArray([...data.memory.labels, time]);

    data.cpu.datasets[0].values = trimArray([
      ...data.cpu.datasets[0].values,
      cpuUsage.value.loadAverage[0],
    ]);

    data.cpu.labels = trimArray([...data.cpu.labels, time]);

    history.value = { ...data };
    localStorage.setItem("history", JSON.stringify(history.value));
  }

  async function stat(apiPath, target) {
    const req = await fetch(apiPath);
    target.value = await req.json();
  }

  async function autoUpdate() {
    const req = await fetch("/auto-update");

    if (req.ok) {
      window.location.reload();
    }
  }

  onInit(() => {
    refresh();
    setInterval(refresh, 5000);
  });

  return {
    refresh,
    refreshCpu,
    refreshDisk,
    refreshMemory,
    refreshNetwork,
    refreshProcesses,
    toDecimal,
    autoUpdate,
    cpuUsage,
    diskUsage,
    networkUsage,
    memoryUsage,
    ps,
    history,
    oneMB,
    oneGB,
  };
}
