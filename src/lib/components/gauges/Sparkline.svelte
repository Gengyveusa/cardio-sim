<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import type { VitalHistory } from '$lib/engine/types';

  export let data: VitalHistory[] = [];
  export let accessor: (v: VitalHistory) => number;
  export let width: number = 150;
  export let height: number = 40;
  export let color: string = '#4ade80';
  export let warningLow: number | null = null;
  export let warningHigh: number | null = null;
  export let showArea: boolean = true;
  export let strokeWidth: number = 1.5;

  let container: HTMLDivElement;
  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  let pathGroup: d3.Selection<SVGGElement, unknown, null, undefined>;

  const margin = { top: 4, right: 4, bottom: 4, left: 4 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  onMount(() => {
    svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Add gradient for area
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0.3);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0);

    pathGroup = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Warning zone backgrounds
    if (warningLow !== null || warningHigh !== null) {
      pathGroup.append('rect')
        .attr('class', 'warning-zone')
        .attr('fill', 'rgba(251, 191, 36, 0.1)');
    }

    // Area path
    if (showArea) {
      pathGroup.append('path')
        .attr('class', 'area-path')
        .attr('fill', `url(#sparkline-gradient-${Math.random().toString(36).substr(2, 9)})`)
        .attr('stroke', 'none');
    }

    // Line path
    pathGroup.append('path')
      .attr('class', 'line-path')
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', strokeWidth)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round');

    // Current value dot
    pathGroup.append('circle')
      .attr('class', 'current-dot')
      .attr('r', 3)
      .attr('fill', color);

    updateChart();
  });

  function updateChart() {
    if (!pathGroup || data.length < 2) return;

    const values = data.map(accessor);
    const times = data.map(d => d.time);

    const xScale = d3.scaleLinear()
      .domain([d3.min(times) || 0, d3.max(times) || 1])
      .range([0, innerWidth]);

    const yExtent = d3.extent(values) as [number, number];
    const yPadding = (yExtent[1] - yExtent[0]) * 0.1 || 1;

    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
      .range([innerHeight, 0]);

    const line = d3.line<VitalHistory>()
      .x(d => xScale(d.time))
      .y(d => yScale(accessor(d)))
      .curve(d3.curveMonotoneX);

    const area = d3.area<VitalHistory>()
      .x(d => xScale(d.time))
      .y0(innerHeight)
      .y1(d => yScale(accessor(d)))
      .curve(d3.curveMonotoneX);

    // Update line
    pathGroup.select('.line-path')
      .datum(data)
      .attr('d', line);

    // Update area
    if (showArea) {
      pathGroup.select('.area-path')
        .datum(data)
        .attr('d', area);
    }

    // Update current dot
    const lastPoint = data[data.length - 1];
    if (lastPoint) {
      pathGroup.select('.current-dot')
        .attr('cx', xScale(lastPoint.time))
        .attr('cy', yScale(accessor(lastPoint)));
    }

    // Update warning zone
    if (warningLow !== null || warningHigh !== null) {
      const low = warningLow !== null ? yScale(warningLow) : innerHeight;
      const high = warningHigh !== null ? yScale(warningHigh) : 0;

      pathGroup.select('.warning-zone')
        .attr('x', 0)
        .attr('y', Math.min(high, low))
        .attr('width', innerWidth)
        .attr('height', Math.abs(high - low));
    }
  }

  $: if (svg && data.length > 0) {
    updateChart();
  }

  onDestroy(() => {
    if (container && container.firstChild) {
      container.removeChild(container.firstChild);
    }
  });
</script>

<div bind:this={container} class="sparkline-container" style="width: {width}px; height: {height}px;"></div>

<style>
  .sparkline-container {
    display: inline-block;
  }

  .sparkline-container :global(.line-path) {
    transition: d 0.1s ease-out;
  }
</style>
