package com.interviewpilot.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubmitAnswerRequest {

    @NotBlank
    private String answer;
}
