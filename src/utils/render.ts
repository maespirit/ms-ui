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

const render = ({
    myProps,
    theirProps,
    tag,
    states,
    visible = true,
    name
}: {
    myProps: React.PropsWithChildren<HTMLElement>;
    theirProps: React.PropsWithChildren<HTMLElement>;
    tag: ElementType;
    states?: object;
    visible?: boolean;
    name: string;
}) => {
    const props = { ...theirProps, ...myProps };
    const { children } = props;

    const resolvedChildren = (
        typeof children === 'function' ? children(states) : children
    ) as ReactElement | ReactElement[];

    console.log(name);

    if (visible) {
        return React.createElement(tag, props, resolvedChildren);
    }
};

export default render;
