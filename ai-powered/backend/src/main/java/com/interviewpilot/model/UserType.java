package com.interviewpilot.model;

/**
 * Classifies a user based on their session history so the AI can adapt
 * onboarding/difficulty/tone accordingly.
 *
 * FIRST_TIME  - no prior sessions at all
 * REGULAR     - practices consistently (average gap between sessions is small)
 * IRREGULAR   - has history, but with long/inconsistent gaps between sessions
 */
public enum UserType {
    FIRST_TIME,
    REGULAR,
    IRREGULAR
}
