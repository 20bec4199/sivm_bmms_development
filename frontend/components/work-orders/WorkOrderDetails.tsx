'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  useGetWorkOrderByIdQuery, 
  useUpdateWorkOrderMutation,
  useToggleChecklistMutation,
  useAddHistoryMutation 
} from '@/services/workOrdersApi';
import { useDispatch, useSelector } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';
import { ArrowLeft, Clock, User, Building, Upload, AlertCircle, MessageSquare, Check, ArrowRight, Play, Pause, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

interface Props {
  workOrderId: string;
  backUrl: string;
}

export function WorkOrderDetails({ workOrderId, backUrl }: Props) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.auth);
  
  const { data: workOrder, isLoading, refetch } = useGetWorkOrderByIdQuery(workOrderId);
  const [updateWorkOrder, { isLoading: isUpdating }] = useUpdateWorkOrderMutation();
  const [toggleChecklist] = useToggleChecklistMutation();
  const [addHistory, { isLoading: isAddingHistory }] = useAddHistoryMutation();
  
  const [actualHours, setActualHours] = useState('');
  const [remarks, setRemarks] = useState('');
  const [newNote, setNewNote] = useState('');
  
  const canUpdateStatus = user?.roles?.includes('TECHNICIAN') || user?.roles?.includes('ORGANIZATION_ADMIN') || user?.roles?.includes('BUILDING_MANAGER');
  const isAdmin = user?.roles?.includes('ORGANIZATION_ADMIN') || user?.roles?.includes('BUILDING_MANAGER');

  if (isLoading) return <div className="p-8">Loading work order details...</div>;
  if (!workOrder) return <div className="p-8 text-red-500">Work order not found.</div>;

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const payload: any = { status: newStatus };
      if (newStatus === 'COMPLETED' && actualHours) {
        payload.actualHours = parseFloat(actualHours);
        payload.remarks = remarks;
      }
      await updateWorkOrder({ id: workOrderId, data: payload }).unwrap();
      dispatch(showWarning({ title: 'Success', message: `Work order status updated to ${newStatus}` }));
      refetch();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Update Failed', message: err.data?.message || 'Failed to update work order' }));
    }
  };

  const handleToggleChecklist = async (checklistId: string, currentStatus: boolean) => {
    try {
      await toggleChecklist({ workOrderId, checklistId, isCompleted: !currentStatus }).unwrap();
      refetch();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Error', message: err.data?.message || 'Failed to update checklist' }));
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      await addHistory({ workOrderId, notes: newNote.trim() }).unwrap();
      setNewNote('');
      refetch();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Error', message: err.data?.message || 'Failed to add log note' }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'CREATED': return 'default';
      case 'OPEN': return 'default';
      case 'ASSIGNED': return 'primary';
      case 'ACCEPTED': return 'info';
      case 'TRAVELLING': return 'warning';
      case 'PENDING_ACCEPTANCE': return 'warning';
      case 'IN_PROGRESS': return 'primary';
      case 'ON_HOLD': return 'danger';
      case 'WAITING_PARTS': return 'warning';
      case 'WAITING_APPROVAL': return 'info';
      case 'VERIFYING': return 'info';
      case 'COMPLETED': return 'success';
      case 'CLOSED': return 'default';
      case 'CANCELLED': return 'danger';
      default: return 'default';
    }
  };

  const getPriorityBadge = (priority: string) => {
    return priority === 'CRITICAL' || priority === 'HIGH' ? 'danger' : priority === 'MEDIUM' ? 'warning' : 'info';
  };

  const formatStatus = (status: string) => status.replace(/_/g, ' ');

  // Timeline phases
  const phases = ['CREATED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'];
  const currentPhaseIndex = phases.indexOf(workOrder.status === 'VERIFYING' ? 'COMPLETED' : 
                                            workOrder.status === 'TRAVELLING' ? 'ACCEPTED' : 
                                            workOrder.status === 'ON_HOLD' || workOrder.status === 'WAITING_PARTS' ? 'IN_PROGRESS' : 
                                            workOrder.status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <button onClick={() => router.push(backUrl)} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{workOrder.title}</h1>
            <Badge variant={getStatusBadge(workOrder.status) as any}>{formatStatus(workOrder.status)}</Badge>
            <Badge variant={getPriorityBadge(workOrder.priority) as any}>{workOrder.priority}</Badge>
          </div>
          <p className="text-gray-500 text-sm flex items-center gap-2">
            <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
              WO-{workOrder.woNumber || workOrder.id.split('-')[0]}
            </span>
            • Created on {new Date(workOrder.createdAt).toLocaleDateString()}
          </p>
        </div>
        
        {/* Actions based on Role and Status */}
        <div className="flex flex-wrap gap-2">
          {canUpdateStatus && (
            <div className="flex flex-wrap gap-2">
              {['ASSIGNED'].includes(workOrder.status) && (
                <Button onClick={() => handleStatusUpdate('ACCEPTED')} isLoading={isUpdating} variant="primary">
                  <Check className="w-4 h-4 mr-2" /> Accept Assignment
                </Button>
              )}
              
              {['ACCEPTED'].includes(workOrder.status) && (
                <Button onClick={() => handleStatusUpdate('TRAVELLING')} isLoading={isUpdating} variant="primary">
                  <ArrowRight className="w-4 h-4 mr-2" /> Start Travelling
                </Button>
              )}

              {['ACCEPTED', 'TRAVELLING', 'ON_HOLD', 'WAITING_PARTS'].includes(workOrder.status) && (
                <Button onClick={() => handleStatusUpdate('IN_PROGRESS')} isLoading={isUpdating} variant="success">
                  <Play className="w-4 h-4 mr-2" /> Start / Resume Work
                </Button>
              )}
              
              {['IN_PROGRESS'].includes(workOrder.status) && (
                <Button onClick={() => handleStatusUpdate('ON_HOLD')} isLoading={isUpdating} variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                  <Pause className="w-4 h-4 mr-2" /> Pause Work
                </Button>
              )}

              {['IN_PROGRESS'].includes(workOrder.status) && (
                <Button onClick={() => handleStatusUpdate('WAITING_PARTS')} isLoading={isUpdating} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  <AlertCircle className="w-4 h-4 mr-2" /> Wait for Parts
                </Button>
              )}

              {['IN_PROGRESS'].includes(workOrder.status) && (
                <Button onClick={() => handleStatusUpdate('COMPLETED')} isLoading={isUpdating} variant="primary">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Complete Work
                </Button>
              )}
            </div>
          )}
          
          {isAdmin && ['COMPLETED', 'WAITING_APPROVAL'].includes(workOrder.status) && (
            <Button onClick={() => handleStatusUpdate('VERIFYING')} isLoading={isUpdating} variant="secondary">
              <ShieldCheck className="w-4 h-4 mr-2 text-blue-600" /> Verify Work
            </Button>
          )}
          {isAdmin && workOrder.status === 'VERIFYING' && (
            <Button onClick={() => handleStatusUpdate('CLOSED')} isLoading={isUpdating} variant="outline">
              Close Work Order
            </Button>
          )}
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="bg-white/50 dark:bg-gray-900/30 rounded-2xl p-6 border border-gray-100 dark:border-gray-800/50 hidden md:block">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full transition-all duration-1000" 
            style={{ width: `${Math.max(0, (currentPhaseIndex / (phases.length - 1)) * 100)}%` }}
          />
          
          {phases.map((phase, idx) => {
            const isCompleted = idx <= currentPhaseIndex;
            const isCurrent = idx === currentPhaseIndex;
            return (
              <div key={phase} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors shadow-sm
                  ${isCompleted ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-white dark:bg-gray-800 text-gray-400 border-2 border-gray-200 dark:border-gray-700'}
                  ${isCurrent ? 'ring-4 ring-blue-100 dark:ring-blue-900/30 scale-110' : ''}
                `}>
                  {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${isCurrent ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-gray-900 dark:text-gray-300' : 'text-gray-400'}`}>
                  {phase.replace('_', ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <CardTitle>Work Description</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{workOrder.description || 'No description provided.'}</p>
              
              {/* If In Progress or On Hold, show update progress sections (mocked for now) */}
              {canUpdateStatus && ['IN_PROGRESS', 'ON_HOLD'].includes(workOrder.status) && (
                <div className="mt-8 space-y-4 border-t pt-6">
                  <h3 className="font-medium text-gray-900 dark:text-white">Update Progress</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-blue-600">Upload Before Photos</p>
                    </div>
                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-blue-600">Upload After Photos</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Actual Hours Spent</label>
                      <input 
                        type="number" 
                        value={actualHours}
                        onChange={(e) => setActualHours(e.target.value)}
                        placeholder="e.g. 2.5"
                        className="w-full border rounded-lg px-4 py-2 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Materials Used & Remarks</label>
                      <textarea 
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full border rounded-lg px-4 py-2 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]" 
                        placeholder="List any parts replaced or additional notes..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {workOrder.complaint && (
            <Card className="border-emerald-100 dark:border-emerald-900/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-emerald-50/50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-900/30">
                <CardTitle className="text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <MessageSquare size={18} />
                  Resident Complaint Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">{workOrder.complaint.title}</h4>
                      <Badge variant={workOrder.complaint.status === 'RESOLVED' || workOrder.complaint.status === 'CLOSED' ? 'success' : 'primary'}>
                        {workOrder.complaint.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl">
                      {workOrder.complaint.description}
                    </p>
                  </div>

                  <div className="md:min-w-[250px] bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Reported By</div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/50">
                        {workOrder.complaint.creator?.firstName?.charAt(0) || <User size={16} />}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {workOrder.complaint.creator?.firstName} {workOrder.complaint.creator?.lastName}
                        </div>
                        {workOrder.complaint.creator?.phone && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {workOrder.complaint.creator.phone}
                          </div>
                        )}
                        {workOrder.complaint.creator?.email && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {workOrder.complaint.creator.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Checklists Card */}
          {workOrder.checklists && workOrder.checklists.length > 0 && (
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="border-b border-gray-100 dark:border-gray-800 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  Maintenance Checklist ({workOrder.checklists.filter((c: any) => c.isCompleted).length}/{workOrder.checklists.length})
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {Math.round((workOrder.checklists.filter((c: any) => c.isCompleted).length / workOrder.checklists.length) * 100)}% Complete
                </Badge>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {workOrder.checklists.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => canUpdateStatus && handleToggleChecklist(item.id, item.isCompleted)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${canUpdateStatus ? 'cursor-pointer' : ''} ${
                      item.isCompleted 
                        ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50' 
                        : 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        item.isCompleted 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {item.isCompleted && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-sm font-medium ${item.isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                        {item.taskName}
                      </span>
                    </div>
                    {item.completedAt && (
                      <span className="text-xs text-gray-400">
                        {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Maintenance Service History & Log */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                Service Log & Maintenance History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record an operational log note or technician update..."
                  className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 bg-gray-50/50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button type="submit" disabled={isAddingHistory || !newNote.trim()} size="sm" className="bg-blue-600 text-white">
                  {isAddingHistory ? 'Saving...' : 'Add Note'}
                </Button>
              </form>

              <div className="space-y-3 pt-2">
                {workOrder.history && workOrder.history.length > 0 ? (
                  workOrder.history.map((entry: any, i: number) => (
                    <div key={entry.id || i} className="flex items-start gap-3 text-sm p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{entry.notes}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(entry.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">No historical log entries recorded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm bg-gray-50 dark:bg-gray-900/50">
            <CardHeader>
              <CardTitle className="text-lg">Assignment Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-2"><User size={14}/> Technician</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {workOrder.assignedTo ? `${workOrder.assignedTo.firstName} ${workOrder.assignedTo.lastName}` : 'Unassigned'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Clock size={14}/> Due Date</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {workOrder.dueDate ? new Date(workOrder.dueDate).toLocaleDateString() : 'No due date'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-2"><AlertCircle size={14}/> Estimated Hours</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {workOrder.estimatedHours ? `${workOrder.estimatedHours} hrs` : 'N/A'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Location Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {workOrder.propertyNode ? (
                <div>
                  <div className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Building size={14}/> Property Node</div>
                  <div className="font-medium text-gray-900 dark:text-white p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                    {workOrder.propertyNode.name}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center border border-dashed border-gray-200 dark:border-gray-700">No specific property linked.</p>
              )}
              
              {workOrder.asset && (
                <div>
                  <div className="text-sm text-gray-500 mb-1 flex items-center gap-2"><MapPin size={14} /> Target Asset</div>
                  <div className="font-medium text-gray-900 dark:text-white p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                    {workOrder.asset.name}
                  </div>
                </div>
              )}
              {workOrder.resident && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Resident Contact</div>
                  <div className="font-medium text-gray-900 dark:text-white">{workOrder.resident.firstName} {workOrder.resident.lastName}</div>
                  <div className="text-sm text-gray-500">{workOrder.resident.phone}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
