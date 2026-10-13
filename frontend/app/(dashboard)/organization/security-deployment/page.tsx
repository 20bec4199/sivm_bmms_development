'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, MapPin, Plus, ShieldCheck, UserPlus, Users, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useGetBuildingsQuery } from '@/services/organizationApi';
import { useGetParkingAreasQuery } from '@/services/parkingApi';
import { useGetUsersQuery } from '@/services/userApi';
import {
  assignGuardToPost,
  createSecurityPost,
  getSecurityPosts,
  removeSecurityPostAssignment,
  updateSecurityPost,
  updateSecurityPostAssignment,
  type SecurityPost,
} from '@/services/securityApi';

interface GuardRecord {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  isActive: boolean;
  userRoles?: { role?: { name?: string } }[];
}

interface LocationRecord {
  id: string;
  name: string;
  nodeType?: string;
  propertyNode?: { name: string } | null;
}

interface ApiList<T> {
  data?: T[];
}

const listFrom = <T,>(response: unknown): T[] => {
  if (Array.isArray(response)) return response as T[];
  return ((response as ApiList<T> | undefined)?.data ?? []);
};

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-white/15 dark:bg-white/5 dark:text-white';
const labelClass = 'space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200';

const formatDate = (value: string | null) => value
  ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  : 'No date limit';

