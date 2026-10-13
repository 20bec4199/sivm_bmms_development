'use client';
import { useParams } from 'next/navigation';
import { WorkOrderDetails } from '@/components/work-orders/WorkOrderDetails';

export default function OrganizationWorkOrderPage() {
  const params = useParams();
  const id = params.id as string;
  
  return <WorkOrderDetails workOrderId={id} backUrl="/organization/work-orders" />;
}
