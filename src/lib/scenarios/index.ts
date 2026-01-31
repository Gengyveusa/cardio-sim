// Scenario library exports

import { dcmScenario } from './dcm-scenario';
import { hcmScenario } from './hcm-scenario';
import type { ScenarioDefinition } from '$lib/engine/types';

export const scenarios: ScenarioDefinition[] = [
  dcmScenario,
  hcmScenario
];

export function getScenarioById(id: string): ScenarioDefinition | undefined {
  return scenarios.find(s => s.id === id);
}

export function getScenariosByPhenotype(phenotype: 'DCM' | 'HCM'): ScenarioDefinition[] {
  return scenarios.filter(s => s.phenotype === phenotype);
}

export { dcmScenario, hcmScenario };
