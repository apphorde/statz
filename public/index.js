import '@sodium/na-chart';
import { onInit, ref, computed } from '@li3/web';

export const oneKB = 1024;
export const oneMB = oneKB * 1024;
export const oneGB = oneMB * 1024;
export const oneTB = oneGB * 1024;

function toDecimal(value) {
  return Number(value).toFixed(2);
}

export function resolveUnit(value) {
  if (value >= oneTB) {
    return toDecimal(value / oneTB) + 'TB';
  }

  if (value >= oneGB) {
    return toDecimal(value / oneGB) + 'GB';
  }

  if (value >= oneMB) {
    return toDecimal(value / oneMB) + 'MB';
  }

  if (value >= oneKB) {
    return toDecimal(value / oneKB) + 'KB';
  }

  return toDecimal(value) + 'b';
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
    const int = parseFloat(v);

    if (v.endsWith('K')) {
      return int * oneKB;
    }

    if (v.endsWith('M')) {
      return int * oneMB;
    }

    if (v.endsWith('G')) {
      return int * oneGB;
    }

    if (v.endsWith('T')) {
      return int * oneTB;
    }

    return int;
  }

  const usage = ref({
    total: 0,
    used: 0,
    available: 0,
    mountpoint: '/',
  });

  const diskUsage = computed(function () {
    return usage.value.map((v) => ({
      ...v,
      total: parseValue(v.total),
      used: parseValue(v.used),
      available: parseValue(v.available),
    }));
  });

  function refreshDisk() {
    return stat('/disk', usage);
  }

  const fileSystems = computed(() => usage.value.map((disk) => disk.type).filter((t, i, a) => a.indexOf(t) === i));

  return { diskUsage, fileSystems, refreshDisk };
}

function useCpu() {
  const cpuUsage = ref({
    cpus: [],
    loadAverage: [],
  });

  function refreshCpu() {
    return stat('/cpu', cpuUsage);
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
    return stat('/memory', memoryUsage);
  }

  return { memoryUsage, refreshMemory };
}

function useNetwork() {
  const networkUsage = ref({
    download: 0,
    upload: 0,
  });

  function refreshNetwork() {
    return stat('/network', networkUsage);
  }

  return { networkUsage, refreshNetwork };
}

function useProcesses() {
  function refreshProcesses() {
    return stat('/ps', ps);
  }

  const ps = ref('');
  return { ps, refreshProcesses };
}

function useHistory({ memoryUsage, cpuUsage }) {
  const previousHistory = localStorage.getItem('history');
  const history = ref(
    previousHistory
      ? JSON.parse(previousHistory)
      : {
          memory: {
            labels: Array(100).fill(''),
            datasets: [{ values: Array(100).fill(0) }],
          },
          cpu: {
            labels: Array(100).fill(''),
            datasets: [{ values: Array(100).fill(0) }],
          },
        },
  );

  function refreshHistory() {
    const data = history.value;
    const now = new Date();
    const time = now.getHours() + ':' + now.getMinutes();

    data.memory.datasets[0].values = trimArray([...data.memory.datasets[0].values, memoryUsage.value.used / oneMB]);

    data.memory.labels = trimArray([...data.memory.labels, time]);

    data.cpu.datasets[0].values = trimArray([...data.cpu.datasets[0].values, cpuUsage.value.loadAverage[0]]);

    data.cpu.labels = trimArray([...data.cpu.labels, time]);

    history.value = { ...data };
    localStorage.setItem('history', JSON.stringify(history.value));
  }

  return { history, refreshHistory };
}

export default function statsApp() {
  const { diskUsage, fileSystems, refreshDisk } = useDisk();
  const { memoryUsage, refreshMemory } = useMemory();
  const { cpuUsage, refreshCpu } = useCpu();
  const { networkUsage, refreshNetwork } = useNetwork();
  const { ps, refreshProcesses } = useProcesses();
  const { history, refreshHistory } = useHistory({ memoryUsage, cpuUsage });
  const autoRefresh = ref(true);
  const diskFilter = ref('');
  const chartOptions = {
    animate: false,
    showTooltip: false,
    truncateLegends: true,
  };

  const diskUsageFiltered = computed(() => {
    const filter = diskFilter.value;
    const list = diskUsage.value;

    if (!filter) {
      return list;
    }

    return list.filter((disk) => filter === disk.type);
  });

  function onDiskFilter(filter) {
    diskFilter.value = filter;
  }

  function onToggleRefresh() {
    autoRefresh.value = !autoRefresh.value;
  }

  async function refresh() {
    if (!autoRefresh.value) return;

    await Promise.all([refreshMemory(), refreshDisk(), refreshCpu(), refreshNetwork(), refreshProcesses()]);

    refreshHistory();
  }

  async function onUpdateApp() {
    const req = await fetch('/auto-update');

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
    onUpdateApp,
    onToggleRefresh,
    onDiskFilter,
    diskFilter,
    diskUsage: diskUsageFiltered,
    autoRefresh,
    cpuUsage,
    networkUsage,
    memoryUsage,
    fileSystems,
    ps,
    history,
    chartOptions,
  };
}
