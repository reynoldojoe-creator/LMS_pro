import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Text } from 'react-native';
import { useVetterStore } from '../../store/vetterStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinenBackground, GlossyNavBar, GroupedTableView } from '../../components/ios6';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<any, 'BatchReview'>;

export function BatchReviewScreen({ route, navigation }: Props) {
    const { batchId } = route.params as { batchId: string };
    const { currentBatch, isLoading, startReview } = useVetterStore();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (batchId) {
            startReview(batchId);
        }
    }, [batchId]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await startReview(batchId);
        setRefreshing(false);
    }, [batchId]);

    const handleQuestionPress = (questionId: string, index: number) => {
        navigation.navigate('QuestionReview', {
            batchId,
            questionId,
            index,
            total: currentBatch?.questions?.length || 0
        });
    };

    const handleCompleteSession = async () => {
        Alert.alert(
            "Complete Review",
            "Are you sure you want to complete this review session?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Complete", onPress: () => {
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    if (isLoading && !refreshing && !currentBatch) {
        return (
            <LinenBackground>
                <GlossyNavBar title="Loading..." showBack />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4C566C" />
                </View>
            </LinenBackground>
        );
    }

    if (!currentBatch && !isLoading) {
        return (
            <LinenBackground>
                <GlossyNavBar title="Error" showBack />
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Batch not found</Text>
                </View>
            </LinenBackground>
        );
    }

    const questionRows = currentBatch?.questions?.map((q, i) => {
        let iconName: any = 'help-circle';
        let iconColor = '#4A90E2';

        if (q.status === 'approved') {
            iconName = 'checkmark-circle';
            iconColor = colors.success;
        } else if (q.status === 'rejected') {
            iconName = 'close-circle';
            iconColor = '#FF3B30';
        } else if (q.status === 'quarantined') {
            iconName = 'flag';
            iconColor = '#FF9500';
        }

        return {
            title: `Q${i + 1}: ${q.type.toUpperCase()}`,
            subtitle: q.questionText ? (q.questionText.substring(0, 40) + '...') : 'No text',
            chevron: true,
            onPress: () => handleQuestionPress(q.id, i)
        };
    }) || [];

    return (
        <LinenBackground>
            <GlossyNavBar
                title={currentBatch?.title || "Batch Review"}
                showBack
                rightButton={{
                    title: 'Finish',
                    onPress: handleCompleteSession,
                    variant: 'blue'
                }}
            />

            <View style={styles.content}>
                <GroupedTableView
                    sections={[
                        {
                            title: 'Questions',
                            data: questionRows,
                            footer: `Total: ${currentBatch?.totalQuestions || 0} • Reviewed: ${currentBatch?.reviewedQuestions || 0}`
                        }
                    ]}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            </View>
        </LinenBackground>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        ...typography.body,
        color: colors.ios.detailText,
        textAlign: 'center',
    },
});
