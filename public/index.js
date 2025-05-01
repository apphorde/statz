import "@sodium/na-chart";
import { ref, onInit } from "@li3/web";

const oneMB = 1048576;

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
  const diskUsage = ref({
    total: 0,
    used: 0,
    available: 0,
    mountpoint: "/",
  });

  function refreshDisk() {
    return stat("/disk", usage);
  }

  return { diskUsage, refreshDisk };
}

function useCpu() {
  const cpuUsage = ref({
    cpus: [],
    loadAverage: [],
  });

  function refreshCpu() {
    return stat("/cpu", cpuUsage);
  }

  return { cpuUsage, refreshCpu };
}

function useMemory() {
  const memoryUsage = ref({
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
  const networkUsage = ref({
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

  const ps = ref("");
  return { ps, refreshProcesses };
}

function useHistory() {
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
  const { history, refreshHistory } = useHistory();

  async function refresh() {
    await Promise.all([
      refreshMemory(),
      refreshDisk(),
      refreshCpu(),
      refreshNetwork(),
      refreshProcesses(),
    ]);

    refreshHistory();
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
  };
}
