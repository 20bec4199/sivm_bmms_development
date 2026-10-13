'use client';

import React from 'react';
import { AuditLogViewer } from '@/components/audit/AuditLogViewer';

export default function OrganizationAuditPage() {
  return (
    <div className="space-y-6">
      <AuditLogViewer 
        mode="organization"
        title="Organization Activity & Audit Log"
        description="Monitor all staff, technician, resident, and property management activities occurring within your specific organization."
      />
    </div>
  );
}
