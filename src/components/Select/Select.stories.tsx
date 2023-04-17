import React, { useState } from 'react';
import Select from './Select';
import type { Meta, StoryObj } from '@storybook/react';

const people = [
    { id: 1, name: 'Durward Reynolds', unavailable: false },
    { id: 2, name: 'Kenton Towne', unavailable: false },
    { id: 3, name: 'Therese Wunsch', unavailable: false },
    { id: 4, name: 'Theo Wunsch', unavailable: false },
    { id: 5, name: 'Benedict Kessler', unavailable: true },
    { id: 6, name: 'Katelyn Rohan', unavailable: false }
];

const ExempleSelect = () => {
    const [selectedPerson, setSelectedPerson] = useState<
        { id: number; name: string; unavailable: boolean }[]
    >([]);
    return (
        <Select value={selectedPerson} onChange={setSelectedPerson} multiple>
            <Select.Button>
                {selectedPerson.length > 0
                    ? selectedPerson.map(person => person.name).join(', ')
                    : 'Sélectionnez une personne...'}
            </Select.Button>
            <Select.Options>
                {people.map(person => (
                    <Select.Option
                        key={person.id}
                        value={person}
                        disabled={person.unavailable}
                    >
                        {({ active, selected }) =>
                            `${selected ? 'V ' : ''}${person.name}${
                                active ? '<--' : ''
                            }`
                        }
                    </Select.Option>
                ))}
            </Select.Options>
        </Select>
    );
};

const ExempleBisSelect = () => {
    const [selectedPerson, setSelectedPerson] = useState<
        { id: number; name: string; unavailable: boolean }[]
    >([]);
    return (
        <Select value={selectedPerson} onChange={setSelectedPerson} multiple>
            <div className='relative w-72'>
                <Select.Button
                    className={({ open }) =>
                        `relative cursor-default ${
                            open
                                ? 'border-black ring-1 ring-black'
                                : 'border-gray-300 ring-black/0'
                        } w-full border border-solid rounded-lg bg-white py-2.5 pl-3 pr-10 text-left focus:outline-none`
                    }
                >
                    {({ open }) => (
                        <>
                            <span className='text-sm'>
                                {selectedPerson.length > 0 ? (
                                    selectedPerson
                                        .map(person => person.name)
                                        .join(', ')
                                ) : (
                                    <span className='text-slate-900/50'>
                                        Sélectionnez une personne...
                                    </span>
                                )}
                            </span>
                            <span
                                className={`${
                                    open ? 'rotate-180' : ''
                                } transition-transform absolute inset-y-0 right-2 flex items-center`}
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
                </Select.Button>
                <Select.Options className='list-none p-0 m-0 rounded-lg bg-white shadow-lg absolute mt-1 w-full py-1 border border-solid border-slate-100'>
                    {people.map(person => (
                        <Select.Option
                            key={person.id}
                            value={person}
                            disabled={person.unavailable}
                            className={({ active, disabled }) =>
                                `relative p-2 text-sm cursor-pointer ${
                                    active ? 'bg-gray-100' : ''
                                } ${disabled ? 'text-gray-400' : ''}`
                            }
                        >
                            {({ selected }) => (
                                <>
                                    <span>{person.name}</span>
                                    {selected && (
                                        <span className='text-black absolute inset-y-0 right-3 flex items-center'>
                                            <svg
                                                xmlns='http://www.w3.org/2000/svg'
                                                viewBox='0 0 20 20'
                                                fill='currentColor'
                                                className='w-5 h-5'
                                            >
                                                <path
                                                    fillRule='evenodd'
                                                    d='M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z'
                                                    clipRule='evenodd'
                                                />
                                            </svg>
                                        </span>
                                    )}
                                </>
                            )}
                        </Select.Option>
                    ))}
                </Select.Options>
            </div>
        </Select>
    );
};

const meta: Meta<typeof Select> = { title: 'Select', component: Select };
export default meta;

type Story = StoryObj<typeof Select>;

export const Primary: Story = {
    render: () => <ExempleSelect />
};

export const Exemple: Story = {
    render: () => <ExempleBisSelect />
};
