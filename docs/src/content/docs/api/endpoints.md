---
title: API Endpoints
description: REST API reference for integrating ATS Screener scoring into your tools.
---

ATS Screener exposes a single REST endpoint for all scoring operations.

## POST `/api/analyze`

Score a resume against all 6 ATS platforms, or extract requirements from a job description.

### Request

```bash
curl -X POST http://localhost:5173/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "full-score",
    "resumeText": "John Doe\nSoftware Engineer\n5 years React, TypeScript..."
  }'
```

### Request Body

| Field            | Type   | Required         | Description                                       |
| ---------------- | ------ | ---------------- | ------------------------------------------------- |
| `mode`           | string | Yes              | `"full-score"` or `"analyze-jd"`                  |
| `resumeText`     | string | For `full-score` | Raw text extracted from resume (max 50,000 chars) |
| `jobDescription` | string | For `analyze-jd` | Full job description text (max 20,000 chars)      |

**Validation rules:**

- `Content-Type` header must be `application/json`
- `resumeText` cannot be empty or whitespace-only
- `resumeText` maximum length: 50,000 characters
- `jobDescription` maximum length: 20,000 characters
- `mode` must be exactly `"full-score"` or `"analyze-jd"`

### Modes

#### `full-score`

Score a resume against all 6 ATS platforms. Optionally include a `jobDescription` for targeted scoring.

```json
{
	"mode": "full-score",
	"resumeText": "John Doe\nSoftware Engineer...",
	"jobDescription": "We are looking for a Senior Frontend Engineer..."
}
```

#### `analyze-jd`

Extract structured requirements from a job description without scoring a resume.

```json
{
	"mode": "analyze-jd",
	"jobDescription": "We are looking for a Senior Frontend Engineer..."
}
```

### Response (full-score)

```json
{
	"results": [
		{
			"system": "Workday",
			"vendor": "Workday Inc.",
			"overallScore": 75,
			"passesFilter": true,
			"breakdown": {
				"formatting": {
					"score": 80,
					"issues": ["Header content may be skipped"],
					"details": ["Single-column layout detected"]
				},
				"keywordMatch": {
					"score": 70,
					"matched": ["React", "TypeScript", "Node.js"],
					"missing": ["AWS", "CI/CD"],
					"synonymMatched": ["JavaScript frameworks"]
				},
				"sections": {
					"score": 85,
					"present": ["Experience", "Education", "Skills"],
					"missing": ["Certifications"]
				},
				"experience": {
					"score": 75,
					"quantifiedBullets": 8,
					"totalBullets": 12,
					"actionVerbCount": 10,
					"highlights": ["Strong quantification"]
				},
				"education": {
					"score": 90,
					"notes": ["BS Computer Science detected"]
				}
			},
			"suggestions": ["Add AWS and CI/CD keywords to match Workday's exact matching"]
		}
	],
	"_provider": "gemini",
	"_fallback": false
}
```

### Response Fields

| Field                    | Type     | Description                             |
| ------------------------ | -------- | --------------------------------------- |
| `results`                | array    | Array of 6 platform scoring objects     |
| `results[].system`       | string   | Platform name                           |
| `results[].overallScore` | number   | 0-100 weighted composite score          |
| `results[].passesFilter` | boolean  | Whether resume passes initial screening |
| `results[].breakdown`    | object   | Per-dimension scores and details        |
| `results[].suggestions`  | string[] | Platform-specific improvement tips      |
| `_provider`              | string   | Which LLM provider handled the request  |
| `_fallback`              | boolean  | Whether a fallback provider was used    |
