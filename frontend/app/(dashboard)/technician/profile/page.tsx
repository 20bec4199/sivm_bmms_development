'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useGetProfileQuery } from '@/services/authApi';
import { User, Phone, Mail, Building, Building2, Briefcase, Clock, Calendar } from 'lucide-react';

export default function TechnicianProfilePage() {
  const { data: profileResponse, isLoading } = useGetProfileQuery({});

  if (isLoading) {
    return <div className="p-8">Loading profile...</div>;
  }

  const user = profileResponse as any;
  const tech = user?.technicianProfile;

  if (!user || !tech) {
    return <div className="p-8 text-red-500">Could not load technician profile details.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader 
        title="My Profile" 
        description="View your personal information and assigned properties."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Details */}
        <Card className="md:col-span-2 border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><User size={14} /> Full Name</label>
                <div className="font-medium text-gray-900 dark:text-white text-lg">
                  {user.firstName} {user.lastName}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Briefcase size={14} /> Employee ID</label>
                <div className="font-medium text-gray-900 dark:text-white text-lg">
                  {tech.employeeId || 'N/A'}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Mail size={14} /> Email Address</label>
                <div className="font-medium text-gray-900 dark:text-white">
                  {user.email}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Phone size={14} /> Phone Number</label>
                <div className="font-medium text-gray-900 dark:text-white">
                  {user.phone || 'N/A'}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Briefcase size={14} /> Specialization</label>
                <div className="font-medium text-gray-900 dark:text-white">
                  {tech.specialization || 'General'}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar size={14} /> Joined Date</label>
                <div className="font-medium text-gray-900 dark:text-white">
                  {tech.joiningDate ? new Date(tech.joiningDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>

            {tech.skills && tech.skills.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                <label className="text-xs text-gray-500 mb-3 block">Skills</label>
                <div className="flex flex-wrap gap-2">
                  {tech.skills.map((skill: string) => (
                    <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Work Status */}
          <Card className="border-0 shadow-sm bg-gray-50 dark:bg-gray-900/50">
            <CardHeader>
              <CardTitle className="text-lg">Work Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Current Status</label>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${tech.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                  {tech.status}
                </span>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Clock size={14} /> Shift</label>
                <div className="font-medium text-gray-900 dark:text-white">
                  {tech.shift || 'Standard'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignments */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Assignments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Building size={14} /> Assigned Buildings</label>
                {tech.assignedBuildings && tech.assignedBuildings.length > 0 ? (
                  <ul className="space-y-2">
                    {tech.assignedBuildings.map((b: string) => (
                      <li key={b} className="text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-2 rounded-md border border-gray-100 dark:border-gray-700">
                        {b}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No buildings assigned.</p>
                )}
              </div>
              
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <label className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Building2 size={14} /> Assigned Towers</label>
                {tech.assignedTowers && tech.assignedTowers.length > 0 ? (
                  <ul className="space-y-2">
                    {tech.assignedTowers.map((t: string) => (
                      <li key={t} className="text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-2 rounded-md border border-gray-100 dark:border-gray-700">
                        {t}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No towers assigned.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
