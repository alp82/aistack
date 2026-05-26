import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
	theme: Theme;
	toggleTheme: () => void;
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = "aistack-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(() => {
		if (typeof document !== "undefined") {
			const htmlClass = document.documentElement.className;
			if (htmlClass === "light") return "light";
		}
		return "dark";
	});

	useEffect(() => {
		const root = document.documentElement;
		root.classList.remove("dark", "light");
		root.classList.add(theme);
		localStorage.setItem(THEME_KEY, theme);
	}, [theme]);

	const toggleTheme = () => {
		setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
	};

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme);
	};

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
