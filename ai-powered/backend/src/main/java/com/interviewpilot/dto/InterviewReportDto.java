package com.interviewpilot.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class InterviewReportDto {
    // Core scores 0-100
    private Integer overallScore;
    private Integer communicationScore;
    private Integer confidenceScore;
    private Integer technicalScore;
    private Integer readinessPercentage;

    // Hiring recommendation
    private String hiringRecommendation;  // SELECTED | BORDERLINE | REJECTED

    // Analysis sections
    private String technicalAnalysis;
    private String communicationAnalysis;
    private String confidenceAnalysis;
    private String grammarVocabularyAnalysis;

    // Summary fields
    private String strengths;
    private String weaknesses;
    private String commonMistakes;
    private String recommendations;
    private String closingStatement;

    // Study plan
    private String personalizedStudyPlan;
    private String topicsForNextPractice;
}
