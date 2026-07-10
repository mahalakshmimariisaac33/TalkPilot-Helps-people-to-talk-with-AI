package com.interviewpilot.service;

import com.interviewpilot.dto.ResumeDto;
import com.interviewpilot.dto.UserStatusDto;
import com.interviewpilot.model.AppUser;
import com.interviewpilot.model.InterviewSession;
import com.interviewpilot.model.Resume;
import com.interviewpilot.model.SessionMode;
import com.interviewpilot.model.UserType;
import com.interviewpilot.repository.AppUserRepository;
import com.interviewpilot.repository.InterviewSessionRepository;
import com.interviewpilot.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class UserService {

    private final AppUserRepository appUserRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeMapper resumeMapper;
    private final DifficultyPlanner difficultyPlanner;

    /**
     * Regular = average gap between the last few PRACTICE sessions is 3 days or less.
     * Irregular = has practice history, but gaps are inconsistent/long.
     * First-time = literally zero prior practice sessions.
     */
    private static final int REGULAR_MAX_AVG_GAP_DAYS = 3;

    public UserStatusDto loginOrRegister(String email) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(email)
                .orElseGet(() -> appUserRepository.save(
                        AppUser.builder()
                                .email(email.trim().toLowerCase())
                                .createdAt(Instant.now())
                                .build()));

        return buildStatus(user);
    }

    public UserStatusDto buildStatus(AppUser user) {
        // Difficulty ramp and streak detection are based on PRACTICE sessions only —
        // Real Experience attempts don't affect the daily practice cadence.
        List<InterviewSession> practiceHistory =
                interviewSessionRepository.findByUserIdAndModeOrderByStartedAtDesc(user.getId(), SessionMode.PRACTICE);

        UserType userType;
        Integer avgGapDays = null;

        if (practiceHistory.isEmpty()) {
            userType = UserType.FIRST_TIME;
        } else {
            avgGapDays = computeAverageGapDays(practiceHistory);
            userType = (avgGapDays != null && avgGapDays <= REGULAR_MAX_AVG_GAP_DAYS)
                    ? UserType.REGULAR
                    : UserType.IRREGULAR;
            // A single prior session isn't enough evidence of a pattern either way —
            // treat as regular-by-default so difficulty ramps up naturally rather than resetting.
            if (practiceHistory.size() == 1) {
                userType = UserType.REGULAR;
            }
        }

        int practiceDayNumber = practiceHistory.size() + 1;

        Optional<Resume> latestResume = resumeRepository.findByUserIdOrderByUploadedAtDesc(user.getId())
                .stream().findFirst();

        return UserStatusDto.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .userType(userType)
                .totalSessionCount(user.getTotalSessionCount())
                .practiceSessionCount(user.getPracticeSessionCount())
                .realSessionCount(user.getRealSessionCount())
                .practiceDayNumber(practiceDayNumber)
                .avgGapDays(avgGapDays)
                .nextPracticeDifficulty(difficultyPlanner.plan(SessionMode.PRACTICE, practiceDayNumber, userType))
                .greeting(buildGreeting(userType, practiceDayNumber))
                .latestResume(latestResume.map(resumeMapper::toDto).orElse(null))
                .build();
    }

    private Integer computeAverageGapDays(List<InterviewSession> historyDesc) {
        if (historyDesc.size() < 2) return null;
        long totalGapMillis = 0;
        int gaps = 0;
        for (int i = 0; i < historyDesc.size() - 1; i++) {
            Instant later = historyDesc.get(i).getStartedAt();
            Instant earlier = historyDesc.get(i + 1).getStartedAt();
            if (later == null || earlier == null) continue;
            totalGapMillis += Duration.between(earlier, later).toMillis();
            gaps++;
        }
        if (gaps == 0) return null;
        long avgMillis = totalGapMillis / gaps;
        return (int) Duration.ofMillis(avgMillis).toDays();
    }

    private String buildGreeting(UserType type, int dayNumber) {
        return switch (type) {
            case FIRST_TIME -> "Welcome! Let's set up your first practice session.";
            case REGULAR -> "Welcome back — great consistency! This is Day " + dayNumber + " of your practice streak.";
            case IRREGULAR -> "Welcome back! It's been a while — let's ease back in and rebuild momentum.";
        };
    }

    public AppUser requireUser(Long userId) {
        return appUserRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
    }
}
