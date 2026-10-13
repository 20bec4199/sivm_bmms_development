'use client';

import React from 'react';
import { AuditLogViewer } from '@/components/audit/AuditLogViewer';

export default function PlatformActivityLogsPage() {
  return (
    <div className="space-y-6">
      <AuditLogViewer 
        mode="platform"
        title="Platform Activity & Event Logs"
        description="Comprehensive interactive record of operational tasks, resident complaints, technician work orders, and user access across all organizations."
      />
    </div>
  );
}
