package com.interviewpilot.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "interview_exchanges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewExchange {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    @Column(nullable = false)
    private int sequenceNumber;

    @Column(nullable = false, length = 2000)
    private String question;

    @Column(length = 4000)
    private String answer;

    @Column(length = 2000)
    private String aiFeedback;

    private Integer answerConfidence;

    private Integer clarityScore;

    private Integer relevanceScore;

    @Column(length = 100)
    private String detectedEmotion;

    @Column(nullable = false)
    private Instant askedAt;

    private Instant answeredAt;

    @Column(name = "reattempt_count")
    private Integer reattemptCount = 0;

    @Column(name = "parent_question_id")
    private Long parentQuestionId;

    // TalkPilot 10-dimension scores (0-10)
    @Column(name = "technical_accuracy")
    private Integer technicalAccuracy;

    @Column(name = "completeness_score")
    private Integer completeness;

    @Column(name = "communication_score")
    private Integer communication;

    @Column(name = "grammar_score")
    private Integer grammar;

    @Column(name = "vocabulary_score")
    private Integer vocabulary;

    @Column(name = "fluency_score")
    private Integer fluency;

    @Column(name = "problem_solving_score")
    private Integer problemSolving;

    @Column(name = "overall10_score")
    private Integer overall10;

    // Rich per-answer feedback
    @Column(length = 1000)
    private String strengths;

    @Column(length = 1000)
    private String weaknesses;

    @Column(length = 1000)
    private String missingConcepts;

    @Column(length = 2000)
    private String sampleAnswer;

    @Column(length = 1000)
    private String improvementTips;

    @Column(length = 50)
    private String answerQuality;
}