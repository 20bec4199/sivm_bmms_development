'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Wrench, Calendar, Plus, Trash2, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';

export interface MaintenanceBlock {
  id: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  createdDate: string;
}

interface MaintenanceBlockFormProps {
  blocks?: MaintenanceBlock[];
  onChange: (blocks: MaintenanceBlock[]) => void;
  facilityName?: string;
}

export const MaintenanceBlockForm: React.FC<MaintenanceBlockFormProps> = ({ blocks = [], onChange, facilityName = 'Amenity' }) => {
  const dispatch = useDispatch();
  const [isAdding, setIsAdding] = useState(false);
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleAddBlock = () => {
    if (!reason || !startDate || !endDate) {
      dispatch(showWarning({ message: 'Please provide maintenance reason, start date, and end date.' }));
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      dispatch(showWarning({ message: 'End date must be logically after start date.' }));
      return;
    }

    const newBlock: MaintenanceBlock = {
      id: `block_${Date.now()}`,
      reason,
      startDate,
      endDate,
      status: new Date() >= new Date(startDate) ? 'IN_PROGRESS' : 'SCHEDULED',
      createdDate: new Date().toISOString()
    };

    onChange([...blocks, newBlock]);
    setReason('');
    setStartDate('');
    setEndDate('');
    setIsAdding(false);
    dispatch(showWarning({ message: 'Maintenance blackout period scheduled and synced with booking validation engine.' }));
  };

  const handleRemove = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center">
            <Wrench size={16} className="mr-2 text-amber-500" />
            Scheduled Maintenance & Unavailability Blackouts ({blocks.length})
          </h4>
          <p className="text-xs text-slate-500">Block facility availability during annual pool maintenance, deep cleaning, or facility equipment audits.</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm">
            <Plus size={14} className="mr-1" /> Schedule Closure Block
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="p-4 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 rounded-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b border-amber-200/60 dark:border-amber-900/60 pb-2">
            <span className="font-extrabold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center">
              <AlertTriangle size={14} className="mr-1.5 text-amber-600" /> Block Availability for {facilityName}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}><X size={16} /></Button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Reason for Blackout Closure *</label>
            <Input
              required
              placeholder="e.g. Annual HVAC duct sanitation and floor recoating"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Closure Start (Date & Time) *</label>
              <Input
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Estimated Re-opening (Date & Time) *</label>
              <Input
                type="datetime-local"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-amber-200/60 dark:border-amber-900/60">
            <span className="text-[11px] text-amber-800 dark:text-amber-400 font-semibold">
              🔒 Resident booking attempts within this window will be rejected by backend rules.
            </span>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleAddBlock} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                Confirm & Lock Dates
              </Button>
            </div>
          </div>
        </Card>
      )}

      {blocks.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500">
          <Calendar className="w-9 h-9 mx-auto text-slate-400 mb-2 opacity-60" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No active maintenance or closure blocks scheduled.</p>
          <p className="text-xs text-slate-400 mt-0.5">Facility operates strictly according to its configured weekly opening hours and slot rules.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {blocks.map((block) => (
            <div key={block.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-amber-400 transition-all shadow-2xs gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 font-bold text-[11px]">
                    <Wrench size={12} className="mr-1 inline animate-pulse" /> {block.status || 'UNAVAILABLE'}
                  </Badge>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{block.reason}</span>
                </div>
                <div className="flex items-center space-x-3 text-xs font-mono text-slate-600 dark:text-slate-400">
                  <span>From: <strong className="text-slate-900 dark:text-slate-200">{new Date(block.startDate).toLocaleString()}</strong></span>
                  <span>→</span>
                  <span>Until: <strong className="text-slate-900 dark:text-slate-200">{new Date(block.endDate).toLocaleString()}</strong></span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleRemove(block.id)}
                  className="text-red-600 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold h-8"
                >
                  <Trash2 size={13} className="mr-1" /> Revoke Block
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
