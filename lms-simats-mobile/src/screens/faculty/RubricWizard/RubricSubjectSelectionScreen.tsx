import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { useFacultyStore } from '../../../store';
import { Input, ScreenBackground, ModernNavBar } from '../../../components/common';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<any, 'RubricSubjectSelection'>;

export const RubricSubjectSelectionScreen = ({ navigation }: Props) => {
    const { subjects, fetchSubjects } = useFacultyStore();
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (subjects.length === 0) fetchSubjects();
    }, []);

    const filtered = subjects.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (subjectId: string) => {
        navigation.navigate('RubricTypeSelection', { subjectId });
    };

    return (
        <ScreenBackground>
            <ModernNavBar
                title="Select Subject"
                showBack
                onBack={() => navigation.goBack()}
            />

            <View style={styles.paddings}>
                <Input
                    label=""
                    placeholder="Search subjects..."
                    value={search}
                    onChangeText={setSearch}
                    variant="filled"
                    leftIcon="search"
                />
            </View>

            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => handleSelect(item.id)}
                    >
                        <View>
                            <Text style={styles.code}>{item.code}</Text>
                            <Text style={styles.name}>{item.name}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>
                )}
            />
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.screenHorizontal,
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
        backgroundColor: colors.surface,
    },
    headerTitle: {
        ...typography.navTitle,
        color: colors.textPrimary,
    },
    paddings: {
        padding: spacing.md,
    },
    listContent: {
        paddingHorizontal: spacing.md,
        paddingBottom: 120, // Added padding for tab bar visibility
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.surface,
        marginBottom: spacing.sm,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    code: {
        ...typography.captionBold,
        color: colors.primary,
        marginBottom: 4,
    },
    name: {
        ...typography.body,
        color: colors.textPrimary,
    },
});
