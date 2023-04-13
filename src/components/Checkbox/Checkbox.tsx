import React, {
    ForwardedRef,
    LabelHTMLAttributes,
    MutableRefObject,
    createContext,
    forwardRef,
    useContext,
    useId,
    useMemo,
    useRef
} from 'react';
import { InputHTMLAttributes } from 'react';
import { useControllable } from '../../hooks/useControllable';
import { useMergeRefs } from '../../hooks/useMergeRefs';
import { useCheckboxGroupData } from './CheckboxGroup';

interface CheckboxProps {
    children: React.ReactNode;
    checked?: boolean;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    disabled?: boolean;
    value?: string;
}

interface CheckboxContextDefinition {
    id: string;
    checked: boolean;
    value?: string;
    disabled: boolean;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    labelRef: MutableRefObject<HTMLLabelElement | null>;
}

const CheckboxContext = createContext<CheckboxContextDefinition | null>(null);

const useData = () => {
    const context = useContext(CheckboxContext);
    if (context === null) {
        const err = new Error(`Context is missing`);
        if (Error.captureStackTrace) Error.captureStackTrace(err, useData);
        throw err;
    }
    return context;
};

const Checkbox = (props: CheckboxProps) => {
    const {
        checked: theirChecked,
        onChange: theirOnChange,
        disabled = false,
        children,
        value
    } = props;

    const groupCtx = useCheckboxGroupData();

    const contextProps = groupCtx
        ? {
              checked: groupCtx.value.includes(value as string),
              onChange: groupCtx.onChange
          }
        : {};

    const [checked, onChange] = useControllable<any>(
        theirChecked,
        theirOnChange
    );

    const internalId = useId();

    const inputRef = useRef<HTMLInputElement | null>(null);
    const labelRef = useRef<HTMLLabelElement | null>(null);

    const data = useMemo<ReturnType<typeof useData>>(
        () => ({
            checked,
            disabled,
            onChange,
            value,
            labelRef,
            inputRef,
            id: internalId,
            ...contextProps
        }),
        [checked, disabled]
    );

    return (
        <CheckboxContext.Provider value={data}>
            {children}
        </CheckboxContext.Provider>
    );
};

const CheckboxInput = forwardRef(
    (
        props: InputHTMLAttributes<HTMLInputElement>,
        ref: ForwardedRef<HTMLInputElement>
    ) => {
        const data = useData();

        const inputRef = useMergeRefs([data.inputRef, ref]);

        return (
            <input
                {...props}
                type='checkbox'
                id={data.id}
                checked={data.checked}
                onChange={data.onChange}
                ref={inputRef}
                value={data.value}
            />
        );
    }
);

const CheckboxLabel = forwardRef(
    (
        { children, ...otherProps }: LabelHTMLAttributes<HTMLLabelElement>,
        ref: ForwardedRef<HTMLLabelElement>
    ) => {
        const data = useData();
        const labelRef = useMergeRefs([data.labelRef, ref]);

        return (
            <label {...otherProps} htmlFor={data.id} ref={labelRef}>
                {children}
            </label>
        );
    }
);

Checkbox.Input = CheckboxInput;
Checkbox.Label = CheckboxLabel;

CheckboxLabel.displayName = 'CheckboxLabel';
CheckboxInput.displayName = 'CheckboxInput';

export default Checkbox;
