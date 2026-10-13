'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Loader2, AlertCircle } from 'lucide-react';

interface QrCodeDisplayProps {
  value: string;
  initialImage?: string | null;
  size?: number;
  className?: string;
  alt?: string;
}

export function QrCodeDisplay({
  value,
  initialImage,
  size = 200,
  className = '',
  alt = 'Security QR Code',
}: QrCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string>(() => {
    if (initialImage && initialImage.startsWith('data:image')) {
      return initialImage;
    }
    return '';
  });
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!dataUrl);

  useEffect(() => {
    let isMounted = true;

    // If initial image is already a valid base64 data URL, use it immediately
    if (initialImage && initialImage.startsWith('data:image')) {
      setDataUrl(initialImage);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    // Otherwise generate client-side with zero external dependencies
    const textToEncode = value || 'INVALID_PASS';
    QRCode.toDataURL(textToEncode, {
      width: Math.max(size * 2, 300),
      margin: 1.5,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a', // Deep slate for high contrast scanner readability
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
          setIsLoading(false);
          setHasError(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate client QR code:', err);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [value, initialImage, size]);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 ${className}`}
        style={{ width: size, height: size }}
      >
        <AlertCircle className="w-8 h-8 mb-2" />
        <span className="text-xs font-medium text-center">Failed to render QR</span>
      </div>
    );
  }

  if (isLoading || !dataUrl) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl ${className}`}
        style={{ width: size, height: size }}
      >
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
        <span className="text-[11px] text-gray-500 mt-2">Generating QR...</span>
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-xl object-contain shadow-sm bg-white p-1 border border-gray-100 dark:border-gray-800 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
