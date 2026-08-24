import { Accessor, JSX } from 'solid-js';
export type Theme = 'light' | 'dark';
type ThemeContextValue = {
    theme: Accessor<Theme>;
    setTheme: (theme: Theme) => void;
};
export declare const ThemeContextProvider: (props: {
    children: JSX.Element;
    theme: Theme;
}) => JSX.Element;
export declare function useTheme(): ThemeContextValue;
export {};
