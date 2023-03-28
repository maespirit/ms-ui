import React, { ReactNode, createContext, useReducer } from 'react';

interface IStateDefinition {
    dropdownState: boolean;
    searchQuery: string;
    options: string[];
    activeOptionIndex: string | null;
}

type Actions = { type: 'OPEN_LIST' } | { type: 'CLOSE_LIST' };

const INITIAL_STATE: IStateDefinition = {
    dropdownState: false,
    searchQuery: '',
    options: [],
    activeOptionIndex: null
};

const selectActionsReducer = (state: IStateDefinition, action: Actions) => {
    switch (action.type) {
        case 'OPEN_LIST':
            return {
                ...state,
                dropdownState: true
            };
        default: {
            return state;
        }
    }
};

const SelectContext = createContext(null);

interface ISelect {
    children?: ReactNode;
}

interface ISelectOptions {
    children?: ReactNode;
}

interface ISelectOption {
    children?: ReactNode;
}

const Select = ({ children }: ISelect) => {
    const [state, dispatch] = useReducer(selectActionsReducer, INITIAL_STATE);
    return (
        <SelectContext.Provider value={null}>{children}</SelectContext.Provider>
    );
};

const Options = ({ children }: ISelectOptions) => {
    return <div>{children}</div>;
};

const Option = ({ children }: ISelectOption) => {
    return <div>{children}</div>;
};

Select.Options = Options;
Select.Option = Option;

export default Select;
