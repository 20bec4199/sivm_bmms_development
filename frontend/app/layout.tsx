import { ThemeProvider } from '../providers/ThemeProvider';
import { QueryProvider } from '../providers/QueryProvider';
import { ReduxProvider } from '../providers/ReduxProvider';
import { ConfirmProvider } from '../providers/ConfirmProvider';
import { PublicLayout } from '../layouts/PublicLayout';
import { AuthInitializer } from '../components/auth/AuthInitializer';
import { GlobalWarningPopup } from '../components/ui/GlobalWarningPopup';
import './globals.css';

export const metadata = {
  title: 'BMMS — Intelligent Property & Facility Management Platform',
  description: 'BMMS connects property management, facilities, maintenance, parking, security and resident operations in one intelligent platform.',
  openGraph: {
    title: 'BMMS — One Intelligent Property Operating System',
    description: 'Manage buildings, towers, floors, units, residents, parking, work orders and security through one connected platform.',
    type: 'website' as const,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          <QueryProvider>
            <ThemeProvider>
              <ConfirmProvider>
                <AuthInitializer>
                  <PublicLayout>
                    {children}
                    <GlobalWarningPopup />
                  </PublicLayout>
                </AuthInitializer>
              </ConfirmProvider>
            </ThemeProvider>
          </QueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
