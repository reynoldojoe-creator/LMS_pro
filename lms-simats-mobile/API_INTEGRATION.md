# API Integration Guide

## Configuration

The mobile app uses axios for API communication with the backend server.

### Base URL Configuration

**For Development (Simulator/Emulator):**
```typescript
const API_BASE_URL = 'http://localhost:8000';
```

**For Expo Go on Physical Device:**
1. Find your computer's local IP address:
   - **Mac/Linux**: Run `ifconfig | grep "inet "` in terminal
   - **Windows**: Run `ipconfig` in command prompt
2. Replace `localhost` in `src/services/api.ts`:
   ```typescript
   const API_BASE_URL = 'http://192.168.1.100:8000'; // Your IP here
   ```
3. Ensure your phone and computer are on the **same WiFi network**
4. Make sure the backend server is running and accessible

### Authentication

The API client automatically includes the JWT token in request headers:
```typescript
Authorization: Bearer <token>
```

Tokens are managed by `authStore` and automatically attached via request interceptors.

### Error Handling

- **401 Unauthorized**: Automatically logs out the user
- **Network Errors**: Logged to console
- **Other Errors**: Propagated to calling code for handling

## Available Services

### 1. Subject Service (`subjectService`)

```typescript
import { subjectService } from '../services';

// Get all subjects
const subjects = await subjectService.getAll();

// Get subject by ID
const subject = await subjectService.getById('subject-id');

// Create new subject with syllabus
const formData = new FormData();
formData.append('name', 'Data Structures');
formData.append('code', 'CS301');
formData.append('syllabus', fileBlob);
const newSubject = await subjectService.create(formData);

// Update CO/LO
await subjectService.updateCOLO('subject-id', {
  courseOutcomes: [...],
  learningOutcomes: {...}
});
```

### 2. Generation Service (`generationService`)

```typescript
import { generationService } from '../services';

// Quick generate questions
const result = await generationService.quickGenerate({
  subjectId: 'subject-id',
  topicId: 'topic-id',
  questionType: 'mcq',
  bloomLevel: 'apply',
  difficulty: 'medium',
  count: 10,
});

// Generate from rubric
const batch = await generationService.generateFromRubric('rubric-id');

// Check generation status
const status = await generationService.getGenerationStatus('batch-id');
```

### 3. Rubric Service (`rubricService`)

```typescript
import { rubricService } from '../services';

// Get all rubrics
const rubrics = await rubricService.getAll();

// Create rubric
const rubric = await rubricService.create({
  subjectId: 'subject-id',
  examType: 'final',
  title: 'Final Exam 2024',
  // ... other fields
});

// Update rubric
await rubricService.update('rubric-id', { title: 'Updated Title' });

// Delete rubric
await rubricService.delete('rubric-id');
```

### 4. Vetting Service (`vettingService`)

```typescript
import { vettingService } from '../services';

// Get pending batches
const pending = await vettingService.getPendingBatches();

// Get batch questions
const questions = await vettingService.getBatchQuestions('batch-id');

// Approve question
await vettingService.approveQuestion('question-id');

// Reject question
await vettingService.rejectQuestion('question-id', 'Ambiguous question');

// Quarantine question
await vettingService.quarantineQuestion('question-id', 'Needs revision');
```

### 5. Question Service (`questionService`)

```typescript
import { questionService } from '../services';

// Get all questions with filters
const questions = await questionService.getAll({
  subjectId: 'subject-id',
  type: 'mcq',
  bloomLevel: 'apply',
});

// Update question
await questionService.update('question-id', {
  questionText: 'Updated question text',
});

// Validate question
const validation = await questionService.validate('question-id');

// Export questions
const blob = await questionService.export({ subjectId: 'subject-id' }, 'pdf');
```

## Usage in Stores

Services are typically called from Zustand stores:

```typescript
// In facultyStore.ts
import { subjectService } from '../services';

export const useFacultyStore = create<FacultyState>((set) => ({
  subjects: [],
  
  fetchSubjects: async () => {
    try {
      set({ isLoading: true });
      const subjects = await subjectService.getAll();
      set({ subjects, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      set({ isLoading: false });
    }
  },
}));
```

## Testing

1. **Start Backend Server**:
   ```bash
   cd backend
   python run_server.py
   ```

2. **Start Mobile App**:
   ```bash
   cd lms-simats-mobile
   npx expo start
   ```

3. **Verify Connection**:
   - Check that API calls return data
   - Monitor network tab in Expo DevTools
   - Check backend logs for incoming requests

## Troubleshooting

### "Network Error" or "Connection Refused"

- Verify backend is running on port 8000
- Check firewall settings
- Ensure correct IP address in `API_BASE_URL`
- Confirm phone and computer are on same WiFi

### "401 Unauthorized"

- Check that token is being stored in `authStore`
- Verify token is valid and not expired
- Check backend authentication middleware

### Timeout Errors

- Increase timeout in `api.ts` (default: 60 seconds)
- Check backend processing time
- Monitor backend logs for slow queries
