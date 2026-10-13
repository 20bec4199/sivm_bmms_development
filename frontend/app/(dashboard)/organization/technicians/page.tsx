'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Plus, X, Edit, Trash2, User, Mail, Phone, Briefcase, 
  Wrench, Calendar, Clock, Building2, CheckCircle2, AlertCircle, 
  ShieldCheck, Check, HelpCircle, AlertTriangle
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';
import { useConfirm } from '@/providers/ConfirmProvider';
import { 
  useGetTechniciansQuery, 
  useCreateTechnicianMutation, 
  useUpdateTechnicianMutation, 
  useDeleteTechnicianMutation 
} from '@/services/technicianApi';
import { useGetBuildingsQuery, useGetTowersQuery } from '@/services/organizationApi';

const SKILLS = [
  'Electrical', 'Plumbing', 'HVAC', 'Painting', 'Civil', 'Carpentry', 
  'IT & Networking', 'Security Systems', 'Deep Cleaning', 'Elevator Maintenance', 'Fire Safety'
];

const SHIFT_OPTIONS = [
  'General Day Shift (09:00 AM - 05:00 PM)',
  'Morning Shift (06:00 AM - 02:00 PM)',
  'Evening Shift (02:00 PM - 10:00 PM)',
  'Night Watch Shift (10:00 PM - 06:00 AM)',
  'Flexible / On-Call Rotation'
];

