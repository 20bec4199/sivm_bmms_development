import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import { authApi } from '../services/authApi';
import { platformApi } from '../services/platformApi';
import { organizationApi } from '../services/organizationApi';
import { userApi } from '../services/userApi';
import { rolesApi } from '../services/rolesApi';
import { buildingManagersApi } from '@/services/buildingManagersApi';
import { injectStore } from '../services/axios';

import { complaintsApi } from '../services/complaintsApi';
import { visitorsApi } from '../services/visitorsApi';
import { workOrdersApi } from '../services/workOrdersApi';
import { technicianApi } from '../services/technicianApi';
import { notificationsApi } from '../services/notificationsApi';
import { auditApi } from '../services/auditApi';
import { facilitiesApi } from '../services/facilitiesApi';
import { assetsApi } from '../services/assetsApi';
import { maintenancePlansApi } from '../services/maintenancePlansApi';
import { parkingApi } from '../services/parkingApi';
import { packagesApi } from '../services/packagesApi';
import { alertsApi } from '../services/alertsApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [authApi.reducerPath]: authApi.reducer,
    [platformApi.reducerPath]: platformApi.reducer,
    [organizationApi.reducerPath]: organizationApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [rolesApi.reducerPath]: rolesApi.reducer,
    [buildingManagersApi.reducerPath]: buildingManagersApi.reducer,
    [complaintsApi.reducerPath]: complaintsApi.reducer,
    [visitorsApi.reducerPath]: visitorsApi.reducer,
    [workOrdersApi.reducerPath]: workOrdersApi.reducer,
    [technicianApi.reducerPath]: technicianApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [auditApi.reducerPath]: auditApi.reducer,
    [facilitiesApi.reducerPath]: facilitiesApi.reducer,
    [assetsApi.reducerPath]: assetsApi.reducer,
    [maintenancePlansApi.reducerPath]: maintenancePlansApi.reducer,
    [parkingApi.reducerPath]: parkingApi.reducer,
    [packagesApi.reducerPath]: packagesApi.reducer,
    [alertsApi.reducerPath]: alertsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      platformApi.middleware,
      organizationApi.middleware,
      userApi.middleware,
      rolesApi.middleware,
      buildingManagersApi.middleware,
      complaintsApi.middleware,
      visitorsApi.middleware,
      workOrdersApi.middleware,
      technicianApi.middleware,
      notificationsApi.middleware,
      auditApi.middleware,
      facilitiesApi.middleware,
      assetsApi.middleware,
      maintenancePlansApi.middleware,
      parkingApi.middleware,
      packagesApi.middleware,
      alertsApi.middleware,
    ),
});


injectStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
