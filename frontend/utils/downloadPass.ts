import QRCode from 'qrcode';

export interface PassData {
  id: string;
  qrData?: string;
  qrCodeImage?: string;
  purpose?: string;
  expectedArrival: string | Date;
  vehiclePlate?: string | null;
  visitor?: {
    firstName?: string;
    lastName?: string | null;
    phone?: string | null;
  };
  propertyNode?: {
    name?: string;
    unitNumber?: string;
    parent?: {
      name?: string;
      parent?: {
        name?: string;
      };
    };
  };
}

export async function downloadVisitorPass(pass: PassData) {
  try {
    const rawQrData =
      pass.qrData ||
      (typeof window !== 'undefined' ? btoa(pass.id) : pass.id);

    // Generate high resolution QR code data URL
    const qrDataUrl = await QRCode.toDataURL(rawQrData, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, 800);
    bgGradient.addColorStop(0, '#f8fafc');
    bgGradient.addColorStop(1, '#edf2f7');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 600, 800);

    // Header bar
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(0, 0, 600, 110);

    // Header text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BUILDING MANAGEMENT SYSTEM', 300, 48);

    ctx.fillStyle = '#dbeafe';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText('Official Visitor Clearance Pass', 300, 78);

    // Pass ID Badge Card
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 6;
    ctx.beginPath();
    ctx.roundRect(40, 130, 520, 620, 20);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';

    // Visitor Name
    const visitorName = `${pass.visitor?.firstName || 'Visitor'} ${pass.visitor?.lastName || ''}`.trim();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(visitorName, 300, 180);

    // Pass Reference ID
    ctx.fillStyle = '#64748b';
    ctx.font = '13px monospace';
    ctx.fillText(`PASS ID: #${pass.id.slice(0, 8).toUpperCase()}`, 300, 205);

    // Purpose pill
    ctx.fillStyle = '#eff6ff';
    ctx.beginPath();
    ctx.roundRect(220, 220, 160, 28, 14);
    ctx.fill();
    ctx.fillStyle = '#1d4ed8';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText((pass.purpose || 'VISITOR').toUpperCase(), 300, 239);

    // Draw QR Code
    const qrImage = new Image();
    await new Promise<void>((resolve, reject) => {
      qrImage.onload = () => resolve();
      qrImage.onerror = reject;
      qrImage.src = qrDataUrl;
    });

    ctx.drawImage(qrImage, 175, 270, 250, 250);

    // Divider
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(70, 545);
    ctx.lineTo(530, 545);
    ctx.stroke();

    // Details Grid
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = '13px system-ui, -apple-system, sans-serif';

    // Destination Unit
    const unitName = pass.propertyNode?.name || pass.propertyNode?.unitNumber || 'Assigned Residence';
    ctx.fillText('Destination Unit:', 70, 580);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Unit ${unitName}`, 70, 605);

    // Expected Arrival
    ctx.fillStyle = '#64748b';
    ctx.font = '13px system-ui, -apple-system, sans-serif';
    ctx.fillText('Scheduled Arrival:', 320, 580);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    const arrivalDate = new Date(pass.expectedArrival).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    ctx.fillText(arrivalDate, 320, 605);

    // Vehicle if present
    if (pass.vehiclePlate) {
      ctx.fillStyle = '#64748b';
      ctx.font = '13px system-ui, -apple-system, sans-serif';
      ctx.fillText('Authorized Vehicle:', 70, 645);
      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(pass.vehiclePlate, 70, 670);
    }

    // Security Footer Note
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Present this QR code at security turnstile / guard desk scanner upon arrival.', 300, 725);

    // Download trigger
    const downloadUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `Pass-${visitorName.replace(/\s+/g, '_')}-${pass.id.slice(0, 6).toUpperCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Failed to export visitor pass image:', err);
  }
}
