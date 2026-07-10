package com.interviewpilot.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.ai")
public class AppProperties {
    private String openaiApiKey;
    private String openaiBaseUrl;
    private String model;
}
