// Svelte stores for simulation state management

import { writable, derived, get } from 'svelte/store';
import type { SimulationState, ScenarioDefinition, SimulationEvent, VitalHistory } from '$lib/engine/types';
import { SimulationEngine } from '$lib/engine/SimulationEngine';
import { dcmScenario } from '$lib/scenarios/dcm-scenario';

// Current scenario
export const currentScenario = writable<ScenarioDefinition>(dcmScenario);

// Simulation engine instance
let engine: SimulationEngine | null = null;

// Reactive simulation state
export const simulationState = writable<SimulationState | null>(null);

// Derived stores for specific state slices
export const vitals = derived(simulationState, $state => $state?.vitals ?? null);
export const drivers = derived(simulationState, $state => $state?.drivers ?? null);
export const currentPhase = derived(simulationState, $state => $state?.currentPhase ?? null);
export const activeInterventions = derived(simulationState, $state => $state?.activeInterventions ?? []);
export const timeMinutes = derived(simulationState, $state => $state?.timeMinutes ?? -10);
export const isPlaying = derived(simulationState, $state => $state?.isPlaying ?? false);
export const playbackSpeed = derived(simulationState, $state => $state?.playbackSpeed ?? 1);
export const loopMode = derived(simulationState, $state => $state?.loopMode ?? false);
export const history = derived(simulationState, $state => $state?.history ?? []);
export const events = derived(simulationState, $state => $state?.events ?? []);

// UI state
export const showScenarioEditor = writable(false);
export const selectedVital = writable<string | null>(null);

// Initialize or reinitialize the engine
export function initializeEngine(scenario?: ScenarioDefinition, seed?: number): void {
  if (engine) {
    engine.destroy();
  }

  const scenarioToUse = scenario ?? get(currentScenario);
  currentScenario.set(scenarioToUse);

  engine = new SimulationEngine(scenarioToUse, seed);

  engine.subscribe((state) => {
    simulationState.set(state);
  });
}

// Playback controls
export function play(): void {
  engine?.start();
}

export function pause(): void {
  engine?.pause();
}

export function togglePlayPause(): void {
  const state = get(simulationState);
  if (state?.isPlaying) {
    pause();
  } else {
    play();
  }
}

export function reset(): void {
  engine?.reset();
}

export function seekTo(timeMinutes: number): void {
  engine?.seekTo(timeMinutes);
}

export function setPlaybackSpeed(speed: number): void {
  engine?.setPlaybackSpeed(speed);
}

export function setLoopMode(enabled: boolean): void {
  engine?.setLoopMode(enabled);
}

// Scenario management
export function loadScenario(scenario: ScenarioDefinition, seed?: number): void {
  initializeEngine(scenario, seed);
}

// Export functionality
export function exportRun(): string {
  return engine?.exportRun() ?? '{}';
}

export function getShareableLink(): string {
  const state = get(simulationState);
  const scenario = get(currentScenario);

  if (!state || !scenario) return '';

  const params = new URLSearchParams({
    scenario: scenario.id,
    seed: state.seed.toString(),
    time: state.timeMinutes.toFixed(2)
  });

  return `${typeof window !== 'undefined' ? window.location.origin : ''}/?${params.toString()}`;
}

// Telemetry
export function logUserAction(action: string, data?: Record<string, unknown>): void {
  engine?.logEvent('user_action', { action, ...data });
}

// Get current engine (for advanced usage)
export function getEngine(): SimulationEngine | null {
  return engine;
}

// Cleanup
export function destroyEngine(): void {
  if (engine) {
    engine.destroy();
    engine = null;
  }
  simulationState.set(null);
}
