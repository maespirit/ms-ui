import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import Menu from './Menu';

const ExempleMenu = () => {
    return (
        <Menu>
            <Menu.Button>Menu</Menu.Button>
            <Menu.Items>
                <Menu.Item onClick={() => console.log('huhu')}>
                    Option 1
                </Menu.Item>
                <Menu.Item>Option 2</Menu.Item>
            </Menu.Items>
        </Menu>
    );
};

const ExempleStyledMenu = () => {
    return (
        <Menu>
            <div className='relative'>
                <Menu.Button
                    className={open =>
                        `relative cursor-default ${
                            open ? 'ring-1 ring-black' : 'ring-black/0'
                        } border border-black border-solid rounded-lg bg-black px-3 py-0 h-8 flex items-center text-white focus:outline-none`
                    }
                >
                    {({ open }) => (
                        <>
                            <span className='font-bold'>Menu</span>
                            <span
                                className={`${
                                    open ? 'rotate-180' : ''
                                } transition-transform flex items-center ml-2`}
                            >
                                <svg
                                    xmlns='http://www.w3.org/2000/svg'
                                    viewBox='0 0 20 20'
                                    fill='currentColor'
                                    className='w-5 h-5'
                                >
                                    <path
                                        fillRule='evenodd'
                                        d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'
                                        clipRule='evenodd'
                                    />
                                </svg>
                            </span>
                        </>
                    )}
                </Menu.Button>
                <Menu.Items className='rounded-lg bg-white shadow-lg absolute mt-1 min-w-[240px] py-1 border border-solid border-slate-100'>
                    <Menu.Item
                        onClick={() => console.log('huhu')}
                        className={({ active }) =>
                            `appearance-none p-0 m-0 text-slate-700 flex items-center w-full h-10 px-4 border-0 text-sm ${
                                active ? 'bg-slate-100' : 'bg-transparent'
                            }`
                        }
                    >
                        <div>
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                viewBox='0 0 20 20'
                                fill='currentColor'
                                className='w-5 h-5 flex'
                            >
                                <path d='M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z' />
                            </svg>
                        </div>
                        <div className='ml-2'>View profile</div>
                    </Menu.Item>
                    <hr className='m-0 p-0 border-0 h-px bg-gray-100' />
                    <Menu.Item
                        onClick={() => console.log('huhu')}
                        className={({ active }) =>
                            `appearance-none p-0 m-0 text-slate-700 flex items-center w-full h-10 px-4 border-0 text-sm ${
                                active ? 'bg-slate-100' : 'bg-transparent'
                            }`
                        }
                    >
                        <div>
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                viewBox='0 0 20 20'
                                fill='currentColor'
                                className='w-5 h-5 flex'
                            >
                                <path
                                    fillRule='evenodd'
                                    d='M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z'
                                    clipRule='evenodd'
                                />
                            </svg>
                        </div>
                        <div className='ml-2'>Settings</div>
                    </Menu.Item>
                    <Menu.Item
                        onClick={() => console.log('huhu')}
                        className={({ active }) =>
                            `appearance-none p-0 m-0 text-slate-700 flex items-center w-full h-10 px-4 border-0 text-sm ${
                                active ? 'bg-slate-100' : 'bg-transparent'
                            }`
                        }
                    >
                        <div>
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                viewBox='0 0 20 20'
                                fill='currentColor'
                                className='w-5 h-5 flex'
                            >
                                <path d='M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z' />
                            </svg>
                        </div>
                        <div className='ml-2'>Keyboard shortcuts</div>
                    </Menu.Item>
                </Menu.Items>
            </div>
        </Menu>
    );
};

const meta: Meta<typeof Menu> = { title: 'Menu', component: Menu };
export default meta;

type Story = StoryObj<typeof Menu>;

export const Primary: Story = {
    render: () => <ExempleMenu />
};

export const Exemple: Story = {
    render: () => (
        <div className='h-[180px]'>
            <ExempleStyledMenu />
        </div>
    )
};
