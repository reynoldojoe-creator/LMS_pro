import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface SegmentedControlProps {
    segments: string[];
    selectedIndex: number;
    onChange: (index: number) => void;
    tintColor?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
    segments,
    selectedIndex,
    onChange,
    tintColor,
}) => {
    return (
        <View style={styles.container}>
            {segments.map((segment, index) => {
                const isSelected = index === selectedIndex;

                return (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.segment,
                            isSelected && [styles.segmentSelected, tintColor ? { backgroundColor: tintColor } : {}],
                            index === 0 && styles.segmentFirst,
                            index === segments.length - 1 && styles.segmentLast,
                        ]}
                        onPress={() => onChange(index)}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.text,
                                isSelected && styles.textSelected,
                                isSelected && tintColor ? { color: '#fff' } : {},
                            ]}
                        >
                            {segment}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: colors.iosGray6,
        borderRadius: borderRadius.md,
        padding: 2,
    },
    segment: {
        flex: 1,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    segmentFirst: {
        borderTopLeftRadius: borderRadius.md - 2,
        borderBottomLeftRadius: borderRadius.md - 2,
    },
    segmentLast: {
        borderTopRightRadius: borderRadius.md - 2,
        borderBottomRightRadius: borderRadius.md - 2,
    },
    segmentSelected: {
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    text: {
        ...typography.body,
        fontSize: 15,
        color: colors.textPrimary,
    },
    textSelected: {
        ...typography.bodyBold,
        fontSize: 15,
        color: colors.textPrimary,
    },
});
