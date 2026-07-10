package com.interviewpilot.controller;

import com.interviewpilot.dto.ResumeDto;
import com.interviewpilot.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<ResumeDto> upload(
            @RequestParam("userId") Long userId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(resumeService.uploadAndParse(userId, file));
    }

    @GetMapping("/latest")
    public ResponseEntity<ResumeDto> latest(@RequestParam("userId") Long userId) {
        ResumeDto dto = resumeService.getLatestForUser(userId);
        if (dto == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(dto);
    }
}
