import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';


export type AuthStackParamList = {
    Login: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

interface AuthNavigatorProps {
    initialRouteName?: keyof AuthStackParamList;
}

export const AuthNavigator = ({ initialRouteName = 'Login' }: AuthNavigatorProps) => (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
        <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
);
