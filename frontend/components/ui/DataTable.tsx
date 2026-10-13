import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TableSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { LayoutList } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  mobileRender?: (item: T) => React.ReactNode;
}

export function DataTable<T>({ data, columns, isLoading, emptyMessage = "There are currently no records to display in this table.", mobileRender }: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-6">
        <TableSkeleton rows={5} cols={columns.length} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState 
        icon={<LayoutList className="w-8 h-8" />}
        title="No Data Available"
        description={emptyMessage}
        className="my-4 mx-4"
      />
    );
  }

  return (
    <>
      {/* Mobile Card Layout */}
      {mobileRender && (
        <div className="md:hidden space-y-4">
          <AnimatePresence>
            {data.map((row, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                key={idx}
              >
                {mobileRender(row)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Desktop Table Layout */}
      <div className={`w-full overflow-hidden bg-white dark:bg-slate-900/90 rounded-2xl shadow-md border border-slate-200/80 dark:border-slate-800 transition-all ${mobileRender ? 'hidden md:block' : ''}`}>
        <div className="overflow-x-auto custom-scrollbar max-h-[75vh]">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 shadow-sm">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    scope="col"
                    className={`px-5 py-3.5 text-left text-xs font-extrabold text-slate-700 uppercase tracking-wider dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap ${col.className || ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
              <AnimatePresence>
                {data.map((row, rowIdx) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    key={rowIdx} 
                    className="even:bg-slate-50/70 dark:even:bg-slate-800/30 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 transition-colors group cursor-default"
                  >
                    {columns.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className={`px-5 py-4 whitespace-normal text-sm font-normal text-slate-900 dark:text-slate-100 transition-colors align-middle ${col.className || ''}`}
                      >
                        {col.cell ? col.cell(row) : (row as any)[col.accessorKey]}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
