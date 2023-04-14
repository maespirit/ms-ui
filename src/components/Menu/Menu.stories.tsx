import { Meta, StoryObj } from '@storybook/react';
import Menu from './Menu';
import React from 'react';

const ExempleMenu = () => {
    return (
        <Menu>
            <Menu.Button>Menu</Menu.Button>
            <Menu.Items>
                <Menu.Item>Option 1</Menu.Item>
                <Menu.Item>Option 2</Menu.Item>
            </Menu.Items>
        </Menu>
    );
};

const meta: Meta<typeof Menu> = { component: Menu };
export default meta;

type Story = StoryObj<typeof Menu>;

export const Primary: Story = {
    render: () => <ExempleMenu />
};
