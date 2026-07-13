package com.interviewpilot.service;

import com.interviewpilot.config.MailProperties;
import com.interviewpilot.model.InterviewSession;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;

    public void sendInterviewReport(InterviewSession session) {
        if (!mailProperties.isEnabled()) {
            log.info("Mail disabled (app.mail.enabled=false) — skipping report email for session {}", session.getId());
            return;
        }
        if (session.getCandidateEmail() == null || session.getCandidateEmail().isBlank()) {
            log.warn("Session {} has no candidateEmail on file — skipping report email", session.getId());
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailProperties.getFrom());
            helper.setTo(session.getCandidateEmail());
            helper.setSubject("Your InterviewPilot AI Report — " + session.getJobRole());
            helper.setText(buildReportHtml(session), true);
            mailSender.send(message);
            log.info("Report email sent to {} for session {}", session.getCandidateEmail(), session.getId());
        } catch (MessagingException | RuntimeException e) {
            log.error("Failed to send report email for session {}: {}", session.getId(), e.getMessage(), e);
        }
    }

    private String buildReportHtml(InterviewSession session) {
        return """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                  <h2 style="color:#22c55e;">InterviewPilot AI — Your Report</h2>
                  <p>Hi %s,</p>
                  <p>Here's how your <strong>%s</strong> interview went:</p>
                  <ul>
                    <li><strong>Overall score:</strong> %s</li>
                    <li><strong>Confidence:</strong> %s</li>
                    <li><strong>Communication:</strong> %s</li>
                    <li><strong>Technical:</strong> %s</li>
                    <li><strong>Readiness:</strong> %s%%</li>
                  </ul>
                  <p><strong>Strengths:</strong><br/>%s</p>
                  <p><strong>Areas to work on:</strong><br/>%s</p>
                  <p><strong>Recommendations:</strong><br/>%s</p>
                  <p style="color:#888; font-size:12px; margin-top:24px;">— InterviewPilot AI</p>
                </div>
                """.formatted(
                        nullSafe(session.getCandidateName()),
                        nullSafe(session.getJobRole()),
                        nullSafe(session.getOverallScore()),
                        nullSafe(session.getConfidenceScore()),
                        nullSafe(session.getCommunicationScore()),
                        nullSafe(session.getTechnicalScore()),
                        nullSafe(session.getReadinessPercentage()),
                        nullSafe(session.getStrengths()),
                        nullSafe(session.getWeaknesses()),
                        nullSafe(session.getRecommendations())
                );
    }

    private String nullSafe(Object value) {
        return value == null ? "—" : value.toString();
    }
}
