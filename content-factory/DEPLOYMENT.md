# Cloud Deployment Guide

## Build check

    pnpm install --frozen-lockfile
    pnpm build

Deploy the content-factory directory as the application root. The project uses Next.js and requires a Node.js runtime compatible with the version declared in package.json.

## Required environment variables

Set these only in the cloud provider's encrypted environment-variable settings. Do not commit .env.local.

| Variable | Required when | Purpose |
| --- | --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Always for persistence | Supabase project URL |
| SUPABASE_SERVICE_ROLE_KEY | Always for persistence | Server-only task and result writes |
| AI_PROVIDER | Always | openai, gemini, deepseek, alternative, or local |
| DEEPSEEK_API_KEY | AI_PROVIDER=deepseek | DeepSeek text generation |
| DEEPSEEK_BASE_URL | Optional | Defaults to https://api.deepseek.com |
| DEEPSEEK_TEXT_MODEL | Optional | Defaults to deepseek-chat |
| OPENAI_API_KEY | AI_PROVIDER=openai | OpenAI text, image, and voice |
| GEMINI_API_KEY | AI_PROVIDER=gemini | Gemini text and optional image generation |

Provider-specific model settings are documented in .env.example and .env.local.example.

## Supabase setup

Apply supabase/migrations/0001_content_factory.sql to the target project before enabling production traffic. It creates projects, content_tasks, ai_generations, and assets.

The backend uses SUPABASE_SERVICE_ROLE_KEY; never expose this key to browser code or prefix it with NEXT_PUBLIC_.

## Deployment scope

The current MVP persists content-task states and DeepSeek text output. Image, voice, and video providers remain independently configurable and should only be enabled after their storage and runtime requirements are validated for the chosen hosting platform.
