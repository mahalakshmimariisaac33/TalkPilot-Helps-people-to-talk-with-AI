package com.interviewpilot.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnswerAnalysisDto {
    // Legacy (kept for compatibility)
    private Integer confidenceScore;   // 0-100
    private Integer clarityScore;      // 0-100
    private Integer relevanceScore;    // 0-10
    private String  detectedEmotion;
    private String  feedback;
    private String  communicationInsight;

    // TalkPilot 10-dimension scores (0-10 each)
    private Integer technicalAccuracy;
    private Integer completeness;
    private Integer communication;
    private Integer confidence;
    private Integer grammar;
    private Integer vocabulary;
    private Integer fluency;
    private Integer relevance10;       // 0-10 renamed to avoid clash
    private Integer problemSolving;
    private Integer overall10;         // 0-10 composite

    // Rich per-answer feedback
    private String strengths;
    private String weaknesses;
    private String missingConcepts;
    private String sampleAnswer;
    private String improvementTips;
    private String answerQuality;      // POOR | ACCEPTABLE | GOOD | EXCELLENT
}
