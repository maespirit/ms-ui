import React, {
    ForwardedRef,
    MutableRefObject,
    ReactNode,
    SyntheticEvent,
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useId,
    useMemo,
    useReducer,
    useRef
} from 'react';
import { useMergeRefs } from '../../hooks/useMergeRefs';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useControllable } from '../../hooks/useControllable';
import useIsomorphicLayoutEffect from '../../hooks/useIsoMorphicEffect';
import calculateActiveIndex, { Focus } from '../../utils/calculateActiveIndex';
import { useLatestValue } from '../../hooks/useLatestValue';
import { useTimeout } from '../../hooks/useTimeout';

interface IStateDefinition<T> {
    dropdownState: boolean;
    options: { id: string; dataOptionRef: IDataOptionRef<T> }[];
    activeOptionIndex: number | null;
    dataContextRef: MutableRefObject<IDataContextDefinition<T> | null>;
    searchQuery: string;
}

interface IDataContextDefinition<T> extends IStateDefinition<T> {
    isSelected: (value: T) => boolean;
    value: T;
    disabled: boolean;
    buttonRef: MutableRefObject<HTMLButtonElement | null>;
    optionsRef: MutableRefObject<HTMLUListElement | null>;
}

type IDataOptionRef<T> = MutableRefObject<{
    id: string;
    value: T;
    domRef: MutableRefObject<HTMLLIElement>;
    disabled: boolean;
}>;

type Actions =
    | { type: 'OPEN_LIST' }
    | { type: 'CLOSE_LIST' }
    | { type: 'REGISTER_OPTION'; id: string; payload: any }
    | { type: 'UNREGISTER_OPTION'; id: string }
    | { type: 'GO_TO_OPTION'; focus: Focus.Specific; id: string }
    | { type: 'GO_TO_OPTION'; focus: Exclude<Focus, Focus.Specific> }
    | { type: 'SEARCH'; value: string }
    | { type: 'CLEAR_SEARCH' };

const selectActionsReducer = <T extends unknown>(
    state: IStateDefinition<T>,
    action: Actions
) => {
    switch (action.type) {
        case 'OPEN_LIST':
            if (!state.dataContextRef.current) return state;
            if (state.dataContextRef.current?.disabled) return state;
            if (state.dropdownState) return state;

            return {
                ...state,
                dropdownState: true
            };
        case 'CLOSE_LIST':
            if (state.dataContextRef.current?.disabled) return state;
            if (!state.dropdownState) return state;
            return {
                ...state,
                activeOptionIndex: null,
                dropdownState: false
            };
        case 'REGISTER_OPTION':
            const newOption = { id: action.id, dataOptionRef: action.payload };

            const newListOption = [...state.options, newOption];

            let currentActiveOptionIndex = state.activeOptionIndex;
            if (
                currentActiveOptionIndex === null &&
                state.dataContextRef.current
            ) {
                if (
                    state.dataContextRef.current.isSelected(
                        action.payload.current.value
                    )
                ) {
                    currentActiveOptionIndex = newListOption.indexOf(newOption);
                }
            }

            return {
                ...state,
                activeOptionIndex: currentActiveOptionIndex,
                options: newListOption
            };
        case 'UNREGISTER_OPTION':
            const index = state.options.findIndex(a => a.id === action.id);
            const cleanedOptions = [...state.options];
            if (index !== -1) {
                cleanedOptions.splice(index, 1);
            }
            return {
                ...state,
                options: cleanedOptions
            };
        case 'GO_TO_OPTION':
            if (state.dataContextRef.current?.disabled) return state;
            const activeOptionIndex = calculateActiveIndex(action, {
                resolveItems: () => state.options,
                resolveActiveIndex: () => state.activeOptionIndex,
                resolveId: option => option.id,
                resolveDisabled: option => option.dataOptionRef.current.disabled
            });
            return {
                ...state,
                activeOptionIndex
            };
        case 'SEARCH':
            if (!state.dropdownState || state.dataContextRef.current?.disabled)
                return state;

            const searchQuery = state.searchQuery + action.value.toLowerCase();

            const matchingOption = state.options.find(
                option =>
                    !option.dataOptionRef.current.disabled &&
                    option.dataOptionRef.current.domRef.current.textContent
                        ?.toLowerCase()
                        ?.startsWith(searchQuery)
            );

            const matchIndex = matchingOption
                ? state.options.indexOf(matchingOption)
                : -1;

            if (matchIndex === -1 || matchIndex === state.activeOptionIndex)
                return { ...state, searchQuery };

            return {
                ...state,
                searchQuery,
                activeOptionIndex: matchIndex
            };
        case 'CLEAR_SEARCH':
            if (
                state.searchQuery === '' ||
                !state.dropdownState ||
                state.dataContextRef.current?.disabled
            )
                return state;
            return { ...state, searchQuery: '' };
        default: {
            return state;
        }
    }
};

const SelectContextData = createContext<IDataContextDefinition<any> | null>(
    null
);

