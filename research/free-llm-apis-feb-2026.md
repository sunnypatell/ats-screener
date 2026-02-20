# free LLM API research for resume scoring engine

**date:** february 2026
**goal:** find completely free LLM APIs that can power a resume-vs-job-description scoring engine at scale (1000+ users/day)

---

## tier 1: best options (truly free, no credit card, persistent)

### 1. Google Gemini API (free tier) -- RECOMMENDED PRIMARY

| model | RPM | RPD | TPM | context |
|-------|-----|-----|-----|---------|
| gemini-2.5-flash-lite | 15 | **1,000** | 250,000 | 1M tokens |
| gemini-2.5-flash | 10 | 250 | 250,000 | 1M tokens |
| gemini-2.5-pro | 5 | 100 | 250,000 | 1M tokens |
| gemini-2.0-flash | 5 | ~250 | 250,000 | 1M tokens |
| gemini-3-flash-preview | tbd | tbd | tbd | tbd |

**structured output:** native JSON mode via `response_mime_type: "application/json"` + `response_schema`. excellent support, can define exact Pydantic-style schemas and get guaranteed valid JSON back.

**quality for resume analysis:** excellent. flash-lite is fast and smart enough for scoring tasks. the 1M context window means you can feed full resumes + full job descriptions without truncation.

**gotchas:**
- google slashed free tier limits by 50-92% in december 2025 without warning. could happen again.
- gemini-2.0-flash and flash-lite being retired march 3, 2026. migrate to 2.5 versions.
- gemini-2.5-flash dropped to just 20 RPD in some reports (conflicting data, may vary by account). flash-lite at 1,000 RPD is the safest bet.
- rate limits are per-project, not per-user.
- free tier data may be used for model improvement.
- using JSON structured output can reduce token usage by 30-50% vs verbose text output.

**verdict:** flash-lite at 1,000 RPD is the single best free option for our use case. with efficient prompting, 1,000 requests/day handles 1,000 users/day directly.

---

### 2. Groq (free tier) -- RECOMMENDED FALLBACK #1

| model | RPM | RPD | TPM |
|-------|-----|-----|-----|
| llama-3.3-70b-versatile | 30 | 1,000 | 12,000 |
| llama-3.1-8b-instant | 30 | 14,400 | 6,000 |
| meta-llama/llama-4-maverick-17b-128e | 30 | 1,000 | 6,000 |
| meta-llama/llama-4-scout-17b-16e | 30 | 1,000 | 30,000 |
| qwen/qwen3-32b | 60 | 1,000 | 6,000 |
| moonshotai/kimi-k2-instruct | 60 | 1,000 | 10,000 |
| openai/gpt-oss-120b | 30 | 1,000 | 8,000 |

**structured output:** groq supports JSON mode via `response_format: { type: "json_object" }`. works well with llama 3.3 70b.

**quality for resume analysis:** llama-3.3-70b is very capable for semantic analysis. fast inference (300+ tokens/sec on groq hardware). 8b models are less reliable for nuanced scoring.

**gotchas:**
- TPM limits are low (6,000-12,000). a resume + job description + prompt can easily be 2,000-4,000 tokens input. output might be 500-1,000 tokens. so effectively ~2-4 requests per minute for 70b.
- 1,000 RPD for the best models, 14,400 RPD only for the smaller 8b model.
- organization-level limits, not user-level.
- no credit card required.

**verdict:** excellent fallback. llama-3.3-70b at 1,000 RPD gives us another 1,000 requests/day. combined with gemini, that's 2,000/day.

---

### 3. Cerebras (free tier) -- RECOMMENDED FALLBACK #2

| limit | value |
|-------|-------|
| tokens/day | 1,000,000 |
| RPM | 30 |
| TPM | 60,000 |
| context length | 8,192 (free), 64K+ (paid) |

**models:** llama 3.3 70b, qwen3 235b instruct, gpt-oss 120b, llama 4 maverick 400b

**structured output:** OpenAI-compatible API, supports JSON mode.

**quality:** very high. qwen3 235b and llama 3.3 70b are excellent for semantic analysis. blazing fast inference (cerebras custom chips).

**gotchas:**
- 1M tokens/day sounds generous, but a typical resume scoring call might use ~3,000-5,000 total tokens, giving you roughly 200-330 requests/day.
- 8,192 context limit on free tier is tight for long resumes + job descriptions. may need to truncate.
- token bucket algorithm (continuous replenishment, not hard daily reset).

**verdict:** good third option. the 8K context limit is the main constraint, but still usable for most resumes.

---

### 4. Mistral AI (free tier)

