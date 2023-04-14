import React, { createContext, useContext, useMemo } from 'react';

interface CheckboxGroupContext {
    value: string[];
    onChange: React.ChangeEventHandler<HTMLInputElement>;
}

const CheckboxGroupContext = createContext<CheckboxGroupContext | null>(null);

interface CheckboxGroupProps {
    children: React.ReactNode;
    value: string[];
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const useCheckboxGroupData = () => useContext(CheckboxGroupContext);

const CheckboxGroup = (props: CheckboxGroupProps) => {
    const { children, onChange, value } = props;

    const data = useMemo<ReturnType<typeof useCheckboxGroupData>>(
        () => ({
            value,
            onChange
        }),
        [value, onChange]
    );

    return (
        <CheckboxGroupContext.Provider value={data}>
            {children}
        </CheckboxGroupContext.Provider>
    );
};

export default CheckboxGroup;
