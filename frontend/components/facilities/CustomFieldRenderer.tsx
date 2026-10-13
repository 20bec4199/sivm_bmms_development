'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { CustomFieldDef } from './CustomFieldBuilder';
import { UploadCloud, Check, AlertCircle } from 'lucide-react';

interface CustomFieldRendererProps {
  fields?: CustomFieldDef[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  errors?: Record<string, string>;
}

export const CustomFieldRenderer: React.FC<CustomFieldRendererProps> = ({
  fields = [],
  values = {},
  onChange,
  errors = {}
}) => {
  if (!fields || fields.length === 0) return null;

  return (
    <div className="space-y-4 pt-2">
      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center">
        📝 Mandatory & Facility-Specific Questionnaire
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((field) => {
          const val = values[field.id] !== undefined ? values[field.id] : (field.fieldType === 'CHECKBOX' ? false : '');
          const errorMsg = errors[field.id];
          const isFullWidth = ['LONG_TEXT', 'MULTI_SELECT', 'CHECKBOX', 'RADIO', 'FILE'].includes(field.fieldType);

          return (
            <div key={field.id} className={isFullWidth ? 'sm:col-span-2' : 'col-span-1'}>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>

              {field.fieldType === 'TEXT' && (
                <Input
                  required={field.required}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                  value={val || ''}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  className={errorMsg ? 'border-red-500' : ''}
                />
              )}

              {field.fieldType === 'NUMBER' && (
                <Input
                  type="number"
                  required={field.required}
                  placeholder={field.placeholder || '0'}
                  value={val || ''}
                  onChange={(e) => onChange(field.id, e.target.value)}
                />
              )}

              {field.fieldType === 'LONG_TEXT' && (
                <textarea
                  required={field.required}
                  rows={3}
                  placeholder={field.placeholder || `Provide details...`}
                  value={val || ''}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              )}

              {(field.fieldType === 'DATE' || field.fieldType === 'TIME' || field.fieldType === 'DATE_TIME') && (
                <Input
                  type={field.fieldType === 'DATE' ? 'date' : field.fieldType === 'TIME' ? 'time' : 'datetime-local'}
                  required={field.required}
                  value={val || ''}
                  onChange={(e) => onChange(field.id, e.target.value)}
                />
              )}

              {field.fieldType === 'DROPDOWN' && (
                <select
                  required={field.required}
                  value={val || ''}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select an option...</option>
                  {(field.options || []).map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {field.fieldType === 'RADIO' && (
                <div className="space-y-2 pt-1">
                  {(field.options || []).map((opt, idx) => (
                    <label key={idx} className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name={field.id}
                        value={opt}
                        checked={val === opt}
                        onChange={() => onChange(field.id, opt)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {field.fieldType === 'MULTI_SELECT' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {(field.options || []).map((opt, idx) => {
                    const selectedList = Array.isArray(val) ? val : [];
                    const isChecked = selectedList.includes(opt);
                    return (
                      <label key={idx} className="flex items-center space-x-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const newArr = e.target.checked
                              ? [...selectedList, opt]
                              : selectedList.filter(i => i !== opt);
                            onChange(field.id, newArr);
                          }}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {field.fieldType === 'CHECKBOX' && (
                <label className="flex items-start space-x-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-indigo-50/20 dark:bg-indigo-950/10 cursor-pointer">
                  <input
                    type="checkbox"
                    required={field.required}
                    checked={!!val}
                    onChange={(e) => onChange(field.id, e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 mt-0.5"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{field.placeholder || field.label}</span>
                    {field.helpText && <p className="text-slate-500 font-normal mt-0.5">{field.helpText}</p>}
                  </div>
                </label>
              )}

              {field.fieldType === 'FILE' && (
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center hover:border-indigo-500 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                  <UploadCloud className="w-6 h-6 text-indigo-500 mx-auto mb-1.5" />
                  <span className="text-xs font-bold block text-slate-700 dark:text-slate-300">
                    {val ? `Uploaded Document File: ${val.name || val}` : 'Click to select or upload supporting PDF/DOC/IMAGE certificate'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Maximum file size 10MB (Simulated attachment verification)</p>
                  <input
                    type="file"
                    className="mt-2 text-xs w-full text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        onChange(field.id, e.target.files[0].name);
                      }
                    }}
                  />
                </div>
              )}

              {field.helpText && field.fieldType !== 'CHECKBOX' && (
                <p className="text-[11px] text-slate-400 mt-1">{field.helpText}</p>
              )}

              {errorMsg && (
                <p className="text-xs text-red-500 font-semibold mt-1 flex items-center">
                  <AlertCircle size={12} className="mr-1 inline" /> {errorMsg}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
