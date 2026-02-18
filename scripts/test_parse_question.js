
const fs = require('fs');

/**
 * Extract a JSON string value by key using regex.
 * Works on truncated/malformed JSON where JSON.parse fails.
 */
function extractJsonStringValue(jsonStr, key) {
    // Match "key": "value" — handles escaped quotes inside the value
    const regex = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
    const match = jsonStr.match(regex);
    return match ? match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').trim() : '';
}

/**
 * Extract an array of strings from JSON by key using regex.
 * e.g. "key_points": ["point1", "point2"]
 */
function extractJsonArrayValues(jsonStr, key) {
    const regex = new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*?)\\]`, 's');
    const match = jsonStr.match(regex);
    if (!match) return [];
    // Extract individual quoted strings from the array content
    const items = [];
    const itemRegex = /"((?:[^"\\]|\\.)*)"/g;
    let m;
    while ((m = itemRegex.exec(match[1])) !== null) {
        items.push(m[1].replace(/\\"/g, '"').trim());
    }
    return items;
}

/**
 * Extract options object like {"A": "...", "B": "..."} using regex.
 */
function extractJsonOptions(jsonStr) {
    // Try to find the options block
    // 1. Try finding a complete object block: "options": { ... }
    let regex = /"options"\s*:\s*\{([^}]*)\}/s;
    let match = jsonStr.match(regex);

    // 2. If no complete block (truncation), try finding start of options until end of string or next key
    if (!match) {
        regex = /"options"\s*:\s*\{([^]*)$/s;
        match = jsonStr.match(regex);
    }

    if (!match) return [];

    const content = match[1];
    const items = [];

    // Match "A": "Value" or "A": "Value (with quotes and commas)"
    // We look for "KEY": followed by value until the next "KEY": or end
    const entryRegex = /"([A-Z])"\s*:\s*"?((?:[^",\n]|"(?:[^"\\]|\\.)*")*)"?(?=\s*,?\s*"[A-Z]"\s*:|\s*\}|\s*$)/g;

    let m;
    // Reset regex state just in case
    entryRegex.lastIndex = 0;

    // If the content is very broken, we might need a simpler approach
    // Let's try to match individual options one by one
    const optionsToFind = ['A', 'B', 'C', 'D', 'E'];

    for (const opt of optionsToFind) {
        // Look for "A": "..."
        const optRegex = new RegExp(`"${opt}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
        const optMatch = content.match(optRegex);
        if (optMatch) {
            items.push(`${opt}) ${optMatch[1].replace(/\\"/g, '"').trim()}`);
        } else {
            // Try unquoted value (sometimes happens in bad JSON)
            const optRegex2 = new RegExp(`"${opt}"\\s*:\\s*([^",}\\]]*)`, 's');
            const optMatch2 = content.match(optRegex2);
            if (optMatch2 && optMatch2[1].trim()) {
                items.push(`${opt}) ${optMatch2[1].trim()}`);
            }
        }
    }

    // If that didn't work well (e.g. standard "A": "val", "B": "val"), try the global match again
    if (items.length === 0) {
        let m;
        const fallbackRegex = /"([A-Z])"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
        while ((m = fallbackRegex.exec(content)) !== null) {
            items.push(`${m[1]}) ${m[2].replace(/\\"/g, '"').trim()}`);
        }
    }

    return items.sort(); // Ensure A, B, C order
}

/**
 * Deeply parse a question object that may have raw JSON stuffed into questionText.
 * The backend sometimes stores the entire LLM output (often truncated) as question_text.
 */
