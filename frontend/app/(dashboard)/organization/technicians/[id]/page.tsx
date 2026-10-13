'use client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useGetUsersQuery } from '@/services/userApi';
import { useParams, useRouter } from 'next/navigation';
import { User, Mail, Phone, Calendar, ShieldCheck, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function TechnicianProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: usersData, isLoading } = useGetUsersQuery({});
  
  // Find the specific technician
  const users = Array.isArray(usersData) ? usersData : (usersData?.data || []);
  const technician = users.find((u: any) => u.id === params.id);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading technician profile...</div>;
  }

  if (!technician) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Technician not found</h2>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const roleName = technician.userRoles?.[0]?.role?.name?.replace('_', ' ') || 'TECHNICIAN';

  return (
    <div>
      <PageHeader 
        title="Technician Profile" 
        description="View details and performance metrics for this technician."
        action={
          <div className="flex gap-3">
            <Link 
              href={`/organization/technicians/${technician.id}/assign`}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 h-10 py-2 px-4"
            >
              Assign Towers
            </Link>
          </div>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-4">
                  <User size={40} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {technician.firstName} {technician.lastName}
                </h2>
                <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  <Briefcase size={12} className="mr-1" />
                  {roleName}
                </span>
                
                <div className="mt-4 flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${technician.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {technician.isActive ? 'Active Status' : 'Inactive Status'}
                  </span>
                </div>
              </div>

              <div className="mt-8 space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center text-sm">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-600 dark:text-gray-300">{technician.email}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-600 dark:text-gray-300">{technician.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Joined {new Date(technician.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats & Assignments */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-blue-500" />
                Current Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500 dark:text-gray-400 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center bg-gray-50 dark:bg-gray-800/50">
                <p>Tower assignments will be displayed here.</p>
                <p className="mt-2 text-xs">If this technician has no assigned towers, they will see all open Work Orders for the entire organization.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Work Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                No recent work orders found for this technician.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
