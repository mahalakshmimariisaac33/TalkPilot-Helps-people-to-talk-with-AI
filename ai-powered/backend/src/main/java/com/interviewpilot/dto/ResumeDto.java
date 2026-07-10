package com.interviewpilot.dto;

import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeDto {
    private Long id;
    private String fileName;
    private String summary;
    private List<String> skills;
    private List<ProjectDto> projects;
    private String yearsOfExperience;
    private String targetRoleGuess;
    private Instant uploadedAt;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectDto {
        private String title;
        private String description;
    }
}
