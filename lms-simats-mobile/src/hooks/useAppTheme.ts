
import { useThemeStore } from '../store';
import { colors, darkColors } from '../theme/colors'; // Assuming colors.ts exports darkColors now

export const useAppTheme = () => {
    const { isDarkMode, toggleTheme, setTheme } = useThemeStore();

    return {
        colors: isDarkMode ? darkColors : colors,
        isDarkMode,
        toggleTheme,
        setTheme,
    };
};
