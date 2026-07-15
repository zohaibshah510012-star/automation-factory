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
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Always for customer authentication | Supabase publishable/anon key |
| SUPABASE_SERVICE_ROLE_KEY | Always for persistence | Server-only task and result writes |
| ADMIN_EMAILS | Required to bootstrap the first admin | Comma-separated administrator emails |
| AI_PROVIDER | Always | openai, gemini, deepseek, alternative, or local |
| AI_IMAGE_PROVIDER | Optional image generation | openai, flux, gemini, alternative, or local |
| AI_VIDEO_PROVIDER | Optional video generation | runway, kling, openai, or local |
| DEEPSEEK_API_KEY | AI_PROVIDER=deepseek | DeepSeek text generation |
| DEEPSEEK_BASE_URL | Optional | Defaults to https://api.deepseek.com |
| DEEPSEEK_TEXT_MODEL | Optional | Defaults to deepseek-chat |
| OPENAI_API_KEY | AI_PROVIDER=openai | OpenAI text, image, and voice |
| GEMINI_API_KEY | AI_PROVIDER=gemini | Gemini text and optional image generation |
| FLUX_API_KEY | AI_IMAGE_PROVIDER=flux | Flux image provider token |
| FLUX_API_BASE_URL | AI_IMAGE_PROVIDER=flux | Flux image generation endpoint |
| RUNWAY_API_KEY | AI_VIDEO_PROVIDER=runway | Runway video provider token |
| RUNWAY_API_BASE_URL | AI_VIDEO_PROVIDER=runway | Runway video endpoint |
| KLING_API_KEY | AI_VIDEO_PROVIDER=kling | Kling video provider token |
| KLING_API_BASE_URL | AI_VIDEO_PROVIDER=kling | Kling video endpoint |
| CREDIT_PRICE_USD | Optional analytics | Internal revenue estimate per credit |
| PROVIDER_COST_PER_CREDIT_USD | Optional analytics | Internal provider cost estimate per credit |

Provider-specific model settings are documented in .env.example and .env.local.example.

## Supabase setup

Apply every file in `supabase/migrations` in lexical order before enabling production traffic. The current commercial launch baseline runs from `0001_content_factory.sql` through `0022_workspace_rls_fix.sql`.

The backend uses SUPABASE_SERVICE_ROLE_KEY; never expose this key to browser code or prefix it with NEXT_PUBLIC_.

## Deployment scope

The current launch baseline includes content generation, credits, billing, payment framework, distribution, short drama, and workspace foundations. Real payment providers and paid media providers should remain disabled until sandbox credentials and webhook contracts are verified.