const SelectContextActions = createContext<{
    closeSelect: () => void;
    openSelect: () => void;
    registerOption: (id: string, payload: any) => void;
    onChange: (value: unknown) => void;
    goToOption(focus: Focus.Specific, id: string): void;
    goToOption(focus: Exclude<Focus, Focus.Specific>, id?: string): void;
    search: (value: string) => void;
    clearSearch: () => void;
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
    children?: ReactNode | ((active: boolean, selected: boolean) => ReactNode);
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
    const dataContextRef = useRef<IDataContextDefinition<any> | null>(null);

    const [state, dispatch] = useReducer(selectActionsReducer, {
        dropdownState: false,
        options: [],
        activeOptionIndex: null,
        dataContextRef: dataContextRef,
        searchQuery: ''
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

    const goToOption = useCallback((focus: Focus, id?: string) => {
        if (focus === Focus.Specific) {
            return dispatch({
                type: 'GO_TO_OPTION',
                focus: Focus.Specific,
                id: id!
            });
        }
        return dispatch({ type: 'GO_TO_OPTION', focus });
    }, []);

    const search = useCallback(
        (value: string) => dispatch({ type: 'SEARCH', value }),
        []
    );

    const clearSearch = useCallback(
        () => dispatch({ type: 'CLEAR_SEARCH' }),
        []
    );

    const isSelected = useCallback(
        (compareValue: unknown) => {
            return value === compareValue;
        },
        [value]
    );

    const actions = useMemo<ReturnType<typeof useAction>>(
        () => ({
            closeSelect,
            openSelect,
            registerOption,
            goToOption,
            onChange: controlledOnChange,
            search,
            clearSearch
        }),
        []
    );

    const data = useMemo<ReturnType<typeof useData>>(
        () => ({
            ...state,
            value,
            disabled,
            isSelected,
            buttonRef,
            optionsRef
        }),
        [state, value, disabled]
    );

    useIsomorphicLayoutEffect(() => {
        state.dataContextRef.current = data;
    }, [data]);

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
        const actions = useAction();
        const optionsRef = useMergeRefs([data.optionsRef, ref]);
        const { start, clear } = useTimeout(() => actions.clearSearch(), 350);

        useIsomorphicLayoutEffect(() => {
            const container = data.optionsRef.current;
            if (!container || !data.dropdownState) return;
            container.focus({ preventScroll: true });
        }, [data.optionsRef, data.dropdownState]);

        useEffect(() => {
            return () => {
                clear();
            };
        }, []);

        const handleOnKeyDown = useCallback(
            (e: React.KeyboardEvent) => {
                switch (e.key) {
                    case 'ArrowUp':
                        e.preventDefault();
                        e.stopPropagation();
                        return actions.goToOption(Focus.Previous);
                    case 'ArrowDown':
                        e.preventDefault();
                        e.stopPropagation();
                        return actions.goToOption(Focus.Next);
                    case 'Home':
                    case 'PageUp':
                        e.preventDefault();
                        e.stopPropagation();
                        return actions.goToOption(Focus.First);
                    case 'End':
                    case 'PageDown':
                        e.preventDefault();
                        e.stopPropagation();
                        return actions.goToOption(Focus.Last);
                    case 'Enter':
                        e.preventDefault();
                        e.stopPropagation();
                        if (data.activeOptionIndex !== null) {
                            const { dataOptionRef } =
                                data.options[data.activeOptionIndex];
                            actions.onChange(dataOptionRef.current.value);
                            return actions.closeSelect();
                        }
                    case 'Escape':
                        e.preventDefault();
                        e.stopPropagation();
                        return actions.closeSelect();
                    default:
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.key.length === 1) {
                            clear();
                            actions.search(e.key);
                            start();
                        }
                        break;
                }
            },
            [data.options, data.activeOptionIndex]
        );

        if (!data.dropdownState) return <></>;
        return (
            <ul
                role='listbox'
                aria-orientation='vertical'
                tabIndex={0}
                ref={optionsRef}
                onKeyDown={handleOnKeyDown}
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
        const data = useData();

        const optionRef = useMergeRefs([domElmOptionRef, ref]);

        const dataOption = useLatestValue({
            id: internalId,
            value,
            domRef: domElmOptionRef,
            disabled
        });

        useIsomorphicLayoutEffect(
            () => actions.registerOption(internalId, dataOption),
            [internalId, dataOption]
        );

        const active =
            data.activeOptionIndex !== null
                ? data.options[data.activeOptionIndex].id === internalId
                : false;

        const selected = data.isSelected(value);

        const handleClick = useCallback((e: SyntheticEvent) => {
            if (disabled) return e.preventDefault();
            actions.onChange(value);
            actions.closeSelect();
        }, []);

        const handleMove = useCallback(() => {
            if (disabled || active) return;
            actions.goToOption(Focus.Specific, internalId);
        }, []);

        return (
            <li
                tabIndex={-1}
                role='option'
                aria-selected={selected}
                aria-disabled={disabled ? true : undefined}
                ref={optionRef}
                onClick={handleClick}
                onMouseMove={handleMove}
            >
                {typeof children == 'function'
                    ? children(active, selected)
                    : children}
            </li>
        );
    }
);

Select.Button = Button;
Select.Options = Options;
Select.Option = Option;

export default Select;
