import { Meta, StoryObj } from '@storybook/react';
import render from '../../utils/render';

const TestRender = ({ children, className }) => {
    return render({
        myProps: { children: children, className: className },
        theirProps: undefined,
        tag: 'div',
        states: { active: true },
        visible: true,
        name: 'coucou'
    });
};

const meta: Meta<typeof any> = { title: 'TestRender' };
export default meta;

type Story = StoryObj<typeof any>;

export const Primary: Story = {
    render: () => (
        <TestRender className={({ active }) => (active ? 'active' : '')}>
            {({ active }) => (active ? 'coucou' : 'hebe')}
        </TestRender>
    )
};
