## Dev Team: Assessment Pre-Flight Validation System

### **Architecture Overview**

**Trigger Point:** After teacher clicks "Ready to publish" button (before assessment goes live)

**Process Flow:**
```
1. Teacher clicks "Ready to publish"
2. System runs validation checks (client-side + server-side)
3. Display validation results in modal/slide-over panel
4. Teacher addresses errors, accepts warnings, or overrides
5. System allows publish (if no critical errors) or blocks (if critical errors exist)
```

---

## **Technical Implementation**

### **1. Validation Endpoint**

**New API Route:** `POST /api/assessments/{id}/validate`

**Request Body:**
```json
{
  "assessment_id": "uuid",
  "questions": [...],
  "scorers": [...],
  "run_ai_analysis": true  // optional, defaults to true
}
```

**Response:**
```json
{
  "status": "errors" | "warnings" | "clean",
  "critical_errors": [
    {
      "type": "scale_mismatch",
      "scorer_id": "uuid",
      "scorer_name": "Evidence & Factual Accuracy",
      "message": "Your rubric instructions reference scores 0-3, but your grading scale is 1-5.",
      "auto_fix_available": true,
      "suggested_fix": {
        "action": "update_scale",
        "scale_min": 1,
        "scale_max": 4
      }
    }
  ],
  "warnings": [
    {
      "type": "missing_descriptors",
      "scorer_id": "uuid",
      "message": "Scale points 2 and 4 have no descriptors.",
      "auto_fix_available": true,
      "suggested_fix": {
        "action": "generate_descriptors",
        "prompt": "Fill in missing scale descriptors"
      }
    },
    {
      "type": "question_rubric_mismatch",
      "question_id": "uuid",
      "message": "Question asks for evidence 'for each cause' but rubric scores evidence as single dimension.",
      "auto_fix_available": false,
      "guidance": "Consider whether partial evidence should receive partial credit."
    }
  ],
  "can_publish": false,  // blocked if critical_errors.length > 0
  "validation_timestamp": "2025-12-31T05:45:00Z"
}
```

---

### **2. Client-Side Validation (Fast, Synchronous)**

**Run these checks immediately on button click:**

```typescript
// /utils/assessmentValidation.ts

interface ValidationResult {
  type: 'error' | 'warning';
  category: string;
  message: string;
  location: {
    scorer_id?: string;
    question_id?: string;
  };
  auto_fix?: AutoFixSuggestion;
}

function validateScaleAlignment(scorer: Scorer): ValidationResult | null {
  // Extract number references from instructions
  const numberPattern = /\b([0-9])\s*[-—]\s*/g;
  const referencedNumbers = [...scorer.instructions.matchAll(numberPattern)]
    .map(match => parseInt(match[1]));
  
  if (referencedNumbers.length === 0) return null;
  
  const minReferenced = Math.min(...referencedNumbers);
  const maxReferenced = Math.max(...referencedNumbers);
  const range = maxReferenced - minReferenced + 1;
  
  const actualRange = scorer.scale_max - scorer.scale_min + 1;
  
  if (range !== actualRange || minReferenced !== scorer.scale_min) {
    return {
      type: 'error',
      category: 'scale_mismatch',
      message: `Instructions reference ${minReferenced}-${maxReferenced} but scale is ${scorer.scale_min}-${scorer.scale_max}`,
      location: { scorer_id: scorer.id },
      auto_fix: {
        action: 'update_scale',
        scale_min: minReferenced,
        scale_max: maxReferenced
      }
    };
  }
  
  return null;
}

function validateDescriptorCompleteness(scorer: Scorer): ValidationResult | null {
  const expectedPoints = scorer.scale_max - scorer.scale_min + 1;
  const providedDescriptors = Object.keys(scorer.descriptors || {}).length;
  
  if (providedDescriptors < expectedPoints && providedDescriptors > 0) {
    const missingPoints = [];
    for (let i = scorer.scale_min; i <= scorer.scale_max; i++) {
      if (!scorer.descriptors?.[i]) {
        missingPoints.push(i);
      }
    }
    
    return {
      type: 'warning',
      category: 'incomplete_descriptors',
      message: `Missing descriptors for scale points: ${missingPoints.join(', ')}`,
      location: { scorer_id: scorer.id },
      auto_fix: {
        action: 'generate_descriptors',
        missing_points: missingPoints
      }
    };
  }
  
  return null;
}

function validateQuestionNotEmpty(question: Question): ValidationResult | null {
  if (!question.text || question.text.trim().length === 0) {
    return {
      type: 'error',
      category: 'empty_question',
      message: 'Question text cannot be empty',
      location: { question_id: question.id }
    };
  }
  return null;
}

export function runClientValidation(assessment: Assessment): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Validate each scorer
  assessment.scorers.forEach(scorer => {
    const scaleCheck = validateScaleAlignment(scorer);
    if (scaleCheck) results.push(scaleCheck);
    
    const descriptorCheck = validateDescriptorCompleteness(scorer);
    if (descriptorCheck) results.push(descriptorCheck);
    
    if (!scorer.instructions || scorer.instructions.trim().length === 0) {
      results.push({
        type: 'error',
        category: 'missing_instructions',
        message: 'Scorer instructions cannot be empty',
        location: { scorer_id: scorer.id }
      });
    }
  });
  
  // Validate questions
  assessment.questions.forEach(question => {
    const emptyCheck = validateQuestionNotEmpty(question);
    if (emptyCheck) results.push(emptyCheck);
  });
  
  return results;
}
```

