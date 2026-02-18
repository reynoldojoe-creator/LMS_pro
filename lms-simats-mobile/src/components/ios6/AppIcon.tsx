import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ViewStyle, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface AppIconProps {
    title: string;
    icon?: string; // Icon name from Ionicons
    image?: ImageSourcePropType; // ...local image source
    color?: string | string[]; // Background color or gradient
    onPress: () => void;
    badge?: number;
    style?: ViewStyle;
}

export const AppIcon: React.FC<AppIconProps> = ({
    title,
    icon,
    image,
    color = ['#4A90E2', '#0056D2'],
    onPress,
    badge,
    style
}) => {
    // Determine background: gradient or solid
    const bgColors = Array.isArray(color) ? color : [color, color];

    return (
        <TouchableOpacity style={[styles.container, style]} onPress={onPress}>
            <View style={styles.iconWrapper}>
                {/* Icon Background */}
                <LinearGradient
                    colors={bgColors as any}
                    style={styles.iconBackground}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                >
                    {/* Content */}
                    {image ? (
                        <Image source={image} style={styles.image} resizeMode="cover" />
                    ) : icon ? (
                        <Ionicons name={icon as any} size={32} color="white" style={styles.iconShadow} />
                    ) : (
                        // Placeholder if no image/icon
                        <Text style={styles.placeholderText}>{title.charAt(0)}</Text>
                    )}
                </LinearGradient>

                {/* Gloss Overlay */}
                <LinearGradient
                    colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.1)', 'transparent']}
                    style={styles.gloss}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    locations={[0, 0.45, 0.46]}
                />

                {/* Badge */}
                {badge && badge > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                    </View>
                )}
            </View>

            <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: 80,
        margin: 10,
    },
    iconWrapper: {
        width: 60,
        height: 60,
        borderRadius: 12,
        // Apple icons are "squircle" technically, but rounded rect is close enough for now
        overflow: 'hidden',
        // Shadow for the whole icon
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 5,
        backgroundColor: 'black', // background for shadow
        marginBottom: 5,
    },
    iconBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gloss: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    iconShadow: {
        shadowColor: 'rgba(0,0,0,0.5)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 1,
    },
    placeholderText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    title: {
        fontSize: 12,
        fontWeight: '500',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        textAlign: 'center',
        width: '100%',
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
        borderWidth: 1.5,
        borderColor: 'white',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    }
});
