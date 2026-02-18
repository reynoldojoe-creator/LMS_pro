import React from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, SectionListProps, ViewStyle } from 'react-native';
import { colors, darkColors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

interface GroupedTableViewProps extends SectionListProps<any, any> {
    onItemPress?: (item: any) => void;
}

export const GroupedTableView: React.FC<GroupedTableViewProps> = ({
    sections,
    renderItem,
    onItemPress,
    style,
    ...props
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const themeColors = isDark ? darkColors : colors;

    const renderSectionHeader = ({ section: { title } }: any) => {
        if (!title) return null;
        return (
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{title.toUpperCase()}</Text>
            </View>
        );
    };

    const renderCell = ({ item, index, section }: any) => {
        const isFirst = index === 0;
        const isLast = index === section.data.length - 1;

        // Pass context to custom renderer if needed, but usually we just wrap it
        const content = renderItem ? renderItem({ item, index, section, separators: { highlight: () => { }, unhighlight: () => { }, updateProps: () => { } } }) : (
            <View style={styles.defaultCell}>
                <Text style={[styles.cellText, { color: isDark ? 'white' : 'black' }]}>{item.title || item.name || String(item)}</Text>
                {item.subtitle && <Text style={styles.cellSubtitle}>{item.subtitle}</Text>}
                {(onItemPress || item.onPress) && (
                    <Ionicons name="chevron-forward" size={20} color={colors.ios.iosGray} />
                )}
            </View>
        );

        const Wrapper = (onItemPress || item.onPress) ? TouchableOpacity : View;

        return (
            <Wrapper
                onPress={() => (item.onPress || onItemPress)?.(item)}
                style={[
                    styles.cellContainer,
                    {
                        backgroundColor: isDark ? themeColors.surface : 'white',
                        borderColor: themeColors.ios.border
                    },
                    isFirst && styles.firstCell,
                    isLast && styles.lastCell,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: themeColors.ios.border }
                ]}
            >
                {content}
            </Wrapper>
        );
    };

    return (
        <SectionList
            sections={sections}
            renderItem={renderCell}
            renderSectionHeader={renderSectionHeader}
            style={[styles.list, style]}
            contentContainerStyle={styles.contentContainer}
            stickySectionHeadersEnabled={false}
            {...props}
        />
    );
};

const styles = StyleSheet.create({
    list: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    sectionHeader: {
        marginTop: 20,
        marginBottom: 8,
        marginLeft: 12,
    },
    sectionHeaderText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4C566C',
        textShadowColor: 'rgba(255,255,255,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 0,
    },
    cellContainer: {
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        // No top/bottom border by default, except first/last
    },
    firstCell: {
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        borderTopWidth: 1,
    },
    lastCell: {
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        borderBottomWidth: 1,
    },
    defaultCell: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cellText: {
        fontSize: 17,
        fontWeight: 'bold',
    },
    cellSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 2,
    }
});
