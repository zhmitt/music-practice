<script lang="ts">
  /**
   * TrendChart — pure SVG mini chart for line or bar data.
   *
   * @example
   * <TrendChart data={[0.7, 0.8, 0.75]} type="line" color="var(--green)" />
   */

  interface Props {
    /** Numeric data points to plot. */
    data: number[];
    /** Optional x-axis labels (not rendered, reserved for future tooltip use). */
    labels?: string[];
    /** Chart type: line with area fill or bar columns. */
    type?: 'line' | 'bar';
    /** Stroke / fill color (CSS value). */
    color?: string;
    /** Height in pixels. */
    height?: number;
    /** Whether the y-axis should always start at zero. */
    showZero?: boolean;
  }

  let {
    data,
    labels: _labels = [],
    type = 'line',
    color = 'var(--accent)',
    height = 80,
    showZero = true,
  }: Props = $props();

  const padding = { top: 4, right: 4, bottom: 4, left: 4 };
  const viewBoxWidth = 100;

  // innerHeight is computed relative to the actual pixel height via viewBox scaling.
  // We keep the viewBox height = pixel height so the chart fills the container.
  $effect(() => {
    /* trigger recalc on height change */
  });

  function innerH(): number {
    return height - padding.top - padding.bottom;
  }

  function innerW(): number {
    return viewBoxWidth - padding.left - padding.right;
  }

  /**
   * Compute polyline points string for a line chart.
   *
   * @returns SVG points attribute value.
   */
  function getPoints(): string {
    if (data.length === 0) return '';
    const max = Math.max(...data, showZero ? 0.01 : 0.01);
    const min = showZero ? 0 : Math.min(...data);
    const range = max - min || 1;

    return data
      .map((v, i) => {
        const x =
          padding.left + (data.length > 1 ? (i / (data.length - 1)) * innerW() : innerW() / 2);
        const y = padding.top + innerH() - ((v - min) / range) * innerH();
        return `${x},${y}`;
      })
      .join(' ');
  }

  /**
   * Compute bar geometry for a bar chart.
   *
   * @returns Array of rect descriptors.
   */
  function getBars(): Array<{ x: number; y: number; w: number; h: number; value: number }> {
    if (data.length === 0) return [];
    const max = Math.max(...data, 0.01);
    const barWidth = (innerW() / data.length) * 0.65;
    const slotWidth = innerW() / data.length;

    return data.map((v, i) => {
      const h = (v / max) * innerH();
      const x = padding.left + i * slotWidth + (slotWidth - barWidth) / 2;
      const y = padding.top + innerH() - h;
      return { x, y, w: barWidth, h: Math.max(0, h), value: v };
    });
  }
</script>

<svg
  viewBox="0 0 {viewBoxWidth} {height}"
  preserveAspectRatio="none"
  class="trend-chart"
  style="height: {height}px"
  aria-hidden="true"
>
  {#if type === 'line'}
    {#if data.length > 1}
      <!-- Area fill -->
      <polygon
        points="{padding.left},{padding.top + innerH()} {getPoints()} {padding.left +
          innerW()},{padding.top + innerH()}"
        fill={color}
        opacity="0.12"
      />
      <!-- Line -->
      <polyline
        points={getPoints()}
        fill="none"
        stroke={color}
        stroke-width="1.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    {/if}
  {:else}
    {#each getBars() as bar}
      <rect
        x={bar.x}
        y={bar.y}
        width={bar.w}
        height={bar.h}
        rx="1.5"
        fill={bar.value > 0 ? color : 'transparent'}
        opacity="0.75"
      />
    {/each}
  {/if}
</svg>

<style>
  .trend-chart {
    width: 100%;
    display: block;
  }
</style>
