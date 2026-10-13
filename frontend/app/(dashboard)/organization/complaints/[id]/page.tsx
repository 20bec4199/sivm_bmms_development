'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ArrowLeft, Check, Clock, User, MessageSquare, Wrench, Phone, 
  Calendar, Building, Tag, AlertTriangle, CheckCircle2, Send, 
  Sparkles, ExternalLink
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { RequireModule } from '@/components/auth/RequireModule';
import { showWarning } from '@/store/slices/uiSlice';
import { 
  useGetComplaintByIdQuery, 
  useUpdateComplaintMutation, 
  useAddComplaintCommentMutation 
} from '@/services/complaintsApi';
import { useCreateWorkOrderMutation } from '@/services/workOrdersApi';
import { useGetUsersQuery } from '@/services/userApi';

export default function ComplaintDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const dispatch = useDispatch();
  const router = useRouter();

  const { data: complaint, isLoading, refetch } = useGetComplaintByIdQuery(id);
  const { data: usersData } = useGetUsersQuery({ limit: 100 });
  const [updateComplaint, { isLoading: isUpdating }] = useUpdateComplaintMutation();
  const [addComment, { isLoading: isCommenting }] = useAddComplaintCommentMutation();
  const [createWorkOrder, { isLoading: isCreatingWorkOrder }] = useCreateWorkOrderMutation();

  const [commentText, setCommentText] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
  const [workOrderForm, setWorkOrderForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assignedToId: '',
    dueDate: '',
  });

  const technicians = usersData?.data?.filter((u: any) => 
    u.userRoles?.some((r: any) => ['TECHNICIAN', 'ELECTRICIAN', 'PLUMBER', 'HVAC_TECHNICIAN'].includes(r.role?.name)) ||
    u.roles?.some((r: string) => ['TECHNICIAN', 'ELECTRICIAN', 'PLUMBER', 'HVAC_TECHNICIAN'].includes(r))
  ) || [];

  if (isLoading) {
    return (
      <RequireModule moduleCode="COMPLAINT_MANAGEMENT">
        <div className="p-12 text-center text-slate-500 font-bold animate-pulse">Loading incident record...</div>
      </RequireModule>
    );
  }

  if (!complaint) {
    return (
      <RequireModule moduleCode="COMPLAINT_MANAGEMENT">
        <div className="p-12 text-center text-slate-500 font-bold">
          <p>Complaint ticket not found.</p>
          <Link href="/organization/complaints" className="text-indigo-600 underline mt-2 inline-block">
            Return to Complaints Center
          </Link>
        </div>
      </RequireModule>
    );
  }

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateComplaint({ id, body: { status: newStatus } }).unwrap();
      dispatch(showWarning({ title: 'Status Updated', message: `Ticket status moved to ${newStatus}.` }));
      refetch();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Update Failed', message: err.data?.message || 'Failed to update status.' }));
    }
  };

  const handleAssign = async () => {
    if (!assigneeId) return;
    try {
      await updateComplaint({ id, body: { assignedToId: assigneeId, status: 'ASSIGNED' } }).unwrap();
      dispatch(showWarning({ title: 'Technician Assigned', message: 'Assigned successfully.' }));
      refetch();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Assign Failed', message: err.data?.message || 'Failed to assign technician.' }));
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addComment({ id, content: commentText }).unwrap();
      setCommentText('');
      dispatch(showWarning({ title: 'Comment Posted', message: 'Note added to ticket history.' }));
      refetch();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Failed to Post', message: err.data?.message || 'Error posting comment.' }));
    }
  };

  const openWorkOrderModal = () => {
    setWorkOrderForm({
      title: `Fix Issue: ${complaint.title}`,
      description: complaint.description || '',
      priority: complaint.priority || 'MEDIUM',
      assignedToId: complaint.assignedToId || (technicians[0]?.id || ''),
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setIsWorkOrderModalOpen(true);
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workOrderForm.title.trim()) return;

    try {
      await createWorkOrder({
        title: workOrderForm.title,
        description: workOrderForm.description,
        priority: workOrderForm.priority,
        propertyNodeId: complaint.propertyNodeId || undefined,
        assignedToId: workOrderForm.assignedToId || undefined,
        complaintId: complaint.id,
        dueDate: workOrderForm.dueDate ? new Date(workOrderForm.dueDate).toISOString() : undefined,
      }).unwrap();

      dispatch(showWarning({ 
        title: 'Work Order Dispatched', 
        message: 'Work order created and linked directly to this complaint.' 
      }));
      setIsWorkOrderModalOpen(false);
      refetch();
    } catch (err: any) {
      dispatch(showWarning({ 
        title: 'Dispatch Failed', 
        message: err?.data?.message || 'Failed to create work order.' 
      }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'WORK_ORDER_CREATED':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 font-extrabold border-purple-300">🛠️ Work Order Dispatched</Badge>;
      case 'RESOLVED':
      case 'CLOSED':
      case 'COMPLETED':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-extrabold border-emerald-300">✓ {status}</Badge>;
      case 'IN_PROGRESS':
      case 'ASSIGNED':
        return <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 font-extrabold border-indigo-300">⚙️ In Progress</Badge>;
      case 'CRITICAL':
        return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 font-extrabold border-rose-300 animate-pulse">🔥 Critical Alert</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300 font-extrabold border-amber-400">⏳ {status}</Badge>;
    }
  };

  return (
    <RequireModule moduleCode="COMPLAINT_MANAGEMENT">
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <div className="flex items-center justify-between">
          <Link 
            href="/organization/complaints" 
            className="inline-flex items-center text-xs font-extrabold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Complaints Ledger
          </Link>
          <span className="text-xs font-mono text-slate-400">
            Ticket ID: {complaint.id}
          </span>
        </div>

        {/* Hero Header Strip */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                {complaint.title}
              </h1>
              {getStatusBadge(complaint.status)}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap">
              <span>Logged by <strong className="text-slate-700 dark:text-slate-300">{complaint.creator?.firstName || 'Resident'} {complaint.creator?.lastName || ''}</strong></span>
              <span>•</span>
              <span>Priority: <strong className="text-slate-700 dark:text-slate-300">{complaint.priority}</strong></span>
              <span>•</span>
              <span>Date: {new Date(complaint.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!['RESOLVED', 'CLOSED', 'COMPLETED', 'WORK_ORDER_CREATED'].includes(complaint.status) && (
              <Button 
                onClick={openWorkOrderModal}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
              >
                <Wrench size={14} /> Dispatch Work Order
              </Button>
            )}
            {complaint.status === 'NEW' && (
              <Button variant="outline" onClick={() => handleStatusUpdate('UNDER_REVIEW')} disabled={isUpdating} className="text-xs font-bold">
                Review
              </Button>
            )}
            {['NEW', 'UNDER_REVIEW'].includes(complaint.status) && (
              <Button onClick={() => handleStatusUpdate('APPROVED')} disabled={isUpdating} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
                Approve
              </Button>
            )}
            {complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED' && (
              <Button onClick={() => handleStatusUpdate('RESOLVED')} disabled={isUpdating} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
                Mark Resolved
              </Button>
            )}
            {complaint.status === 'RESOLVED' && (
              <Button onClick={() => handleStatusUpdate('CLOSED')} disabled={isUpdating} variant="outline" className="text-xs font-bold">
                Close Ticket
              </Button>
            )}
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Details Description */}
            <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                  <Tag size={16} className="text-indigo-500" />
                  Issue Details & Observations
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {complaint.description || 'No detailed issue observations recorded.'}
                </p>

                {complaint.feedbackText && (
                  <div className="mt-6 p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                    <h4 className="font-bold text-xs text-indigo-900 dark:text-indigo-300 mb-1 flex items-center gap-1.5">
                      <Sparkles size={14} /> Resident Feedback & Rating
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      "{complaint.feedbackText}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Linked Work Orders */}
            {complaint.workOrders && complaint.workOrders.length > 0 && (
              <Card className="rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <CardHeader className="bg-purple-50/50 dark:bg-purple-950/20 border-b border-purple-100 dark:border-purple-900/30">
                  <CardTitle className="text-sm font-extrabold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                    <Wrench size={16} />
                    Linked Maintenance Work Orders ({complaint.workOrders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
                  {complaint.workOrders.map((wo: any) => (
                    <div key={wo.id} className="p-4 flex flex-col md:flex-row justify-between gap-4 items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{wo.title}</h4>
                          <Badge className="text-[10px] font-bold">{wo.status}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{wo.description}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                          <span>Created: {new Date(wo.createdAt).toLocaleDateString()}</span>
                          {wo.dueDate && <span>Due: {new Date(wo.dueDate).toLocaleDateString()}</span>}
                        </div>
                      </div>

                      {wo.assignedTo && (
                        <div className="text-xs bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 min-w-[200px]">
                          <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <User size={13} className="text-indigo-500" />
                            {wo.assignedTo.firstName} {wo.assignedTo.lastName}
                          </div>
                          {wo.assignedTo.phone && (
                            <div className="text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                              <Phone size={10} /> {wo.assignedTo.phone}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Comments Thread */}
            <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                  <MessageSquare size={16} className="text-indigo-500" />
                  Investigation Log & Discussion
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-3">
                  {(!complaint.comments || complaint.comments.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">No notes or comments posted yet.</p>
                  ) : (
                    complaint.comments.map((c: any) => (
                      <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex gap-3">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xs shrink-0">
                          {c.user?.firstName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {c.user?.firstName} {c.user?.lastName || ''}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300">{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                  <Input
                    placeholder="Add an investigation note, resident update, or comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                  <Button 
                    type="submit" 
                    disabled={!commentText.trim() || isCommenting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0"
                  >
                    <Send size={13} className="mr-1" /> Post
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Routing & Assignment */}
          <div className="space-y-6">
            <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                  <Building size={16} className="text-indigo-500" />
                  Routing & Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                {/* Category */}
                <div>
                  <span className="text-slate-400 block mb-1 font-bold">Category</span>
                  <Badge variant="outline" className="font-bold">
                    <Tag size={11} className="mr-1 text-indigo-500" />
                    {complaint.category?.name || 'General Maintenance'}
                  </Badge>
                </div>

                {/* Property Unit */}
                <div>
                  <span className="text-slate-400 block mb-1 font-bold">Property Location</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Building size={13} className="text-indigo-500" />
                    {complaint.propertyNode ? `Unit ${complaint.propertyNode.name}` : 'Common Area'}
                  </div>
                </div>

                {/* Assigned Technician */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1.5 font-bold">Direct Technician Assignment</span>
                  {complaint.assignedTo ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 font-bold">
                        {complaint.assignedTo.firstName?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {complaint.assignedTo.firstName} {complaint.assignedTo.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">{complaint.assignedTo.email}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select 
                        className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                        value={assigneeId}
                        onChange={(e) => setAssigneeId(e.target.value)}
                      >
                        <option value="">Select Technician...</option>
                        {technicians.map((tech: any) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.firstName} {tech.lastName} ({tech.email})
                          </option>
                        ))}
                      </select>
                      <Button 
                        onClick={handleAssign}
                        disabled={!assigneeId || isUpdating}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                      >
                        Assign Technician
                      </Button>
                    </div>
                  )}
                </div>

                {/* Quick 1-Click Dispatch Button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button 
                    onClick={openWorkOrderModal}
                    variant="outline" 
                    className="w-full border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-bold text-xs"
                  >
                    <Wrench size={13} className="mr-1.5" /> Dispatch Work Order
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Audit History Timeline */}
            <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                  <Clock size={16} className="text-indigo-500" />
                  Status Audit Log
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {(!complaint.history || complaint.history.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No previous state transitions.</p>
                ) : (
                  complaint.history.map((h: any) => (
                    <div key={h.id} className="text-xs p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center font-bold text-slate-800 dark:text-slate-200">
                        <span>{h.statusFrom} → {h.statusTo}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(h.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {h.notes && <p className="text-[11px] text-slate-500 mt-1">{h.notes}</p>}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal: Dispatch Work Order from Detail Page */}
        <Modal 
          isOpen={isWorkOrderModalOpen} 
          onClose={() => setIsWorkOrderModalOpen(false)}
          title={`Dispatch Work Order for Ticket #${complaint.id.slice(0, 8)}`}
        >
          <form onSubmit={handleCreateWorkOrder} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Work Order Title *</label>
              <Input
                value={workOrderForm.title}
                onChange={(e) => setWorkOrderForm({ ...workOrderForm, title: e.target.value })}
                required
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                <select
                  value={workOrderForm.priority}
                  onChange={(e) => setWorkOrderForm({ ...workOrderForm, priority: e.target.value })}
                  className="w-full h-10 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                >
                  <option value="LOW">🟢 Low</option>
                  <option value="MEDIUM">⚡ Medium</option>
                  <option value="HIGH">⚠️ High</option>
                  <option value="CRITICAL">🔥 Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                <Input
                  type="date"
                  value={workOrderForm.dueDate}
                  onChange={(e) => setWorkOrderForm({ ...workOrderForm, dueDate: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Assign Technician</label>
              <select
                value={workOrderForm.assignedToId}
                onChange={(e) => setWorkOrderForm({ ...workOrderForm, assignedToId: e.target.value })}
                className="w-full h-10 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                <option value="">Select Technician...</option>
                {technicians.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    👤 {t.firstName} {t.lastName} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Work Scope Instructions</label>
              <textarea
                value={workOrderForm.description}
                onChange={(e) => setWorkOrderForm({ ...workOrderForm, description: e.target.value })}
                rows={3}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsWorkOrderModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isCreatingWorkOrder}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
              >
                {isCreatingWorkOrder ? 'Dispatching...' : 'Dispatch Work Order'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </RequireModule>
  );
}
