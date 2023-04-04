import { useCallback, useEffect, useRef } from 'react';

export function useTimeout(
    callback: (...callbackParams: any[]) => void,
    delay: number,
    options: { autoInvoke: boolean } = { autoInvoke: false }
) {
    const callbackRef = useRef<Function | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const start = useCallback(
        (...callbackParams: any[]) => {
            if (!timeoutRef.current) {
                timeoutRef.current = setTimeout(() => {
                    callbackRef.current && callbackRef.current(callbackParams);
                    timeoutRef.current = null;
                }, delay);
            }
        },
        [delay]
    );

    const clear = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (options.autoInvoke) {
            start();
        }

        return clear;
    }, [clear, delay, options.autoInvoke, start]);

    return { start, clear };
}
