'use client';
import { useParams } from 'next/navigation';
import { WorkOrderDetails } from '@/components/work-orders/WorkOrderDetails';

export default function TechnicianWorkOrderPage() {
  const params = useParams();
  const id = params.id as string;
  
  return <WorkOrderDetails workOrderId={id} backUrl="/technician/work-orders" />;
}
