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
import calculateActiveIndex, { Focus } from '../../utils/calculateActiveIndex';
import useIsomorphicLayoutEffect from '../../hooks/useIsoMorphicEffect';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useMergeRefs } from '../../hooks/useMergeRefs';
import { useTimeout } from '../../hooks/useTimeout';
import { useLatestValue } from '../../hooks/useLatestValue';

interface IStateDefinition {
    dropdownState: boolean;
    items: { id: string; dataItemRef: IDataItemRef }[];
    activeItemIndex: number | null;
    dataContextRef: MutableRefObject<IDataContextDefinition | null>;
    searchQuery: string;
}

interface IDataContextDefinition extends IStateDefinition {
    disabled: boolean;
    buttonRef: MutableRefObject<HTMLButtonElement | null>;
    itemsRef: MutableRefObject<HTMLDivElement | null>;
}

type IDataItemRef = MutableRefObject<{
    id: string;
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

const menuActionsReducer = (state: IStateDefinition, action: Actions) => {
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
                activeItemIndex: null,
                dropdownState: false
            };
        case 'REGISTER_OPTION': {
            const newOption = { id: action.id, dataItemRef: action.payload };

            const newListItem = [...state.items, newOption];

            return {
                ...state,
                items: newListItem
            };
        }
        case 'UNREGISTER_OPTION': {
            const index = state.items.findIndex(a => a.id === action.id);
            const cleanedOptions = [...state.items];
            if (index !== -1) {
                cleanedOptions.splice(index, 1);
            }
            return {
                ...state,
                items: cleanedOptions
            };
        }
        case 'GO_TO_OPTION': {
            if (state.dataContextRef.current?.disabled) return state;
            const activeItemIndex = calculateActiveIndex(action, {
                resolveItems: () => state.items,
                resolveActiveIndex: () => state.activeItemIndex,
                resolveId: option => option.id,
                resolveDisabled: option => option.dataItemRef.current.disabled
            });
            return {
                ...state,
                activeItemIndex
            };
        }
        case 'SEARCH': {
            if (!state.dropdownState || state.dataContextRef.current?.disabled)
                return state;

            const searchQuery = state.searchQuery + action.value.toLowerCase();

            const matchingItem = state.items.find(
                item =>
                    !item.dataItemRef.current.disabled &&
                    item.dataItemRef.current.domRef.current.textContent
                        ?.toLowerCase()
                        ?.startsWith(searchQuery)
            );

            const matchIndex = matchingItem
                ? state.items.indexOf(matchingItem)
                : -1;

            if (matchIndex === -1 || matchIndex === state.activeItemIndex)
                return { ...state, searchQuery };

            return {
                ...state,
                searchQuery,
                activeItemIndex: matchIndex
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

const MenuContextData = createContext<IDataContextDefinition | null>(null);

const MenuContextActions = createContext<{
    closeMenu: () => void;
    openMenu: () => void;
    registerOption: (id: string, payload: any) => void;
    goToOption(focus: Focus.Specific, id: string): void;
    goToOption(focus: Exclude<Focus, Focus.Specific>, id?: string): void;
    search: (value: string) => void;
    clearSearch: () => void;
} | null>(null);

const useData = () => {
    const context = useContext(MenuContextData);
    if (context === null) {
        const err = new Error(`le context data n'existe pas`);
        if (Error.captureStackTrace) Error.captureStackTrace(err, useData);
        throw err;
    }
    return context;
};

const useAction = () => {
    const context = useContext(MenuContextActions);
    if (context === null) {
        const err = new Error(`le context action n'existe pas`);
        if (Error.captureStackTrace) Error.captureStackTrace(err, useAction);
        throw err;
    }
    return context;
};

interface IMenu {
    children?: ReactNode;
    disabled?: boolean;
}

const Menu = (props: IMenu) => {
    const { disabled = false, children } = props;

    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const itemsRef = useRef<HTMLDivElement | null>(null);
    const dataContextRef = useRef<IDataContextDefinition | null>(null);

    const [state, dispatch] = useReducer(menuActionsReducer, {
        dropdownState: false,
        items: [],
        activeItemIndex: null,
        dataContextRef: dataContextRef,
        searchQuery: ''
    });

    const openMenu = useCallback(() => {
        dispatch({ type: 'OPEN_LIST' });
    }, []);

    const closeMenu = useCallback(() => {
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

    const data = useMemo<ReturnType<typeof useData>>(
        () => ({
            ...state,
            disabled,
            buttonRef,
            itemsRef
        }),
        [state, disabled]
    );

    useIsomorphicLayoutEffect(() => {
        state.dataContextRef.current = data;
    }, [data]);

    const actions = useMemo<ReturnType<typeof useAction>>(
        () => ({
            closeMenu,
            openMenu,
            registerOption,
            goToOption,
            search,
            clearSearch
        }),
        []
    );

    useClickOutside(() => closeMenu(), null, [data.buttonRef, data.itemsRef]);

    return (
        <MenuContextData.Provider value={data}>
            <MenuContextActions.Provider value={actions}>
                {children}
            </MenuContextActions.Provider>
        </MenuContextData.Provider>
    );
};

interface IMenuButton {
    className?: string | ((open: boolean) => string);
    children?: ReactNode | ((open: boolean) => ReactNode);
}

const Button = forwardRef(
    (
        { children, ...otherProps }: IMenuButton,
        ref: ForwardedRef<HTMLButtonElement>
    ) => {
        const actions = useAction();
        const data = useData();

        const buttonRef = useMergeRefs([data.buttonRef, ref]);

        const handleClick = () => {
            if (data.dropdownState) actions.closeMenu();
            else actions.openMenu();
        };

        const handleOnKeyDown = useCallback((e: React.KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    actions.openMenu();
                    actions.goToOption(Focus.Last);
                    break;

                case 'Space':
                case 'ArrowDown':
                case 'Enter':
                    e.preventDefault();
                    actions.openMenu();
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
                ariaHaspopup: 'menu',
                ariaExpanded: data.disabled ? undefined : data.dropdownState,
                ...otherProps
            },
            typeof children == 'function' ? children(open) : children
        );
    }
);

interface IMenuItems extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

const Items = forwardRef(
    (
        { children, ...otherProps }: IMenuItems,
        ref: ForwardedRef<HTMLDivElement>
    ) => {
        const data = useData();
        const actions = useAction();
        const optionsRef = useMergeRefs([data.itemsRef, ref]);
        const { start, clear } = useTimeout(() => actions.clearSearch(), 350);

        useIsomorphicLayoutEffect(() => {
            const container = data.itemsRef.current;
            if (!container || !data.dropdownState) return;
            container.focus({ preventScroll: true });
        }, [data.itemsRef, data.dropdownState]);

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
                        if (data.activeItemIndex !== null) {
                            return actions.closeMenu();
                        }
                        break;
                    case 'Escape':
                        e.preventDefault();
                        e.stopPropagation();
                        actions.closeMenu();
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
            [data.items, data.activeItemIndex]
        );

        if (!data.dropdownState) return <></>;
        return (
            <div
                role='menu'
                aria-orientation='vertical'
                tabIndex={0}
                ref={optionsRef}
                onKeyDown={handleOnKeyDown}
                {...otherProps}
            >
                {children}
            </div>
        );
    }
);

interface IMenuItem {
    children?:
        | ReactNode
        | ((p: { active: boolean; disabled: boolean }) => ReactNode);
    disabled?: boolean;
    className?:
        | string
        | ((p: { active: boolean; disabled: boolean }) => string);
}

const Item = forwardRef(
    (props: IMenuItem, ref: ForwardedRef<HTMLButtonElement>) => {
        const { children, disabled = false, ...otherProps } = props;
        const internalId = useId();
        const domElmItemRef = useRef<HTMLButtonElement | null>(null);
        const actions = useAction();
        const data = useData();

        const optionRef = useMergeRefs([domElmItemRef, ref]);

        const dataOption = useLatestValue({
            id: internalId,
            domRef: domElmItemRef,
            disabled
        });

        useIsomorphicLayoutEffect(
            () => actions.registerOption(internalId, dataOption),
            [internalId, dataOption]
        );

        const active =
            data.activeItemIndex !== null
                ? data.items[data.activeItemIndex].id === internalId
                : false;

        const handleClick = useCallback(
            (e: SyntheticEvent) => {
                if (disabled) return e.preventDefault();
                actions.closeMenu();
            },
            [actions, disabled]
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
                disabled
            });
        }

        return React.createElement(
            'button',
            {
                role: 'menuitem',
                ariaDisabled: disabled ? true : undefined,
                ref: optionRef,
                onClick: handleClick,
                onMouseMove: handleMove,
                ...otherProps
            },
            typeof children == 'function'
                ? children({ active, disabled })
                : children
        );
    }
);

Button.displayName = 'Button';
Items.displayName = 'Items';
Item.displayName = 'Item';

Menu.Button = Button;
Menu.Items = Items;
Menu.Item = Item;

export default Menu;
