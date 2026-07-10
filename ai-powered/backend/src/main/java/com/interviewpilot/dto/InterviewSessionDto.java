package com.interviewpilot.dto;

import com.interviewpilot.model.DifficultyLevel;
import com.interviewpilot.model.InterviewType;
import com.interviewpilot.model.InterviewerGender;
import com.interviewpilot.model.SessionMode;
import com.interviewpilot.model.SessionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class InterviewSessionDto {
    private Long id;
    private String candidateName;
    private String jobRole;
    private InterviewType interviewType;
    private InterviewerGender interviewerGender;
    private double speakingSpeed;
    private SessionMode mode;
    private DifficultyLevel difficulty;
    private SessionStatus status;
    private Integer confidenceScore;
    private Integer communicationScore;
    private Integer overallScore;
    private Integer technicalScore;
    private String overallFeedback;
    private String strengths;
    private String weaknesses;
    private String recommendations;
    private Integer readinessPercentage;
    // TalkPilot report fields
    private String hiringRecommendation;
    private String technicalAnalysis;
    private String communicationAnalysis;
    private String confidenceAnalysis;
    private String grammarVocabularyAnalysis;
    private String commonMistakes;
    private String personalizedStudyPlan;
    private String topicsForNextPractice;
    private Instant startedAt;
    private Instant completedAt;
    private List<ExchangeDto> exchanges;
    private String currentQuestion;
    private String interviewerEmotion;
    private boolean interviewComplete;
    private boolean shouldWrapUp;
}
