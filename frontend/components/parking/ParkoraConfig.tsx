'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Sliders, Shield, Zap, QrCode, Radio, Camera, DollarSign,
  AlertOctagon, Calendar, Users, Layers, Plus, Trash2, CheckCircle2,
  Building2, Store, Briefcase, HeartPulse, BedDouble, Factory, GraduationCap, Check
} from 'lucide-react';
import {
  useGetParkingConfigQuery,
  useUpdateParkingConfigMutation,
  useGetParkingRulesQuery,
  useCreateParkingRuleMutation,
  useDeleteParkingRuleMutation,
  useGetRatesQuery,
  useCreateRateMutation
} from '@/services/parkingApi';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';
import { useConfirm } from '@/providers/ConfirmProvider';

const PROPERTY_MODES = [
  {
    id: 'RESIDENTIAL',
    title: 'Residential Community',
    icon: Building2,
    desc: 'Unit-linked exclusive bays, resident family tags, visitor registration and overnight rules.',
    badge: 'Apartments & Gated Villas'
  },
  {
    id: 'OFFICE',
    title: 'Corporate & Tech Park',
    icon: Briefcase,
    desc: 'Shift-based parking, executive reserved stalls, employee RFID badges & tenant block allocations.',
    badge: 'Business Towers'
  },
  {
    id: 'COMMERCIAL',
    title: 'Commercial Complex',
    icon: Building2,
    desc: 'Multi-tenant pooled capacity, lease agreements, validation stamps & customer tariff tiers.',
    badge: 'Commercial Centers'
  },
  {
    id: 'RETAIL',
    title: 'Retail & Shopping Mall',
    icon: Store,
    desc: 'High turnover bay sensors, 2-hour free threshold, validation receipts & peak dynamic pricing.',
    badge: 'Retail Malls'
  },
  {
    id: 'HOSPITAL',
    title: 'Hospital & Healthcare',
    icon: HeartPulse,
    desc: 'Emergency vehicle exclusivity, doctor reserved slots, disabled/accessible priority, 24/7 patient tariffs.',
    badge: 'Medical Centers'
  },
  {
    id: 'HOSPITALITY',
    title: 'Hotel & Hospitality',
    icon: BedDouble,
    desc: 'Valet ticketing, guest room folio billing, banquet peak surge & conference attendee parking.',
    badge: 'Hotels & Resorts'
  },
  {
    id: 'INDUSTRIAL',
    title: 'Industrial & Logistics',
    icon: Factory,
    desc: 'Heavy vehicle clearance, loading bay scheduling, container staging & weighbridge verification.',
    badge: 'Warehouses & Yards'
  },
  {
    id: 'CAMPUS',
    title: 'Institutional / Campus',
    icon: GraduationCap,
    desc: 'Faculty vs student zoned decals, semester permits, bus depot staging & weekend sports events.',
    badge: 'Universities & Schools'
  },
  {
    id: 'MIXED_USE',
    title: 'Mixed-Use Development',
    icon: Layers,
    desc: 'Segmented residential, retail and office zones under unified barrier gates and differential pricing.',
    badge: 'Hybrid Projects'
  }
];