function parseQuestion(raw) {
    let rawText = raw.questionText || raw.question_text || raw.text || '';

    // Clean up markdown code blocks if present
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    // --- Use DB-level fields as primary sources (they're reliable) ---
    let bloomLevel = raw.bloomLevel || raw.bloom_level || '';
    let difficulty = raw.difficulty || '';
    let correctAnswer = raw.correctAnswer || raw.correct_answer || '';
    let questionType = raw.type || raw.question_type || 'short_answer';
    let coId = raw.coId || raw.co_id || raw.mapped_co || '';
    let loId = raw.loId || raw.lo_id || raw.mapped_lo || '';
    let validationScore = raw.validationScore || raw.validation_score || 0;

    // --- Parse options from DB field ---
    let options = [];
    if (raw.options) {
        if (typeof raw.options === 'string') {
            try {
                const parsed = JSON.parse(raw.options);
                if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                    options = Object.entries(parsed).map(([k, v]) => `${k}) ${v}`);
                } else if (Array.isArray(parsed)) {
                    options = parsed;
                }
            } catch {
                // ignore
            }
        } else if (Array.isArray(raw.options)) {
            options = raw.options;
        } else if (typeof raw.options === 'object') {
            options = Object.entries(raw.options).map(([k, v]) => `${k}) ${v}`);
        }
    }

    // --- Extract clean question text from the raw JSON blob ---
    let cleanText = '';
    let explanation = '';
    let keyPoints = [];
    let expectedAnswer = '';

    // Step 1: Try JSON.parse (works if the LLM output is complete, valid JSON)
    try {
        if (typeof rawText === 'string' && rawText.trim().startsWith('{')) {
            const parsed = JSON.parse(rawText);
            const inner = parsed.questions?.[0] || parsed;
            cleanText = inner.question_text || inner.questionText || '';
            explanation = inner.explanation || '';
            expectedAnswer = inner.expected_answer || inner.correct_answer || '';
            keyPoints = inner.key_points || inner.keyPoints || [];
            // Extract options from parsed JSON if DB options are empty
            if (options.length === 0 && inner.options) {
                if (typeof inner.options === 'object' && !Array.isArray(inner.options)) {
                    options = Object.entries(inner.options).map(([k, v]) => `${k}) ${v}`);
                } else if (Array.isArray(inner.options)) {
                    options = inner.options;
                }
            }
            // Use parsed fields as fallbacks for DB fields
            bloomLevel = bloomLevel || inner.bloom_level || inner.bloomLevel || 'understand';
            difficulty = difficulty || inner.difficulty || 'medium';
            coId = coId || inner.co_id || inner.mapped_co || '';
            loId = loId || inner.lo_id || inner.mapped_lo || '';
        }
    } catch (e) {
        // JSON.parse failed — truncated JSON, use regex fallback
        // console.log("JSON parse error", e);
    }

    // Step 2: Regex fallback for truncated/malformed JSON
    if ((!cleanText || options.length === 0) && typeof rawText === 'string' && (rawText.includes('question_text') || rawText.includes('"options"'))) {
        if (!cleanText) cleanText = extractJsonStringValue(rawText, 'question_text');
        if (!explanation) explanation = extractJsonStringValue(rawText, 'explanation');
        if (!expectedAnswer) expectedAnswer = extractJsonStringValue(rawText, 'expected_answer') ||
            extractJsonStringValue(rawText, 'correct_answer');
        if (keyPoints.length === 0) keyPoints = extractJsonArrayValues(rawText, 'key_points');

        // Extract options from JSON blob if DB options are empty
        if (options.length === 0) {
            options = extractJsonOptions(rawText);

            // Also try array-style options
            if (options.length === 0) {
                options = extractJsonArrayValues(rawText, 'options');
            }
        }

        // Extract bloom/difficulty from JSON if not in DB
        if (!bloomLevel) {
            bloomLevel = extractJsonStringValue(rawText, 'bloom_level') || 'understand';
        }
        if (!difficulty) {
            difficulty = extractJsonStringValue(rawText, 'difficulty') || 'medium';
        }
    }

    // Step 3: If still no clean text, use the raw text but strip any JSON wrapper
    if (!cleanText) {
        cleanText = rawText;
    }

    // Use expectedAnswer as correctAnswer fallback
    if (!correctAnswer && expectedAnswer) {
        correctAnswer = expectedAnswer;
    }

    return {
        id: raw.id,
        text: cleanText,
        type: questionType,
        options,
        correctAnswer,
        explanation: explanation || 'Based on the learning objectives for this topic.',
        keyPoints: Array.isArray(keyPoints) && keyPoints.length > 0
            ? keyPoints
            : ['Review the topic material for detailed understanding'],
        coMapping: coId ? (Array.isArray(coId) ? coId : [coId]) : ['N/A'],
        loMapping: loId ? (Array.isArray(loId) ? loId : [loId]) : ['N/A'],
        bloomLevel: bloomLevel || 'understand',
        difficulty: difficulty || 'medium',
        validationScore,
    };
}

// --- Test Cases ---

const testCase1 = {
    // Parsing from raw JSON string in question_text
    question_text: `
  {
    "question_text": "What is 2+2?",
    "options": {
      "A": "3",
      "B": "4",
      "C": "5",
      "D": "6"
    },
    "correct_answer": "B"
  }
  `,
    type: 'mcq',
    options: []
};


const testCase2 = {
    // Malformed/Truncated JSON where options block is cut off or slightly weird
    question_text: `
    {
      "question_text": "What is the capital of France?",
      "options": {
        "A": "Berlin",
        "B": "Madrid",
        "C": "Paris",
        "D": "Rome"
      
    `, // intentional truncation
    type: 'mcq'
};

const testCase3 = {
    // Options as Array in JSON
    question_text: `
    {
        "question_text": "Select the prime number.",
        "options": ["4", "6", "7", "9"],
        "correct_answer": "7"
    }
    `,
    type: 'mcq'
};

const testCase4 = {
    // LLM failing to close braces properly or using markdown code blocks
    question_text: `
    \`\`\`json
    {
        "question_text": "Who wrote Hamlet?",
        "options": {
            "A": "Shakespeare",
            "B": "Hemingway"
        }
    }
    \`\`\`
    `,
    type: 'mcq'
};

const testCase5 = {
    // Broken JSON weird quoting
    question_text: `
    {
        "question_text": "Weird quotes?",
        "options": {
            "A": "Value with \\"quotes\\"",
            "B": "Normal value"
        }
    }
    `,
    type: 'mcq'
};

console.log("Test Case 1 Parsed:", parseQuestion(testCase1).options);
console.log("Test Case 2 Parsed:", parseQuestion(testCase2).options);
console.log("Test Case 3 Parsed:", parseQuestion(testCase3).options);
console.log("Test Case 4 Parsed:", parseQuestion(testCase4).options);
console.log("Test Case 5 Parsed:", parseQuestion(testCase5).options);
