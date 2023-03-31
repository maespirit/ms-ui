import React, {
    ForwardedRef,
    MutableRefObject,
    ReactNode,
    SyntheticEvent,
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
import useIsomorphicLayoutEffect from '../../hooks/useIsoMorphicEffect';

interface IStateDefinition {
    dropdownState: boolean;
    options: any[];
    activeOptionIndex: string | null;
    propsRef: MutableRefObject<IDataPropsDefinition | null>;
}

interface IDataPropsDefinition {
    value: unknown;
    disabled: boolean;
}

interface IDataContextDefinition
    extends IStateDefinition,
        IDataPropsDefinition {
    buttonRef: MutableRefObject<HTMLButtonElement | null>;
    optionsRef: MutableRefObject<HTMLUListElement | null>;
}

type Actions =
    | { type: 'OPEN_LIST' }
    | { type: 'CLOSE_LIST' }
    | { type: 'REGISTER_OPTION'; id: string; payload: any }
    | { type: 'UNREGISTER_OPTION'; id: string };

const selectActionsReducer = (state: IStateDefinition, action: Actions) => {
    switch (action.type) {
        case 'OPEN_LIST':
            if (state.propsRef.current?.disabled) return state;
            if (state.dropdownState) return state;
            return {
                ...state,
                dropdownState: true
            };
        case 'CLOSE_LIST':
            if (state.propsRef.current?.disabled) return state;
            if (!state.dropdownState) return state;
            return {
                ...state,
                dropdownState: false
            };
        case 'REGISTER_OPTION':
            let newOption = { id: action.id, data: action.payload };
            return {
                ...state,
                options: [...state.options, newOption]
            };
        case 'UNREGISTER_OPTION':
            let index = state.options.findIndex(a => a.id === action.id);
            const cleanedOptions = [...state.options];
            if (index !== -1) {
                cleanedOptions.splice(index, 1);
            }
            return {
                ...state,
                options: cleanedOptions
            };
        default: {
            return state;
        }
    }
};

const SelectContextData = createContext<IDataContextDefinition | null>(null);

const SelectContextActions = createContext<{
    closeSelect: () => void;
    openSelect: () => void;
    registerOption: (id: string, payload: any) => void;
    onChange: (value: unknown) => void;
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
    disabled?: boolean;
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
        defaultValue,
        disabled = false
    } = props;

    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const optionsRef = useRef<HTMLUListElement | null>(null);
    const propsRef = useRef<IDataPropsDefinition | null>(null);

    const [state, dispatch] = useReducer(selectActionsReducer, {
        dropdownState: false,
        options: [],
        activeOptionIndex: null,
        propsRef: propsRef
    });

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

    const registerOption = useCallback((id: string, payload: any) => {
        dispatch({ type: 'REGISTER_OPTION', id, payload });
        return () => dispatch({ type: 'UNREGISTER_OPTION', id });
    }, []);

    const actions = useMemo<ReturnType<typeof useAction>>(
        () => ({
            closeSelect,
            openSelect,
            registerOption,
            onChange: controlledOnChange
        }),
        []
    );

    const theirProps = useMemo(
        () => ({
            value,
            disabled
        }),
        [value, disabled]
    );

    useIsomorphicLayoutEffect(() => {
        state.propsRef.current = theirProps;
    }, [theirProps]);

    const data = useMemo<ReturnType<typeof useData>>(
        () => ({
            ...state,
            ...theirProps,
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
            <button
                type='button'
                onClick={handleClick}
                ref={buttonRef}
                disabled={data.disabled}
                aria-haspopup='listbox'
                aria-expanded={data.disabled ? undefined : data.dropdownState}
            >
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
        const actions = useAction();

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

        useIsomorphicLayoutEffect(() =>
            actions.registerOption(internalId, dataOption)
        );

        const handleClick = useCallback((e: SyntheticEvent) => {
            if (disabled) return e.preventDefault();
            actions.onChange(value);
            actions.closeSelect();
        }, []);

        return (
            <li
                tabIndex={-1}
                role='option'
                aria-selected={false}
                aria-disabled={disabled ? true : undefined}
                ref={optionRef}
                onClick={handleClick}
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
