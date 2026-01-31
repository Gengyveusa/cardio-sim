<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';

  export let value: number = 0;
  export let min: number = 0;
  export let max: number = 100;
  export let label: string = '';
  export let unit: string = '';
  export let warningLow: number | null = null;
  export let warningHigh: number | null = null;
  export let criticalLow: number | null = null;
  export let criticalHigh: number | null = null;
  export let size: number = 120;

  let container: HTMLDivElement;
  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  let arc: d3.Arc<unknown, d3.DefaultArcObject>;
  let needleGroup: d3.Selection<SVGGElement, unknown, null, undefined>;

  const innerRadius = size * 0.35;
  const outerRadius = size * 0.45;

  function getColor(val: number): string {
    if (criticalLow !== null && val < criticalLow) return '#ef4444';
    if (criticalHigh !== null && val > criticalHigh) return '#ef4444';
    if (warningLow !== null && val < warningLow) return '#fbbf24';
    if (warningHigh !== null && val > warningHigh) return '#fbbf24';
    return '#4ade80';
  }

  function valueToAngle(val: number): number {
    const clampedVal = Math.max(min, Math.min(max, val));
    const ratio = (clampedVal - min) / (max - min);
    // Gauge spans from -135 to 135 degrees (270 degree arc)
    return -135 + ratio * 270;
  }

  onMount(() => {
    svg = d3.select(container)
      .append('svg')
      .attr('width', size)
      .attr('height', size * 0.75)
      .attr('viewBox', `0 0 ${size} ${size * 0.75}`);

    const g = svg.append('g')
      .attr('transform', `translate(${size / 2}, ${size * 0.55})`);

    arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    // Background arc
    g.append('path')
      .attr('d', arc({
        startAngle: -135 * Math.PI / 180,
        endAngle: 135 * Math.PI / 180
      } as d3.DefaultArcObject))
      .attr('fill', '#1a1a2e');

    // Zone arcs (critical, warning, normal)
    const zones: { start: number; end: number; color: string }[] = [];

    // Build zones based on thresholds
    let current = min;
    if (criticalLow !== null && criticalLow > min) {
      zones.push({ start: min, end: criticalLow, color: 'rgba(239, 68, 68, 0.3)' });
      current = criticalLow;
    }
    if (warningLow !== null && warningLow > current) {
      zones.push({ start: current, end: warningLow, color: 'rgba(251, 191, 36, 0.3)' });
      current = warningLow;
    }
    if (warningHigh !== null) {
      zones.push({ start: current, end: warningHigh, color: 'rgba(74, 222, 128, 0.2)' });
      current = warningHigh;
    } else if (criticalHigh !== null) {
      zones.push({ start: current, end: criticalHigh, color: 'rgba(74, 222, 128, 0.2)' });
      current = criticalHigh;
    } else {
      zones.push({ start: current, end: max, color: 'rgba(74, 222, 128, 0.2)' });
      current = max;
    }
    if (warningHigh !== null && warningHigh < max) {
      if (criticalHigh !== null && criticalHigh > warningHigh) {
        zones.push({ start: warningHigh, end: criticalHigh, color: 'rgba(251, 191, 36, 0.3)' });
        current = criticalHigh;
      } else {
        zones.push({ start: warningHigh, end: max, color: 'rgba(251, 191, 36, 0.3)' });
        current = max;
      }
    }
    if (criticalHigh !== null && criticalHigh < max) {
      zones.push({ start: criticalHigh, end: max, color: 'rgba(239, 68, 68, 0.3)' });
    }

    zones.forEach(zone => {
      const startAngle = valueToAngle(zone.start) * Math.PI / 180;
      const endAngle = valueToAngle(zone.end) * Math.PI / 180;
      g.append('path')
        .attr('d', arc({
          startAngle,
          endAngle
        } as d3.DefaultArcObject))
        .attr('fill', zone.color);
    });

    // Tick marks
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
      const tickValue = min + (max - min) * (i / tickCount);
      const angle = valueToAngle(tickValue) * Math.PI / 180;
      const x1 = Math.cos(angle - Math.PI / 2) * (outerRadius + 2);
      const y1 = Math.sin(angle - Math.PI / 2) * (outerRadius + 2);
      const x2 = Math.cos(angle - Math.PI / 2) * (outerRadius + 8);
      const y2 = Math.sin(angle - Math.PI / 2) * (outerRadius + 8);

      g.append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', '#555')
        .attr('stroke-width', 1);
    }

    // Needle
    needleGroup = g.append('g').attr('class', 'needle');

    needleGroup.append('path')
      .attr('d', `M -3 0 L 0 ${-innerRadius + 5} L 3 0 Z`)
      .attr('fill', '#fff');

    needleGroup.append('circle')
      .attr('r', 6)
      .attr('fill', '#333')
      .attr('stroke', '#666')
      .attr('stroke-width', 2);

    // Label
    g.append('text')
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#888')
      .attr('font-size', 10)
      .text(label);

    // Value display
    g.append('text')
      .attr('class', 'value-text')
      .attr('y', 12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', 16)
      .attr('font-weight', 'bold');

    // Unit
    g.append('text')
      .attr('y', 28)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .attr('font-size', 9)
      .text(unit);

    updateGauge();
  });

  function updateGauge() {
    if (!svg || !needleGroup) return;

    const angle = valueToAngle(value);
    needleGroup
      .transition()
      .duration(300)
      .ease(d3.easeQuadOut)
      .attr('transform', `rotate(${angle})`);

    svg.select('.value-text')
      .text(value.toFixed(value < 10 ? 1 : 0))
      .attr('fill', getColor(value));
  }

  $: if (svg) {
    updateGauge();
  }

  onDestroy(() => {
    if (container && container.firstChild) {
      container.removeChild(container.firstChild);
    }
  });
</script>

<div bind:this={container} class="gauge-container" style="width: {size}px; height: {size * 0.75}px;"></div>

<style>
  .gauge-container {
    display: inline-block;
  }

  .gauge-container :global(text) {
    font-family: system-ui, sans-serif;
  }
</style>
