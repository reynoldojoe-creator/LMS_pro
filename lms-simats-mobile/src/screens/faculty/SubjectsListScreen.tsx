import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFacultyStore } from '../../store/facultyStore';
import { LinenBackground, GlossyNavBar, GroupedTableView } from '../../components/ios6';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme';

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

    // Transform subjects into GroupedTableView sections
    const subjectRows = subjects.map(subject => ({
        ...subject,
        title: subject.name,
        subtitle: subject.code,
        value: `${subject.topics?.length || 0} topics`, // Display topic count
        onPress: () => handleSubjectPress(subject),
    }));

    return (
        <LinenBackground>
            <GlossyNavBar title="Subjects" showBack />

            {isLoadingSubjects && !refreshing && subjects.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4C566C" />
                </View>
            ) : (
                <GroupedTableView
                    style={styles.list}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    sections={[
                        {
                            title: 'Available Subjects',
                            data: subjectRows
                        }
                    ]}
                    renderItem={({ item }) => (
                        // Custom render item passed to GroupedTableView if needed, 
                        // or rely on GroupedTableView's default renderer which uses title/subtitle
                        // note: GroupedTableView expects 'data' in section, not 'rows'.
                        // I updated the prop to 'data' in the section object above 
                        undefined
                    )}
                />
            )}
        </LinenBackground>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        flex: 1,
    },
    // Styles below were leftovers from the broken file, cleaning them up
});
