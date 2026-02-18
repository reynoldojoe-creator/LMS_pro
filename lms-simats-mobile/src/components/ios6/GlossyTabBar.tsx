import React, { FC } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const GlossyTabBar: FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.wrapper}>
            <LinearGradient
                colors={['#202020', '#000000']} // Dark glossy black like classic iOS
                style={[styles.container, { paddingBottom: insets.bottom }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                {/* Top highlight */}
                <View style={styles.highlight} />

                <View style={styles.tabs}>
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

                        // Decide icon based on route name - simplistic mapping, should be passed in ideally
                        let iconName: any = 'square';
                        if (route.name.includes('Home') || route.name.includes('Dashboard')) iconName = 'home';
                        if (route.name.includes('Subject')) iconName = 'book';
                        if (route.name.includes('Rubric')) iconName = 'list';
                        if (route.name.includes('Vetter')) iconName = 'checkmark-circle';
                        if (route.name.includes('Settings')) iconName = 'settings';

                        // Use specified icon if available in options (custom field)
                        if ((options as any).tabBarIconName) {
                            iconName = (options as any).tabBarIconName;
                        }

                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                style={styles.tab}
                                activeOpacity={0.8}
                            >
                                {/* Selection Glow */}
                                {isFocused && (
                                    <View style={styles.selectionGlow} />
                                )}

                                <Ionicons
                                    name={iconName}
                                    size={28}
                                    color={isFocused ? '#4A90E2' : '#999999'}
                                    style={[
                                        styles.icon,
                                        isFocused && styles.activeIconShadow
                                    ]}
                                />
                                <Text style={[
                                    styles.label,
                                    { color: isFocused ? '#4A90E2' : '#999999' }
                                ]}>
                                    {label as string}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'black',
    },
    container: {
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    highlight: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    tabs: {
        flexDirection: 'row',
        height: 49, // Standard iOS tab bar height
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 49,
    },
    label: {
        fontSize: 10,
        marginTop: 2,
        fontWeight: '600',
    },
    icon: {
        marginBottom: -2
    },
    activeIconShadow: {
        textShadowColor: 'rgba(74, 144, 226, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
    },
    selectionGlow: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 10,
        right: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 5,
    }
});
