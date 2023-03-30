import React, {
    ForwardedRef,
    MutableRefObject,
    ReactNode,
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useId,
    useMemo,
    useReducer,
    useRef
} from 'react';
import { useMergeRefs } from '../../hooks/useMergeRefs';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useControllable } from '../../hooks/useControllable';

interface IStateDefinition {
    dropdownState: boolean;
    options: string[];
    activeOptionIndex: string | null;
}

interface IDataDefinition extends IStateDefinition {
    buttonRef: MutableRefObject<HTMLButtonElement | null>;
    optionsRef: MutableRefObject<HTMLUListElement | null>;
}

type Actions = { type: 'OPEN_LIST' } | { type: 'CLOSE_LIST' };

const selectActionsReducer = (state: IStateDefinition, action: Actions) => {
    switch (action.type) {
        case 'OPEN_LIST':
            return {
                ...state,
                dropdownState: true
            };
        case 'CLOSE_LIST':
            return {
                ...state,
                dropdownState: false
            };
        default: {
            return state;
        }
    }
};

const SelectContextData = createContext<IDataDefinition | null>(null);

const SelectContextActions = createContext<{
    closeSelect: () => void;
    openSelect: () => void;
} | null>(null);

const useData = () => {
    let context = useContext(SelectContextData);
    if (context === null) {
        let err = new Error(`le context data n'existe pas`);
        if (Error.captureStackTrace) Error.captureStackTrace(err, useData);
        throw err;
    }
    return context;
};

const useAction = () => {
    let context = useContext(SelectContextActions);
    if (context === null) {
        let err = new Error(`le context action n'existe pas`);
        if (Error.captureStackTrace) Error.captureStackTrace(err, useAction);
        throw err;
    }
    return context;
};

interface ISelect {
    children?: ReactNode;
    value?: unknown;
    defaultValue?: unknown;
    onChange?(value: unknown): void;
    multiple?: boolean;
}

interface ISelectOptions {
    children?: ReactNode;
}

interface ISelectOption {
    children?: ReactNode;
    value: unknown;
    disabled?: boolean;
}

const Select = (props: ISelect) => {
    const {
        children,
        value: controlledValue,
        onChange: theirOnChange,
        defaultValue
    } = props;
    const [state, dispatch] = useReducer(selectActionsReducer, {
        dropdownState: false,
        options: [],
        activeOptionIndex: null
    });
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const optionsRef = useRef<HTMLUListElement | null>(null);

    const [value, controlledOnChange] = useControllable(
        controlledValue,
        theirOnChange,
        defaultValue
    );

    const openSelect = useCallback(() => {
        dispatch({ type: 'OPEN_LIST' });
    }, []);

    const closeSelect = useCallback(() => {
        dispatch({ type: 'CLOSE_LIST' });
    }, []);

    const actions = useMemo<ReturnType<typeof useAction>>(
        () => ({
            closeSelect,
            openSelect,
            onChange: controlledOnChange
        }),
        []
    );

    const data = useMemo<ReturnType<typeof useData>>(
        () => ({
            ...state,
            buttonRef,
            optionsRef
        }),
        [state]
    );

    useClickOutside(() => closeSelect(), null, [
        data.buttonRef,
        data.optionsRef
    ]);

    return (
        <SelectContextData.Provider value={data}>
            <SelectContextActions.Provider value={actions}>
                {children}
            </SelectContextActions.Provider>
        </SelectContextData.Provider>
    );
};

const Button = forwardRef(
    ({ children }: ISelectOptions, ref: ForwardedRef<HTMLButtonElement>) => {
        const actions = useAction();
        const data = useData();

        const buttonRef = useMergeRefs([data.buttonRef, ref]);

        const handleClick = () => {
            if (data.dropdownState) actions.closeSelect();
            else actions.openSelect();
        };

        return (
            <button onClick={handleClick} ref={buttonRef}>
                {children}
            </button>
        );
    }
);

const Options = forwardRef(
    ({ children }: ISelectOptions, ref: ForwardedRef<HTMLUListElement>) => {
        const data = useData();
        const optionsRef = useMergeRefs([data.optionsRef, ref]);

        if (!data.dropdownState) return <></>;
        return (
            <ul
                role='listbox'
                aria-orientation='vertical'
                tabIndex={0}
                ref={optionsRef}
            >
                {children}
            </ul>
        );
    }
);

const Option = forwardRef(
    (props: ISelectOption, ref: ForwardedRef<HTMLLIElement>) => {
        const { children, value, disabled = false } = props;
        const internalId = useId();
        const domElmOptionRef = useRef(null);

        const optionRef = useMergeRefs([domElmOptionRef, ref]);

        const dataOption = useMemo(
            () => ({
                id: internalId,
                value,
                domRef: domElmOptionRef,
                disabled
            }),
            [value, internalId]
        );

        return (
            <li
                tabIndex={-1}
                role='option'
                aria-selected={false}
                ref={optionRef}
            >
                {children}
            </li>
        );
    }
);

Select.Button = Button;
Select.Options = Options;
Select.Option = Option;

export default Select;
