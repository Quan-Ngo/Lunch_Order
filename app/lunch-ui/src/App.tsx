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
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

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
    </QueryClientProvider>
  );
}
