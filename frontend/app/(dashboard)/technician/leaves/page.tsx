'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';

export default function TechnicianPlaceholderPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Page Under Construction" 
        description="This module is currently being developed."
      />
      <Card className="border-0 shadow-sm">
        <CardContent className="p-12 text-center text-slate-500">
          More features coming soon...
        </CardContent>
      </Card>
    </div>
  );
}
