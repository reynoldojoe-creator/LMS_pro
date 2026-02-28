import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Text, ScrollView, RefreshControl } from 'react-native';
import { useVetterStore } from '../../store/vetterStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenBackground, ModernNavBar, InsetGroupedList } from '../../components/common';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
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
            <ScreenBackground>
                <ModernNavBar title="Loading..." showBack onBack={() => navigation.goBack()} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </ScreenBackground>
        );
    }

    if (!currentBatch && !isLoading) {
        return (
            <ScreenBackground>
                <ModernNavBar title="Error" showBack onBack={() => navigation.goBack()} />
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Batch not found</Text>
                </View>
            </ScreenBackground>
        );
    }

    const questionItems = currentBatch?.questions?.map((q, i) => {
        let iconName = 'help-circle-outline';
        let iconColor = colors.primary;

        if (q.status === 'approved') {
            iconName = 'checkmark-circle';
            iconColor = colors.success;
        } else if (q.status === 'rejected') {
            iconName = 'close-circle';
            iconColor = colors.error;
        } else if (q.status === 'quarantined') {
            iconName = 'flag';
            iconColor = colors.warning;
        }

        return {
            id: q.id,
            title: `Q${i + 1}: ${q.type.toUpperCase()}`,
            subtitle: q.questionText ? (q.questionText.substring(0, 40) + '...') : 'No text',
            showChevron: true,
            onPress: () => handleQuestionPress(q.id, i),
            icon: iconName,
            iconColor: iconColor
        };
    }) || [];

    return (
        <ScreenBackground>
            <ModernNavBar
                title={currentBatch?.title || "Batch Review"}
                showBack
                onBack={() => navigation.goBack()}
                rightButton={
                    <TouchableOpacity onPress={handleCompleteSession}>
                        <Text style={{ ...typography.body, color: colors.primary }}>Finish</Text>
                    </TouchableOpacity>
                }
            />

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                <InsetGroupedList
                    items={questionItems}
                    header="QUESTIONS"
                    footer={`Total: ${currentBatch?.totalQuestions || 0} • Reviewed: ${currentBatch?.reviewedQuestions || 0}`}
                />
            </ScrollView>
        </ScreenBackground>
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
