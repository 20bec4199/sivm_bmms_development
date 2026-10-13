'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Building2, Search, Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useGetTowersQuery } from '@/services/organizationApi';

interface Tower {
  id: string;
  name: string;
  building: {
    name: string;
  };
  parent?: any;
  createdAt: string;
}

export default function TowersPage() {
  const { data, isLoading } = useGetTowersQuery({});

  const columns: Column<Tower>[] = [
    {
      header: 'Tower Name',
      accessorKey: 'name',
      cell: (tower) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center mr-3">
            <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              {tower.name}
              <Badge variant="secondary" className="text-xs uppercase">{tower.id.split('-')[0]}</Badge>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Building',
      accessorKey: 'building',
      cell: (tower) => (
        <Badge variant="outline" className="font-normal">
          {tower.parent?.name || tower.building?.name || 'N/A'}
        </Badge>
      )
    },
    {
      header: 'Created Date',
      accessorKey: 'createdAt',
      cell: (tower) => new Date(tower.createdAt).toLocaleDateString()
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (tower) => (
        <div className="flex space-x-2">
          <Link href={`/organization/towers/${tower.id}`}>
            <Button variant="outline" size="sm">View</Button>
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm space-y-6 w-full">
      <PageHeader 
        title="Towers" 
        description="Manage all towers and blocks within your buildings."
        action={
          <Link href="/organization/towers/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Tower
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
            <Input className="pl-10" placeholder="Search towers..." />
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
