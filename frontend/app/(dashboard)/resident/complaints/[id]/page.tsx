'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useGetComplaintByIdQuery, useUpdateComplaintMutation, useAddComplaintCommentMutation } from '@/services/complaintsApi';
import { ArrowLeft, User, Wrench, Phone, Mail, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';

export default function ResidentComplaintDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const dispatch = useDispatch();
  
  const { data: complaint, isLoading, refetch } = useGetComplaintByIdQuery(id);
  const [updateComplaint, { isLoading: isUpdating }] = useUpdateComplaintMutation();
  const [addComment, { isLoading: isCommenting }] = useAddComplaintCommentMutation();

  const [commentText, setCommentText] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!complaint) return <div className="p-8">Complaint not found</div>;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addComment({ id, content: commentText }).unwrap();
      setCommentText('');
      refetch();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Failed to add comment', message: err.data?.message }));
    }
  };

  const handleCloseComplaint = async () => {
    try {
      await updateComplaint({ 
        id, 
        body: { 
          status: 'CLOSED', 
          feedbackText, 
          feedbackRating 
        } 
      }).unwrap();
      setShowFeedbackForm(false);
      refetch();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Failed to close complaint', message: err.data?.message }));
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'NEW': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'OPEN': return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400';
      case 'ASSIGNED': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'ACCEPTED': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'ON_HOLD': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'WAITING_FOR_PARTS': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'PENDING_APPROVAL': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400';
      case 'RESOLVED': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'CLOSED': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link href="/resident/complaints" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to My Complaints
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            {complaint.title}
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getStatusBadgeColor(complaint.status)}`}>
              {complaint.status}
            </span>
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-4 text-sm">
            <span>Submitted on {new Date(complaint.createdAt).toLocaleDateString()}</span>
            <span>Priority: <strong className="text-gray-700 dark:text-gray-300">{complaint.priority}</strong></span>
          </p>
        </div>
        
        <div className="flex gap-2">
          {complaint.status === 'RESOLVED' && !showFeedbackForm && (
            <Button onClick={() => setShowFeedbackForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              Close & Provide Feedback
            </Button>
          )}
        </div>
      </div>

      {showFeedbackForm && (
        <Card className="border-blue-200 dark:border-blue-800 shadow-md">
          <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10">
            <CardTitle className="text-blue-900 dark:text-blue-100">Rate your experience</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">How would you rate the service?</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    onClick={() => setFeedbackRating(star)}
                    className={`p-1 transition-colors ${star <= feedbackRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                  >
                    <svg className="w-8 h-8 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Additional Feedback</label>
              <textarea 
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                rows={3}
                placeholder="Tell us about the service quality..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowFeedbackForm(false)}>Cancel</Button>
              <Button onClick={handleCloseComplaint} disabled={isUpdating}>Submit Feedback & Close</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            {complaint.description}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Category</div>
              <div className="font-medium text-gray-900 dark:text-white">{complaint.category?.name}</div>
            </div>
            {complaint.assignedTo && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Assigned Technician</div>
                <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <User size={16} className="text-blue-500" />
                  {complaint.assignedTo.firstName} {complaint.assignedTo.lastName}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Linked Work Orders Section */}
      {complaint.workOrders && complaint.workOrders.length > 0 && (
        <Card className="border-indigo-100 dark:border-indigo-900/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/30">
            <CardTitle className="text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
              <Wrench size={18} />
              Maintenance Work Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {complaint.workOrders.map((wo: any) => (
                <div key={wo.id} className="p-6 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">{wo.title}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          ['COMPLETED', 'CLOSED'].includes(wo.status) ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          ['IN_PROGRESS'].includes(wo.status) ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {wo.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{wo.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          <span>Created: {new Date(wo.createdAt).toLocaleDateString()}</span>
                        </div>
                        {wo.dueDate && (
                          <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                            <Clock size={14} />
                            <span>Due: {new Date(wo.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {wo.assignedTo && (
                      <div className="md:min-w-[250px] bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Assigned Technician</div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800/50">
                            {wo.assignedTo.firstName?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white text-sm">
                              {wo.assignedTo.firstName} {wo.assignedTo.lastName}
                            </div>
                            {wo.assignedTo.phone && (
                              <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Phone size={10} />
                                {wo.assignedTo.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Comments & Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            {complaint.comments?.length === 0 ? (
              <p className="text-gray-500 italic text-sm">No comments yet.</p>
            ) : (
              complaint.comments?.map((comment: any) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0">
                    {comment.user?.firstName?.charAt(0) || <User size={16} />}
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 flex-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {comment.user?.firstName} {comment.user?.lastName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {complaint.status !== 'CLOSED' && (
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Add a comment or ask for an update..."
                className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <Button type="submit" disabled={!commentText.trim() || isCommenting}>
                Post
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
