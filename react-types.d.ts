// Type declarations for React

declare module 'react' {
  // Basic React hooks
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useRef<T>(initialValue: T): { current: T };
  export function useId(): string;
  export function createContext<T>(defaultValue: T): React.Context<T>;
  export function useContext<T>(context: React.Context<T>): T;
  
  // ForwardRef type with displayName
  export function forwardRef<T, P = {}>(render: (props: P, ref: React.Ref<T>) => React.ReactElement | null): ForwardRefExoticComponent<P & { ref?: React.Ref<T> }>;
  
  export interface ForwardRefExoticComponent<P> {
    (props: P): React.ReactElement | null;
    displayName?: string;
  }

  // Context type
  export interface Context<T> {
    Provider: Provider<T>;
    Consumer: Consumer<T>;
    displayName?: string;
  }

  export interface Provider<T> {
    (props: { value: T; children?: ReactNode }): ReactElement | null;
  }

  export interface Consumer<T> {
    (props: { children: (value: T) => ReactNode }): ReactElement | null;
  }

  // React Node types
  export type ReactNode = ReactElement | string | number | ReactFragment | ReactPortal | boolean | null | undefined;
  export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }
  export type JSXElementConstructor<P> = (props: P) => ReactElement<any, any> | null;
  export type ReactFragment = Iterable<ReactNode>;
  export interface ReactNodeArray extends Array<ReactNode> {}
  export interface ReactPortal extends ReactElement {
    key: Key | null;
    children: ReactNode;
  }
  export type Key = string | number;

  // Ref types
  export type Ref<T> = RefCallback<T> | RefObject<T> | null;
  export type RefCallback<T> = (instance: T | null) => void;
  export interface RefObject<T> {
    readonly current: T | null;
  }

  // Element types
  export type ElementRef<C extends React.ComponentType<any>> = C extends React.ComponentType<infer P> ? (P extends { ref?: infer R } ? R extends React.Ref<infer E> ? E : never : never) : never;
  export type ComponentPropsWithoutRef<T extends React.ComponentType<any>> = Omit<React.ComponentProps<T>, 'ref'>;
  export type ComponentProps<T extends React.ComponentType<any>> = T extends React.ComponentType<infer P> ? P : never;

  // HTML attributes
  export interface HTMLAttributes<T> {
    className?: string;
    children?: ReactNode;
    id?: string;
    style?: CSSProperties;
    onClick?: (event: any) => void;
    onChange?: (event: any) => void;
    onInput?: (event: any) => void;
    onBlur?: (event: any) => void;
    onFocus?: (event: any) => void;
    onKeyDown?: (event: any) => void;
    onKeyUp?: (event: any) => void;
    onKeyPress?: (event: any) => void;
    onSubmit?: (event: any) => void;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
    maxLength?: number;
    minLength?: number;
    name?: string;
    value?: string | number | readonly string[] | undefined;
    defaultValue?: string | number | readonly string[] | undefined;
    title?: string;
    role?: string;
    tabIndex?: number;
    autoFocus?: boolean;
    autoComplete?: string;
    ariaLabel?: string;
    ariaLabelledby?: string;
    ariaDescribedby?: string;
    ariaHidden?: boolean;
    dataTestid?: string;
  }

  // Button HTML attributes
  export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    form?: string;
    formAction?: string;
    formEncType?: string;
    formMethod?: string;
    formNoValidate?: boolean;
    formTarget?: string;
    name?: string;
    value?: string | ReadonlyArray<string> | number;
  }

  // Input HTML attributes
  export interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    accept?: string;
    alt?: string;
    autoComplete?: string;
    autoFocus?: boolean;
    capture?: boolean | 'user' | 'environment';
    checked?: boolean;
    disabled?: boolean;
    form?: string;
    formAction?: string;
    formEncType?: string;
    formMethod?: string;
    formNoValidate?: boolean;
    formTarget?: string;
    height?: number | string;
    list?: string;
    max?: number | string;
    maxLength?: number;
    min?: number | string;
    minLength?: number;
    multiple?: boolean;
    name?: string;
    pattern?: string;
    placeholder?: string;
    readOnly?: boolean;
    required?: boolean;
    size?: number;
    src?: string;
    step?: number | string;
    type?: string;
    value?: string | ReadonlyArray<string> | number | undefined;
    width?: number | string;
  }

  // CSS Properties
  export interface CSSProperties {
    [key: string]: string | number | undefined;
  }

  // Event types
  export interface ChangeEvent<T extends Element> {
    target: T & {
      value: string;
      checked?: boolean;
    };
    currentTarget: T & {
      value: string;
      checked?: boolean;
    };
  }

  // Utility types
  export type FC<P = {}> = FunctionComponent<P>;
  export interface FunctionComponent<P = {}> {
    (props: P): React.ReactElement | null;
    displayName?: string;
  }
} 