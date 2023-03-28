import React, { ReactNode, createContext, useContext, useReducer } from 'react';

interface IStateDefinition {
    dropdownState: boolean;
    searchQuery: string;
    options: string[];
    activeOptionIndex: string | null;
}

type Actions = { type: 'OPEN_LIST' } | { type: 'CLOSE_LIST' };

const INITIAL_STATE_DATA: IStateDefinition = {
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

const SelectContextData = createContext(null);

const useData = () => {
    let context = useContext(SelectContextData);
    if (context === null) {
        let err = new Error(`le context data n'existe pas`);
        if (Error.captureStackTrace) Error.captureStackTrace(err, useData);
        throw err;
    }
    return context;
};

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
    const [state, dispatch] = useReducer(
        selectActionsReducer,
        INITIAL_STATE_DATA
    );
    return (
        <SelectContextData.Provider value={null}>
            <button>coucou</button>
            <div>{children}</div>
        </SelectContextData.Provider>
    );
};

const Options = ({ children }: ISelectOptions) => {
    return (
        <ul role='listbox' aria-orientation='vertical' tabIndex={0}>
            {children}
        </ul>
    );
};

const Option = ({ children }: ISelectOption) => {
    return (
        <li tabIndex={-1} role='option' aria-selected={false}>
            {children}
        </li>
    );
};

Select.Options = Options;
Select.Option = Option;

export default Select;
