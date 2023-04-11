import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import Checkbox from './Checkbox';

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

const meta: Meta<typeof Checkbox> = { component: Checkbox };
export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Primary: Story = {
    render: () => <ExempleCheckbox />
};
