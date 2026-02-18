import { useState, useCallback } from 'react';
import { APIError } from '../services/api';

interface UseApiCallState<T> {
    data: T | null;
    isLoading: boolean;
    error: string | null;
}

interface UseApiCallReturn<T, P extends any[]> extends UseApiCallState<T> {
    execute: (...args: P) => Promise<T | null>;
    reset: () => void;
}

export const useApiCall = <T, P extends any[] = []>(
    apiFunction: (...args: P) => Promise<T>,
    initialData: T | null = null
): UseApiCallReturn<T, P> => {
    const [state, setState] = useState<UseApiCallState<T>>({
        data: initialData,
        isLoading: false,
        error: null,
    });

    const execute = useCallback(async (...args: P) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const result = await apiFunction(...args);
            setState({ data: result, isLoading: false, error: null });
            return result;
        } catch (error: any) {
            const message = error instanceof APIError
                ? error.message
        : error.message || 'An unexpected error occurred';

            setState(prev => ({ ...prev, isLoading: false, error: message }));
            return null;
        }
    }, [apiFunction]);

    const reset = useCallback(() => {
        setState({ data: initialData, isLoading: false, error: null });
    }, [initialData]);

    return {
        ...state,
        execute,
        reset,
    };
};
