import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { typography, spacing } from '../../theme';
import { useFacultyStore } from '../../store/facultyStore';
import { useAppTheme } from '../../hooks';
import { Header, Input, Button, LoadingSpinner } from '../../components/common';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<any, 'AddSubject'>;

export const AddSubjectScreen = ({ navigation }: Props) => {
    const { colors } = useAppTheme();
    const { createSubject, isUploading } = useFacultyStore();
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [department, setDepartment] = useState('');
    const [credits, setCredits] = useState('');
    const [file, setFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel'
                ],
                copyToCacheDirectory: true,
            });

            if (result.canceled === false) {
                setFile(result);
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const handleCreate = async () => {
        if (!name || !code || !department || !file || file.canceled) {
            Alert.alert('Error', 'Please fill all fields and upload a syllabus');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('code', code);
            formData.append('department', department);
            formData.append('credits', credits || '3');

            const fileAsset = file.assets[0];
            formData.append('syllabus_file', {
                uri: fileAsset.uri,
                name: fileAsset.name,
                type: fileAsset.mimeType || 'application/pdf',
            } as any);

            await createSubject(formData);
            Alert.alert('Success', 'Subject created and syllabus extracted successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create subject');
        }
    };

    const styles = getStyles(colors);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="Add Subject" onBack={() => navigation.goBack()} />

            {isUploading ? (
                <View style={styles.loadingContainer}>
                    <LoadingSpinner size="large" />
                    <Text style={styles.loadingText}>Creating subject & extracting syllabus...</Text>
                    <Text style={styles.loadingSubText}>This may take a minute.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <Input
                        label="Subject Name"
                        placeholder="e.g. Data Structures"
                        value={name}
                        onChangeText={setName}
                    />
                    <Input
                        label="Subject Code"
                        placeholder="e.g. CS301"
                        value={code}
                        onChangeText={setCode}
                    />
                    <Input
                        label="Department"
                        placeholder="e.g. Computer Science"
                        value={department}
                        onChangeText={setDepartment}
                    />
                    <Input
                        label="Credits"
                        placeholder="e.g. 3"
                        value={credits}
                        onChangeText={setCredits}
                        keyboardType="numeric"
                    />

                    <View style={styles.uploadSection}>
                        <Text style={styles.label}>Syllabus (PDF/Docx)</Text>
                        <TouchableOpacity style={styles.uploadButton} onPress={handlePickDocument}>
                            {file && !file.canceled ? (
                                <View style={styles.fileInfo}>
                                    <Ionicons name="document-text" size={24} color={colors.primary} />
                                    <Text style={styles.fileName} numberOfLines={1}>
                                        {file.assets[0].name}
                                    </Text>
                                    <View style={styles.changeFile}>
                                        <Text style={styles.changeFileText}>Change</Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Ionicons name="cloud-upload-outline" size={32} color={colors.textSecondary} />
                                    <Text style={styles.uploadText}>Tap to upload syllabus</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <Button
                        title="Create Subject"
                        onPress={handleCreate}
                        variant="primary"
                        style={styles.submitButton}
                    />
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.screenHorizontal,
        gap: spacing.md,
    },
    submitButton: {
        marginTop: spacing.lg,
    },
    uploadSection: {
        marginTop: spacing.sm,
    },
    label: {
        ...typography.caption,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
        fontWeight: '600',
    },
    uploadButton: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        borderStyle: 'dashed',
        padding: spacing.md,
        backgroundColor: colors.surface,
    },
    uploadPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
    },
    uploadText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    fileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    fileName: {
        flex: 1,
        ...typography.body,
        color: colors.textPrimary,
    },
    changeFile: {
        backgroundColor: colors.background,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 4,
    },
    changeFileText: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    loadingText: {
        ...typography.h3,
        color: colors.textPrimary,
        marginTop: spacing.lg,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    loadingSubText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
