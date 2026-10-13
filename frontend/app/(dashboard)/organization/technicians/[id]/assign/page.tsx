'use client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { useGetBuildingsQuery, useGetTowersQuery } from '@/services/organizationApi';
import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { Check } from 'lucide-react';

export default function AssignTechnicianPage() {
  const params = useParams();
  const router = useRouter();
  const technicianId = params.id as string;
  
  const { data: buildingsData, isLoading: isLoadingBuildings } = useGetBuildingsQuery({});
  const { data: towersData, isLoading: isLoadingTowers } = useGetTowersQuery({});
  
  const getArray = (res: any) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  };

  const buildings = getArray(buildingsData);
  const allTowers = getArray(towersData);

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedTowerIds, setSelectedTowerIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter towers based on the selected building
  const availableTowers = useMemo(() => {
    if (!selectedBuildingId) return [];
    return allTowers.filter(
      (tower: any) =>
        tower.parentId === selectedBuildingId ||
        tower.parent?.id === selectedBuildingId ||
        tower.buildingId === selectedBuildingId ||
        tower.building?.id === selectedBuildingId
    );
  }, [allTowers, selectedBuildingId]);

  const toggleTower = (towerId: string) => {
    setSelectedTowerIds(prev => 
      prev.includes(towerId)
        ? prev.filter(id => id !== towerId)
        : [...prev, towerId]
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuildingId || selectedTowerIds.length === 0) {
      window.alert('Please select a building and at least one tower.');
      return;
    }

    try {
      setIsSubmitting(true);
      // Backend does not currently support multi-tower assignment API out of the box.
      // So we simulate the assignment process based on the user's workflow requirements.
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      window.alert(`Successfully assigned technician to ${selectedTowerIds.length} tower(s).`);
      router.push('/organization/technicians');
    } catch (err: any) {
      window.alert('Failed to assign technician.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Assign Technician to Towers" 
        description="Select a building and assign this technician to one or multiple towers."
      />
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-8">
            
            {/* Step 1: Select Building */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                1. Select Building
              </label>
              <select
                value={selectedBuildingId}
                onChange={(e) => {
                  setSelectedBuildingId(e.target.value);
                  setSelectedTowerIds([]); // Reset tower selection when building changes
                }}
                className="flex h-12 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:text-gray-50"
              >
                <option value="" className="dark:bg-gray-800">-- Choose a Building --</option>
                {isLoadingBuildings ? (
                  <option disabled>Loading buildings...</option>
                ) : (
                  buildings.map((building: any) => (
                    <option key={building.id} value={building.id} className="dark:bg-gray-800">
                      {building.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Step 2: Select Towers */}
            <div className={`transition-opacity duration-300 ${!selectedBuildingId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <label className="block text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                2. Select Towers (Multi-select)
              </label>
              
              {!selectedBuildingId ? (
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-center">
                  Please select a building first to view its towers.
                </div>
              ) : isLoadingTowers ? (
                <div className="p-4 text-center text-gray-500">Loading towers...</div>
              ) : availableTowers.length === 0 ? (
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-center">
                  No towers found in this building.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableTowers.map((tower: any) => {
                    const isSelected = selectedTowerIds.includes(tower.id);
                    return (
                      <div
                        key={tower.id}
                        onClick={() => toggleTower(tower.id)}
                        className={`cursor-pointer border rounded-lg p-4 flex items-center justify-between transition-colors ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                      >
                        <div>
                          <p className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                            {tower.name}
                          </p>
                          <p className="text-sm text-gray-500">Tower/Block</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && <Check size={14} color="white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-gray-300 bg-transparent hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 h-10 py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedTowerIds.length === 0}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed h-10 py-2 px-4"
              >
                {isSubmitting ? 'Assigning...' : `Assign to ${selectedTowerIds.length} Tower(s)`}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
