---
title: Error Handling
description: API error codes, meanings, and how to handle them.
---

All errors return JSON with a descriptive message.

## Error Codes

| Status | Code                | Meaning                                                                                                |
| ------ | ------------------- | ------------------------------------------------------------------------------------------------------ |
| `400`  | Bad Request         | Invalid JSON body, wrong Content-Type, missing required fields, input too long, or mode not recognized |
| `429`  | Too Many Requests   | Rate limit exceeded                                                                                    |
| `502`  | Bad Gateway         | LLM returned a response that couldn't be parsed as valid JSON                                          |
| `503`  | Service Unavailable | All LLM providers failed or no API keys configured                                                     |

## Error Response Format

```json
{
	"error": "Human-readable error description",
	"fallback": false
}
```

The `fallback` field indicates whether the system attempted to use fallback providers before failing.

## Common Errors

### 400: Missing or Invalid Content-Type

The request must include `Content-Type: application/json`.

### 400: Missing resumeText

```json
{
	"error": "resumeText is required"
}
```

**Fix:** Include the `resumeText` field in your request body.

### 400: Input Too Long

```json
{
	"error": "resumeText exceeds maximum length of 50,000 characters"
}
```

Resume text is capped at 50,000 characters and job descriptions at 20,000. If you're hitting this limit, trim whitespace or reduce content.

### 429: Rate Limited

```json
{
	"error": "rate limit exceeded. try again in 60 seconds."
}
```

**Fix:** Wait and retry with exponential backoff.

### 502: Parse Failure

```json
{
	"error": "Failed to parse LLM response as JSON",
	"fallback": true
}
```

This means the AI returned malformed output. The system already tried fallback providers. Usually a transient issue.

**Fix:** Retry the request. If persistent, the LLM prompt may need adjustment for your specific resume format.

### 503: All Providers Down

```json
{
	"error": "All LLM providers failed",
	"fallback": true
}
```

All configured LLM providers either failed or hit their daily quotas.

**Fix:** Wait for quota reset (usually midnight UTC) or self-host with your own API keys.