---

### **3. Server-Side AI Analysis (Slower, Async)**

**Run this for deeper semantic analysis:**

```python
# /services/assessment_ai_validator.py

async def analyze_question_rubric_alignment(question: dict, scorers: list) -> list:
    """
    Use AI to detect mismatches between what question asks for 
    and what rubric scores.
    """
    
    prompt = f"""
You are an assessment design expert. Analyze this question and rubric for alignment issues.

QUESTION:
{question['text']}

RUBRIC SCORERS:
{json.dumps([{
    'name': s['name'],
    'description': s['description'],
    'instructions': s['instructions']
} for s in scorers], indent=2)}

Identify any of these issues:
1. Question asks for multiple components but rubric treats as single score
2. Question requires specific elements not mentioned in rubric
3. Rubric scores dimensions not asked for in the question

Return JSON array of issues found (empty if none):
[
  {{
    "type": "multi_component_question_single_score",
    "severity": "warning",
    "message": "Question asks for X and Y, but rubric only scores one dimension",
    "guidance": "Consider adding separate scorers or clarifying integration"
  }}
]
"""

    response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.1
    )
    
    return json.loads(response.choices[0].message.content).get('issues', [])


async def validate_assessment_ai(assessment_id: str) -> dict:
    """
    Main AI validation orchestrator
    """
    assessment = await get_assessment(assessment_id)
    
    warnings = []
    
    # Run AI analysis for each question
    for question in assessment['questions']:
        alignment_issues = await analyze_question_rubric_alignment(
            question, 
            assessment['scorers']
        )
        warnings.extend(alignment_issues)
    
    return {
        'warnings': warnings,
        'timestamp': datetime.utcnow().isoformat()
    }
```

---

### **4. UI Component - Validation Modal**

**Component:** `AssessmentValidationModal.tsx`

