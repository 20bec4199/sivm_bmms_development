'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  CheckSquare, Plus, Trash2, ArrowUp, ArrowDown, Camera, FileText, 
  ShieldAlert, UserCheck, Edit2, Copy, AlertCircle, Clock
} from 'lucide-react';

export interface ChecklistItem {
  id?: string;
  taskName: string;
  description?: string;
  instructions?: string;
  sequence: number;
  taskCategory?: string;
  taskType: string; // CHECKBOX, TEXT, NUMBER, YES_NO, PASS_FAIL, DROPDOWN, MULTI_SELECT, DATE, TIME, PHOTO, DOCUMENT, SIGNATURE, METER_READING, CUSTOM
  options?: string[];
  isMandatory: boolean;
  photoRequired: boolean;
  signatureRequired: boolean;
  supervisorSignoff: boolean;
  estimatedDurationMinutes?: number;
}

interface ChecklistBuilderProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

export const ChecklistBuilder: React.FC<ChecklistBuilderProps> = ({ items = [], onChange }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Default initial item if empty list
  const handleAddNewTask = () => {
    const newItem: ChecklistItem = {
      taskName: 'Verify system interlock safety relays and emergency stops',
      description: 'Physical inspection and diagnostic trip test of hardware relays.',
      sequence: items.length + 1,
      taskCategory: 'Safety & Compliance',
      taskType: 'PASS_FAIL',
      isMandatory: true,
      photoRequired: true,
      signatureRequired: false,
      supervisorSignoff: false,
      estimatedDurationMinutes: 15
    };
    onChange([...items, newItem]);
    setEditingIndex(items.length);
  };

  const handleRemoveTask = (idx: number) => {
    const updated = items.filter((_, i) => i !== idx).map((item, i) => ({ ...item, sequence: i + 1 }));
    onChange(updated);
    if (editingIndex === idx) setEditingIndex(null);
  };

  const handleDuplicateTask = (idx: number) => {
    const orig = items[idx];
    const dup: ChecklistItem = { ...orig, taskName: `${orig.taskName} (Copy)`, sequence: items.length + 1 };
    onChange([...items, dup]);
  };

  const handleMove = (idx: number, dir: 'up' | 'down') => {
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === items.length - 1)) return;
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    const clone = [...items];
    const temp = clone[idx];
    clone[idx] = clone[targetIdx];
    clone[targetIdx] = temp;
    // Re-index sequences
    const reIndexed = clone.map((item, i) => ({ ...item, sequence: i + 1 }));
    onChange(reIndexed);
    if (editingIndex === idx) setEditingIndex(targetIdx);
  };

  const updateItem = (idx: number, updatedProps: Partial<ChecklistItem>) => {
    const updated = items.map((item, i) => (i === idx ? { ...item, ...updatedProps } : item));
    onChange(updated);
  };

  const totalEstimatedTime = items.reduce((sum, item) => sum + (item.estimatedDurationMinutes || 15), 0);

  return (
    <div className="space-y-4 bg-slate-50/70 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700/60 pb-3">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center">
            <CheckSquare size={16} className="mr-2 text-indigo-600 dark:text-indigo-400" />
            Safety & Compliance Technician Task Builder
          </h4>
          <p className="text-xs text-slate-500">Construct modular multi-step inspections with mandatory photo evidence and supervisor verification rules.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 font-extrabold text-xs px-3 py-1 flex items-center">
            <Clock size={13} className="mr-1 inline" /> ~{totalEstimatedTime}m Total Est.
          </Badge>
          <Button
            type="button"
            onClick={handleAddNewTask}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-3.5 rounded-xl shadow-xs flex items-center"
          >
            <Plus size={15} className="mr-1" /> Add Task Step
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <CheckSquare size={36} className="mx-auto mb-2 text-slate-300" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No inspection checklist tasks configured yet</p>
          <p className="text-[11px] text-slate-400 mb-4 max-w-sm mx-auto">Click &quot;Add Task Step&quot; above to define diagnostic measurements, pass/fail thresholds, and photo uploads.</p>
          <Button type="button" onClick={handleAddNewTask} variant="outline" className="text-xs font-bold px-4 h-9">
            Initialize Standard Safety Regimen
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className={`rounded-2xl border transition-all overflow-hidden ${
                editingIndex === index
                  ? 'bg-white dark:bg-slate-900 border-indigo-600 shadow-sm ring-1 ring-indigo-500/30'
                  : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {/* Task Header Row */}
              <div className="p-3.5 flex items-center justify-between gap-3 bg-slate-100/50 dark:bg-slate-800/30 border-b border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center space-x-3 truncate">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
                    {item.sequence}
                  </span>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {item.taskName || 'Unnamed Inspection Step'}
                    </h5>
                    <div className="flex flex-wrap gap-1.5 mt-0.5 items-center">
                      <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                        {item.taskType}
                      </span>
                      {item.isMandatory && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded">
                          ★ Mandatory
                        </span>
                      )}
                      {item.photoRequired && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded flex items-center">
                          <Camera size={10} className="mr-1 inline" /> Photo Required
                        </span>
                      )}
                      {item.supervisorSignoff && (
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded flex items-center">
                          <UserCheck size={10} className="mr-1 inline" /> Supervisor Verify
                        </span>
                      )}
                      <span className="text-[10px] font-medium text-slate-400">
                        (~{item.estimatedDurationMinutes || 15} min)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button type="button" onClick={() => handleMove(index, 'up')} disabled={index === 0} className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" onClick={() => handleMove(index, 'down')} disabled={index === items.length - 1} className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                    <ArrowDown size={14} />
                  </button>
                  <button type="button" onClick={() => handleDuplicateTask(index)} title="Duplicate Task" className="p-1.5 text-slate-400 hover:text-indigo-600">
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
                  >
                    {editingIndex === index ? 'Done' : 'Configure'}
                  </button>
                  <button type="button" onClick={() => handleRemoveTask(index)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Expandable Configuration Drawer (Section 11) */}
              {editingIndex === index && (
                <div className="p-4 space-y-4 bg-white dark:bg-slate-900 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Task Name / Prompt *
                      </label>
                      <input
                        type="text"
                        value={item.taskName}
                        onChange={(e) => updateItem(index, { taskName: e.target.value })}
                        className="w-full h-9 px-3 text-xs font-extrabold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Input Type / Method (Section 10) *
                      </label>
                      <select
                        value={item.taskType}
                        onChange={(e) => updateItem(index, { taskType: e.target.value })}
                        className="w-full h-9 px-3 text-xs font-extrabold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="CHECKBOX">Checkbox (Simple Done)</option>
                        <option value="PASS_FAIL">Pass / Fail Inspection</option>
                        <option value="YES_NO">Yes / No Query</option>
                        <option value="METER_READING">Meter / Gauge Reading (Numeric)</option>
                        <option value="NUMBER">Number Input (Temperature, PSI, etc.)</option>
                        <option value="TEXT">Short Text Observation</option>
                        <option value="DROPDOWN">Single Select Dropdown</option>
                        <option value="MULTI_SELECT">Multi-Select List</option>
                        <option value="DATE">Date Picker</option>
                        <option value="TIME">Time Capture</option>
                        <option value="PHOTO">Photo Attachment Only</option>
                        <option value="DOCUMENT">Document / PDF Certificate Upload</option>
                        <option value="SIGNATURE">Technician Digital Signature</option>
                        <option value="CUSTOM">Custom Script Assessment</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Task Category:
                      </label>
                      <input
                        type="text"
                        value={item.taskCategory || 'Safety & Compliance'}
                        onChange={(e) => updateItem(index, { taskCategory: e.target.value })}
                        className="w-full h-9 px-3 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Est. Duration (Minutes):
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="480"
                        value={item.estimatedDurationMinutes || 15}
                        onChange={(e) => updateItem(index, { estimatedDurationMinutes: parseInt(e.target.value, 10) || 15 })}
                        className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Technician Diagnostic Instructions & Safety Notes:
                    </label>
                    <textarea
                      rows={2}
                      value={item.instructions || ''}
                      onChange={(e) => updateItem(index, { instructions: e.target.value })}
                      placeholder="e.g. Ensure mainline circuit breaker is tagged out prior to taking resistance reading."
                      className="w-full p-2.5 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Safety & Compliance Toggles (Section 11) */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.isMandatory}
                        onChange={(e) => updateItem(index, { isMandatory: e.target.checked })}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Mandatory Task</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.photoRequired}
                        onChange={(e) => updateItem(index, { photoRequired: e.target.checked })}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Photo Evidence</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.signatureRequired}
                        onChange={(e) => updateItem(index, { signatureRequired: e.target.checked })}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Tech Signature</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.supervisorSignoff}
                        onChange={(e) => updateItem(index, { supervisorSignoff: e.target.checked })}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Supervisor Verify</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ChecklistItemEditor = ChecklistBuilder;
