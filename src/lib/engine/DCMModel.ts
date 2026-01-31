// DCM (Dilated Cardiomyopathy) Physiology Model
// Characteristics:
// - Negative inotropy (reduced contractility)
// - Afterload sensitivity (CO drops with increased SVR)
// - LVEDP rises -> pulmonary edema
// - Hypoventilation -> hypercapnia/acidosis -> catecholamine surge -> arrhythmias/arrest

import type { VitalSigns, DriverState } from './types';

export class DCMModel {
  // Rate constants for dynamic changes
  private readonly CO_RESPONSE_RATE = 0.5;
  private readonly HR_RESPONSE_RATE = 0.3;
  private readonly EDEMA_RATE = 0.02;
  private readonly CATECHOLAMINE_RATE = 0.1;
  private readonly ISCHEMIA_RATE = 0.05;

  public update(vitals: VitalSigns, drivers: DriverState, dt: number): VitalSigns {
    const v = { ...vitals };

    // ============ CONTRACTILITY ============
    // DCM has inherently reduced contractility
    // Catecholamines can temporarily improve it, but with diminishing returns
    const baseContractility = 0.35; // Reduced baseline for DCM
    const epiBoost = drivers.epiLoad * 0.3 * (1 - v.contractility); // Diminishing returns
    const sedationImpact = -drivers.sedationDepth * 0.1;
    const targetContractility = Math.max(0.1, Math.min(0.8,
      baseContractility + epiBoost + sedationImpact
    ));
    v.contractility += (targetContractility - v.contractility) * dt * 0.5;

    // ============ HEART RATE ============
    // Responds to pain, catecholamines, sedation
    const baseHR = 80; // Slightly elevated at baseline for DCM
    let targetHR = baseHR;
    targetHR += drivers.painStimulus * 40;
    targetHR += drivers.epiLoad * 50;
    targetHR += v.catecholamines * 30;
    targetHR -= drivers.sedationDepth * 20;
    targetHR -= drivers.betaBlockerEffect * 25;

    // Hypoxia causes tachycardia then bradycardia
    if (v.spo2 < 90) {
      targetHR += (90 - v.spo2) * 2;
    }
    if (v.spo2 < 70) {
      targetHR -= (70 - v.spo2) * 5; // Severe hypoxia -> bradycardia
    }

    // Acidosis increases HR
    if (v.ph < 7.35) {
      targetHR += (7.35 - v.ph) * 100;
    }

    targetHR = Math.max(30, Math.min(180, targetHR));
    v.hr += (targetHR - v.hr) * dt * this.HR_RESPONSE_RATE;

    // ============ PRELOAD / AFTERLOAD ============
    // Fluid status affects preload
    v.preload = Math.max(0, Math.min(1,
      0.5 + drivers.fluidStatus * 0.3 + v.pulmonaryEdema * 0.2
    ));

    // SVR/afterload affected by catecholamines and vasopressors
    v.afterload = Math.max(0.2, Math.min(1,
      0.5 + v.catecholamines * 0.2 + drivers.vasopressorDose * 0.3 - drivers.sedationDepth * 0.1
    ));

    // Calculate SVR from afterload
    v.svr = 800 + v.afterload * 800;

    // ============ CARDIAC OUTPUT ============
    // DCM is very afterload sensitive - CO drops as SVR rises
    // Also affected by contractility and preload
    const strokeVolume = v.contractility * v.preload * 100; // mL
    const afterloadPenalty = 1 - (v.afterload - 0.5) * 0.6; // Significant afterload sensitivity
    const targetCO = (v.hr * strokeVolume * afterloadPenalty) / 1000;
    v.co = Math.max(1.5, Math.min(8, targetCO));

    // ============ BLOOD PRESSURE ============
    // MAP = CO * SVR / 80
    v.map = (v.co * v.svr) / 80;
    v.map = Math.max(30, Math.min(150, v.map));

    // SBP/DBP from MAP
    const pulsePressure = 40 + v.contractility * 20;
    v.sbp = v.map + pulsePressure / 2;
    v.dbp = v.map - pulsePressure / 2;
    v.sbp = Math.max(40, Math.min(200, v.sbp));
    v.dbp = Math.max(20, Math.min(120, v.dbp));

    // ============ LVEDP ============
    // Rises with fluid overload, reduced contractility
    // DCM has elevated LVEDP at baseline
    const baseLVEDP = 15;
    v.lvedp = baseLVEDP + (1 - v.contractility) * 15 + v.preload * 10 + drivers.fluidStatus * 5;
    v.lvedp = Math.max(5, Math.min(40, v.lvedp));

    // ============ PULMONARY EDEMA ============
    // Develops when LVEDP > 20
    if (v.lvedp > 20) {
      const edemaRate = (v.lvedp - 20) * 0.01;
      v.pulmonaryEdema += edemaRate * dt * this.EDEMA_RATE;
    } else if (v.pulmonaryEdema > 0) {
      v.pulmonaryEdema -= 0.005 * dt; // Slow resolution
    }
    v.pulmonaryEdema = Math.max(0, Math.min(1, v.pulmonaryEdema));

    // ============ RESPIRATORY ============
    // RR affected by sedation, pain, hypoxia
    let targetRR = 14;
    targetRR -= drivers.sedationDepth * 10;
    targetRR += drivers.painStimulus * 8;
    targetRR += v.pulmonaryEdema * 10; // Compensatory tachypnea

    if (v.spo2 < 94) {
      targetRR += (94 - v.spo2) * 0.5;
    }

    // Airway obstruction reduces effective ventilation
    const effectiveVentilation = drivers.ventilationIndex * (1 - drivers.airwayObstruction);
    if (effectiveVentilation < 0.5) {
      targetRR += 10; // Gasping attempts
    }

    targetRR = Math.max(4, Math.min(40, targetRR));
    v.rr = targetRR;

    // ============ PaCO2 ============
    // Rises with hypoventilation
    const targetPaCO2 = 40 + (1 - effectiveVentilation) * 40 + v.pulmonaryEdema * 10;
    v.paco2 += (targetPaCO2 - v.paco2) * dt * 0.1;
    v.paco2 = Math.max(20, Math.min(100, v.paco2));

    // ============ pH ============
    // Respiratory acidosis from hypercapnia
    // Metabolic acidosis from hypoperfusion
    const respiratoryComponent = 7.40 - (v.paco2 - 40) * 0.008;
    const metabolicComponent = v.co < 3 ? -(3 - v.co) * 0.05 : 0;
    const lacticComponent = v.ischemiaIndex * 0.1;
    v.ph = respiratoryComponent + metabolicComponent - lacticComponent;
    v.ph = Math.max(6.8, Math.min(7.6, v.ph));

    // ============ SpO2 ============
    // Affected by ventilation, pulmonary edema, O2 supply
    const baseSpO2 = 98;
    const ventilationPenalty = (1 - effectiveVentilation) * 40;
    const edemaPenalty = v.pulmonaryEdema * 30;
    const o2Benefit = (drivers.oxygenSupply - 0.21) * 20;
    v.spo2 = baseSpO2 - ventilationPenalty - edemaPenalty + o2Benefit;
    v.spo2 = Math.max(50, Math.min(100, v.spo2));

    // ============ CATECHOLAMINES ============
    // Rise with stress, hypoxia, hypercapnia, pain
    let targetCatecholamines = 0.2;
    targetCatecholamines += drivers.painStimulus * 0.3;
    targetCatecholamines += drivers.epiLoad * 0.4;

    // Hypoxia triggers catecholamine surge
    if (v.spo2 < 90) {
      targetCatecholamines += (90 - v.spo2) * 0.02;
    }

    // Hypercapnia/acidosis triggers catecholamine surge
    if (v.paco2 > 50) {
      targetCatecholamines += (v.paco2 - 50) * 0.01;
    }
    if (v.ph < 7.30) {
      targetCatecholamines += (7.30 - v.ph) * 2;
    }

    // Beta blockers reduce catecholamine effect
    targetCatecholamines *= (1 - drivers.betaBlockerEffect * 0.5);

    targetCatecholamines = Math.max(0, Math.min(1, targetCatecholamines));
    v.catecholamines += (targetCatecholamines - v.catecholamines) * dt * this.CATECHOLAMINE_RATE;

    // ============ CORONARY PERFUSION ============
    // Depends on MAP minus LVEDP, and HR (less filling time at high HR)
    const perfusionPressure = v.dbp - v.lvedp;
    const hrPenalty = v.hr > 100 ? (v.hr - 100) * 0.005 : 0;
    v.coronaryPerfusion = Math.max(0, Math.min(1,
      perfusionPressure / 70 - hrPenalty
    ));

    // ============ ISCHEMIA ============
    // Develops when coronary perfusion is inadequate
    if (v.coronaryPerfusion < 0.5) {
      const ischemiaRate = (0.5 - v.coronaryPerfusion) * 0.1;
      v.ischemiaIndex += ischemiaRate * dt * this.ISCHEMIA_RATE;
    } else if (v.ischemiaIndex > 0) {
      v.ischemiaIndex -= 0.01 * dt; // Slow recovery
    }
    v.ischemiaIndex = Math.max(0, Math.min(1, v.ischemiaIndex));

    // ============ ARRHYTHMIA RISK ============
    // Influenced by ischemia, pH, hypoxia, catecholamines
    let arrhythmiaRisk = 0.05;
    arrhythmiaRisk += v.ischemiaIndex * 0.3;
    arrhythmiaRisk += v.catecholamines * 0.2;

    if (v.ph < 7.30) {
      arrhythmiaRisk += (7.30 - v.ph) * 3;
    }
    if (v.spo2 < 85) {
      arrhythmiaRisk += (85 - v.spo2) * 0.02;
    }

    // Electrolyte disturbances would add here
    v.arrhythmiaRisk = Math.max(0, Math.min(1, arrhythmiaRisk));

    // LVOT gradient is minimal in DCM
    v.lvotGradient = 0;

    return v;
  }
}
