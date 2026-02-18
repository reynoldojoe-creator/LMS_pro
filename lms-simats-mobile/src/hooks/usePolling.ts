import { useState, useCallback, useRef, useEffect } from 'react';

interface UsePollingOptions {
    interval?: number;
    maxAttempts?: number;
    stopCondition?: (data: any) => boolean;
}

export const usePolling = <T>(
    pollFunction: () => Promise<T>,
    options: UsePollingOptions = {}
) => {
    const {
        interval = 2000,
        maxAttempts = 60, // Default 2 minutes with 2s interval
        stopCondition
    } = options;

    const [data, setData] = useState<T | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const attemptsRef = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            stopPolling();
        };
    }, []);

    const stopPolling = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsPolling(false);
        attemptsRef.current = 0;
    }, []);

    const startPolling = useCallback(async () => {
        setIsPolling(true);
        setError(null);
        attemptsRef.current = 0;

        const poll = async () => {
            if (!isMounted.current) return;

            try {
                attemptsRef.current += 1;
                const result = await pollFunction();

                if (isMounted.current) {
                    setData(result);

                    const shouldStop = stopCondition ? stopCondition(result) : false;

                    if (shouldStop) {
                        setIsPolling(false);
                    } else if (attemptsRef.current >= maxAttempts) {
                        setIsPolling(false);
                        setError('Polling timed out');
                    } else {
                        timeoutRef.current = setTimeout(poll, interval);
                    }
                }
            } catch (err: any) {
                if (isMounted.current) {
                    setIsPolling(false);
                    setError(err.message || 'Polling failed');
                }
            }
        };

        poll();
    }, [pollFunction, interval, maxAttempts, stopCondition]);

    return {
        data,
        isPolling,
        error,
        startPolling,
        stopPolling,
    };
};
