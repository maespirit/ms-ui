import { useRef, useState } from 'react';

export function useControllable<T>(
    value: T | undefined,
    onChange?: (value: T) => void,
    defaultValue?: T
) {
    const [internalValue, setInternalValue] = useState(defaultValue);

    const isControlled = value !== undefined;
    const wasControlled = useRef(isControlled);
    const didWarnOnUncontrolledToControlled = useRef(false);
    const didWarnOnControlledToUncontrolled = useRef(false);

    if (
        isControlled &&
        !wasControlled.current &&
        !didWarnOnUncontrolledToControlled.current
    ) {
        didWarnOnUncontrolledToControlled.current = true;
        wasControlled.current = isControlled;
        console.error(
            'A component is changing from uncontrolled to controlled. This may be caused by the value changing from undefined to a defined value, which should not happen.'
        );
    } else if (
        !isControlled &&
        wasControlled.current &&
        !didWarnOnControlledToUncontrolled.current
    ) {
        didWarnOnControlledToUncontrolled.current = true;
        wasControlled.current = isControlled;
        console.error(
            'A component is changing from controlled to uncontrolled. This may be caused by the value changing from a defined value to undefined, which should not happen.'
        );
    }

    const handleUncontrolledChange = (val: T) => {
        setInternalValue(val);
        onChange?.(val);
    };

    if (value !== undefined) {
        return [value as T, onChange as (value: T) => void] as const;
    }

    return [
        internalValue as T,
        handleUncontrolledChange as (value: T) => void
    ] as const;
}
