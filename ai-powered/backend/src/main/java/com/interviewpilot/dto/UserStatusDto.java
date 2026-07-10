package com.interviewpilot.dto;

import com.interviewpilot.model.DifficultyLevel;
import com.interviewpilot.model.UserType;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatusDto {
    private Long userId;
    private String email;
    private UserType userType;
    private int totalSessionCount;
    private int practiceSessionCount;
    private int realSessionCount;
    private int practiceDayNumber;         // which "day" of practice this is, drives difficulty ramp
    private Integer avgGapDays;            // null if not enough history yet
    private DifficultyLevel nextPracticeDifficulty; // preview shown on the dashboard before starting
    private String greeting;               // short human-friendly line the frontend can show
    private ResumeDto latestResume;         // null if none uploaded yet
}
