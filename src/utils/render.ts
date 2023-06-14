import React, { ElementType, ReactElement } from 'react';

const mergeRefs = (...refs: any[]) => {
    return {
        ref: refs.every(ref => ref == null)
            ? undefined
            : (value: any) => {
                  for (const ref of refs) {
                      if (ref == null) continue;
                      if (typeof ref === 'function') ref(value);
                      else ref.current = value;
                  }
              }
    };
};

// type ReactTag = keyof JSX.IntrinsicElements | JSXElementConstructor<any>;

// interface RenderProps<TTag> {
//     myProps: React.ComponentPropsWithRef<ElementType>;
//     theirProps: React.ComponentPropsWithRef<ElementType>;
//     tag: ElementType;
//     states?: object;
//     visible?: boolean;
//     name: string;
// }

interface RenderProps {
    myProps: React.PropsWithChildren<Record<string, any>>;
    theirProps: React.PropsWithChildren<Record<string, any>>;
    tag: ElementType;
    states?: Record<string, any>;
    visible?: boolean;
    name: string;
}

const render = ({
    myProps,
    theirProps,
    tag,
    states,
    visible = true,
    name
}: RenderProps) => {
    const props = { ...theirProps, ...myProps };
    const { children } = props;

    const resolvedChildren = (
        typeof children === 'function' ? children(states) : children
    ) as ReactElement | ReactElement[];

    if (
        'className' in props &&
        props.className &&
        typeof props.className === 'function'
    ) {
        props.className = props.className(states);
    }

    console.log(name);

    if (visible) {
        return React.createElement(tag, props, resolvedChildren);
    }

    return null;
};

export default render;
