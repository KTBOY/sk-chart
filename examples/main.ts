import { FoldBarChart, type FoldBarDatum } from '../src/index';

const PAYMENTS: FoldBarDatum[] = [
  { label: '发起支付', value: 65.2 },
  { label: '授权支付', value: 54.8 },
  { label: '支付成功', value: 48.6 },
  { label: '商户打款', value: 38.3 },
  { label: '完成交易', value: 32.9 },
];

const WEEK: FoldBarDatum[] = [
  { label: '周一', value: 12.4 },
  { label: '周二', value: 18.2 },
  { label: '周三', value: 15.7 },
  { label: '周四', value: 24.9 },
  { label: '周五', value: 31.5 },
  { label: '周六', value: 27.8 },
  { label: '周日', value: 21.3 },
];

const logEl = document.getElementById('log')!;
function log(message: string): void {
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  logEl.textContent += `[${time}] ${message}\n`;
  logEl.scrollTop = logEl.scrollHeight;
  const lines = logEl.textContent.split('\n');
  if (lines.length > 200) {
    logEl.textContent = lines.slice(-200).join('\n');
  }
}

// Instance 1 — pixel-parity target against the prototype effect 3.
const chart1 = new FoldBarChart('#chart-1', {
  data: PAYMENTS,
  scale: { exponent: 2 },
  state: { defaultActive: 2 },
  title: { text: '支付' },
  ariaLabel: '支付漏斗图',
});

// Instance 2 — parameterized: more columns, linear scale, custom palette.
const TEAL_ACTIVE = [
  [0, '#0E7A6C'],
  [0.42, '#17A38F'],
  [0.82, '#BDEBE2'],
  [1, '#EAFBF7'],
] as [number, string][];
const TEAL_NORMAL = [
  [0, '#0F8A7A'],
  [0.42, '#27B39D'],
  [0.82, '#C8EFE7'],
  [1, '#EDFCF9'],
] as [number, string][];
const TEAL_FOLD = [
  [0, '#8ADCD0'],
  [0.38, '#BDEAE2'],
  [1, '#F1FAF8'],
] as [number, string][];

const TEAL_PILL = {
  gradient: [
    [0, '#F1FEFB'],
    [0.45, '#B5F0E4'],
    [1, '#34C4AC'],
  ] as [number, string][],
  shadow: { color: '#2E8F7F', opacity: 0.75 },
};

const weekFormatter = (d: FoldBarDatum, i: number, data: FoldBarDatum[]) => {
  const prev = i > 0 ? data[i - 1].value : null;
  const delta = prev ? Math.round(((d.value - prev) / prev) * 100) : 0;
  return [
    { text: `${d.value.toFixed(1)}k`, tone: 'b' as const },
    { text: ' 次活跃 ', tone: 'n' as const },
    { text: '|', tone: 's' as const },
    { text: ' 环比: ', tone: 'n' as const },
    { text: `${delta >= 0 ? '+' : ''}${delta}%`, tone: 'b' as const },
  ];
};

let chart2: FoldBarChart | null = new FoldBarChart('#chart-2', {
  data: WEEK,
  title: { text: '一周活跃' },
  ariaLabel: '一周活跃柱状图',
  tooltip: { formatter: weekFormatter },
  theme: { number: { fontSize: 22 } },
  style: {
    barGradient: { active: TEAL_ACTIVE, normal: TEAL_NORMAL },
    foldGradient: TEAL_FOLD,
    pill: TEAL_PILL,
  },
});

const stageLabels = (d: FoldBarDatum, i: number, data: FoldBarDatum[]): string[] => {
  const prev = i > 0 ? data[i - 1].value : d.value;
  const pct = prev > 0 ? Math.round((d.value / prev) * 100) : 0;
  return [`第 ${i + 1} 阶段`, `${pct}%`];
};

// Instance 3 — full X axis: baseline + tick marks + bottom semantic rows + axis title.
const chart3 = new FoldBarChart('#chart-3', {
  data: PAYMENTS,
  height: 430, // extra room for the axis band without squeezing the bars
  scale: { exponent: 2 },
  title: { text: '支付（含坐标轴）' },
  ariaLabel: '支付漏斗图（含坐标轴）',
  xAxis: {
    showLine: true,
    showTick: true,
    bottomLabels: stageLabels,
    title: { text: '支付阶段 →' },
  },
});

for (const [name, chart] of [
  ['实例1', chart1],
  ['实例2', chart2],
  ['实例3', chart3],
] as const) {
  chart.on('column:enter', (p) => log(`${name} column:enter #${p.index} ${p.datum.label}`));
  chart.on('column:click', (p) =>
    log(`${name} column:click #${p.index} ${p.datum.label} = ${p.datum.value}`),
  );
  chart.on('column:leave', (p) => log(`${name} column:leave #${p.index}`));
}

document.getElementById('btn-random')!.addEventListener('click', () => {
  const next = PAYMENTS.map((d) => ({
    ...d,
    value: Math.round((20 + Math.random() * 50) * 10) / 10,
  }));
  next.sort((a, b) => b.value - a.value);
  chart1.update({ data: next });
  log('实例1 update：随机递减数据');
});

document.getElementById('btn-restore')!.addEventListener('click', () => {
  chart1.update({ data: PAYMENTS });
  log('实例1 update：还原原稿数据');
});

let bottomAxisOn = false;
document.getElementById('btn-xaxis')!.addEventListener('click', () => {
  bottomAxisOn = !bottomAxisOn;
  chart1.update(bottomAxisOn ? { xAxis: { bottomLabels: stageLabels } } : { xAxis: {} });
  log(`实例1 ${bottomAxisOn ? '启用' : '关闭'}底部语义轴（阶段序号 + 环节转化率）`);
});

document.getElementById('btn-toggle')!.addEventListener('click', () => {
  if (chart2) {
    chart2.destroy();
    chart2 = null;
    log('实例2 destroy');
  } else {
    chart2 = new FoldBarChart('#chart-2', {
      data: WEEK,
      title: { text: '一周活跃' },
      tooltip: { formatter: weekFormatter },
      style: {
        barGradient: { active: TEAL_ACTIVE, normal: TEAL_NORMAL },
        foldGradient: TEAL_FOLD,
        pill: TEAL_PILL,
      },
    });
    log('实例2 重建完成');
  }
});