| limit | value |
|-------|-------|
| RPM | 2 |
| TPM | 500,000 |
| tokens/month | 1,000,000,000 (1B) |

**models:** mistral large, mistral small, codestral, pixtral 12b

**structured output:** supports JSON mode.

**quality:** mistral models are solid for text analysis. mistral large is competitive with gpt-4 class.

**gotchas:**
- **2 RPM is extremely limiting.** that's 2,880 requests/day max, but in practice you can only serve 2 concurrent users per minute.
- the 1B tokens/month is generous, but the RPM bottleneck makes it impractical as a primary.
- no credit card required.

**verdict:** usable as a low-priority fallback. the 2 RPM limit means it can only trickle-serve requests, not handle bursts.

---

### 5. OpenRouter (free models)

**rate limits:** 20 RPM, 200 RPD (50 RPD without $10+ balance)

**best free models for our use case:**
- `meta-llama/llama-3.3-70b-instruct:free` (128K context, tool use)
- `qwen/qwen3-235b-thinking:free` (131K context, reasoning)
- `openai/gpt-oss-120b:free` (131K context, tool use)
- `mistral/mistral-small-3.1-24b:free` (128K context, vision + tool use)
- `google/gemma-3-27b:free` (131K context, vision + tool use)
- `deepseek/deepseek-r1-0528:free` (163K context, reasoning)

**structured output:** depends on the underlying model. llama 3.3 and qwen3 support JSON mode well.

**gotchas:**
- only 200 RPD without paying anything. 1,000 RPD if you've ever purchased $10+ in credits.
- free models can be removed or changed without notice.
- availability varies; models may be temporarily unavailable.
- rate limits are across ALL free models combined, not per-model.

**verdict:** decent supplementary option. 200 RPD baseline, but unreliable for production.

---

### 6. Cloudflare Workers AI

**free allocation:** 10,000 neurons/day (resets at 00:00 UTC)

**models:** llama 3.2 variants (1b, 3b), llama 3.1 8b, mistral 7b, deepseek, qwen

**estimated LLM requests:** ~1,300 text generation requests/day with 10K neurons (varies by model size)

**structured output:** can be coerced via prompting, but no native JSON mode for all models.

**gotchas:**
- neuron-based pricing is opaque. hard to predict exact request counts.
- models are quantized edge-deployed versions, lower quality than full models.
- smaller models (7b-8b) may not be reliable enough for nuanced resume scoring.
- requires cloudflare account and workers setup.

**verdict:** backup option only. the quantized small models and opaque neuron pricing make it hard to rely on.

---

### 7. Cohere (trial key)

| limit | value |
|-------|-------|
| requests/month | 1,000 |
| chat RPM | 20 |
| embed RPM | 5 |

**models:** command r+, embed 4, rerank 3.5

**structured output:** native JSON mode support.

**gotchas:**
- **1,000 requests per MONTH** is extremely low for 1,000 users/day.
- trial keys are explicitly non-commercial, non-production.
- good quality models though.

**verdict:** not viable for our scale. 1,000/month = ~33/day.

---

### 8. HuggingFace Inference API

**free tier:** monthly credits (exact amount unclear), limited to ~10B parameter models

**gotchas:**
- cold starts of 30+ seconds for niche models.
- free tier limited to small models that may not be good enough.
- unclear/undocumented rate limits.
- unreliable for production.

**verdict:** not recommended. too unreliable and limited.

---

### 9. SambaNova (free tier)

| limit | value |
|-------|-------|
| tokens/day | 200,000 |
| RPM | 10-30 (depends on model) |

**models:** llama 3.3 70b, llama 3.1 405b, qwen 2.5 72b

**structured output:** OpenAI-compatible API.

**gotchas:**
- 200K tokens/day is only ~40-65 resume scoring requests.
- comes with $5 initial credits (30 day expiry) on top of free tier.
- free tier persists indefinitely.

**verdict:** too limited for our scale. maybe 40-65 requests/day.

---

### 10. GitHub Models

| tier | RPM | RPD | max input tokens |
|------|-----|-----|------------------|
| high (gpt-4o, o3) | 10 | 50 | 8,000 |
| low (smaller) | 15 | 150 | 8,000 |

**gotchas:**
- 8K input / 4K output token limit per request is restrictive.
- 50 RPD for good models.
- requires github account.

**verdict:** too limited. 50 RPD for good models, 8K context cap.

---

### 11. NVIDIA NIM

**free:** 1,000 credits on signup (can request 4,000 more), 40 RPM

**models:** deepseek r1/v3.1, llama variants, kimi k2.5