export default function TechniciansPage() {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  
  const { data: techniciansData, isLoading, refetch } = useGetTechniciansQuery({});
  const { data: buildingsData } = useGetBuildingsQuery({});
  const { data: towersData } = useGetTowersQuery({});
  
  const [createTechnician, { isLoading: isCreating }] = useCreateTechnicianMutation();
  const [updateTechnician, { isLoading: isUpdating }] = useUpdateTechnicianMutation();
  const [deleteTechnician] = useDeleteTechnicianMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    employeeId: '', departmentId: '', specialization: '',
    experience: '', shift: 'General Day Shift (09:00 AM - 05:00 PM)', joiningDate: '', emergencyContact: '',
    skills: [] as string[], availability: 'Available', workingHours: '09:00 AM - 05:00 PM',
    status: 'ACTIVE', assignedBuildings: [] as string[], assignedTowers: [] as string[]
  });

  const technicians = techniciansData?.data || [];
  const buildings = buildingsData?.data || [];
  const towers = towersData?.data || [];

  const columns = [
    { 
      header: 'Emp ID & Speciality', 
      accessorKey: 'technicianProfile.employeeId', 
      cell: (item: any) => (
        <div>
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 text-xs">
            {item.technicianProfile?.employeeId || 'EMP-UNASSIGNED'}
          </span>
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
            {item.technicianProfile?.specialization || 'General Maintenance'}
          </div>
        </div>
      ) 
    },
    { 
      header: 'Technician Profile', 
      accessorKey: 'name', 
      cell: (item: any) => (
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-slate-200 dark:border-slate-700">
            <User className="h-4 w-4" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 dark:text-white text-sm">
              {item.firstName} {item.lastName || ''}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {item.email}
            </div>
            {item.phone && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                📞 {item.phone}
              </div>
            )}
          </div>
        </div>
      )
    },
    { 
      header: 'Skills Matrix', 
      accessorKey: 'technicianProfile.skills', 
      cell: (item: any) => {
        const skills = item.technicianProfile?.skills || [];
        if (skills.length === 0) {
          return <span className="text-xs text-slate-400 italic">No skills tagged</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {skills.slice(0, 3).map((skill: string) => (
              <span key={skill} className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {skill}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                +{skills.length - 3} more
              </span>
            )}
          </div>
        );
      } 
    },
    { 
      header: 'Availability & Shift', 
      accessorKey: 'technicianProfile.shift', 
      cell: (item: any) => (
        <div className="text-xs space-y-0.5">
          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1 text-blue-500" />
            {item.technicianProfile?.availability || 'Available'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {item.technicianProfile?.shift || 'Day Shift'}
          </div>
        </div>
      ) 
    },
    { 
      header: 'Status', 
      accessorKey: 'technicianProfile.status', 
      cell: (item: any) => {
        const status = item.technicianProfile?.status || (item.isActive ? 'ACTIVE' : 'INACTIVE');
        return (
          <Badge variant={status === 'ACTIVE' ? 'success' : status === 'ON_LEAVE' ? 'warning' : 'danger'} className="px-2.5 py-0.5 text-[11px] font-extrabold uppercase">
            {status === 'ACTIVE' ? '✓ Active' : status === 'ON_LEAVE' ? '⏳ On Leave' : '× Inactive'}
          </Badge>
        );
      }
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (item: any) => (
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" onClick={() => handleEdit(item)} className="h-8 px-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800">
            <Edit className="h-3.5 w-3.5 mr-1" /> Edit Profile
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDelete(item.id, `${item.firstName} ${item.lastName || ''}`.trim())} className="h-8 px-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 border-rose-200 dark:border-rose-900" title="Remove Technician">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    },
  ];

  const handleEdit = (technician: any) => {
    setEditingId(technician.id);
    const profile = technician.technicianProfile || {};
    setFormData({
      firstName: technician.firstName || '',
      lastName: technician.lastName || '',
      email: technician.email || '',
      phone: technician.phone || '',
      employeeId: profile.employeeId || '',
      departmentId: technician.departmentId || '',
      specialization: profile.specialization || '',
      experience: profile.experience?.toString() || '',
      shift: profile.shift || 'General Day Shift (09:00 AM - 05:00 PM)',
      joiningDate: profile.joiningDate ? new Date(profile.joiningDate).toISOString().split('T')[0] : '',
      emergencyContact: profile.emergencyContact || '',
      skills: profile.skills || [],
      availability: profile.availability || 'Available',
      workingHours: profile.workingHours || '09:00 AM - 05:00 PM',
      status: profile.status || 'ACTIVE',
      assignedBuildings: profile.assignedBuildings || [],
      assignedTowers: profile.assignedTowers || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: 'Remove Technician Account',
      message: `Are you sure you want to remove technician "${name}"? They will no longer receive work orders or access building maintenance logs.`,
      confirmText: 'Yes, Remove Technician',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (isConfirmed) {
      try {
        await deleteTechnician(id).unwrap();
        dispatch(showWarning({ title: 'Technician Removed', message: `Successfully removed technician profile for ${name}.` }));
        refetch();
      } catch (err: any) {
        dispatch(showWarning({ title: 'Remove Failed', message: err.data?.message || 'Error occurred while removing technician profile.' }));
      }
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleBuilding = (id: string) => {
    setFormData(prev => ({
      ...prev,
      assignedBuildings: prev.assignedBuildings.includes(id)
        ? prev.assignedBuildings.filter(bId => bId !== id)
        : [...prev.assignedBuildings, id]
    }));
  };

  const toggleTower = (id: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTowers: prev.assignedTowers.includes(id)
        ? prev.assignedTowers.filter(tId => tId !== id)
        : [...prev.assignedTowers, id]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.firstName.trim() || !formData.email.trim()) {
      dispatch(showWarning({ title: 'Missing Required Fields', message: 'First Name and Email Address are mandatory to provision a technician account.' }));
      return;
    }

    try {
      const payload = {
        ...formData,
        departmentId: formData.departmentId || undefined,
        experience: formData.experience ? parseInt(formData.experience) : undefined,
      };

      if (editingId) {
        await updateTechnician({ id: editingId, ...payload }).unwrap();
        dispatch(showWarning({ title: 'Technician Updated', message: `Profile and skill assignments for ${formData.firstName} saved successfully.` }));
      } else {
        await createTechnician(payload).unwrap();
        dispatch(showWarning({ title: 'Technician Provisioned', message: `New maintenance account created for ${formData.firstName}.` }));
      }
      setIsModalOpen(false);
      setEditingId(null);
      refetch();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Operation Failed', message: err.data?.message || 'Failed to save technician record.' }));
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader 
        title="Technician & Workforce Management" 
        description="Provision maintenance specialists, configure trade skill matrices, and designate spatial property allocations."
        action={
          <Button 
            onClick={() => {
              setEditingId(null);
              setFormData({
                firstName: '', lastName: '', email: '', phone: '', employeeId: '', departmentId: '', specialization: '', experience: '', shift: 'General Day Shift (09:00 AM - 05:00 PM)', joiningDate: new Date().toISOString().split('T')[0], emergencyContact: '', skills: [], availability: 'Available', workingHours: '09:00 AM - 05:00 PM', status: 'ACTIVE', assignedBuildings: [], assignedTowers: []
              });
              setIsModalOpen(true);
            }} 
            className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-lg shadow-indigo-600/25"
          >
            <Plus className="mr-2 h-4 w-4" />
            Provision New Technician
          </Button>
        }
      />

      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <DataTable 
            data={technicians} 
            columns={columns} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>

      {/* Modern High-Clarity Enterprise Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 shadow-2xl my-8 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Sticky Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-20">
              <div className="flex items-center space-x-3">
                <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black shadow-xs">
                  <Wrench className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {editingId ? `Update Technician Profile` : 'Provision New Technician'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {editingId ? 'Modify professional certifications, schedules, and property allocations.' : 'Register a field specialist with specific trade skills and schedule availability.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Scrollable Form Content */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-8 divide-y divide-slate-100 dark:divide-slate-800">
              
              {/* SECTION 1: Personal & Contact Profile */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    1. Personal Identity & Contact
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5 flex items-center">
                      First Name <span className="text-rose-500 ml-1">*</span>
                    </label>
                    <Input 
                      placeholder="e.g. Marcus" 
                      value={formData.firstName} 
                      onChange={e => setFormData({...formData, firstName: e.target.value})} 
                      className="h-10 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                      Last Name
                    </label>
                    <Input 
                      placeholder="e.g. Vance" 
                      value={formData.lastName} 
                      onChange={e => setFormData({...formData, lastName: e.target.value})} 
                      className="h-10 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5 flex items-center">
                      <Mail className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                      Email Address <span className="text-rose-500 ml-1">*</span>
                    </label>
                    <Input 
                      type="email" 
                      disabled={!!editingId} 
                      placeholder="technician@bmms.com"
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      className="h-10 text-sm font-mono disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:text-slate-400"
                    />
                    {editingId && <p className="text-[11px] text-slate-400 mt-1">Primary identity email cannot be altered after registration.</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5 flex items-center">
                      <Phone className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                      Primary Phone Number
                    </label>
                    <Input 
                      placeholder="+1 (555) 392-8811" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      className="h-10 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Professional Profile & Qualifications */}
              <div className="pt-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-blue-500" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    2. Employment & Specialization Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-1">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                      Employee ID / Badge No.
                    </label>
                    <Input 
                      placeholder="e.g. TECH-9024" 
                      value={formData.employeeId} 
                      onChange={e => setFormData({...formData, employeeId: e.target.value})} 
                      className="h-10 font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                      Primary Specialization
                    </label>
                    <Input 
                      placeholder="e.g. HVAC & Refrigeration" 
                      value={formData.specialization} 
                      onChange={e => setFormData({...formData, specialization: e.target.value})} 
                      className="h-10 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                      Years of Experience
                    </label>
                    <Input 
                      type="number" 
                      min="0"
                      placeholder="e.g. 5" 
                      value={formData.experience} 
                      onChange={e => setFormData({...formData, experience: e.target.value})} 
                      className="h-10 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5 flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                      Date Joined
                    </label>
                    <Input 
                      type="date" 
                      value={formData.joiningDate} 
                      onChange={e => setFormData({...formData, joiningDate: e.target.value})} 
                      className="h-10 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                      Emergency Contact Number
                    </label>
                    <Input 
                      placeholder="+1 (555) 911-0022" 
                      value={formData.emergencyContact} 
                      onChange={e => setFormData({...formData, emergencyContact: e.target.value})} 
                      className="h-10 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                      Operational Status
                    </label>
                    <select 
                      className="w-full h-10 border border-slate-300 dark:border-slate-700 rounded-lg px-3 text-sm bg-white dark:bg-slate-900 font-extrabold outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-all" 
                      value={formData.status} 
                      onChange={e => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="ACTIVE" className="text-emerald-600 font-bold">✓ Active Operational</option>
                      <option value="ON_LEAVE" className="text-amber-600 font-bold">⏳ Currently On Leave</option>
                      <option value="INACTIVE" className="text-rose-600 font-bold">× Inactive / Deactivated</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Technical Skills Matrix */}
              <div className="pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wrench className="h-5 w-5 text-amber-500" />
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                      3. Technical Trade Skills ({formData.skills.length} Selected)
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Click buttons below to tag skills
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Assigned trade certifications determine automatic work order routing and SLA maintenance matches.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {SKILLS.map(skill => {
                    const isSelected = formData.skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center transition-all shadow-xs ${
                          isSelected 
                            ? 'bg-indigo-600 text-white border-2 border-indigo-700 shadow-md shadow-indigo-600/25 scale-[1.02]' 
                            : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isSelected ? <Check className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" /> : <span className="w-3.5 mr-1 text-slate-400">○</span>}
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4: Schedule & Property Allocation */}
              <div className="pt-6 space-y-5">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-emerald-500" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    4. Schedule & Property Allocation
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5 flex items-center">
                      Assigned Shift Rotation
                    </label>
                    <select
                      className="w-full h-10 border border-slate-300 dark:border-slate-700 rounded-lg px-3 text-sm bg-white dark:bg-slate-900 font-semibold outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                      value={formData.shift}
                      onChange={e => setFormData({...formData, shift: e.target.value})}
                    >
                      {SHIFT_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                      Current Dispatch Availability
                    </label>
                    <select
                      className="w-full h-10 border border-slate-300 dark:border-slate-700 rounded-lg px-3 text-sm bg-white dark:bg-slate-900 font-semibold outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                      value={formData.availability}
                      onChange={e => setFormData({...formData, availability: e.target.value})}
                    >
                      <option value="Available">🟢 Ready / Available for Dispatch</option>
                      <option value="Busy">🟡 Busy / Engaged on Work Order</option>
                      <option value="On Call">🟣 Standby / On Call</option>
                      <option value="Offline">⚪ Offline / Off Duty</option>
                    </select>
                  </div>
                </div>

                {/* Property Tiles Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  
                  {/* Buildings Assignment Chip Grid */}
                  <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 flex items-center">
                        <Building2 className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                        Assign Buildings ({formData.assignedBuildings.length})
                      </span>
                      {formData.assignedBuildings.length > 0 && (
                        <button type="button" onClick={() => setFormData({...formData, assignedBuildings: []})} className="text-[11px] text-rose-600 hover:underline font-bold">
                          Clear
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {buildings.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-4">No active buildings registered in this organization.</p>
                      ) : (
                        buildings.map((b: any) => {
                          const isSelected = formData.assignedBuildings.includes(b.id);
                          return (
                            <div 
                              key={b.id} 
                              onClick={() => toggleBuilding(b.id)}
                              className={`p-2.5 rounded-lg text-xs font-bold flex items-center justify-between cursor-pointer transition-all border ${
                                isSelected 
                                  ? 'bg-indigo-50/90 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 font-extrabold shadow-2xs' 
                                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <span className="truncate pr-2">{b.name}</span>
                              <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-400 text-transparent'}`}>
                                {isSelected ? '✓' : ''}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Towers Assignment Chip Grid */}
                  <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 flex items-center">
                        <Building2 className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                        Assign Towers ({formData.assignedTowers.length})
                      </span>
                      {formData.assignedTowers.length > 0 && (
                        <button type="button" onClick={() => setFormData({...formData, assignedTowers: []})} className="text-[11px] text-rose-600 hover:underline font-bold">
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {towers.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-4">No towers registered in this organization.</p>
                      ) : (
                        towers.map((t: any) => {
                          const isSelected = formData.assignedTowers.includes(t.id);
                          return (
                            <div 
                              key={t.id} 
                              onClick={() => toggleTower(t.id)}
                              className={`p-2.5 rounded-lg text-xs font-bold flex items-center justify-between cursor-pointer transition-all border ${
                                isSelected 
                                  ? 'bg-blue-50/90 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 font-extrabold shadow-2xs' 
                                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <span className="truncate pr-2">{t.name}</span>
                              <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${isSelected ? 'bg-blue-600 text-white' : 'border border-slate-400 text-transparent'}`}>
                                {isSelected ? '✓' : ''}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Modal Sticky Footer */}
            <div className="flex items-center justify-between p-5 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur sticky bottom-0 z-20 rounded-b-2xl">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                <HelpCircle className="h-3.5 w-3.5 mr-1 text-slate-400" />
                Required parameters marked with (<span className="text-rose-500 font-bold ml-0.5">*</span>)
              </span>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-5 font-bold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isCreating || isUpdating} 
                  className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md shadow-indigo-600/25 disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  {isCreating || isUpdating ? 'Saving Record...' : editingId ? 'Save Technician Changes' : 'Provision Technician'}
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
