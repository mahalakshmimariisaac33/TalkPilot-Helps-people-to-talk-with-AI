package com.interviewpilot.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ExchangeDto {
    private Long id;
    private int sequenceNumber;
    private String question;
    private String answer;
    private String aiFeedback;
    private Integer answerConfidence;
    private Integer clarityScore;
    private Integer relevanceScore;
    private String detectedEmotion;

    // TalkPilot 10-dimension scores (0-10)
    private Integer technicalAccuracy;
    private Integer completeness;
    private Integer communication;
    private Integer confidence;
    private Integer grammar;
    private Integer vocabulary;
    private Integer fluency;
    private Integer problemSolving;
    private Integer overall10;

    // Rich feedback
    private String strengths;
    private String weaknesses;
    private String missingConcepts;
    private String sampleAnswer;
    private String improvementTips;
    private String answerQuality;
}
