import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DailyMenu from '@/pages/DailyMenu';
import FoodCatalog from '@/pages/FoodCatalog';
import Employees from '@/pages/Employees';
import ManageMenu from '@/pages/ManageMenu';
import DailyOrders from '@/pages/DailyOrders';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      retry: 1,
    },
  },
});

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DailyMenu />} />
          <Route path="/catalog" element={<FoodCatalog />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/manage-menu" element={<ManageMenu />} />
          <Route path="/daily-orders" element={<DailyOrders />} />
        </Routes>
      </BrowserRouter>
      <style>{`
        .Toastify__progress-bar.Toastify__progress-bar--success { background: #16a34a !important; height: 3px !important; }
        .Toastify__progress-bar.Toastify__progress-bar--error { background: #dc2626 !important; height: 3px !important; }
        .Toastify__progress-bar { background: #000 !important; height: 3px !important; }
        .Toastify__toast-body { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; display: block; }
        .Toastify__toast-body > div:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      `}</style>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        pauseOnHover={true}
        draggable={false}
        theme="light"
        style={{ top: '92px' }}
        toastClassName={() =>
          'relative flex items-start p-4 mb-3 rounded-lg border-2 border-black bg-white font-bold text-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer overflow-hidden w-72'
        }
      />
    </QueryClientProvider>
  );
}
