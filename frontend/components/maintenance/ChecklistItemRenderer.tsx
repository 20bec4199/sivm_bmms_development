'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Camera, Check, X, AlertTriangle, FileText, UserCheck, ShieldCheck, 
  Upload, Clock, CheckSquare, ChevronRight, PenTool, Image as ImageIcon 
} from 'lucide-react';
import { ChecklistItem } from './ChecklistBuilder';

interface ExecutionTask extends ChecklistItem {
  isCompleted?: boolean;
  resultValue?: string;
  photoUrls?: string[];
  technicianNotes?: string;
}

interface ChecklistItemRendererProps {
  tasks: ExecutionTask[];
  onCompleteTask: (index: number, resultValue: string, photoUrls?: string[], notes?: string) => void;
  onSubmitVerification: (signature: string, supervisorNote?: string) => void;
  isSupervisor?: boolean;
  onSupervisorVerify?: (index: number, verified: boolean) => void;
}

export const ChecklistItemRenderer: React.FC<ChecklistItemRendererProps> = ({
  tasks = [],
  onCompleteTask,
  onSubmitVerification,
  isSupervisor = false,
  onSupervisorVerify
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [tempAnswer, setTempAnswer] = useState<string>('');
  const [tempNotes, setTempNotes] = useState<string>('');
  const [tempPhotos, setTempPhotos] = useState<string[]>([]);
  const [signature, setSignature] = useState<string>('');
  const [showSummary, setShowSummary] = useState<boolean>(false);

  const completedCount = tasks.filter(t => t.isCompleted).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Verify all mandatory tasks and mandatory photos are met (Section 11)
  const isMandatoryMet = tasks.every(t => {
    if (t.isMandatory && !t.isCompleted) return false;
    if (t.photoRequired && (!t.photoUrls || t.photoUrls.length === 0)) return false;
    if (t.signatureRequired && !signature) return false;
    return true;
  });

  const handleSelectTask = (idx: number) => {
    setActiveStep(idx);
    const t = tasks[idx];
    setTempAnswer(t?.resultValue || '');
    setTempNotes(t?.technicianNotes || '');
    setTempPhotos(t?.photoUrls || []);
    setShowSummary(false);
  };

  const handleSaveStep = () => {
    const t = tasks[activeStep];
    if (t.photoRequired && tempPhotos.length === 0) {
      alert('Photo verification evidence is mandatory for this step prior to signing off.');
      return;
    }
    if (t.isMandatory && !tempAnswer) {
      alert('An inspection value or status decision is required for this mandatory step.');
      return;
    }

    onCompleteTask(activeStep, tempAnswer || 'COMPLETED', tempPhotos, tempNotes);

    if (activeStep < tasks.length - 1) {
      handleSelectTask(activeStep + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handleSimulateCameraCapture = () => {
    const timestamp = new Date().toLocaleTimeString();
    const photoMock = `https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80#time=${timestamp}`;
    setTempPhotos([...tempPhotos, photoMock]);
  };

  const currentTask = tasks[activeStep] || null;

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm animate-in fade-in duration-200">
      {/* Top Progress Header (Section 12) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-700/60 pb-4">
        <div>
          <h4 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center">
            <ShieldCheck size={20} className="mr-2 text-emerald-600" />
            Field Technician Execution & Verification Engine
          </h4>
          <p className="text-xs text-slate-500 font-medium">Mobile-optimized diagnostic checklist with mandatory evidence compliance gating.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
              {completedCount} / {tasks.length} Completed
            </span>
            <div className="w-32 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1 border border-slate-200 dark:border-slate-700">
              <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Step Navigation Bar for Technicians */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin">
        {tasks.map((t, idx) => {
          const isActive = idx === activeStep && !showSummary;
          const isDone = t.isCompleted;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectTask(idx)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : isDone
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:border-slate-400'
              }`}
            >
              <span>Step {idx + 1}</span>
              {isDone && <Check size={13} className="text-emerald-600 dark:text-emerald-300" />}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowSummary(true)}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 border ${
            showSummary
              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
              : 'bg-slate-100 text-purple-700 border-purple-300 dark:bg-purple-950/30 dark:text-purple-300'
          }`}
        >
          Sign & Submit ⭐
        </button>
      </div>

      {/* Active Step Field Card */}
      {!showSummary && currentTask && (
        <div className="p-6 bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                  {currentTask.taskCategory || 'Inspection Item'}
                </span>
                {currentTask.isMandatory && (
                  <span className="text-[11px] font-extrabold text-red-600 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded-md">
                    ★ Mandatory Task
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {currentTask.taskName}
              </h3>
              {currentTask.instructions && (
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  ℹ️ <strong>Technician Instruction:</strong> {currentTask.instructions}
                </p>
              )}
            </div>
            <div className="text-right shrink-0 font-mono text-xs font-bold text-slate-400">
              Est: ~{currentTask.estimatedDurationMinutes || 15}m
            </div>
          </div>

          {/* Dynamic Task Input Method (Section 10) */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">
              Record Inspection Result ({currentTask.taskType}):
            </label>

            {currentTask.taskType === 'PASS_FAIL' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTempAnswer('PASS')}
                  className={`h-12 rounded-xl font-extrabold text-sm border flex items-center justify-center space-x-2 transition-all ${
                    tempAnswer === 'PASS'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50'
                  }`}
                >
                  <Check size={18} /> <span>PASS / HEALTHY</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTempAnswer('FAIL')}
                  className={`h-12 rounded-xl font-extrabold text-sm border flex items-center justify-center space-x-2 transition-all ${
                    tempAnswer === 'FAIL'
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-red-600 hover:bg-red-50'
                  }`}
                >
                  <X size={18} /> <span>FAIL / DEFECT DETECTED</span>
                </button>
              </div>
            )}

            {currentTask.taskType === 'YES_NO' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTempAnswer('YES')}
                  className={`h-12 rounded-xl font-extrabold text-sm border transition-all ${
                    tempAnswer === 'YES' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-300 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  Yes / Confirmed
                </button>
                <button
                  type="button"
                  onClick={() => setTempAnswer('NO')}
                  className={`h-12 rounded-xl font-extrabold text-sm border transition-all ${
                    tempAnswer === 'NO' ? 'bg-slate-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-300 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  No / Negative
                </button>
              </div>
            )}

            {(currentTask.taskType === 'NUMBER' || currentTask.taskType === 'METER_READING') && (
              <input
                type="number"
                step="any"
                placeholder="Enter numerical gauge measurement or meter telemetry..."
                value={tempAnswer}
                onChange={(e) => setTempAnswer(e.target.value)}
                className="w-full h-12 px-4 text-base font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            )}

            {(currentTask.taskType === 'TEXT' || currentTask.taskType === 'CUSTOM' || currentTask.taskType === 'CHECKBOX') && (
              <input
                type="text"
                placeholder="Enter diagnostic observation or technician remarks..."
                value={tempAnswer}
                onChange={(e) => setTempAnswer(e.target.value)}
                className="w-full h-12 px-4 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>

          {/* Photo Verification Engine (Section 13) */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center">
                <Camera size={15} className="mr-1.5 text-blue-600" />
                Photo Evidence Verification {currentTask.photoRequired && '<span class="text-red-500">* (Mandatory)</span>'}
              </span>
              <Button
                type="button"
                onClick={handleSimulateCameraCapture}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-3.5 rounded-xl shadow-xs flex items-center"
              >
                <Upload size={14} className="mr-1.5" /> Camera / Upload Photo
              </Button>
            </div>

            {tempPhotos.length === 0 ? (
              <div className="p-4 bg-white/60 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-[11px] text-slate-400">
                No inspection photos attached yet. {currentTask.photoRequired ? 'Capture at least one photo to satisfy mandatory safety compliance.' : 'Optional visual record.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {tempPhotos.map((url, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black group">
                    <img src={url} alt="Verification" className="w-full h-24 object-cover opacity-90 group-hover:opacity-100 transition-all" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/70 px-2 py-1 text-[9px] text-white font-mono flex items-center justify-between">
                      <span>📸 GPS Tagged</span>
                      <span>Just now</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Technician Field Notes */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Additional Technician Notes:</label>
            <textarea
              rows={2}
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="e.g. Filter cartridge replaced; recommended follow-up inspection in 60 days."
              className="w-full p-3 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Save / Advance Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500 font-medium">
              Step {activeStep + 1} of {tasks.length}
            </span>
            <Button
              type="button"
              onClick={handleSaveStep}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-11 px-6 rounded-xl shadow-md flex items-center space-x-1.5"
            >
              <span>Save & Continue to Next Step</span>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Completion & Sign-off Summary (Step 9 & 10) */}
      {showSummary && (
        <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-6 animate-in slide-in-from-right-4 duration-200">
          <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <UserCheck size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
              Technician Completion Sign-off & Verification
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Verify that all mandatory safety tasks and diagnostic photo captures have been recorded prior to locking work order history.
            </p>
          </div>

          {/* Compliance Review Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">Checklist Task Summary:</span>
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>Completed Tasks:</span>
                <span className="text-emerald-600 font-black">{completedCount} / {tasks.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>Mandatory Compliance:</span>
                {isMandatoryMet ? (
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">✔ All Verified</span>
                ) : (
                  <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-[11px]">✖ Incomplete Mandatory Steps</span>
                )}
              </div>
            </div>

            {/* Digital Signature Capture (Section 11 & 12) */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center">
                <PenTool size={14} className="mr-1.5 text-indigo-600" />
                Technician Digital Signature *
              </span>
              <input
                type="text"
                placeholder="Type your full legal name to sign..."
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full h-10 px-3 text-sm font-serif italic font-bold text-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              <p className="text-[10px] text-slate-400 text-center">By signing, I certify that diagnostic steps were executed accurately in compliance with property standards.</p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setShowSummary(false); setActiveStep(0); }}
              className="text-xs font-extrabold h-11 px-5 rounded-xl"
            >
              Review Tasks Again
            </Button>
            <Button
              type="button"
              disabled={!isMandatoryMet || !signature.trim()}
              onClick={() => onSubmitVerification(signature, 'Completed with full digital evidence signoff.')}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black text-xs h-11 px-8 rounded-xl shadow-md transition-all"
            >
              Submit Final Work Order Completion ⭐
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const PhotoVerification = ChecklistItemRenderer;
