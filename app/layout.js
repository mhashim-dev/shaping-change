import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata = {
  title: 'Shaping Change — Building strong roots for safety',
  description: 'A short, reflective interactive activity that supports violence prevention, following one man through the pressures of migration and settlement.',
  applicationName: 'Shaping Change',
  appleWebApp: { capable: true, title: 'Shaping Change', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' }
};

export const viewport = {
  themeColor: '#17110a'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
