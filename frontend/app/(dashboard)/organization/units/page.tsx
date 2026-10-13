'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Home, Search, Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useGetUnitsQuery } from '@/services/organizationApi';

interface Unit {
  id: string;
  name?: string;
  unitNumber: string;
  type: string;
  status: string;
  floor: {
    name: string;
    tower?: {
      name: string;
      building?: {
        name: string;
      }
    }
  };
  metadata?: any;
  parent?: any;
}

export default function UnitsPage() {
  const { data, isLoading } = useGetUnitsQuery({});

  const columns: Column<Unit>[] = [
    {
      header: 'Unit / Block',
      accessorKey: 'unitNumber',
      cell: (unit) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 bg-pink-100 dark:bg-pink-900/50 rounded-lg flex items-center justify-center mr-3">
            <Home className="h-5 w-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              {unit.name || unit.unitNumber}
              <Badge variant="secondary" className="text-xs uppercase">{unit.metadata?.type || unit.type || 'Standard Unit'}</Badge>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Floor',
      accessorKey: 'floor',
      cell: (unit) => (
        <Badge variant="outline" className="font-normal">
          {unit.parent?.name || unit.floor?.name || 'N/A'}
        </Badge>
      )
    },
    {
      header: 'Tower',
      accessorKey: 'tower',
      cell: (unit) => (
        <Badge variant="outline" className="font-normal">
          {unit.parent?.parent?.name || unit.floor?.tower?.name || 'N/A'}
        </Badge>
      )
    },
    {
      header: 'Building',
      accessorKey: 'building',
      cell: (unit) => (
        <Badge variant="outline" className="font-normal">
          {unit.parent?.parent?.parent?.name || unit.floor?.tower?.building?.name || 'N/A'}
        </Badge>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (unit) => {
        const status = unit.metadata?.status || unit.status || 'VACANT';
        const variant = status === 'OCCUPIED' ? 'success' : status === 'MAINTENANCE' ? 'warning' : 'secondary';
        return <Badge variant={variant as any}>{status}</Badge>;
      }
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (unit) => (
        <div className="flex space-x-2">
          <Link href={`/organization/units/${unit.id}`}>
            <Button variant="outline" size="sm">View</Button>
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm space-y-6 w-full">
      <PageHeader 
        title="Units" 
        description="Manage individual units, apartments, or office spaces."
        action={
          <Link href="/organization/units/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Unit
            </Button>
          </Link>
        }
      />

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-96 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input className="pl-10" placeholder="Search units by number..." />
          </div>
          <div className="flex space-x-2 w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable 
        columns={columns} 
        data={data?.data || []} 
        isLoading={isLoading} 
      />
    </div>
  );
}
