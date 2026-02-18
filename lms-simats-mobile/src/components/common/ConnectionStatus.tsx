import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useAppTheme } from '../../hooks';
import { api } from '../../services/api';

export const ConnectionStatus: React.FC = () => {
    const { colors } = useAppTheme();
    const [isConnected, setIsConnected] = useState(true);
    const [height] = useState(new Animated.Value(0));

    useEffect(() => {
        const checkConnection = async () => {
            try {
                // Ping health endpoint
                await api.get('/health');
                if (!isConnected) {
                    setIsConnected(true);
                    Animated.timing(height, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: false,
                    }).start();
                }
            } catch (e) {
                if (isConnected) {
                    setIsConnected(false);
                    Animated.timing(height, {
                        toValue: 30, // Adjust height as needed
                        duration: 300,
                        useNativeDriver: false,
                    }).start();
                }
            }
        };

        // Check immediately
        checkConnection();

        // Poll every 10 seconds
        const interval = setInterval(checkConnection, 10000);

        return () => clearInterval(interval);
    }, [isConnected, height]);

    // Determine style based on status
    const styles = getStyles(colors, isConnected);

    // Always render container for animation, but hide content if connected (handled by height)
    return (
        <Animated.View style={[styles.container, { height }]}>
            {!isConnected && <Text style={styles.text}>No Connection to Server</Text>}
        </Animated.View>
    );
};

const getStyles = (colors: any, _isConnected: boolean) => StyleSheet.create({
    container: {
        backgroundColor: colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        paddingVertical: 4,
    },
});
