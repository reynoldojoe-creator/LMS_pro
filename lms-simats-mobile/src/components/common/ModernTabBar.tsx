import React, { FC } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { BlurView } from 'expo-blur';

export const ModernTabBar: FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
    const insets = useSafeAreaInsets();

    // Check if the focused route has tabBarStyle set to { display: 'none' }
    const focusedRoute = state.routes[state.index];
    const { options: focusedOptions } = descriptors[focusedRoute.key];
    const isHidden = focusedOptions.tabBarStyle && (focusedOptions.tabBarStyle as any).display === 'none';

    if (isHidden) {
        return null; // hide the tab bar completely
    }

    return (
        <View style={styles.wrapper}>
            <BlurView intensity={80} tint="light" style={[styles.container, { paddingBottom: insets.bottom }]}>
                <View style={[styles.borderTop]} />
                <View style={styles.content}>
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        const label =
                            options.tabBarLabel !== undefined
                                ? options.tabBarLabel
                                : options.title !== undefined
                                    ? options.title
                                    : route.name;

                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        let iconName: any = 'square';
                        if (route.name.includes('Home')) iconName = isFocused ? 'home' : 'home-outline';
                        if (route.name.includes('Subjects')) iconName = isFocused ? 'book' : 'book-outline';
                        if (route.name.includes('Rubrics')) iconName = isFocused ? 'list' : 'list-outline';
                        if (route.name.includes('Reports')) iconName = isFocused ? 'bar-chart' : 'bar-chart-outline';

                        // Vetter Tabs
                        if (route.name === 'ReviewQueue' || route.name === 'Queue') iconName = isFocused ? 'albums' : 'albums-outline';
                        if (route.name === 'Completed') iconName = isFocused ? 'checkmark-done-circle' : 'checkmark-done-circle-outline';
                        if (route.name === 'Stats') iconName = isFocused ? 'stats-chart' : 'stats-chart-outline';
                        if (route.name === 'Settings') iconName = isFocused ? 'settings' : 'settings-outline';

                        // Specific mapping if needed
                        if ((options as any).tabBarIconName) {
                            iconName = (options as any).tabBarIconName;
                        }

                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                style={styles.tab}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={iconName}
                                    size={20}
                                    color={isFocused ? colors.primary : colors.textSecondary}
                                    style={styles.icon}
                                />
                                <Text style={[
                                    styles.label,
                                    { color: isFocused ? colors.primary : colors.textSecondary }
                                ]}>
                                    {label as string}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    container: {
        backgroundColor: Platform.OS === 'android' ? colors.background : 'transparent',
    },
    borderTop: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.separator,
    },
    content: {
        flexDirection: 'row',
        height: 40, // Reduced from 45/50 for compactness
        alignItems: 'center',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 2, // Reduced padding
    },
    icon: {
        marginBottom: 2,
    },
    label: {
        ...typography.caption2,
        fontWeight: '500',
        fontSize: 9, // Reduced font size
    },
});
