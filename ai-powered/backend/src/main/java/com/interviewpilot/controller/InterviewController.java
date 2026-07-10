package com.interviewpilot.controller;

import com.interviewpilot.dto.InterviewSessionDto;
import com.interviewpilot.dto.StartInterviewRequest;
import com.interviewpilot.dto.SubmitAnswerRequest;
import com.interviewpilot.service.InterviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping("/start")
    public ResponseEntity<InterviewSessionDto> start(@Valid @RequestBody StartInterviewRequest request) {
        return ResponseEntity.ok(interviewService.startInterview(request));
    }

    @PostMapping("/{sessionId}/answer")
    public ResponseEntity<InterviewSessionDto> submitAnswer(
            @PathVariable Long sessionId,
            @Valid @RequestBody SubmitAnswerRequest request) {
        return ResponseEntity.ok(interviewService.submitAnswer(sessionId, request));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<InterviewSessionDto> getSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(interviewService.getSession(sessionId));
    }

    @PostMapping("/{sessionId}/conclude")
    public ResponseEntity<InterviewSessionDto> conclude(@PathVariable Long sessionId) {
        return ResponseEntity.ok(interviewService.concludeInterview(sessionId));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "InterviewPilot AI"));
    }
}
