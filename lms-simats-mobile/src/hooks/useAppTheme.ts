
import { useThemeStore } from '../store';
import { colors, darkColors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export const useAppTheme = () => {
    const { isDarkMode, toggleTheme, setTheme } = useThemeStore();

    return {
        colors: isDarkMode ? darkColors : colors,
        typography,
        spacing,
        isDarkMode,
        toggleTheme,
        setTheme,
    };
};