```tsx
interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: string;
  onPublish: () => void;
}

export function AssessmentValidationModal({ 
  isOpen, 
  onClose, 
  assessmentId,
  onPublish 
}: ValidationModalProps) {
  const [validationResults, setValidationResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (isOpen) {
      runValidation();
    }
  }, [isOpen]);
  
  async function runValidation() {
    setIsLoading(true);
    
    // Run client-side checks immediately
    const clientResults = runClientValidation(assessment);
    setValidationResults({ client: clientResults, ai: null });
    
    // Run AI analysis async
    const aiResults = await fetch(`/api/assessments/${assessmentId}/validate`, {
      method: 'POST',
      body: JSON.stringify({ run_ai_analysis: true })
    }).then(r => r.json());
    
    setValidationResults({ client: clientResults, ai: aiResults });
    setIsLoading(false);
  }
  
  const criticalErrors = validationResults?.client?.filter(r => r.type === 'error') || [];
  const warnings = [
    ...(validationResults?.client?.filter(r => r.type === 'warning') || []),
    ...(validationResults?.ai?.warnings || [])
  ];
  
  const canPublish = criticalErrors.length === 0;
  
  return (
    <SlideOver isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold">Assessment Quality Check</h2>
        
        {isLoading ? (
          <LoadingSpinner message="Analyzing assessment..." />
        ) : (
          <>
            {/* Summary */}
            <div className="mt-4 space-y-2">
              <StatusBadge 
                status={canPublish ? 'ready' : 'blocked'}
                count={criticalErrors.length}
                label="Critical Errors"
              />
              <StatusBadge 
                status="warning"
                count={warnings.length}
                label="Warnings"
              />
            </div>
            
            {/* Critical Errors */}
            {criticalErrors.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-red-600">
                  Must Fix Before Publishing
                </h3>
                {criticalErrors.map((error, idx) => (
                  <ErrorCard 
                    key={idx}
                    error={error}
                    onAutoFix={handleAutoFix}
                  />
                ))}
              </div>
            )}
            
            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-yellow-600">
                  Recommended Improvements
                </h3>
                {warnings.map((warning, idx) => (
                  <WarningCard 
                    key={idx}
                    warning={warning}
                    onAutoFix={handleAutoFix}
                    onDismiss={() => dismissWarning(idx)}
                  />
                ))}
              </div>
            )}
            
            {/* Actions */}
            <div className="mt-8 flex gap-3">
              <Button
                variant="primary"
                onClick={onPublish}
                disabled={!canPublish}
              >
                {canPublish ? 'Publish Assessment' : 'Fix Errors to Publish'}
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Keep Editing
              </Button>
            </div>
          </>
        )}
      </div>
    </SlideOver>
  );
}
```

---

### **5. Auto-Fix Implementation**

```typescript
async function handleAutoFix(fix: AutoFixSuggestion, location: Location) {
  switch (fix.action) {
    case 'update_scale':
      await updateScorer(location.scorer_id, {
        scale_min: fix.scale_min,
        scale_max: fix.scale_max
      });
      break;
      
    case 'generate_descriptors':
      // Call AI to generate missing descriptors
      const descriptors = await fetch('/api/scorers/generate-descriptors', {
        method: 'POST',
        body: JSON.stringify({
          scorer_id: location.scorer_id,
          missing_points: fix.missing_points,
          existing_instructions: scorer.instructions
        })
      }).then(r => r.json());
      
      await updateScorer(location.scorer_id, {
        descriptors: { ...scorer.descriptors, ...descriptors }
      });
      break;
  }
  
  // Re-run validation
  runValidation();
}
```

---

## **Summary: What Gets Built**

### **Phase 1: Critical Errors Only (Week 1)**
- Client-side scale mismatch detection
- Empty field validation
- Blocking UI before publish
- Manual fixes only

### **Phase 2: Auto-Fix + Warnings (Week 2)**
- AI-generated descriptor completion
- One-click scale adjustments
- Warning system (dismissible)

### **Phase 3: Semantic Analysis (Week 3)**
- AI question-rubric alignment checks
- Multi-component detection
- Pedagogical suggestions

---

## **Performance Considerations**

- **Client validation:** <100ms (runs immediately)
- **Server validation:** 1-3 seconds (shows progress indicator)
- **Cache results:** Don't re-validate unless assessment changes
- **Async loading:** Show client results first, AI results stream in

---

**Bottom line:** This makes you look like assessment design experts while catching teacher mistakes before they create confusing student experiences. Build Phase 1 before beta launch, Phase 2/3 based on feedback.