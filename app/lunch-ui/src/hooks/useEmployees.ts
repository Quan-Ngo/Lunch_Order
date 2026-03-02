import { useQuery } from '@tanstack/react-query';
import { employeeService, type StaffEntity } from '@/services/api';

export function useEmployees() {
    const { data: employees, isLoading, error, refetch } = useQuery<StaffEntity[]>({
        queryKey: ['employees'],
        queryFn: employeeService.getAll,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return {
        employees,
        isLoading,
        error,
        refetch,
    };
}
