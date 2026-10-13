'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Check, ChevronRight, ChevronLeft, Wrench, MapPin, Building, Cpu, 
  Repeat, CheckSquare, UserCheck, ShieldCheck, Zap, Plus 
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';
import { useRouter } from 'next/navigation';
import { useCreateMaintenancePlanMutation } from '@/services/maintenancePlansApi';

// Reusable Atomic Components
import { SpatialHierarchySelector, SpatialSelection } from '@/components/maintenance/SpatialHierarchySelector';
import { FacilitySelector } from '@/components/maintenance/FacilitySelector';
import { AssetSelector } from '@/components/maintenance/AssetSelector';
import { MaintenanceScheduleBuilder, ScheduleConfig } from '@/components/maintenance/MaintenanceScheduleBuilder';
import { ChecklistBuilder, ChecklistItem } from '@/components/maintenance/ChecklistBuilder';

export default function CreateMaintenancePlanWizard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [createPlan, { isLoading: isSubmitting }] = useCreateMaintenancePlanMutation();
  const [activeStep, setActiveStep] = useState<number>(1);

  // Step 1: Basic Information State (Section 2)
  const [title, setTitle] = useState('');
  const [planCode, setPlanCode] = useState(`PMP-${Date.now().toString().slice(-5)}`);
  const [description, setDescription] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('Preventive');
  const [customTypeInput, setCustomTypeInput] = useState('');
  const [category, setCategory] = useState('HVAC & Air Distribution Subsystems');
  const [customCatInput, setCustomCatInput] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('ACTIVE');

  // Step 2: Spatial Hierarchy State (Section 3)
  const [spatialSelection, setSpatialSelection] = useState<SpatialSelection>({
    locationScope: 'PROPERTY',
    locationName: 'Entire Property Architecture'
  });

  // Step 3: Facility & Asset Linking State (Section 4 & 5)
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([]);
  const [autoSyncBlackout, setAutoSyncBlackout] = useState<boolean>(true);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // Step 4: Schedule Engine & Technician Assignment Strategy (Section 6, 7 & 9)
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    frequency: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    timeZone: 'UTC+05:30 (IST / Local)',
    maintenanceWindow: { startTime: '22:00', endTime: '02:00', isOvernight: true },
    gracePeriodDays: 3,
    monthlyRule: 'SPECIFIC_DATE',
    specificDayOfMonth: 1
  });
  const [assignmentStrategy, setAssignmentStrategy] = useState<'MANUAL' | 'AUTOMATIC' | 'TEAM'>('AUTOMATIC');
  const [teamName, setTeamName] = useState('Central Electromechanical Squad');

  // Step 5: Safety & Compliance Checklist (Section 10 & 11)
  const [checklists, setChecklists] = useState<ChecklistItem[]>([
    {
      taskName: 'Inspect baseline hydraulic fluid pressure & safety relief valves',
      description: 'Check gauges against OEM specified nominal psi threshold.',
      sequence: 1,
      taskCategory: 'Mechanical Safety',
      taskType: 'NUMBER',
      isMandatory: true,
      photoRequired: false,
      signatureRequired: false,
      supervisorSignoff: false,
      estimatedDurationMinutes: 10
    },
    {
      taskName: 'Capture photo evidence of clean electrostatic intake filters',
      description: 'Ensure filter elements are clear of particulates or biological growth.',
      sequence: 2,
      taskCategory: 'Air Hygiene',
      taskType: 'PHOTO',
      isMandatory: true,
      photoRequired: true,
      signatureRequired: true,
      supervisorSignoff: false,
      estimatedDurationMinutes: 15
    }
  ]);

  const handleNext = () => {
    if (activeStep === 1 && !title.trim()) {
      dispatch(showWarning({ message: 'Regimen Title / Purpose is required before advancing.' }));
      return;
    }
    if (activeStep < 5) setActiveStep(activeStep + 1);
  };

  const handlePrev = () => {
    if (activeStep > 1) setActiveStep(activeStep - 1);
  };

  const handlePublishPlan = async () => {
    try {
      const finalType = maintenanceType === 'CUSTOM' ? customTypeInput.trim() : maintenanceType;
      const finalCat = category === 'CUSTOM' ? customCatInput.trim() : category;

      const payload = {
        title,
        planCode,
        description,
        maintenanceType: finalType || 'Preventive',
        category: finalCat || 'General Systems',
        priority,
        status,
        frequency: scheduleConfig.frequency,
        nextDueDate: scheduleConfig.startDate ? new Date(scheduleConfig.startDate).toISOString() : undefined,
        buildingId: spatialSelection.buildingId,
        towerId: spatialSelection.towerId,
        floorId: spatialSelection.floorId,
        unitId: spatialSelection.unitId,
        locationScope: spatialSelection.locationScope,
        spatialNodes: spatialSelection.spatialNodes,
        locationName: spatialSelection.locationName,
        facilityIds: selectedFacilityIds,
        assetIds: selectedAssetIds,
        scheduleConfig,
        assignmentConfig: {
          strategy: assignmentStrategy,
          teamName: assignmentStrategy === 'TEAM' ? teamName : undefined,
          autoRules: assignmentStrategy === 'AUTOMATIC' ? { matchLocation: true, matchSkill: finalCat } : undefined
        },
        blackoutConfig: {
          autoSyncFacilityBlock: autoSyncBlackout,
          blockReason: `[Scheduled Maintenance] ${title}`,
          blockDurationHours: 6
        },
        checklists
      };

      await createPlan(payload).unwrap();
      dispatch(showWarning({ message: 'Preventive maintenance regimen established and scheduled successfully! Facility blackouts synchronized.' }));
      router.push('/organization/maintenance-plans');
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to establish maintenance plan.' }));
    }
  };

  const steps = [
    { id: 1, title: 'Basic Regimen', desc: 'Type, priority & code', icon: Wrench },
    { id: 2, title: 'Spatial Scope', desc: 'Tower & floor nodes', icon: MapPin },
    { id: 3, title: 'Facility & Assets', desc: 'Link community hardware', icon: Cpu },
    { id: 4, title: 'Recurrence & Techs', desc: 'Schedule & assignment', icon: Repeat },
    { id: 5, title: 'Safety Checklists', desc: 'Task builder & sign-offs', icon: CheckSquare },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 animate-in fade-in duration-200">
      <PageHeader
        title="Establish Preventive Maintenance & Lifecycle Schedule"
        description="Step-by-step configuration wizard for recurring automated inspections and technician safety compliance."
      />

      {/* Stepper Header Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {steps.map((s) => {
          const Icon = s.icon;
          const isCurrent = activeStep === s.id;
          const isDone = activeStep > s.id;
          return (
            <div
              key={s.id}
              onClick={() => { if (isDone || s.id < activeStep) setActiveStep(s.id); }}
              className={`p-3 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : isDone
                    ? 'bg-emerald-50/70 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 text-slate-400 border-slate-200/80 dark:border-slate-700/60 pointer-events-none'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <Icon size={16} className={isCurrent ? 'text-white' : isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
                <span className="text-[10px] font-black font-mono">STEP {s.id}</span>
              </div>
              <div>
                <span className="block font-black text-xs leading-tight">{s.title}</span>
                <span className={`text-[10px] block mt-0.5 leading-tight ${isCurrent ? 'text-indigo-100' : 'opacity-70'}`}>{s.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step Content Area */}
      <Card className="p-6 border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm bg-white dark:bg-slate-900">
        {/* STEP 1: Basic Information */}
        {activeStep === 1 && (
          <div className="space-y-5">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center">
                <Wrench size={18} className="mr-2 text-indigo-600" />
                Step 1: Basic Regimen Profile & Configurable Categories (Section 2)
              </h3>
              <p className="text-xs text-slate-500">Define maintenance objectives, severity priority levels, and custom organizational subsystems.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">Regimen Title / Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Rooftop Chiller Safety & Fluid Audit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 px-3.5 text-xs font-extrabold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">Unique Plan Code *</label>
                <input
                  type="text"
                  value={planCode}
                  onChange={(e) => setPlanCode(e.target.value)}
                  className="w-full h-11 px-3.5 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Configurable Types and Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">Maintenance Type *</label>
                <select
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value)}
                  className="w-full h-11 px-3.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Preventive">Preventive Maintenance</option>
                  <option value="Inspection">Safety Inspection Audit</option>
                  <option value="Safety">Mandatory Safety Testing</option>
                  <option value="Compliance">Statutory Compliance Audit</option>
                  <option value="Cleaning">Sanitation & Hygiene Scrub</option>
                  <option value="Calibration">Sensor & Gauge Calibration</option>
                  <option value="Servicing">Fluid / Consumable Replacement</option>
                  <option value="Lifecycle">Lifecycle Health Diagnostic</option>
                  <option value="CUSTOM">➕ Create Custom Type...</option>
                </select>
                {maintenanceType === 'CUSTOM' && (
                  <input
                    type="text"
                    placeholder="Enter custom maintenance discipline..."
                    value={customTypeInput}
                    onChange={(e) => setCustomTypeInput(e.target.value)}
                    className="mt-2 w-full h-10 px-3 text-xs font-bold rounded-xl border border-indigo-300 bg-indigo-50/30 text-indigo-950 dark:text-indigo-200"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">Target Asset Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 px-3.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="HVAC & Air Distribution Subsystems">HVAC & Air Distribution Subsystems</option>
                  <option value="Elevators & Vertical Lift Mechanics">Elevators & Vertical Lift Mechanics</option>
                  <option value="Fire Protection & Safety Pumps">Fire Protection & Safety Pumps</option>
                  <option value="Swimming Pool Filtration & Chemistry">Swimming Pool Filtration & Chemistry</option>
                  <option value="Electrical Transformers & Backup Generators">Electrical Transformers & Backup Generators</option>
                  <option value="CCTV Security & Access Control Gates">CCTV Security & Access Control Gates</option>
                  <option value="CUSTOM">➕ Define Custom Category...</option>
                </select>
                {category === 'CUSTOM' && (
                  <input
                    type="text"
                    placeholder="Enter custom infrastructure category..."
                    value={customCatInput}
                    onChange={(e) => setCustomCatInput(e.target.value)}
                    className="mt-2 w-full h-10 px-3 text-xs font-bold rounded-xl border border-indigo-300 bg-indigo-50/30 text-indigo-950 dark:text-indigo-200"
                  />
                )}
              </div>
            </div>

            {/* Priority & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">Priority Severity Level *</label>
                <div className="grid grid-cols-4 gap-2">
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`py-2 rounded-xl text-xs font-black border transition-all ${
                        priority === p
                          ? p === 'CRITICAL' || p === 'HIGH' ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-11 px-3.5 text-xs font-extrabold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                >
                  <option value="ACTIVE">ACTIVE (Automated cron generating WOs)</option>
                  <option value="DRAFT">DRAFT (Configuration in progress)</option>
                  <option value="PAUSED">PAUSED (Temp operational hold)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">Detailed Purpose & OEM Guidelines</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe diagnostic parameters, required PPE safety gloves, or reference OEM operator manual sections..."
                className="w-full p-3.5 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Spatial Hierarchy Linking */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center">
                <MapPin size={18} className="mr-2 text-indigo-600" />
                Step 2: Spatial Hierarchy & Location Scope Binding (Section 3)
              </h3>
              <p className="text-xs text-slate-500">Bind maintenance regimens to specific towers, floors, suites, or custom multi-building zones.</p>
            </div>

            <SpatialHierarchySelector value={spatialSelection} onChange={(sel) => setSpatialSelection(sel)} />
          </div>
        )}

        {/* STEP 3: Facility & Asset Linking */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center">
                <Cpu size={18} className="mr-2 text-indigo-600" />
                Step 3: Community Facility & Hardware Asset Linking (Section 4 & 5)
              </h3>
              <p className="text-xs text-slate-500">Attach physical community amenities and equipment assets to enforce automated maintenance blackout locks.</p>
            </div>

            <FacilitySelector
              selectedIds={selectedFacilityIds}
              onChange={(ids) => setSelectedFacilityIds(ids)}
              autoSyncBlackout={autoSyncBlackout}
              onBlackoutToggle={(val) => setAutoSyncBlackout(val)}
            />

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <AssetSelector
                selectedIds={selectedAssetIds}
                onChange={(ids) => setSelectedAssetIds(ids)}
              />
            </div>
          </div>
        )}

        {/* STEP 4: Recurrence Schedule & Technician Assignment */}
        {activeStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center">
                <Repeat size={18} className="mr-2 text-indigo-600" />
                Step 4: Recurring Schedule Engine & Assignment Strategy (Section 6, 7 & 9)
              </h3>
              <p className="text-xs text-slate-500">Configure recurring interval rules, overnight servicing slots, and automated technician skill routing.</p>
            </div>

            <MaintenanceScheduleBuilder value={scheduleConfig} onChange={(cfg) => setScheduleConfig(cfg)} />

            {/* Technician Assignment Strategy Card (Section 9) */}
            <div className="p-5 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center">
                <UserCheck size={16} className="mr-2 text-indigo-600" />
                Technician Assignment Strategy & Team Routing (Section 9)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'AUTOMATIC', title: 'Automatic Skill Routing', desc: 'System assigns based on building coordinates & skill match.' },
                  { id: 'MANUAL', title: 'Manual Dispatch', desc: 'Manager assigns specific technician upon Work Order spawning.' },
                  { id: 'TEAM', title: 'Technician Squad Pool', desc: 'Assign directly to an internal electromechanical squad.' }
                ].map((strat) => (
                  <div
                    key={strat.id}
                    onClick={() => setAssignmentStrategy(strat.id as any)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      assignmentStrategy === strat.id
                        ? 'bg-white dark:bg-slate-900 border-indigo-600 text-indigo-950 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500/50'
                        : 'bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{strat.title}</span>
                      {assignmentStrategy === strat.id && <Check size={14} className="text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{strat.desc}</p>
                  </div>
                ))}
              </div>

              {assignmentStrategy === 'TEAM' && (
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">Target Maintenance Squad:</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: Safety & Compliance Checklist Builder */}
        {activeStep === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center">
                <CheckSquare size={18} className="mr-2 text-indigo-600" />
                Step 5: Modular Safety & Compliance Task Studio (Section 10 & 11)
              </h3>
              <p className="text-xs text-slate-500">Define step-by-step diagnostic procedures, pass/fail tolerances, and mandatory photo capture constraints.</p>
            </div>

            <ChecklistBuilder items={checklists} onChange={(items) => setChecklists(items)} />
          </div>
        )}

        {/* Bottom Wizard Navigation Footer */}
        <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={activeStep === 1 || isSubmitting}
            onClick={handlePrev}
            className="h-11 px-6 font-bold text-xs rounded-xl flex items-center space-x-1.5"
          >
            <ChevronLeft size={16} />
            <span>Previous Step</span>
          </Button>

          {activeStep < 5 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md flex items-center space-x-1.5"
            >
              <span>Continue to Step {activeStep + 1}</span>
              <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handlePublishPlan}
              disabled={isSubmitting}
              className="h-11 px-10 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2"
            >
              <ShieldCheck size={18} />
              <span>{isSubmitting ? 'Establishing & Syncing Blackouts...' : 'Publish & Activate Regimen ⭐'}</span>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
