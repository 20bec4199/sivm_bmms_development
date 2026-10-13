'use client';

import React from 'react';
import { AuditLogViewer } from '@/components/audit/AuditLogViewer';

export default function PlatformAuditLogsPage() {
  return (
    <div className="space-y-6">
      <AuditLogViewer 
        mode="platform"
        title="Immutable Security Audit Log"
        description="Cryptographically tracked, read-only compliance archives featuring Before & After diff inspection for sensitive system mutations."
      />
    </div>
  );
}
