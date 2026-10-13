import { axiosInstance } from './axios';

export type IncidentSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';
export type IncidentStatus = 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  incidentDate: string;
  reportedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentFilters {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  search?: string;
  skip?: number;
  take?: number;
}

export interface IncidentListResponse {
  data: SecurityIncident[];
  total: number;
  skip: number;
  take: number;
}

export interface PatrolCheckpoint {
  id: string;
  name: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  orderIndex: number;
  logs?: PatrolLog[];
}

export interface PatrolRoute {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  checkpoints?: PatrolCheckpoint[];
  _count?: { checkpoints: number };
}

export interface PatrolLog {
  id: string;
  checkpointId: string;
  guardId: string;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  scannedAt: string;
  checkpoint?: PatrolCheckpoint & { route?: { id: string; name: string } };
}

export interface VisitorProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  idNumber?: string | null;
}

export interface VisitorLog {
  id: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  notes?: string | null;
}

export interface VisitorRegistration {
  id: string;
  status: string;
  purpose?: string | null;
  vehiclePlate?: string | null;
  requiresParking: boolean;
  expectedArrival?: string | null;
  visitor: VisitorProfile;
  propertyNode?: { id?: string; name: string } | null;
  logs?: VisitorLog[];
  qrData?: string;
  qrCodeImage?: string;
}

export interface VisitorRegistrationListResponse {
  data: VisitorRegistration[];
  meta: { total: number; skip: number; take: number };
}

export interface AccessLogFilters {
  search?: string;
  date?: string;
  skip?: number;
  take?: number;
}

export interface AccessLogEntry extends VisitorLog {
  registration: {
    visitor: VisitorProfile;
    propertyNode?: { name: string } | null;
  };
}

export interface AccessLogResponse {
  data: AccessLogEntry[];
  total: number;
  skip: number;
  take: number;
}

export interface SecurityDashboardStats {
  totalIncidents: number;
  openIncidents: number;
  todayIncidents: number;
  activeVisitors: number;
  todayVisitorLogs: number;
  patrolRoutes: number;
  todayPatrolLogs: number;
}

export interface SecurityDashboardResponse {
  stats: SecurityDashboardStats;
  recentIncidents: Pick<SecurityIncident, 'id' | 'title' | 'severity' | 'status' | 'createdAt'>[];
  recentAccess: AccessLogEntry[];
}

export interface SecurityPostAssignment {
  id: string;
  guardId: string;
  shiftName: string;
  startsAt: string | null;
  endsAt: string | null;
  daysOfWeek: string[];
  notes: string | null;
  isActive: boolean;
  guard: { id: string; firstName: string; lastName: string | null; email: string; isActive?: boolean };
}

export interface SecurityPost {
  id: string;
  name: string;
  postType: string;
  description: string | null;
  duties: string[];
  propertyNodeId: string | null;
  parkingAreaId: string | null;
  propertyNode?: { id: string; name: string; nodeType: string } | null;
  parkingArea?: { id: string; name: string; propertyNode?: { id: string; name: string; nodeType: string } | null } | null;
  isActive: boolean;
  assignments: SecurityPostAssignment[];
}

export interface SaveSecurityPostInput {
  name: string;
  postType: string;
  description?: string;
  duties: string[];
  propertyNodeId?: string;
  parkingAreaId?: string;
}

export interface AssignGuardToPostInput {
  guardId: string;
  shiftName: string;
  startsAt?: string;
  endsAt?: string;
  daysOfWeek: string[];
  notes?: string;
}

export interface MyPostAssignment {
  id: string;
  shiftName: string;
  startsAt: string | null;
  endsAt: string | null;
  daysOfWeek: string[];
  notes: string | null;
  post: Pick<SecurityPost, 'id' | 'name' | 'postType' | 'description' | 'duties' | 'propertyNode' | 'parkingArea'>;
}

export const getSecurityDashboardStats = () =>
  axiosInstance.get<SecurityDashboardResponse>('/security/dashboard/stats').then((r) => r.data);

export const getMyAssignedPosts = () =>
  axiosInstance.get<MyPostAssignment[]>('/security/my-posts').then((r) => r.data);

export const getSecurityPosts = () =>
  axiosInstance.get<SecurityPost[]>('/security/posts').then((r) => r.data);

