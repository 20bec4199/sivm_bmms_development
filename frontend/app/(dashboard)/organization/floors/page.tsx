'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, LayoutDashboard, Search, Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useGetFloorsQuery } from '@/services/organizationApi';

interface Floor {
  id: string;
  name: string;
  level: number;
  tower: {
    name: string;
    building?: {
      name: string;
    }
  };
  metadata?: any;
  parent?: any;
  createdAt: string;
}

export default function FloorsPage() {
  const { data, isLoading } = useGetFloorsQuery({});

  const columns: Column<Floor>[] = [
    {
      header: 'Floor Name/Level',
      accessorKey: 'name',
      cell: (floor) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center mr-3">
            <LayoutDashboard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              {floor.name} (Lvl: {floor.metadata?.level || floor.level})
              <Badge variant="secondary" className="text-xs uppercase">{floor.id.split('-')[0]}</Badge>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Tower',
      accessorKey: 'tower',
      cell: (floor) => (
        <Badge variant="outline" className="font-normal">
          {floor.parent?.name || floor.tower?.name || 'N/A'}
        </Badge>
      )
    },
    {
      header: 'Building',
      accessorKey: 'building',
      cell: (floor) => (
        <Badge variant="outline" className="font-normal">
          {floor.parent?.parent?.name || floor.tower?.building?.name || 'N/A'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (floor) => (
        <div className="flex space-x-2">
          <Link href={`/organization/floors/${floor.id}`}>
            <Button variant="outline" size="sm">View</Button>
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm space-y-6 w-full">
      <PageHeader 
        title="Floors" 
        description="Manage floors within your towers."
        action={
          <Link href="/organization/floors/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Floor
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
            <Input className="pl-10" placeholder="Search floors..." />
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
