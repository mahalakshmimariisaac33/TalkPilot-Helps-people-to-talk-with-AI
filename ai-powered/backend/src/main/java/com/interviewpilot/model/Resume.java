package com.interviewpilot.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "resumes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(nullable = false)
    private String fileName;

    /** Raw extracted text from the PDF, kept for future re-parsing. */
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String rawText;

    /** 2-3 sentence AI-generated summary of the candidate. */
    @Column(length = 2000)
    private String summary;

    /** Comma-separated list of detected skills/technologies. */
    @Column(length = 2000)
    private String skills;

    /** JSON array string of {title, description} project objects. */
    @Lob
    @Column(columnDefinition = "TEXT")
    private String projectsJson;

    private String yearsOfExperience;

    @Column(length = 500)
    private String targetRoleGuess;

    @Column(nullable = false)
    private Instant uploadedAt;
}