export default function SecurityDeploymentPage() {
  const queryClient = useQueryClient();
  const { data: posts = [], isLoading, isError } = useQuery({ queryKey: ['securityPosts'], queryFn: getSecurityPosts });
  const { data: usersResponse } = useGetUsersQuery({ take: 500 });
  const { data: buildingsResponse } = useGetBuildingsQuery({});
  const { data: parkingResponse } = useGetParkingAreasQuery(undefined);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [locationKind, setLocationKind] = useState<'NONE' | 'BUILDING' | 'PARKING'>('NONE');
  const [postForm, setPostForm] = useState({ name: '', postType: '', description: '', duties: '', locationId: '' });
  const [assignmentForm, setAssignmentForm] = useState({ guardId: '', shiftName: 'Day Shift', startsAt: '', endsAt: '', daysOfWeek: [] as string[] });
  const [formError, setFormError] = useState<string | null>(null);

  const guards = listFrom<GuardRecord>(usersResponse).filter((user) =>
    user.isActive && user.userRoles?.some(({ role }) => role?.name === 'SECURITY_GUARD'),
  );
  const buildings = listFrom<LocationRecord>(buildingsResponse);
  const parkingAreas = listFrom<LocationRecord>(parkingResponse);
  const locations = locationKind === 'BUILDING' ? buildings : parkingAreas;

  const refreshPosts = () => queryClient.invalidateQueries({ queryKey: ['securityPosts'] });
  const createPostMutation = useMutation({ mutationFn: createSecurityPost, onSuccess: refreshPosts });
  const assignMutation = useMutation({ mutationFn: ({ postId, payload }: { postId: string; payload: Parameters<typeof assignGuardToPost>[1] }) => assignGuardToPost(postId, payload), onSuccess: refreshPosts });
  const updatePostMutation = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateSecurityPost(id, { isActive }), onSuccess: refreshPosts });
  const updateAssignmentMutation = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateSecurityPostAssignment(id, { isActive }), onSuccess: refreshPosts });
  const removeAssignmentMutation = useMutation({ mutationFn: removeSecurityPostAssignment, onSuccess: refreshPosts });

  const handleCreatePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    try {
      await createPostMutation.mutateAsync({
        name: postForm.name.trim(),
        postType: postForm.postType.trim(),
        description: postForm.description.trim() || undefined,
        duties: postForm.duties.split(',').map((duty) => duty.trim()).filter(Boolean),
        ...(locationKind === 'BUILDING' && postForm.locationId ? { propertyNodeId: postForm.locationId } : {}),
        ...(locationKind === 'PARKING' && postForm.locationId ? { parkingAreaId: postForm.locationId } : {}),
      });
      setPostForm({ name: '', postType: '', description: '', duties: '', locationId: '' });
      setLocationKind('NONE');
    } catch {
      setFormError('Could not create this post. Check the location and try again.');
    }
  };

  const handleAssign = async (event: React.FormEvent<HTMLFormElement>, postId: string) => {
    event.preventDefault();
    setFormError(null);
    try {
      await assignMutation.mutateAsync({
        postId,
        payload: {
          guardId: assignmentForm.guardId,
          shiftName: assignmentForm.shiftName.trim() || 'General',
          ...(assignmentForm.startsAt ? { startsAt: new Date(assignmentForm.startsAt).toISOString() } : {}),
          ...(assignmentForm.endsAt ? { endsAt: new Date(assignmentForm.endsAt).toISOString() } : {}),
          daysOfWeek: assignmentForm.daysOfWeek,
        },
      });
      setAssignmentForm({ guardId: '', shiftName: 'Day Shift', startsAt: '', endsAt: '', daysOfWeek: [] });
      setExpandedPostId(null);
    } catch {
      setFormError('Could not assign this guard. Confirm the account is active and assigned the Security Guard role.');
    }
  };

  const toggleDay = (day: string) => setAssignmentForm((current) => ({
    ...current,
    daysOfWeek: current.daysOfWeek.includes(day)
      ? current.daysOfWeek.filter((selected) => selected !== day)
      : [...current.daysOfWeek, day],
  }));

  const locationLabel = (post: SecurityPost) => {
    if (post.parkingArea) return `Parking · ${post.parkingArea.name}${post.parkingArea.propertyNode ? ` · ${post.parkingArea.propertyNode.name}` : ''}`;
    if (post.propertyNode) return `${post.propertyNode.nodeType} · ${post.propertyNode.name}`;
    return 'Organization-wide / mobile post';
  };

  return (
    <div className="w-full space-y-7">
      <PageHeader title="Security Deployment" description="Configure organization-specific posts and assign guards by location, duty, and shift." />

      <section className="border-y border-slate-200 py-5 dark:border-white/10">
        <div className="mb-4 flex items-center gap-2">
          <Plus size={17} className="text-blue-700 dark:text-blue-400" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Create a deployment post</h2>
        </div>
        <form onSubmit={handleCreatePost} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className={labelClass}>Post name *
            <input required minLength={2} className={inputClass} placeholder="North Main Gate" value={postForm.name} onChange={(event) => setPostForm({ ...postForm, name: event.target.value })} />
          </label>
          <label className={labelClass}>Post type * <span className="text-xs font-normal text-slate-500">Custom label</span>
            <input required minLength={2} className={inputClass} placeholder="Gate, Parking Patrol, Lobby..." value={postForm.postType} onChange={(event) => setPostForm({ ...postForm, postType: event.target.value })} />
          </label>
          <label className={labelClass}>Location type
            <select className={inputClass} value={locationKind} onChange={(event) => { setLocationKind(event.target.value as typeof locationKind); setPostForm({ ...postForm, locationId: '' }); }}>
              <option value="NONE">Mobile / organization-wide</option>
              <option value="BUILDING">Building or property</option>
              <option value="PARKING">Parking area</option>
            </select>
          </label>
          {locationKind !== 'NONE' && (
            <label className={labelClass}>{locationKind === 'BUILDING' ? 'Building / property' : 'Parking area'} *
              <select required className={inputClass} value={postForm.locationId} onChange={(event) => setPostForm({ ...postForm, locationId: event.target.value })}>
                <option value="">Choose location</option>
                {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
              </select>
            </label>
          )}
          <label className={labelClass}>Duties <span className="text-xs font-normal text-slate-500">Comma-separated, customized per post</span>
            <input className={inputClass} placeholder="Visitor check-in, package log, emergency response" value={postForm.duties} onChange={(event) => setPostForm({ ...postForm, duties: event.target.value })} />
          </label>
          <label className={`${labelClass} md:col-span-2 xl:col-span-3`}>Description
            <textarea rows={2} className={inputClass} placeholder="Post-specific instructions or coverage notes" value={postForm.description} onChange={(event) => setPostForm({ ...postForm, description: event.target.value })} />
          </label>
          <div className="flex items-end xl:col-span-3">
            <button disabled={createPostMutation.isPending} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
              <Plus size={16} /> {createPostMutation.isPending ? 'Creating...' : 'Create post'}
            </button>
          </div>
        </form>
        {formError && <p role="alert" className="mt-3 text-sm text-red-600">{formError}</p>}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Posts and assignments</h2>
            <p className="mt-1 text-sm text-slate-500">{posts.length} configured post{posts.length === 1 ? '' : 's'} · {guards.length} active guard account{guards.length === 1 ? '' : 's'}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> Site coverage</span>
            <span className="inline-flex items-center gap-1.5"><CalendarClock size={14} /> Shift schedule</span>
            <span className="inline-flex items-center gap-1.5"><Users size={14} /> Guard assignments</span>
          </div>
        </div>

        {isLoading ? <p className="py-10 text-center text-sm text-slate-500">Loading deployment...</p> : null}
        {isError ? <p role="alert" className="py-10 text-center text-sm text-red-600">Could not load security deployment settings.</p> : null}
        {!isLoading && !isError && posts.length === 0 ? (
          <div className="border-y border-slate-200 py-12 text-center dark:border-white/10">
            <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <p className="font-semibold text-slate-900 dark:text-white">No posts configured</p>
            <p className="mt-1 text-sm text-slate-500">Create a gate, parking, lobby, patrol, or organization-defined post above.</p>
          </div>
        ) : null}

        <div className="space-y-4">
          {posts.map((post) => (
            <article key={post.id} className={`border border-slate-200 dark:border-white/10 ${post.isActive ? 'bg-white dark:bg-white/[0.02]' : 'bg-slate-50 opacity-75 dark:bg-white/[0.01]'}`}>
              <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{post.name}</h3>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-500/10 dark:text-blue-300">{post.postType}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${post.isActive ? 'bg-green-50 text-green-800 dark:bg-green-500/10 dark:text-green-300' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-400'}`}>{post.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={14} />{locationLabel(post)}</p>
                  {post.description && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{post.description}</p>}
                  {post.duties.length > 0 && <p className="mt-2 text-xs text-slate-500">Duties: {post.duties.join(' · ')}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => { setFormError(null); setExpandedPostId(expandedPostId === post.id ? null : post.id); }} disabled={!post.isActive} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5">
                    <UserPlus size={15} /> Assign guard
                  </button>
                  <button type="button" onClick={() => updatePostMutation.mutate({ id: post.id, isActive: !post.isActive })} disabled={updatePostMutation.isPending} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5" title={post.isActive ? 'Deactivate post' : 'Activate post'}>{post.isActive ? 'Deactivate' : 'Activate'}</button>
                </div>
              </div>

              {expandedPostId === post.id && (
                <form onSubmit={(event) => handleAssign(event, post.id)} className="grid gap-3 border-t border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.025] md:grid-cols-2 xl:grid-cols-4">
                  <label className={labelClass}>Guard *
                    <select required className={inputClass} value={assignmentForm.guardId} onChange={(event) => setAssignmentForm({ ...assignmentForm, guardId: event.target.value })}>
                      <option value="">Choose active guard</option>
                      {guards.map((guard) => <option key={guard.id} value={guard.id}>{guard.firstName} {guard.lastName ?? ''} · {guard.email}</option>)}
                    </select>
                  </label>
                  <label className={labelClass}>Shift name *
                    <input required className={inputClass} value={assignmentForm.shiftName} onChange={(event) => setAssignmentForm({ ...assignmentForm, shiftName: event.target.value })} placeholder="Night Watch" />
                  </label>
                  <label className={labelClass}>Starts at
                    <input type="datetime-local" className={inputClass} value={assignmentForm.startsAt} onChange={(event) => setAssignmentForm({ ...assignmentForm, startsAt: event.target.value })} />
                  </label>
                  <label className={labelClass}>Ends at
                    <input type="datetime-local" className={inputClass} value={assignmentForm.endsAt} onChange={(event) => setAssignmentForm({ ...assignmentForm, endsAt: event.target.value })} />
                  </label>
                  <fieldset className="md:col-span-2 xl:col-span-4">
                    <legend className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Recurring days (leave all clear for any day)</legend>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {WEEKDAYS.map((day) => <label key={day} className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" checked={assignmentForm.daysOfWeek.includes(day)} onChange={() => toggleDay(day)} className="rounded border-slate-300 text-blue-700 focus:ring-blue-600" />{day.slice(0, 3)}</label>)}
                    </div>
                  </fieldset>
                  {formError && <p role="alert" className="text-sm text-red-600 md:col-span-2 xl:col-span-4">{formError}</p>}
                  <div className="flex gap-2 md:col-span-2 xl:col-span-4">
                    <button disabled={assignMutation.isPending || guards.length === 0} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{assignMutation.isPending ? 'Assigning...' : 'Save assignment'}</button>
                    <button type="button" onClick={() => setExpandedPostId(null)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 dark:border-white/15 dark:text-slate-300"><X size={14} /> Cancel</button>
                    {guards.length === 0 && <span className="self-center text-xs text-amber-700 dark:text-amber-300">Create a Security Guard account first.</span>}
                  </div>
                </form>
              )}

              <div className="border-t border-slate-200 dark:border-white/10">
                {post.assignments.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-slate-500">No guards assigned to this post.</p>
                ) : post.assignments.map((assignment) => (
                  <div key={assignment.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 last:border-0 dark:border-white/5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{assignment.guard.firstName} {assignment.guard.lastName ?? ''}<span className="ml-2 text-xs font-normal text-slate-500">{assignment.guard.email}</span></p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><CalendarClock size={13} />{assignment.shiftName}</span><span>{formatDate(assignment.startsAt)} to {formatDate(assignment.endsAt)}</span>{assignment.daysOfWeek.length > 0 && <span>{assignment.daysOfWeek.map((day) => day.slice(0, 3)).join(', ')}</span>}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${assignment.isActive ? 'bg-green-50 text-green-800 dark:bg-green-500/10 dark:text-green-300' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400'}`}>{assignment.isActive ? 'Assigned' : 'Inactive'}</span>
                      <button type="button" onClick={() => updateAssignmentMutation.mutate({ id: assignment.id, isActive: !assignment.isActive })} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5">{assignment.isActive ? 'Pause' : 'Restore'}</button>
                      <button type="button" onClick={() => removeAssignmentMutation.mutate(assignment.id)} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
