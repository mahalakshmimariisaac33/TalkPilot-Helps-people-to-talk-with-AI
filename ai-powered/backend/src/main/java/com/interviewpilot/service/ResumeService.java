package com.interviewpilot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.interviewpilot.dto.ResumeDto;
import com.interviewpilot.model.AppUser;
import com.interviewpilot.model.Resume;
import com.interviewpilot.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final UserService userService;
    private final AiInterviewService aiInterviewService;
    private final ResumeMapper resumeMapper;

    private static final long MAX_FILE_SIZE_BYTES = 8L * 1024 * 1024; // 8 MB

    public ResumeDto uploadAndParse(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file uploaded.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File too large — please upload a PDF under 8MB.");
        }
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "resume.pdf";
        if (!originalName.toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("Only PDF resumes are supported right now.");
        }

        String rawText = extractText(file);
        if (rawText.isBlank()) {
            throw new IllegalArgumentException(
                    "Couldn't read any text from that PDF — it may be a scanned image. Try exporting a text-based PDF.");
        }

        AppUser user = userService.requireUser(userId);

        JsonNode parsed = aiInterviewService.parseResumeText(rawText);

        String skillsCsv = joinSkills(parsed);
        String projectsJson = parsed.has("projects") ? parsed.get("projects").toString() : "[]";

        Resume resume = Resume.builder()
                .user(user)
                .fileName(originalName)
                .rawText(rawText)
                .summary(parsed.path("summary").asText(""))
                .skills(skillsCsv)
                .projectsJson(projectsJson)
                .yearsOfExperience(parsed.path("yearsOfExperience").asText("Not specified"))
                .targetRoleGuess(parsed.path("targetRoleGuess").asText(""))
                .uploadedAt(Instant.now())
                .build();

        resume = resumeRepository.save(resume);
        return resumeMapper.toDto(resume);
    }

    public ResumeDto getLatestForUser(Long userId) {
        return resumeRepository.findByUserIdOrderByUploadedAtDesc(userId).stream()
                .findFirst()
                .map(resumeMapper::toDto)
                .orElse(null);
    }

    private String joinSkills(JsonNode parsed) {
        List<String> skills = new ArrayList<>();
        if (parsed.has("skills") && parsed.get("skills").isArray()) {
            parsed.get("skills").forEach(n -> skills.add(n.asText()));
        }
        return String.join(", ", skills);
    }

    private String extractText(MultipartFile file) {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document).trim();
        } catch (IOException e) {
            log.error("Failed to extract text from PDF: {}", e.getMessage());
            throw new IllegalArgumentException("Couldn't read that PDF file — it may be corrupted.");
        }
    }
}
