import { useQuery } from '@tanstack/react-query';
import { foodService, type Food } from '@/services/api';

export function useFoods() {
    const { data: foods, isLoading, error, refetch } = useQuery<Food[]>({
        queryKey: ['foods'],
        queryFn: foodService.getAll,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return {
        foods,
        isLoading,
        error,
        refetch,
        isEmpty: foods && foods.length === 0,
    };
}