export function ParkoraConfig() {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const { data: configData, isLoading: isLoadingConfig } = useGetParkingConfigQuery();
  const [updateConfig, { isLoading: isUpdatingConfig }] = useUpdateParkingConfigMutation();

  const { data: rulesData, isLoading: isLoadingRules } = useGetParkingRulesQuery();
  const [createRule, { isLoading: isCreatingRule }] = useCreateParkingRuleMutation();
  const [deleteRule, { isLoading: isDeletingRule }] = useDeleteParkingRuleMutation();

  const { data: ratesData, isLoading: isLoadingRates } = useGetRatesQuery();
  const [createRate, { isLoading: isCreatingRate }] = useCreateRateMutation();

  // Sub-tab: 'platform' | 'rules' | 'rates'
  const [subTab, setSubTab] = useState<'platform' | 'rules' | 'rates'>('platform');

  // Local Form state for Configuration
  const [parkingMode, setParkingMode] = useState('RESIDENTIAL');
  const [allocationModel, setAllocationModel] = useState('HYBRID');
  const [visitorParkingEnabled, setVisitorParkingEnabled] = useState(true);
  const [reservationEnabled, setReservationEnabled] = useState(true);
  const [paidParkingEnabled, setPaidParkingEnabled] = useState(false);
  const [evParkingEnabled, setEvParkingEnabled] = useState(true);
  const [anprEnabled, setAnprEnabled] = useState(true);
  const [rfidAccessEnabled, setRfidAccessEnabled] = useState(true);
  const [qrAccessEnabled, setQrAccessEnabled] = useState(true);
  const [temporaryParkingEnabled, setTemporaryParkingEnabled] = useState(true);
  const [violationsEnabled, setViolationsEnabled] = useState(true);
  const [subscriptionsEnabled, setSubscriptionsEnabled] = useState(false);
  const [dynamicPricingEnabled, setDynamicPricingEnabled] = useState(false);

  // Sync state when configData arrives
  useEffect(() => {
    if (configData) {
      if (configData.parkingMode) setParkingMode(configData.parkingMode);
      if (configData.allocationModel) setAllocationModel(configData.allocationModel);
      setVisitorParkingEnabled(Boolean(configData.visitorParkingEnabled));
      setReservationEnabled(Boolean(configData.reservationEnabled));
      setPaidParkingEnabled(Boolean(configData.paidParkingEnabled));
      setEvParkingEnabled(Boolean(configData.evParkingEnabled));
      setAnprEnabled(Boolean(configData.anprEnabled));
      setRfidAccessEnabled(Boolean(configData.rfidAccessEnabled));
      setQrAccessEnabled(Boolean(configData.qrAccessEnabled));
      setTemporaryParkingEnabled(Boolean(configData.temporaryParkingEnabled));
      setViolationsEnabled(Boolean(configData.violationsEnabled));
      setSubscriptionsEnabled(Boolean(configData.subscriptionsEnabled));
      setDynamicPricingEnabled(Boolean(configData.dynamicPricingEnabled));
    }
  }, [configData]);

  // Modal: Add Rule
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState('MAX_STAY_HOURS');
  const [ruleConditionValue, setRuleConditionValue] = useState('4');
  const [ruleActionType, setRuleActionType] = useState('WARN_SECURITY');

  // Modal: Add Rate Card
  const [isAddRateModalOpen, setIsAddRateModalOpen] = useState(false);
  const [rateName, setRateName] = useState('');
  const [rateType, setRateType] = useState('HOURLY');
  const [baseAmount, setBaseAmount] = useState('50');
  const [hourlyRate, setHourlyRate] = useState('30');
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState('15');
  const [maxDailyAmount, setMaxDailyAmount] = useState('300');
  const [overstayPenaltyRate, setOverstayPenaltyRate] = useState('100');
  const [rateVehicleType, setRateVehicleType] = useState('CAR');

  // Save Configuration Handler
  const handleSaveConfig = async () => {
    try {
      await updateConfig({
        parkingMode,
        allocationModel,
        visitorParkingEnabled,
        reservationEnabled,
        paidParkingEnabled,
        evParkingEnabled,
        anprEnabled,
        rfidAccessEnabled,
        qrAccessEnabled,
        temporaryParkingEnabled,
        violationsEnabled,
        subscriptionsEnabled,
        dynamicPricingEnabled,
      }).unwrap();

      dispatch(showWarning({
        title: 'Platform Config Updated',
        message: `SmartiPark has been updated to "${parkingMode}" mode with your selected operating capabilities.`
      }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to update platform settings.' }));
    }
  };

  // Create Rule Handler
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) {
      dispatch(showWarning({ message: 'Rule title is required.' }));
      return;
    }

    try {
      await createRule({
        name: ruleName.trim(),
        ruleType,
        conditions: { threshold: parseFloat(ruleConditionValue) || ruleConditionValue },
        actions: { action: ruleActionType },
        isActive: true
      }).unwrap();

      setIsAddRuleModalOpen(false);
      setRuleName('');
      dispatch(showWarning({ title: 'Rule Enforced', message: 'Operational parking rule has been created and activated.' }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to create rule.' }));
    }
  };

  // Delete Rule Handler
  const handleDeleteRule = async (ruleId: string, name: string) => {
    const confirmed = await confirm({
      title: 'Remove Parking Rule',
      message: `Are you sure you want to deactivate and remove rule "${name}"?`,
      confirmText: 'Remove Rule',
      destructive: true
    });

    if (confirmed) {
      try {
        await deleteRule(ruleId).unwrap();
        dispatch(showWarning({ title: 'Rule Removed', message: `Rule "${name}" has been removed.` }));
      } catch (err: any) {
        dispatch(showWarning({ message: err?.data?.message || 'Failed to remove rule.' }));
      }
    }
  };

  // Create Rate Handler
  const handleCreateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateName.trim()) {
      dispatch(showWarning({ message: 'Rate card name is required.' }));
      return;
    }

    try {
      await createRate({
        name: rateName.trim(),
        rateType,
        baseAmount: parseFloat(baseAmount) || 0,
        hourlyRate: parseFloat(hourlyRate) || 0,
        gracePeriodMinutes: parseInt(gracePeriodMinutes) || 15,
        maxDailyAmount: parseFloat(maxDailyAmount) || 0,
        overstayPenaltyRate: parseFloat(overstayPenaltyRate) || 0,
        vehicleType: rateVehicleType
      }).unwrap();

      setIsAddRateModalOpen(false);
      setRateName('');
      dispatch(showWarning({ title: 'Tariff Published', message: 'Rate card has been published to gate billing engines.' }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to create rate card.' }));
    }
  };

  const rules = Array.isArray(rulesData) ? rulesData : (rulesData?.data || []);
  const rates = Array.isArray(ratesData) ? ratesData : (ratesData?.data || []);

  return (
    <div className="space-y-8">
      {/* Header & Sub-Tab Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                SmartiPark Engine Configuration
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 text-xs">Universal Engine</Badge>
              </h2>
              <p className="text-xs text-slate-400">
                Adapt parking logic dynamically without code changes across all building typologies and workflows.
              </p>
            </div>
          </div>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 z-10">
          <button
            onClick={() => setSubTab('platform')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              subTab === 'platform' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Property Mode & Capabilities
          </button>
          <button
            onClick={() => setSubTab('rules')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              subTab === 'rules' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Rule Engine
            {rules.length > 0 && <span className="bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px]">{rules.length}</span>}
          </button>
          <button
            onClick={() => setSubTab('rates')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              subTab === 'rates' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Rate Cards & Tariffs
            {rates.length > 0 && <span className="bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px]">{rates.length}</span>}
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: PLATFORM MODE & CAPABILITIES */}
      {subTab === 'platform' && (
        <div className="space-y-8">
          {/* Section: Select Property Operating Mode */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>1. Select Property Operating Mode</span>
              </h3>
              <p className="text-xs text-slate-500">
                Switches the operational logic, terminology, default reservation behaviors, and bay availability policies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PROPERTY_MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = parkingMode === mode.id;

                return (
                  <div
                    key={mode.id}
                    onClick={() => setParkingMode(mode.id)}
                    className={`cursor-pointer rounded-2xl p-5 border transition-all text-left relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <Badge className={`text-[10px] ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {mode.badge}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white mb-1">
                        {mode.title}
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 inline" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {mode.desc}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="mt-4 pt-3 border-t border-indigo-200/60 dark:border-indigo-900/60 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        <span>Active Profile</span>
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Allocation Model */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>2. Space Allocation Engine</span>
              </h3>
              <p className="text-xs text-slate-500">
                Choose how bays are distributed to residents, tenants, employees, or customers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { id: 'DEDICATED', name: 'Dedicated (Exclusive)', desc: '1:1 spatial lock to a specific unit, employee or tenant.' },
                { id: 'POOLED', name: 'Pooled Capacity', desc: 'First-come first-served within an authorized quota block.' },
                { id: 'HYBRID', name: 'Hybrid (Dedicated + Pooled)', desc: 'Key members have reserved spots; visitors & overflow use pooled bays.' },
                { id: 'FLOATING', name: 'Floating / Free Circulation', desc: 'No fixed stalls. Vehicles claim any available bay with sensor tracking.' },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => setAllocationModel(m.id)}
                  className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                    allocationModel === m.id
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 font-medium'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold text-sm mb-1">{m.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Feature Toggles */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>3. Operational Capability Modules</span>
              </h3>
              <p className="text-xs text-slate-500">
                Enable or disable specialized parking modules depending on property hardware and security requirements.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  label: 'Visitor & Guest Parking',
                  desc: 'Guest registration, host approval, gate pass generation',
                  icon: Users,
                  active: visitorParkingEnabled,
                  toggle: () => setVisitorParkingEnabled(!visitorParkingEnabled),
                },
                {
                  label: 'Advance Bay Reservations',
                  desc: 'Residents & clients can book bay time-slots in advance',
                  icon: Calendar,
                  active: reservationEnabled,
                  toggle: () => setReservationEnabled(!reservationEnabled),
                },
                {
                  label: 'Tariff & Paid Parking',
                  desc: 'Automated fee calculation, payment gates, overstay fines',
                  icon: DollarSign,
                  active: paidParkingEnabled,
                  toggle: () => setPaidParkingEnabled(!paidParkingEnabled),
                },
                {
                  label: 'EV Charging Bay Control',
                  desc: 'Green stalls priority, power charging logs, idle fee logic',
                  icon: Zap,
                  active: evParkingEnabled,
                  toggle: () => setEvParkingEnabled(!evParkingEnabled),
                },
                {
                  label: 'ANPR Camera Vision',
                  desc: 'Automatic Number Plate Recognition gate trigger integration',
                  icon: Camera,
                  active: anprEnabled,
                  toggle: () => setAnprEnabled(!anprEnabled),
                },
                {
                  label: 'RFID Fast-Tag Reader',
                  desc: 'Windshield FastTag & proximity smart card barrier triggers',
                  icon: Radio,
                  active: rfidAccessEnabled,
                  toggle: () => setRfidAccessEnabled(!rfidAccessEnabled),
                },
                {
                  label: 'Dynamic QR Entry Pass',
                  desc: 'Time-expiring cryptographic QR codes on visitor mobile',
                  icon: QrCode,
                  active: qrAccessEnabled,
                  toggle: () => setQrAccessEnabled(!qrAccessEnabled),
                },
                {
                  label: 'Temporary Parking Overrides',
                  desc: 'Short-term guest/maintenance bay swaps with audit logs',
                  icon: Layers,
                  active: temporaryParkingEnabled,
                  toggle: () => setTemporaryParkingEnabled(!temporaryParkingEnabled),
                },
                {
                  label: 'Violations & Towing Workflow',
                  desc: 'Security notification, warning notices, fines & towing clamp queue',
                  icon: AlertOctagon,
                  active: violationsEnabled,
                  toggle: () => setViolationsEnabled(!violationsEnabled),
                },
                {
                  label: 'Monthly Subscriptions',
                  desc: 'Recurring pass cards for long-term commercial parkers',
                  icon: Shield,
                  active: subscriptionsEnabled,
                  toggle: () => setSubscriptionsEnabled(!subscriptionsEnabled),
                },
                {
                  label: 'Dynamic Peak Pricing',
                  desc: 'Automatic surge pricing during high-occupancy rush hours',
                  icon: Sliders,
                  active: dynamicPricingEnabled,
                  toggle: () => setDynamicPricingEnabled(!dynamicPricingEnabled),
                },
              ].map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={idx}
                    onClick={feat.toggle}
                    className={`cursor-pointer rounded-2xl p-4 border transition-all flex items-start gap-3.5 ${
                      feat.active
                        ? 'border-indigo-500/80 bg-indigo-50/30 dark:bg-indigo-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-60'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      feat.active ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {feat.label}
                        </span>
                        <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                          feat.active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            feat.active ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              onClick={handleSaveConfig}
              isLoading={isUpdatingConfig}
              className="rounded-2xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply Platform Configuration
            </Button>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RULE ENGINE */}
      {subTab === 'rules' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Operational Rules</h3>
              <p className="text-xs text-slate-500">Autonomous rules evaluated during vehicle gate check-in, parking duration, and egress.</p>
            </div>
            <Button
              onClick={() => setIsAddRuleModalOpen(true)}
              className="rounded-xl h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Parking Rule
            </Button>
          </div>

          {rules.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <Shield className="w-10 h-10 mx-auto text-slate-400 mb-3" />
              <div className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No Custom Rules Defined</div>
              <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Create automated rules for maximum overstay hours, visitor curfews, or unauthorized parking notifications.
              </div>
              <Button
                onClick={() => setIsAddRuleModalOpen(true)}
                variant="outline"
                className="mt-4 rounded-xl text-xs"
              >
                Create First Rule
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rules.map((rule: any) => (
                <div
                  key={rule.id}
                  className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{rule.name}</div>
                      <Badge className="mt-1 bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 text-[10px]">
                        {rule.ruleType}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg text-rose-600 hover:bg-rose-50 border-rose-200 h-8 w-8 p-0"
                      onClick={() => handleDeleteRule(rule.id, rule.name)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="text-xs space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Condition:</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">
                        {rule.conditions?.threshold ? `${rule.conditions.threshold} hrs` : JSON.stringify(rule.conditions)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Automated Action:</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {rule.actions?.action || JSON.stringify(rule.actions)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: RATE CARDS & TARIFFS */}
      {subTab === 'rates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Tariff Cards & Fee Schedules</h3>
              <p className="text-xs text-slate-500">Tiered billing schedules applied to visitor entries and commercial parkers.</p>
            </div>
            <Button
              onClick={() => setIsAddRateModalOpen(true)}
              className="rounded-xl h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Rate Card
            </Button>
          </div>

          {rates.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <DollarSign className="w-10 h-10 mx-auto text-slate-400 mb-3" />
              <div className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No Rate Cards Configured</div>
              <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Set up hourly rates, daily caps, free grace periods, and overstay penalties for vehicles entering the facility.
              </div>
              <Button
                onClick={() => setIsAddRateModalOpen(true)}
                variant="outline"
                className="mt-4 rounded-xl text-xs"
              >
                Create First Rate Card
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rates.map((rate: any) => (
                <div
                  key={rate.id}
                  className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{rate.name}</div>
                      <span className="text-xs text-slate-400">Class: {rate.vehicleType || 'ALL'}</span>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-mono">
                      ₹{rate.hourlyRate}/hr
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Base Amount</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">₹{rate.baseAmount || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Grace Period</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{rate.gracePeriodMinutes || 0} mins</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Daily Cap</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">₹{rate.maxDailyAmount || 'No Cap'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Overstay Penalty</span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">₹{rate.overstayPenaltyRate || 0}/hr</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD RULE */}
      <Modal
        isOpen={isAddRuleModalOpen}
        onClose={() => setIsAddRuleModalOpen(false)}
        title="Create Operational Parking Rule"
      >
        <p className="text-xs text-slate-500 mb-4">
          Automate gate and parking restrictions across all property bays.
        </p>
        <form onSubmit={handleCreateRule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Rule Title *
            </label>
            <Input
              placeholder="e.g. Visitor 4-Hour Overstay Alert"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className="rounded-xl h-11 text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Rule Trigger Type
            </label>
            <select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="MAX_STAY_HOURS">Maximum Continuous Stay (Hours)</option>
              <option value="CURFEW_HOURS">Night Overstay / Curfew Limit</option>
              <option value="UNAUTHORIZED_OCCUPANCY">Unregistered Vehicle In Allocated Bay</option>
              <option value="EV_IDLE_CHARGE">EV Stall Idle After 100% Charge</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Trigger Threshold (Hours or Value)
            </label>
            <Input
              type="number"
              placeholder="4"
              value={ruleConditionValue}
              onChange={(e) => setRuleConditionValue(e.target.value)}
              className="rounded-xl h-11 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Automated Action
            </label>
            <select
              value={ruleActionType}
              onChange={(e) => setRuleActionType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="WARN_SECURITY">Notify Gate Security Dispatch</option>
              <option value="ISSUE_FINE">Auto-Assess Violation Fine</option>
              <option value="BLOCK_GATE_EXIT">Prevent Barrier Gate Lift (Require Staff)</option>
              <option value="REQUEST_TOW">Flag for Wheel Clamp / Towing</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddRuleModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isCreatingRule}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
            >
              Enforce Rule
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD RATE CARD */}
      <Modal
        isOpen={isAddRateModalOpen}
        onClose={() => setIsAddRateModalOpen(false)}
        title="Publish Tariff Rate Card"
      >
        <p className="text-xs text-slate-500 mb-4">
          Define pricing, free grace duration, and penalties for parking sessions.
        </p>
        <form onSubmit={handleCreateRate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Rate Card Name *
            </label>
            <Input
              placeholder="e.g. Standard Visitor Hourly"
              value={rateName}
              onChange={(e) => setRateName(e.target.value)}
              className="rounded-xl h-11 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vehicle Type
              </label>
              <select
                value={rateVehicleType}
                onChange={(e) => setRateVehicleType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="CAR">Four-Wheeler / Car</option>
                <option value="BIKE">Two-Wheeler / Bike</option>
                <option value="TRUCK">Heavy Vehicle / Truck</option>
                <option value="ALL">All Vehicle Types</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Grace Period (Mins)
              </label>
              <Input
                type="number"
                placeholder="15"
                value={gracePeriodMinutes}
                onChange={(e) => setGracePeriodMinutes(e.target.value)}
                className="rounded-xl h-11 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Base Fee (₹)
              </label>
              <Input
                type="number"
                placeholder="50"
                value={baseAmount}
                onChange={(e) => setBaseAmount(e.target.value)}
                className="rounded-xl h-11 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hourly Fee (₹/hr)
              </label>
              <Input
                type="number"
                placeholder="30"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="rounded-xl h-11 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Daily Cap (₹)
              </label>
              <Input
                type="number"
                placeholder="300"
                value={maxDailyAmount}
                onChange={(e) => setMaxDailyAmount(e.target.value)}
                className="rounded-xl h-11 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Overstay Fine (₹/hr)
              </label>
              <Input
                type="number"
                placeholder="100"
                value={overstayPenaltyRate}
                onChange={(e) => setOverstayPenaltyRate(e.target.value)}
                className="rounded-xl h-11 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddRateModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isCreatingRate}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
            >
              Publish Rate Card
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
