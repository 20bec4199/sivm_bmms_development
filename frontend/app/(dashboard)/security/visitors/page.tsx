'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Users, Search, QrCode, CheckCircle, XCircle, RefreshCw, Camera, CameraOff } from 'lucide-react';
import {
  checkInVisitor,
  checkOutVisitor,
  getVisitorPass,
  getVisitorRegistrations,
  verifyVisitorQr,
  type VisitorRegistration,
} from '@/services/securityApi';

const getErrorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message ?? fallback
    : fallback;

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10' },
  APPROVED: { label: 'Approved', color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' },
  ARRIVED: { label: 'Arrived', color: 'text-green-600 bg-green-50 dark:bg-green-500/10' },
  COMPLETED: { label: 'Completed', color: 'text-slate-600 bg-slate-100 dark:bg-slate-500/10' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-600 bg-red-50 dark:bg-red-500/10' },
  REJECTED: { label: 'Rejected', color: 'text-red-600 bg-red-50 dark:bg-red-500/10' },
};

export default function SecurityVisitorsPage() {
  const [qrInput, setQrInput] = useState('');
  const [qrResult, setQrResult] = useState<{ success: boolean; registration?: VisitorRegistration; message?: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [registrations, setRegistrations] = useState<VisitorRegistration[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);

  const qrRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControlsRef = useRef<{ stop: () => void } | null>(null);

  // Load today's visitor registrations
  const loadRegistrations = () => {
    setListLoading(true);
    getVisitorRegistrations({ take: 50 })
      .then((response) => setRegistrations(response.data ?? []))
      .catch(console.error)
      .finally(() => setListLoading(false));
  };

  useEffect(() => {
    getVisitorRegistrations({ take: 50 })
      .then((response) => setRegistrations(response.data ?? []))
      .catch(console.error)
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => () => scannerControlsRef.current?.stop(), []);

  const handleVerifyQr = async (value = qrInput) => {
    const qrData = value.trim();
    if (!qrData) return;
    setQrLoading(true);
    setQrResult(null);
    try {
      const verification = await verifyVisitorQr(qrData);
      const registration = await getVisitorPass(verification.registration.id);
      setQrResult({ success: true, registration });
    } catch (error) {
      setQrResult({ success: false, message: getErrorMessage(error, 'Invalid QR code') });
    } finally {
      setQrLoading(false);
    }
  };

  const stopQrScanner = () => {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    setScannerActive(false);
  };

  const startQrScanner = async () => {
    setScannerError(null);
    if (!navigator.mediaDevices?.getUserMedia || !videoRef.current) {
      setScannerError('Camera scanning is unavailable in this browser. Enter the pass code below instead.');
      return;
    }

    setScannerActive(true);
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, _error, scannerControls) => {
        if (!result) return;
        const decodedText = result.getText();
        scannerControls.stop();
        scannerControlsRef.current = null;
        setScannerActive(false);
        setQrInput(decodedText);
        void handleVerifyQr(decodedText);
      });
      scannerControlsRef.current = controls;
    } catch {
      setScannerActive(false);
      setScannerError('Could not open the camera. Check browser permissions or enter the pass code below.');
    }
  };

  const handleCheckIn = async (registrationId: string) => {
    setActionLoading(registrationId + '_in');
    try {
      await checkInVisitor(registrationId);
      setQrResult(null);
      setQrInput('');
      loadRegistrations();
    } catch (error) {
      alert(getErrorMessage(error, 'Check-in failed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (logId: string) => {
    setActionLoading(logId + '_out');
    try {
      await checkOutVisitor(logId);
      setQrResult(null);
      setQrInput('');
      loadRegistrations();
    } catch (error) {
      alert(getErrorMessage(error, 'Check-out failed'));
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = registrations.filter((r) => {
    const q = search.toLowerCase();
    return (
      !q ||
      r.visitor.firstName?.toLowerCase().includes(q) ||
      r.visitor.lastName?.toLowerCase().includes(q) ||
      r.visitor.phone?.toLowerCase().includes(q) ||
      r.visitor.idNumber?.toLowerCase().includes(q) ||
      r.purpose?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Visitor Gate</h1>
          <p className="text-sm text-slate-500">QR scan, check-in and check-out visitors</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* QR Scanner Panel */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <QrCode className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-slate-800 dark:text-white text-sm">Scan Visitor Pass</h2>
          </div>
          <p className="text-[12px] text-slate-400">Use the camera or a connected scanner to verify the visitor pass.</p>

          <div className="flex flex-wrap items-center gap-3">
            {!scannerActive ? (
              <button
                type="button"
                onClick={startQrScanner}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Camera className="h-4 w-4" />
                Open camera
              </button>
            ) : (
              <button
                type="button"
                onClick={stopQrScanner}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
              >
                <CameraOff className="h-4 w-4" />
                Close camera
              </button>
            )}
            {scannerActive && <span className="text-xs text-slate-500">Camera active. Center the QR code in view.</span>}
          </div>

          {(scannerActive || scannerError) && (
            <div className="space-y-2">
              <div className="relative aspect-video overflow-hidden rounded-lg border border-slate-200 bg-black dark:border-white/10">
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                {scannerActive && (
                  <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
                    <div className="h-2/3 w-2/3 max-w-64 rounded-lg border-2 border-white/90 shadow-[0_0_0_999px_rgba(0,0,0,0.22)]" />
                  </div>
                )}
              </div>
              {scannerError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{scannerError}</p>}
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={qrRef}
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyQr()}
              placeholder="Enter or scan QR data..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <button
              onClick={() => handleVerifyQr()}
              disabled={qrLoading || !qrInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {qrLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify'}
            </button>
          </div>

          {/* QR Result */}
          {qrResult && (
            <div className={`rounded-xl border p-4 ${qrResult.success ? 'border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10' : 'border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10'}`}>
              {qrResult.success && qrResult.registration ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-700 dark:text-green-400">Valid Pass</span>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    <div className="text-sm font-semibold text-slate-800 dark:text-white">
                      {qrResult.registration.visitor.firstName} {qrResult.registration.visitor.lastName}
                    </div>
                    {qrResult.registration.visitor.phone && (
                      <div className="text-[12px] text-slate-500">{qrResult.registration.visitor.phone}</div>
                    )}
                    {qrResult.registration.purpose && (
                      <div className="text-[12px] text-slate-500">Purpose: {qrResult.registration.purpose}</div>
                    )}
                    {qrResult.registration.propertyNode && (
                      <div className="text-[12px] text-slate-500">Visiting: {qrResult.registration.propertyNode.name}</div>
                    )}
                    {qrResult.registration.vehiclePlate && (
                      <div className="text-[12px] text-slate-500">Vehicle: {qrResult.registration.vehiclePlate}</div>
                    )}
                  </div>

                  {/* Determine if active log exists */}
                  {(() => {
                    const activeLogs = qrResult.registration.logs?.filter((l) => l.checkInTime && !l.checkOutTime) ?? [];
                    const activeLog = activeLogs[0];
                    return activeLog ? (
                      <button
                        onClick={() => handleCheckOut(activeLog.id)}
                        disabled={!!actionLoading}
                        className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        {actionLoading ? 'Processing...' : 'Check Out'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(qrResult.registration!.id)}
                        disabled={!!actionLoading}
                        className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        {actionLoading ? 'Processing...' : 'Check In'}
                      </button>
                    );
                  })()}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                    {qrResult.message ?? 'Invalid or expired pass'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Visitor list */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-white/10">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search visitors..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <button
              onClick={loadRegistrations}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-500"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.05] max-h-[440px]">
            {listLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-4 flex gap-3">
                  <div className="w-24 h-4 rounded bg-slate-100 dark:bg-white/5 animate-pulse" />
                  <div className="flex-1 h-4 rounded bg-slate-100 dark:bg-white/5 animate-pulse" />
                </div>
              ))
            ) : !filtered.length ? (
              <div className="py-12 text-center text-slate-400 text-sm">No visitors found</div>
            ) : (
              filtered.map((reg) => {
                const statusInfo = STATUS_MAP[reg.status] ?? { label: reg.status, color: 'text-slate-500 bg-slate-100' };
                const activeLog = reg.logs?.find((l) => l.checkInTime && !l.checkOutTime);
                return (
                  <div key={reg.id} className="px-5 py-3.5 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                        {reg.visitor.firstName} {reg.visitor.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {reg.purpose ?? 'Visit'} {reg.propertyNode ? `· ${reg.propertyNode.name}` : ''}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    {activeLog ? (
                      <button
                        onClick={() => handleCheckOut(activeLog.id)}
                        disabled={actionLoading === activeLog.id + '_out'}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 hover:bg-orange-200 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === activeLog.id + '_out' ? '...' : 'Check Out'}
                      </button>
                    ) : reg.status === 'APPROVED' || reg.status === 'PENDING' ? (
                      <button
                        onClick={() => handleCheckIn(reg.id)}
                        disabled={actionLoading === reg.id + '_in'}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-200 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === reg.id + '_in' ? '...' : 'Check In'}
                      </button>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
