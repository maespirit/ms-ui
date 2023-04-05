import React, { useState } from 'react';
import Select from './Select';
import { ComponentMeta, ComponentStory } from '@storybook/react';

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
                        {(active, selected) =>
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

export default {
    title: 'Select',
    component: Select
} as ComponentMeta<typeof Select>;

export const Primary: ComponentStory<typeof Select> = () => <ExempleSelect />;
