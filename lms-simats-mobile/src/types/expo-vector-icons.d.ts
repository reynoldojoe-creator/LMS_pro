declare module '@expo/vector-icons' {
    import { IconProps } from 'react-native-vector-icons/Icon';
    import { Component } from 'react';

    export class Ionicons extends Component<IconProps> {
        static glyphMap: any;
    }
    export class MaterialIcons extends Component<IconProps> {
        static glyphMap: any;
    }
    export class FontAwesome extends Component<IconProps> {
        static glyphMap: any;
    }
    // Add others if needed
}
