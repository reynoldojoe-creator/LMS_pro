import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, LayoutAnimation, Platform } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

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
    tintColor = colors.background, // Default to background (white) for the selected thumb
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
                            isSelected && styles.selectedSegment
                        ]}
                        onPress={() => {
                            // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            onChange(index);
                        }}
                        activeOpacity={0.7}
                    >
                        <Text style={[
                            styles.text,
                            isSelected && styles.selectedText
                        ]}>
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
        backgroundColor: colors.systemGray5, // Darker background for better visibility
        borderRadius: borderRadius.md,
        padding: 4, // Increased padding
        height: 40, // Increased height
    },
    segment: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: borderRadius.sm,
    },
    selectedSegment: {
        backgroundColor: colors.background, // White thumb
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    text: {
        ...typography.caption1,
        fontWeight: '500',
        color: colors.text,
    },
    selectedText: {
        fontWeight: '600',
        color: colors.text,
    }
});
