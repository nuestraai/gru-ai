import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './router';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useNotifications } from '@/hooks/useNotifications';

function Initializers() {
  useWebSocket();
  useNotifications();
  return null;
}

export default function App() {
  return (
    <>
      <Initializers />
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          },
        }}
      />
      <RouterProvider router={router} />
    </>
  );
}