**gotchas:**
- credit-based, not truly persistent free tier.
- credits will run out.

**verdict:** one-time credits, not sustainable.

---

## tier 2: free credits (one-time, will expire)

| provider | free credits | expiry | notes |
|----------|-------------|--------|-------|
| Together AI | $25 | 30-90 days | no persistent free tier after credits |
| xAI (Grok) | $25 | unclear | grok 4 access |
| DeepSeek | 5M tokens | 30 days | very cheap after ($0.14/M input) |
| AI21 Labs | $10 | 3 months | jamba models |
| Anthropic | $5 | one-time | claude access |
| NVIDIA NIM | 1,000 credits | unclear | can request more |

these are useful for initial development/testing but not for sustained free operation.

---

## comparison matrix for 1,000+ users/day

| provider | daily capacity | quality | JSON support | reliability | score |
|----------|---------------|---------|--------------|-------------|-------|
| **Gemini flash-lite** | 1,000 RPD | excellent | native | high | **9/10** |
| **Groq (llama-3.3-70b)** | 1,000 RPD | excellent | native | high | **8/10** |
| **Cerebras** | ~200-330 RPD | excellent | native | medium | **7/10** |
| Mistral | ~2,880 RPD | good | native | medium | **6/10** |
| OpenRouter | 200 RPD | varies | varies | low | **5/10** |
| Cloudflare Workers | ~1,300 RPD | low-medium | limited | medium | **4/10** |
| SambaNova | ~40-65 RPD | good | native | medium | **3/10** |
| Cohere | ~33 RPD | good | native | high | **2/10** |
| HuggingFace | unclear | varies | varies | low | **2/10** |
| GitHub Models | 50 RPD | good | native | high | **2/10** |

---

## recommended architecture

### primary: Google Gemini 2.5 Flash-Lite
- 1,000 requests/day
- excellent JSON structured output
- 1M token context (can handle any resume + job description)
- fast, reliable, no credit card needed

### fallback #1: Groq (llama-3.3-70b-versatile)
- 1,000 requests/day
- blazing fast inference
- good JSON mode support
- kicks in when gemini hits daily limit

### fallback #2: Cerebras (llama 3.3 70b or qwen3 235b)
- ~200-330 requests/day
- very fast inference
- OpenAI-compatible API
- 8K context limit is manageable with smart truncation

### fallback #3: Mistral (mistral-small or mistral-large)
- 2 RPM trickle
- decent quality
- last resort when others are exhausted

### total daily capacity: ~2,200-2,330 requests/day (free)

---

## implementation strategy

### multi-provider fallback chain
```
gemini flash-lite (1,000/day)
  -> groq llama-3.3-70b (1,000/day)
    -> cerebras llama 3.3 70b (~250/day)
      -> mistral small (trickle at 2 RPM)
        -> openrouter free models (200/day)
```

### key implementation details

1. **use liteLLM or similar router** to abstract away provider differences. all these APIs are OpenAI-compatible or have adapters.

2. **track usage per provider** in redis or a simple counter. switch to next provider when approaching daily limit (use 90% threshold to avoid hitting hard limits).

3. **standardize the prompt** so the same scoring prompt works across all providers. use a simple JSON schema that all models can reliably produce.

4. **cache aggressively.** if the same resume is scored against the same job description, return cached results. this could reduce actual API calls by 30-50%.

5. **queue and batch.** don't let users wait for real-time responses. queue scoring requests and process them at a steady rate to stay within RPM limits.

6. **implement exponential backoff** with jitter for 429 (rate limit) errors. when one provider returns 429, immediately failover to the next.

7. **JSON output optimization.** using `response_mime_type: "application/json"` with gemini or `response_format: { type: "json_object" }` with groq/cerebras reduces token usage significantly vs asking for JSON in the prompt.

### scaling beyond free tiers

if you consistently need 2,000+ requests/day:
- gemini flash-lite paid tier is $0.02 per million input tokens. 1,000 extra requests/day would cost pennies.
- groq paid tier is also very cheap.
- the free tier strategy buys time to validate the product before paying anything.

---

## final recommendation

**go with gemini 2.5 flash-lite as primary.** it has the highest free quota (1,000 RPD), best structured output support, massive context window, and excellent quality for text analysis tasks like resume scoring. supplement with groq and cerebras as fallbacks to reach ~2,200+ free requests/day. this architecture costs exactly $0 and can serve 1,000+ users daily.

the main risk is google further cutting free tier limits (they already did it once in december 2025). having groq and cerebras as fallbacks mitigates this risk completely.
