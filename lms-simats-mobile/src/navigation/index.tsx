import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { FacultyNavigator } from './FacultyNavigator';
import { VetterNavigator } from './VetterNavigator';
import { useAuthStore } from '../store';
import { LoadingSpinner } from '../components/common';
import { RoleSelectScreen } from '../screens/auth/RoleSelectScreen';

export const RootNavigator = () => {
    const { currentRole, isLoading } = useAuthStore();

    // Hydrate persisted role on app start
    useEffect(() => {
        useAuthStore.getState().hydrate();
    }, []);

    // Show loading spinner while hydrating
    if (isLoading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <NavigationContainer>
            {!currentRole ? (
                // No role selected: Show role selection
                <RoleSelectScreen />
            ) : currentRole === 'faculty' ? (
                // Faculty role selected
                <FacultyNavigator />
            ) : (
                // Vetter role selected
                <VetterNavigator />
            )}
        </NavigationContainer>
    );
};
