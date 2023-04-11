import React, {
    Children,
    ForwardedRef,
    LabelHTMLAttributes,
    cloneElement,
    forwardRef,
    isValidElement,
    useId
} from 'react';
import { InputHTMLAttributes } from 'react';
import { useControllable } from '../../hooks/useControllable';

interface CheckboxProps {
    children: React.ReactNode;
    checked?: boolean;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

const Checkbox = ({
    checked: theirChecked,
    onChange: theirOnChange,
    children
}: CheckboxProps) => {
    const [checked, onChange] = useControllable<any>(
        theirChecked,
        theirOnChange
    );

    const internalId = useId();

    return (
        <>
            {Children.map(children, child => {
                if (isValidElement(child)) {
                    if (child.type === CheckboxInput) {
                        return cloneElement(
                            child as React.ReactElement<
                                InputHTMLAttributes<HTMLInputElement>
                            >,
                            {
                                id: internalId,
                                checked: checked,
                                onChange: onChange
                            }
                        );
                    } else if (child.type === CheckboxLabel) {
                        return cloneElement(
                            child as React.ReactElement<
                                LabelHTMLAttributes<HTMLLabelElement>
                            >,
                            {
                                htmlFor: internalId
                            }
                        );
                    } else {
                        return child;
                    }
                }
            })}
        </>
    );
};

const CheckboxInput = ({
    id,
    checked,
    onChange
}: InputHTMLAttributes<HTMLInputElement>) => {
    return (
        <input type='checkbox' id={id} checked={checked} onChange={onChange} />
    );
};

const CheckboxLabel = forwardRef(
    (
        { children, ...otherProps }: LabelHTMLAttributes<HTMLLabelElement>,
        ref: ForwardedRef<HTMLLabelElement>
    ) => {
        CheckboxLabel.displayName = 'CheckboxLabel';
        return (
            <label {...otherProps} ref={ref}>
                {children}
            </label>
        );
    }
);

Checkbox.Input = CheckboxInput;
Checkbox.Label = CheckboxLabel;

export default Checkbox;
