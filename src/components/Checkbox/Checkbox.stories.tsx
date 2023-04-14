import React, { useCallback, useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import Checkbox from './Checkbox';
import CheckboxGroup from './CheckboxGroup';

const ExempleCheckbox = () => {
    const [checked, setChecked] = useState(true);

    return (
        <Checkbox
            checked={checked}
            onChange={e => setChecked(e.currentTarget.checked)}
        >
            <div>
                <Checkbox.Input />
                <Checkbox.Label>coucou</Checkbox.Label>
            </div>
        </Checkbox>
    );
};

const EXComponentCheckbox = ({
    checked,
    onChange,
    value,
    label
}: {
    checked?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    value?: string;
    label: string;
}) => {
    return (
        <Checkbox checked={checked} value={value} onChange={onChange}>
            <div className='flex'>
                <div className='relative w-4 h-4'>
                    <Checkbox.Input className='appearance-none transition duration-150 p-0 m-0 w-4 h-4 border border-black border-solid rounded peer checked:bg-black' />
                    <span className='invisible peer-checked:visible absolute inset-0 pointer-events-none'>
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            viewBox='0 0 20 20'
                            fill='#FFFFFF'
                            className='w-4 h-4'
                        >
                            <path
                                fillRule='evenodd'
                                d='M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z'
                                clipRule='evenodd'
                            />
                        </svg>
                    </span>
                </div>
                <Checkbox.Label className='pl-2 text-sm leading-none'>
                    {label}
                </Checkbox.Label>
            </div>
        </Checkbox>
    );
};

const ExempleBisCheckbox = () => {
    const [checked, setChecked] = useState(true);

    return (
        <EXComponentCheckbox
            label='coucou'
            onChange={e => setChecked(e.currentTarget.checked)}
            checked={checked}
        />
    );
};

const ExempleCheckboxGroup = () => {
    const [value, setValue] = useState<string[]>([]);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const currValue = e.currentTarget.value;
            console.log(currValue, value, value.includes(currValue));
            if (value.includes(currValue)) {
                const copy = [...value];
                const index = copy.indexOf(currValue);
                copy.splice(index, 1);
                setValue(copy);
            } else setValue(x => [...x, currValue]);
        },
        [value]
    );

    return (
        <CheckboxGroup value={value} onChange={handleChange}>
            <div className='space-y-2'>
                <EXComponentCheckbox label='blue' value='blue' />
                <EXComponentCheckbox label='black' value='black' />
            </div>
        </CheckboxGroup>
    );
};

const meta: Meta<typeof Checkbox> = { component: Checkbox };
export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Primary: Story = {
    render: () => <ExempleCheckbox />
};

export const Styled: Story = {
    render: () => <ExempleBisCheckbox />
};

export const EXCheckboxGroup: Story = {
    render: () => <ExempleCheckboxGroup />
};
