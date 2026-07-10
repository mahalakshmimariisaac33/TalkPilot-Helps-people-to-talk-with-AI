package com.interviewpilot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewpilot.dto.ResumeDto;
import com.interviewpilot.model.Resume;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
@Slf4j
public class ResumeMapper {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResumeDto toDto(Resume resume) {
        return ResumeDto.builder()
                .id(resume.getId())
                .fileName(resume.getFileName())
                .summary(resume.getSummary())
                .skills(parseSkills(resume.getSkills()))
                .projects(parseProjects(resume.getProjectsJson()))
                .yearsOfExperience(resume.getYearsOfExperience())
                .targetRoleGuess(resume.getTargetRoleGuess())
                .uploadedAt(resume.getUploadedAt())
                .build();
    }

    private List<String> parseSkills(String skillsCsv) {
        if (skillsCsv == null || skillsCsv.isBlank()) return List.of();
        return Arrays.stream(skillsCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    private List<ResumeDto.ProjectDto> parseProjects(String projectsJson) {
        List<ResumeDto.ProjectDto> result = new ArrayList<>();
        if (projectsJson == null || projectsJson.isBlank()) return result;
        try {
            JsonNode arr = objectMapper.readTree(projectsJson);
            if (arr.isArray()) {
                for (JsonNode node : arr) {
                    result.add(ResumeDto.ProjectDto.builder()
                            .title(node.path("title").asText(""))
                            .description(node.path("description").asText(""))
                            .build());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse projectsJson: {}", e.getMessage());
        }
        return result;
    }
}
