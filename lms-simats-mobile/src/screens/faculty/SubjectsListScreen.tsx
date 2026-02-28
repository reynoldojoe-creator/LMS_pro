import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFacultyStore } from '../../store/facultyStore';
import { ScreenBackground, ModernNavBar, InsetGroupedList } from '../../components/common';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<any, 'Subjects'>;

export const SubjectsListScreen = ({ navigation }: Props) => {
    const { subjects, isLoadingSubjects, fetchSubjects } = useFacultyStore();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchSubjects();
        setRefreshing(false);
    }, [fetchSubjects]);

    const handleSubjectPress = (subject: any) => {
        navigation.navigate('SubjectDetail', { subjectId: subject.id });
    };

    const items = subjects.map(subject => ({
        id: subject.id,
        title: subject.name,
        subtitle: subject.code,
        value: `${subject.topics?.length || 0} topics`,
        onPress: () => handleSubjectPress(subject),
        showChevron: true,
        icon: 'book-outline'
    }));

    return (
        <ScreenBackground>
            <ModernNavBar title="Subjects" showBack onBack={() => navigation.goBack()} />

            {isLoadingSubjects && !refreshing && subjects.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                >
                    <InsetGroupedList
                        items={items}
                        header="AVAILABLE SUBJECTS"
                    />
                </ScrollView>
            )}
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
