package com.interviewpilot.service;

import com.interviewpilot.model.DifficultyLevel;
import com.interviewpilot.model.SessionMode;
import com.interviewpilot.model.UserType;
import org.springframework.stereotype.Component;

/**
 * Decides how hard the next set of interview questions should be.
 *
 * PRACTICE mode ramps up day over day:
 *   Day 1        -> EASY   (warm-up, build confidence)
 *   Day 2-4      -> MEDIUM
 *   Day 5+       -> HARD
 *
 * If the user has been IRREGULAR (long gaps between sessions), we step back
 * one level from what the day count alone would suggest — easing them back in
 * rather than throwing them at full difficulty after a long break.
 *
 * REAL mode always simulates the full-difficulty real interview experience,
 * regardless of practice day — that's the point of "real experience".
 */
@Component
public class DifficultyPlanner {

    public DifficultyLevel plan(SessionMode mode, int practiceDayNumber, UserType userType) {
        if (mode == SessionMode.REAL) {
            return DifficultyLevel.HARD;
        }

        DifficultyLevel byDay;
        if (practiceDayNumber <= 1) {
            byDay = DifficultyLevel.EASY;
        } else if (practiceDayNumber <= 4) {
            byDay = DifficultyLevel.MEDIUM;
        } else {
            byDay = DifficultyLevel.HARD;
        }

        if (userType == UserType.IRREGULAR) {
            return stepDown(byDay);
        }
        return byDay;
    }

    private DifficultyLevel stepDown(DifficultyLevel level) {
        return switch (level) {
            case HARD -> DifficultyLevel.MEDIUM;
            case MEDIUM -> DifficultyLevel.EASY;
            case EASY -> DifficultyLevel.EASY;
        };
    }
}
