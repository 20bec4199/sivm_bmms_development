import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className = '' }: FormSectionProps) {
  return (
    <Card className={`border-0 shadow-sm bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl ${className}`}>
      <CardHeader className="border-b border-gray-100 dark:border-gray-800/50 pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{description}</p>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
