'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Plus, Trash2, Edit2, GripVertical, Check, X, Layers, FileText, Hash, Calendar, Clock, ChevronDown, CheckSquare, Radio, UploadCloud } from 'lucide-react';
import { showWarning } from '@/store/slices/uiSlice';
import { useDispatch } from 'react-redux';

export interface CustomFieldDef {
  id: string;
  label: string;
  fieldType: 'TEXT' | 'LONG_TEXT' | 'NUMBER' | 'DATE' | 'TIME' | 'DATE_TIME' | 'DROPDOWN' | 'MULTI_SELECT' | 'CHECKBOX' | 'RADIO' | 'FILE';
  required: boolean;
  placeholder?: string;
  options?: string[]; // for DROPDOWN, MULTI_SELECT, RADIO
  helpText?: string;
}

interface CustomFieldBuilderProps {
  fields: CustomFieldDef[];
  onChange: (fields: CustomFieldDef[]) => void;
}

export const CustomFieldBuilder: React.FC<CustomFieldBuilderProps> = ({ fields = [], onChange }) => {
  const dispatch = useDispatch();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New Field Form State
  const [label, setLabel] = useState('');
  const [fieldType, setFieldType] = useState<CustomFieldDef['fieldType']>('TEXT');
  const [required, setRequired] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const [optionsStr, setOptionsStr] = useState('');
  const [helpText, setHelpText] = useState('');

  const resetForm = () => {
    setLabel('');
    setFieldType('TEXT');
    setRequired(false);
    setPlaceholder('');
    setOptionsStr('');
    setHelpText('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSaveField = () => {
    if (!label.trim()) {
      dispatch(showWarning({ message: 'Field label is mandatory.' }));
      return;
    }

    const options = ['DROPDOWN', 'MULTI_SELECT', 'RADIO'].includes(fieldType)
      ? optionsStr.split('\n').map(o => o.trim()).filter(Boolean)
      : undefined;

    if (['DROPDOWN', 'MULTI_SELECT', 'RADIO'].includes(fieldType) && (!options || options.length === 0)) {
      dispatch(showWarning({ message: 'Please provide at least one choice option (one per line).' }));
      return;
    }

    if (editingId) {
      const updated = fields.map(f => f.id === editingId ? { ...f, label, fieldType, required, placeholder, options, helpText } : f);
      onChange(updated);
    } else {
      const newField: CustomFieldDef = {
        id: `custom_field_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        label,
        fieldType,
        required,
        placeholder,
        options,
        helpText
      };
      onChange([...fields, newField]);
    }
    resetForm();
  };

  const handleEdit = (field: CustomFieldDef) => {
    setEditingId(field.id);
    setLabel(field.label);
    setFieldType(field.fieldType);
    setRequired(field.required);
    setPlaceholder(field.placeholder || '');
    setOptionsStr(field.options ? field.options.join('\n') : '');
    setHelpText(field.helpText || '');
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    onChange(fields.filter(f => f.id !== id));
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'NUMBER': return <Hash size={15} className="text-blue-500" />;
      case 'DATE':
      case 'DATE_TIME': return <Calendar size={15} className="text-purple-500" />;
      case 'TIME': return <Clock size={15} className="text-amber-500" />;
      case 'DROPDOWN':
      case 'MULTI_SELECT': return <ChevronDown size={15} className="text-indigo-500" />;
      case 'CHECKBOX': return <CheckSquare size={15} className="text-emerald-500" />;
      case 'RADIO': return <Radio size={15} className="text-pink-500" />;
      case 'FILE': return <UploadCloud size={15} className="text-cyan-500" />;
      default: return <FileText size={15} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center">
            <Layers size={16} className="mr-2 text-indigo-600 dark:text-indigo-400" />
            Dynamic Booking & Questionnaire Fields ({fields.length})
          </h4>
          <p className="text-xs text-slate-500">Configure custom input questions that residents must answer during reservation checkouts.</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold">
            <Plus size={14} className="mr-1" /> Add Custom Field
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="p-5 border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="font-extrabold text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              {editingId ? 'Edit Custom Field Definition' : 'Configure New Custom Field'}
            </span>
            <Button variant="ghost" size="sm" onClick={resetForm}><X size={16} /></Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Field Label / Question *</label>
              <Input
                placeholder="e.g. Number of Guests, Vehicle License Plate, Catering Vendor"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Input Field Type *</label>
              <select
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value as any)}
                className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TEXT">Short Text (Single Line)</option>
                <option value="LONG_TEXT">Long Text (Paragraph)</option>
                <option value="NUMBER">Numeric Value (Integer/Decimal)</option>
                <option value="DATE">Date Selector</option>
                <option value="TIME">Time Picker</option>
                <option value="DATE_TIME">Date & Time combined</option>
                <option value="DROPDOWN">Dropdown Menu (Single Selection)</option>
                <option value="MULTI_SELECT">Multi-Select List</option>
                <option value="RADIO">Radio Buttons (Exclusive Choice)</option>
                <option value="CHECKBOX">Checkbox (Yes / No Acknowledgement)</option>
                <option value="FILE">Document / File Upload</option>
              </select>
            </div>
          </div>

          {['DROPDOWN', 'MULTI_SELECT', 'RADIO'].includes(fieldType) && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Available Choices (Enter one option per line) *
              </label>
              <textarea
                rows={3}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                className="w-full p-2.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Placeholder Text (Optional)</label>
              <Input
                placeholder="e.g. Enter details here..."
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Help Note for Resident (Optional)</label>
              <Input
                placeholder="e.g. Required for parking security clearance."
                value={helpText}
                onChange={(e) => setHelpText(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="field_req_toggle"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="field_req_toggle" className="text-xs font-bold text-slate-800 dark:text-slate-200 select-none">
              Make answering this question mandatory before confirming reservation
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={resetForm}>Cancel</Button>
            <Button variant="primary" size="sm" type="button" onClick={handleSaveField} className="bg-indigo-600 text-white font-bold">
              <Check size={14} className="mr-1" /> {editingId ? 'Update Field' : 'Save Field Definition'}
            </Button>
          </div>
        </Card>
      )}

      {fields.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500">
          <Layers className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-60" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No custom booking questionnaire fields configured.</p>
          <p className="text-xs text-slate-400 mt-1">Add custom text fields, document upload attachments, or event option dropdowns to tailor booking workflows.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, idx) => (
            <div key={field.id || idx} className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-400 transition-colors shadow-2xs">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                  {getFieldIcon(field.fieldType)}
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm truncate">{field.label}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                      {field.fieldType}
                    </span>
                    {field.required && (
                      <span className="text-red-500 font-black text-xs">* Required</span>
                    )}
                  </div>
                  {field.helpText && <p className="text-xs text-slate-400 truncate mt-0.5">{field.helpText}</p>}
                  {field.options && field.options.length > 0 && (
                    <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
                      Choices: {field.options.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600" onClick={() => handleEdit(field)}>
                  <Edit2 size={15} />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => handleDelete(field.id)}>
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
