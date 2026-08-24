"use client";

import posthog from "posthog-js";
import { APP_VERSION, APP_VERSION_CHANGES } from "@/lib/version";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (typeof window !== "undefined" && key) {
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: false,
  });
  posthog.register({
    app_version: APP_VERSION,
    changes: APP_VERSION_CHANGES,
  });
}

export default function PostHogProvider() {
  return null;
}
