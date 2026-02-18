import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useFacultyStore } from '../../store';
import { LinenBackground, GlossyNavBar, GroupedTableView } from '../../components/ios6';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<any, 'UnitDetail'>;

export const UnitDetailScreen = ({ route, navigation }: Props) => {
    const { subjectId, unitId } = route.params as { subjectId: string; unitId: string };
    const { getSubjectById } = useFacultyStore();
    const subject = getSubjectById(subjectId);
    const unit = (subject?.units || []).find(u => u.id === unitId);

    if (!subject || !unit) {
        return (
            <LinenBackground>
                <GlossyNavBar title="Unit Error" showBack onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <Text>Unit not found</Text>
                </View>
            </LinenBackground>
        );
    }

    const handleTopicPress = (topicId: string) => {
        navigation.navigate('TopicDetail', { subjectId, unitId, topicId });
    };

    const topicRows = (unit.topics || []).map(topic => ({
        title: topic.name,
        subtitle: `${topic.questionCount || 0} Questions Generated`,
        onPress: () => handleTopicPress(topic.id),
        chevron: true
    }));

    return (
        <LinenBackground>
            <GlossyNavBar title={`Unit ${unit.number}`} showBack onBack={() => navigation.goBack()} />

            <Text style={styles.unitTitle}>{unit.title}</Text>
            <Text style={styles.unitDesc}>{unit.description || 'No description available'}</Text>

            <GroupedTableView
                sections={[
                    {
                        title: 'TOPICS',
                        data: topicRows.length > 0 ? topicRows : [{ title: 'No topics found', disabled: true }]
                    }
                ]}
            />
        </LinenBackground>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    unitTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginTop: 20, marginBottom: 5, textShadowColor: 'white', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 0 },
    unitDesc: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
});
