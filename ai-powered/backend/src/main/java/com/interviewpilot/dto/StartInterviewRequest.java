package com.interviewpilot.dto;

import com.interviewpilot.model.InterviewType;
import com.interviewpilot.model.InterviewerGender;
import com.interviewpilot.model.SessionMode;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StartInterviewRequest {

    @NotBlank
    private String candidateName;

    @NotBlank
    private String jobRole;

    @NotNull
    private InterviewType interviewType;

    @NotNull
    private InterviewerGender interviewerGender;

    @DecimalMin("0.5")
    @DecimalMax("2.0")
    private double speakingSpeed = 1.0;

    /** PRACTICE or REAL — defaults to PRACTICE if the client omits it (older frontend builds). */
    @NotNull
    private SessionMode mode = SessionMode.PRACTICE;

    /** Optional — links this session to a logged-in user for history/difficulty tracking. */
    private Long userId;

    /** Optional — the resume to personalize questions against. */
    private Long resumeId;
}
