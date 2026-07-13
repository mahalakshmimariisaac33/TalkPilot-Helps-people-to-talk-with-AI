package com.interviewpilot.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "interview_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nullable for backwards compatibility with sessions started before user accounts existed. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private AppUser user;

    /** The resume used to personalize this session's questions, if any. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id")
    private Resume resume;

    @Column(nullable = false)
    private String candidateName;
    private String candidateEmail;

    @Column(nullable = false)
    private String jobRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterviewType interviewType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterviewerGender interviewerGender;

    @Column(nullable = false)
    private double speakingSpeed;

    /** PRACTICE (unlimited retakes, ramping difficulty) or REAL (single strict attempt). Defaults to PRACTICE for old rows. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SessionMode mode = SessionMode.PRACTICE;

    /** Computed once at session start based on practice day number / user type / mode. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DifficultyLevel difficulty = DifficultyLevel.EASY;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status;

    private Integer confidenceScore;

    private Integer communicationScore;

    @Column(length = 4000)
    private String overallFeedback;

    private Integer overallScore;

    private Integer technicalScore;

    @Column(length = 2000)
    private String strengths;

    @Column(length = 2000)
    private String weaknesses;

    @Column(length = 2000)
    private String recommendations;

    private Integer readinessPercentage;

    // TalkPilot report fields
    @Column(length = 100)
    private String hiringRecommendation;

    @Column(length = 3000)
    private String technicalAnalysis;

    @Column(length = 3000)
    private String communicationAnalysis;

    @Column(length = 2000)
    private String confidenceAnalysis;

    @Column(length = 2000)
    private String grammarVocabularyAnalysis;

    @Column(length = 2000)
    private String commonMistakes;

    @Column(length = 3000)
    private String personalizedStudyPlan;

    @Column(length = 2000)
    private String topicsForNextPractice;

    @Column(nullable = false)
    private Instant startedAt;

    private Instant completedAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequenceNumber ASC")
    @Builder.Default
    private List<InterviewExchange> exchanges = new ArrayList<>();
}