export const createSecurityPost = (data: SaveSecurityPostInput) =>
  axiosInstance.post<SecurityPost>('/security/posts', data).then((r) => r.data);

export const updateSecurityPost = (id: string, data: Partial<SaveSecurityPostInput> & { isActive?: boolean }) =>
  axiosInstance.patch<SecurityPost>(`/security/posts/${id}`, data).then((r) => r.data);

export const assignGuardToPost = (postId: string, data: AssignGuardToPostInput) =>
  axiosInstance.post<SecurityPostAssignment>(`/security/posts/${postId}/assignments`, data).then((r) => r.data);

export const updateSecurityPostAssignment = (id: string, data: { isActive?: boolean }) =>
  axiosInstance.patch<SecurityPostAssignment>(`/security/post-assignments/${id}`, data).then((r) => r.data);

export const removeSecurityPostAssignment = (id: string) =>
  axiosInstance.delete<{ success: boolean }>(`/security/post-assignments/${id}`).then((r) => r.data);

export const getIncidents = (params: IncidentFilters = {}) =>
  axiosInstance.get<IncidentListResponse>('/security/incidents', { params }).then((r) => r.data);

export const getIncident = (id: string) =>
  axiosInstance.get<SecurityIncident>(`/security/incidents/${id}`).then((r) => r.data);

export type CreateIncidentInput = {
  title: string;
  description: string;
  severity?: IncidentSeverity;
  incidentDate?: string;
};

export type UpdateIncidentInput = Partial<CreateIncidentInput> & { status?: IncidentStatus };

export const createIncident = (data: CreateIncidentInput) =>
  axiosInstance.post<SecurityIncident>('/security/incidents', data).then((r) => r.data);

export const updateIncident = (id: string, data: UpdateIncidentInput) =>
  axiosInstance.patch<SecurityIncident>(`/security/incidents/${id}`, data).then((r) => r.data);

export const getPatrolRoutes = () =>
  axiosInstance.get<PatrolRoute[]>('/security/patrol-routes').then((r) => r.data);

export const getPatrolRoute = (id: string) =>
  axiosInstance.get<PatrolRoute>(`/security/patrol-routes/${id}`).then((r) => r.data);

export interface CreatePatrolRouteInput {
  name: string;
  description?: string;
  checkpoints: {
    name: string;
    location?: string;
    orderIndex: number;
    latitude?: number;
    longitude?: number;
  }[];
}

export const createPatrolRoute = (data: CreatePatrolRouteInput) =>
  axiosInstance.post<PatrolRoute>('/security/patrol-routes', data).then((r) => r.data);

export const togglePatrolRoute = (id: string) =>
  axiosInstance.patch<PatrolRoute>(`/security/patrol-routes/${id}/toggle`).then((r) => r.data);

export interface LogPatrolCheckpointInput {
  checkpointId: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export const logPatrolCheckpoint = (data: LogPatrolCheckpointInput) =>
  axiosInstance.post<PatrolLog>('/security/patrol-logs', data).then((r) => r.data);

export const getPatrolLogs = (params: { routeId?: string; guardId?: string } = {}) =>
  axiosInstance.get<PatrolLog[]>('/security/patrol-logs', { params }).then((r) => r.data);

export const getAccessLog = (params: AccessLogFilters = {}) =>
  axiosInstance.get<AccessLogResponse>('/security/access-log', { params }).then((r) => r.data);

export const getVisitorRegistrations = (params: { skip?: number; take?: number } = {}) =>
  axiosInstance.get<VisitorRegistrationListResponse>('/visitor-registrations', { params }).then((r) => r.data);

export const verifyVisitorQr = (qrData: string) =>
  axiosInstance.post<{ valid: true; registration: VisitorRegistration }>(
    '/visitor-registrations/verify-qr',
    { qrData },
  ).then((r) => r.data);

export const getVisitorPass = (registrationId: string) =>
  axiosInstance.get<VisitorRegistration>(`/visitor-registrations/${registrationId}/pass`).then((r) => r.data);

export const checkInVisitor = (registrationId: string, notes?: string) =>
  axiosInstance.post<VisitorLog>(`/visitor-registrations/${registrationId}/check-in`, { notes }).then((r) => r.data);

export const checkOutVisitor = (logId: string, notes?: string) =>
  axiosInstance.patch<VisitorLog>(`/visitor-registrations/logs/${logId}/check-out`, { notes }).then((r) => r.data);
