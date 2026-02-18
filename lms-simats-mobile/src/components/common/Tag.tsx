import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing} from '../../theme';
import { useAppTheme } from '../../hooks';

interface TagProps {
    label: string;
    variant?: 'bloom' | 'difficulty' | 'status' | 'default';
    bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
    difficulty?: 'easy' | 'medium' | 'hard';
    status?: 'pending' | 'approved' | 'rejected' | 'quarantined';
    size?: 'sm' | 'md';
    color?: string;
}

export const Tag: React.FC<TagProps> = ({
    label,
    variant = 'default',
    bloomLevel,
    difficulty,
    status,
    size = 'md',
    color,
}) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    const getBackgroundColor = () => {
        if (color) {
            return color;
        }

        if (variant === 'bloom' && bloomLevel) {
            const bloomColors: Record<string, string> = {
                remember: colors.bloomRemember,
                understand: colors.bloomUnderstand,
                apply: colors.bloomApply,
                analyze: colors.bloomAnalyze,
                evaluate: colors.bloomEvaluate,
                create: colors.bloomCreate,
            };
            return bloomColors[bloomLevel];
        }

        if (variant === 'difficulty' && difficulty) {
            const difficultyColors: Record<string, string> = {
                easy: colors.difficultyEasy,
                medium: colors.difficultyMedium,
                hard: colors.difficultyHard,
            };
            return difficultyColors[difficulty];
        }

        if (variant === 'status' && status) {
            const statusColors: Record<string, string> = {
                pending: colors.warning,
                approved: colors.success,
                rejected: colors.error,
                quarantined: colors.iosGray,
            };
            return statusColors[status];
        }

        return colors.iosGray5;
    };

    return (
        <View
            style={[
                styles.tag,
                { backgroundColor: getBackgroundColor() },
                size === 'sm' && styles.tagSm,
            ]}
        >
            <Text style={[styles.text, size === 'sm' && styles.textSm]}>
                {label}
            </Text>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    tag: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
: 9999,
        alignSelf: 'flex-start',
    },
    tagSm: {
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    text: {
        ...typography.captionBold,
        color: colors.textInverse,
        fontSize: 11,
    },
    textSm: {
        fontSize: 9,
    },
});
