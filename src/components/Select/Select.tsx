import React, {
    ForwardedRef,
    HTMLAttributes,
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
    dataContextRef: MutableRefObject<IDataContextDefinition | null>;
    searchQuery: string;
}

interface IDataContextDefinition extends IStateDefinition<unknown> {
    isSelected: (value: unknown) => boolean;
    value: unknown;
    disabled: boolean;
    mode: 'single' | 'multiple';
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

const selectActionsReducer = <T,>(
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
        case 'REGISTER_OPTION': {
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
        }
        case 'UNREGISTER_OPTION': {
            const index = state.options.findIndex(a => a.id === action.id);
            const cleanedOptions = [...state.options];
            if (index !== -1) {
                cleanedOptions.splice(index, 1);
            }
            return {
                ...state,
                options: cleanedOptions
            };
        }
        case 'GO_TO_OPTION': {
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
        }
        case 'SEARCH': {
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
        }
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

const SelectContextData = createContext<IDataContextDefinition | null>(null);

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
    const context = useContext(SelectContextData);
    if (context === null) {
        const err = new Error(`le context data n'existe pas`);
        if (Error.captureStackTrace) Error.captureStackTrace(err, useData);
        throw err;
    }
    return context;
};

const useAction = () => {
    const context = useContext(SelectContextActions);
    if (context === null) {
        const err = new Error(`le context action n'existe pas`);
        if (Error.captureStackTrace) Error.captureStackTrace(err, useAction);
        throw err;
    }
    return context;
};

interface ISelect<T> {
    children?: ReactNode;
    value?: T;
    defaultValue?: T;
    onChange?(value: T): void;
    multiple?: boolean;
    disabled?: boolean;
}

interface ISelectOptions extends HTMLAttributes<HTMLUListElement> {
    children?: ReactNode;
}

interface ISelectButton {
    className?: string | ((open: boolean) => string);
    children?: ReactNode | ((open: boolean) => ReactNode);
}

interface ISelectOption<T> {
    children?:
        | ReactNode
        | ((p: {
              active: boolean;
              selected: boolean;
              disabled: boolean;
          }) => ReactNode);
    value: T;
    disabled?: boolean;
    className?:
        | string
        | ((p: {
              active: boolean;
              selected: boolean;
              disabled: boolean;
          }) => string);
}

const Select = <T,>(props: ISelect<T>) => {
    const {
        children,
        value: controlledValue,
        onChange: theirOnChange,
        defaultValue,
        multiple = false,
        disabled = false
    } = props;

    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const optionsRef = useRef<HTMLUListElement | null>(null);
    const dataContextRef = useRef<IDataContextDefinition | null>(null);

    const [state, dispatch] = useReducer(selectActionsReducer, {
        dropdownState: false,
        options: [],
        activeOptionIndex: null,
        dataContextRef: dataContextRef,
        searchQuery: ''
    });

    const [value = multiple ? ([] as T[]) : undefined, controlledOnChange] =
        useControllable<any>(controlledValue, theirOnChange, defaultValue);

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
            if (!multiple) {
                return value === compareValue;
            } else {
                return (value as T[]).some(option => compareValue === option);
            }
        },
        [value, multiple]
    );

    const data = useMemo<ReturnType<typeof useData>>(
        () => ({
            ...state,
            value,
            disabled,
            mode: multiple ? 'multiple' : 'single',
            isSelected,
            buttonRef,
            optionsRef
        }),
        [state, value, disabled, multiple]
    );

    useIsomorphicLayoutEffect(() => {
        state.dataContextRef.current = data;
    }, [data]);

    const onChange = useCallback(
        (val: unknown) => {
            if (!multiple) {
                return controlledOnChange(val as T);
            } else {
                const copy = [...(value as T[])];
                const idx = copy.findIndex(item => item === val);
                if (idx === -1) {
                    copy.push(val as T);
                } else {
                    copy.splice(idx, 1);
                }
                return controlledOnChange(copy as T[]);
            }
        },
        [multiple, value]
    );

    const actions = useMemo<ReturnType<typeof useAction>>(
        () => ({
            closeSelect,
            openSelect,
            registerOption,
            goToOption,
            onChange,
            search,
            clearSearch
        }),
        [onChange]
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
    (
        { children, ...otherProps }: ISelectButton,
        ref: ForwardedRef<HTMLButtonElement>
    ) => {
        const actions = useAction();
        const data = useData();

        const buttonRef = useMergeRefs([data.buttonRef, ref]);

        const handleClick = () => {
            if (data.dropdownState) actions.closeSelect();
            else actions.openSelect();
        };

        const handleOnKeyDown = useCallback((e: React.KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    actions.openSelect();
                    actions.goToOption(Focus.Last);
                    break;

                case 'Space':
                case 'ArrowDown':
                case 'Enter':
                    e.preventDefault();
                    actions.openSelect();
                    actions.goToOption(Focus.First);
                    break;
                default:
                    break;
            }
        }, []);

        const open = data.dropdownState;

        if (
            'className' in otherProps &&
            otherProps.className &&
            typeof otherProps.className === 'function'
        ) {
            otherProps.className = otherProps.className(open);
        }

        return React.createElement(
            'button',
            {
                onClick: handleClick,
                onKeyDown: handleOnKeyDown,
                ref: buttonRef,
                disabled: data.disabled,
                ariaHaspopup: 'listbox',
                ariaExpanded: data.disabled ? undefined : data.dropdownState,
                ...otherProps
            },
            typeof children == 'function' ? children(open) : children
        );
    }
);

const Options = forwardRef(
    (
        { children, ...otherProps }: ISelectOptions,
        ref: ForwardedRef<HTMLUListElement>
    ) => {
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
                            if (data.mode == 'single')
                                return actions.closeSelect();
                        }
                        break;
                    case 'Escape':
                        e.preventDefault();
                        e.stopPropagation();
                        actions.closeSelect();
                        return data.buttonRef.current?.focus({
                            preventScroll: true
                        });
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
                {...otherProps}
            >
                {children}
            </ul>
        );
    }
);

const Option = forwardRef(
    <T,>(props: ISelectOption<T>, ref: ForwardedRef<HTMLLIElement>) => {
        const { children, value, disabled = false, ...otherProps } = props;
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

        const handleClick = useCallback(
            (e: SyntheticEvent) => {
                if (disabled) return e.preventDefault();
                actions.onChange(value);
                data.mode == 'single' && actions.closeSelect();
            },
            [data.mode, actions]
        );

        const handleMove = useCallback(() => {
            if (disabled || active) return;
            actions.goToOption(Focus.Specific, internalId);
        }, []);

        if (
            'className' in otherProps &&
            otherProps.className &&
            typeof otherProps.className === 'function'
        ) {
            otherProps.className = otherProps.className({
                active,
                selected,
                disabled
            });
        }

        return React.createElement(
            'li',
            {
                tabIndex: '-1',
                role: 'option',
                ariaSelected: selected,
                ariaDisabled: disabled ? true : undefined,
                ref: optionRef,
                onClick: handleClick,
                onMouseMove: handleMove,
                ...otherProps
            },
            typeof children == 'function'
                ? children({ active, selected, disabled })
                : children
        );
    }
);

Button.displayName = 'Button';
Options.displayName = 'Options';
Option.displayName = 'Option';

Select.Button = Button;
Select.Options = Options;
Select.Option = Option;

export default Select;
