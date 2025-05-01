import "@sodium/na-chart";
import { onInit } from "@li3/web";
import { signal, effect } from "@li3/reactive";

const oneMB = 1048576;
const oneGB = oneMB * 1024;

export function toDecimal(value) {
  return Number(value).toFixed(2);
}

export function toMB(value) {
  return value / oneMB;
}

function trimArray(array, size = 100) {
  return array.slice(-size);
}

async function stat(apiPath, target) {
  const req = await fetch(apiPath);
  target.value = await req.json();
}

function useDisk() {
  function parseValue(v) {
    const int = parseInt(v);

    if (v.endsWith("M")) {
      return int * oneMB;
    }

    if (v.endsWith("G")) {
      return int * oneGB;
    }

    return int;
  }

  const usage = signal({
    total: 0,
    used: 0,
    available: 0,
    mountpoint: "/",
  });

  const diskUsage = effect(function () {
    const v = usage.value;
    return {
      total: parseValue(v.total),
      used: parseValue(v.used),
      available: parseValue(v.available),
      mountpoint: v.mountpoint,
    };
  });

  function refreshDisk() {
    return stat("/disk", usage);
  }

  return { diskUsage, refreshDisk };
}

function useCpu() {
  const cpuUsage = signal({
    cpus: [],
    loadAverage: [],
  });

  function refreshCpu() {
    return stat("/cpu", cpuUsage);
  }

  return { cpuUsage, refreshCpu };
}

function useMemory() {
  const memoryUsage = signal({
    used: 0,
    total: 0,
    free: 0,
  });

  function refreshMemory() {
    return stat("/memory", memoryUsage);
  }

  return { memoryUsage, refreshMemory };
}

function useNetwork() {
  const networkUsage = signal({
    download: 0,
    upload: 0,
  });

  function refreshNetwork() {
    return stat("/network", networkUsage);
  }

  return { networkUsage, refreshNetwork };
}

function useProcesses() {
  function refreshProcesses() {
    return stat("/ps", ps);
  }

  const ps = signal("");
  return { ps, refreshProcesses };
}

function useHistory({ memoryUsage, cpuUsage }) {
  const previousHistory = localStorage.getItem("history");
  const history = signal(
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

  function refreshHistory() {
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

  return { history, refreshHistory };
}

export default function statsApp() {
  const { diskUsage, refreshDisk } = useDisk();
  const { memoryUsage, refreshMemory } = useMemory();
  const { cpuUsage, refreshCpu } = useCpu();
  const { networkUsage, refreshNetwork } = useNetwork();
  const { ps, refreshProcesses } = useProcesses();
  const { history, refreshHistory } = useHistory({ memoryUsage, cpuUsage });

  const autoRefresh = signal(true);
  function toggleRefresh() {
    autoRefresh.value = !autoRefresh.value;
  }

  async function refresh() {
    if (!autoRefresh.value) return;

    await Promise.all([
      refreshMemory(),
      refreshDisk(),
      refreshCpu(),
      refreshNetwork(),
      refreshProcesses(),
    ]);

    refreshHistory();
  }

  async function updateApp() {
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
    toMB,
    updateApp,
    toggleRefresh,
    autoRefresh,
    cpuUsage,
    diskUsage,
    networkUsage,
    memoryUsage,
    ps,
    history,
  };
}
