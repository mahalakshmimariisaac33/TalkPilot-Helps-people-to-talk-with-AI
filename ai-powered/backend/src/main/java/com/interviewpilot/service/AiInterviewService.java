package com.interviewpilot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewpilot.config.AppProperties;
import com.interviewpilot.dto.AnswerAnalysisDto;
import com.interviewpilot.dto.InterviewReportDto;
import com.interviewpilot.model.DifficultyLevel;
import com.interviewpilot.model.InterviewExchange;
import com.interviewpilot.model.InterviewSession;
import com.interviewpilot.model.InterviewType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiInterviewService {

    private final AppProperties appProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    // ─────────────────────────────────────────────────────────────────────────
    // Opening question
    // ─────────────────────────────────────────────────────────────────────────

    public String generateOpeningQuestion(InterviewSession session) {
        String typeSpecific = session.getInterviewType() == InterviewType.HR
                ? "Start with 'Tell me about yourself' — ask the candidate to introduce themselves."
                : "Start with a technical icebreaker about a recent project or daily technology.";
        String prompt = """
                You are TalkPilot AI — a strict senior interviewer conducting a %s interview for %s.
                Candidate: %s
                %s
                %s
                %s
                Rules:
                - Do NOT say Hello or Hi — start directly with the question
                - 1-2 sentences only. Return only the question text.
                """.formatted(session.getInterviewType(), session.getJobRole(),
                session.getCandidateName(), resumeContext(session), typeSpecific,
                difficultyInstruction(session.getDifficulty()));
        return callLlm(prompt, fallbackOpening(session));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Follow-up question — never repeats, targets weaknesses
    // ─────────────────────────────────────────────────────────────────────────

    public String generateFollowUpQuestion(InterviewSession session, String lastAnswer, long elapsedMinutes) {
        List<InterviewExchange> history = session.getExchanges();
        String askedQuestions = history.stream().map(e -> "- " + e.getQuestion()).collect(Collectors.joining("\n"));
        String conversation = history.stream().filter(e -> e.getAnswer() != null)
                .map(e -> "Interviewer: " + e.getQuestion() + "\nCandidate: " + e.getAnswer())
                .collect(Collectors.joining("\n\n"));
        int questionNumber = (int) history.stream().filter(e -> e.getAnswer() != null).count() + 1;

        // Collect weak areas from prior answers to target them
        String weakAreas = history.stream().filter(e -> e.getWeaknesses() != null && !e.getWeaknesses().isBlank())
                .map(e -> "- " + e.getWeaknesses()).collect(Collectors.joining("\n"));

        String timingInstruction = elapsedMinutes >= 12
                ? "The interview is nearing its end. Ask a wrap-up question (salary, notice period, or candidate questions)." : "";

        String prompt = """
                You are TalkPilot AI — a strict senior interviewer. %s interview for %s.
                Candidate: %s. Question number: %d.
                %s

                Conversation so far:
                %s

                Questions already asked — NEVER repeat or rephrase:
                %s

                Weak areas identified in previous answers (TARGET THESE):
                %s

                Last answer: "%s"

                %s
                %s
                %s

                Generate ONE strict follow-up question. Rules:
                - NEVER repeat a question already asked
                - If weak areas exist, probe them specifically
                - Increase difficulty based on answer quality
                - Be direct, specific, no small talk
                - 1-2 sentences only. Return only the question text.
                """.formatted(session.getInterviewType(), session.getJobRole(), session.getCandidateName(),
                questionNumber, resumeContext(session),
                conversation.isBlank() ? "(start)" : conversation,
                askedQuestions.isBlank() ? "(none)" : askedQuestions,
                weakAreas.isBlank() ? "(none identified yet)" : weakAreas,
                lastAnswer, buildSequenceInstruction(session, questionNumber),
                difficultyInstruction(session.getDifficulty()), timingInstruction);

        return callLlm(prompt, fallbackFollowUp(session, history.size()));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Rephrase when answer is poor
    // ─────────────────────────────────────────────────────────────────────────

    public String rephraseQuestion(InterviewSession session, String originalQuestion,
                                    String poorAnswer, String feedback) {
        String prompt = """
                You are TalkPilot AI. The candidate gave an insufficient answer.
                Original question: "%s"
                Candidate's answer: "%s"
                Issue: "%s"
                Rephrase the question more specifically with a hint. 1-2 sentences. Return only the question.
                """.formatted(originalQuestion, poorAnswer, feedback);
        return callLlm(prompt, "Could you be more specific about " +
                originalQuestion.toLowerCase().replace("?", "") + "?");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TalkPilot strict 10-dimension answer analysis
    // ─────────────────────────────────────────────────────────────────────────

    public AnswerAnalysisDto analyzeAnswer(InterviewSession session, String question, String answer) {
        String prompt = """
                You are TalkPilot AI — a strict interviewer evaluating a candidate's answer.
                Interview type: %s | Role: %s
                Question: "%s"
                Answer: "%s"

                Evaluate STRICTLY. Do not inflate scores. Compare against an ideal answer.
                Correct obvious speech-to-text transcription errors before evaluating.

                Respond in JSON only (no markdown):
                {
                  "technicalAccuracy": <0-10>,
                  "completeness": <0-10>,
                  "communication": <0-10>,
                  "confidence": <0-10>,
                  "grammar": <0-10>,
                  "vocabulary": <0-10>,
                  "fluency": <0-10>,
                  "relevance": <0-10>,
                  "problemSolving": <0-10>,
                  "overall": <0-10>,
                  "detectedEmotion": "calm|nervous|confident|enthusiastic|uncertain",
                  "answerQuality": "POOR|ACCEPTABLE|GOOD|EXCELLENT",
                  "strengths": "<specific evidence-based strengths from this answer, 1-2 sentences>",
                  "weaknesses": "<specific weaknesses with evidence, 1-2 sentences>",
                  "missingConcepts": "<key concepts or points missing from the answer>",
                  "sampleAnswer": "<a concise ideal answer to this question in 3-4 sentences>",
                  "improvementTips": "<2-3 actionable, specific tips to improve this answer>",
                  "feedback": "<one specific sentence of constructive feedback>",
                  "communicationInsight": "<one sentence on communication style>"
                }

                Scoring guide (apply strictly):
                - 0-3: Completely wrong, off-topic, or missing
                - 4-5: Partial, vague, lacks depth
                - 6-7: Acceptable but incomplete
                - 8-9: Good with minor gaps
                - 10: Ideal, complete, structured

                Never give generic praise. Every weakness must be evidence-based from the actual answer.
                """.formatted(session.getInterviewType(), session.getJobRole(), question, answer);

        String response = callLlm(prompt, null);
        return parseAnalysis(response, answer);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Resume parsing
    // ─────────────────────────────────────────────────────────────────────────

    public JsonNode parseResumeText(String rawText) {
        String trimmed = rawText.length() > 12000 ? rawText.substring(0, 12000) : rawText;
        String prompt = """
                Extract structured information from this resume text.
                Resume:
                %s
                Respond in JSON only (no markdown):
                {
                  "summary": "<2-3 sentence professional summary>",
                  "skills": ["skill1", "skill2", ...],
                  "projects": [{"title": "<name>", "description": "<1 sentence>"}],
                  "yearsOfExperience": "<e.g. '0-1 (fresher)' or '2 years'>",
                  "targetRoleGuess": "<most likely target role>"
                }
                Max 12 skills, 6 projects.
                """.formatted(trimmed);
        String response = callLlm(prompt, null);
        if (response == null || response.isBlank()) return objectMapper.createObjectNode();
        try {
            String json = response;
            if (json.contains("{")) json = json.substring(json.indexOf('{'), json.lastIndexOf('}') + 1);
            return objectMapper.readTree(json);
        } catch (Exception e) {
            log.warn("Failed to parse resume LLM response: {}", e.getMessage());
            return objectMapper.createObjectNode();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TalkPilot full final report
    // ─────────────────────────────────────────────────────────────────────────

    public InterviewReportDto generateFullReport(InterviewSession session) {
        String fullTranscript = session.getExchanges().stream()
                .filter(e -> e.getAnswer() != null)
                .map(e -> "Q: " + e.getQuestion() + "\nA: " + e.getAnswer()
                        + (e.getWeaknesses() != null ? "\n[Weakness noted: " + e.getWeaknesses() + "]" : ""))
                .collect(Collectors.joining("\n\n"));

        int avgConf     = averageScore(session.getExchanges(), InterviewExchange::getAnswerConfidence);
        int avgClarity  = averageScore(session.getExchanges(), InterviewExchange::getClarityScore);
        int avgRel      = averageScore(session.getExchanges(), InterviewExchange::getRelevanceScore);

        String questionScores = session.getExchanges().stream()
                .filter(e -> e.getAnswer() != null && e.getOverall10() != null)
                .map(e -> "Q" + e.getSequenceNumber() + ": " + e.getOverall10() + "/10")
                .collect(Collectors.joining(", "));

        String prompt = """
                You are TalkPilot AI completing a strict %s interview with %s for %s.

                Full transcript:
                %s

                Per-question overall scores: %s
                Average Confidence: %d/100 | Clarity: %d/100 | Relevance: %d/10

                Generate a comprehensive, honest interview report in JSON (no markdown):
                {
                  "overallScore": <0-100>,
                  "communicationScore": <0-100>,
                  "confidenceScore": <0-100>,
                  "technicalScore": <0-100>,
                  "readinessPercentage": <0-100>,
                  "hiringRecommendation": "SELECTED|BORDERLINE|REJECTED",
                  "technicalAnalysis": "<2-3 sentences on technical depth and accuracy>",
                  "communicationAnalysis": "<2-3 sentences on communication style and clarity>",
                  "confidenceAnalysis": "<2 sentences on confidence and delivery>",
                  "grammarVocabularyAnalysis": "<2 sentences on language quality>",
                  "strengths": "<3 specific, evidence-based strengths, comma-separated>",
                  "weaknesses": "<3 specific weak areas with evidence, comma-separated>",
                  "commonMistakes": "<recurring mistakes observed across multiple answers>",
                  "recommendations": "<3 actionable personalized improvement suggestions>",
                  "personalizedStudyPlan": "<structured 2-week study plan based on weak areas>",
                  "topicsForNextPractice": "<5 specific topics the candidate must practice next, comma-separated>",
                  "closingStatement": "<2-3 sentences the interviewer would say to close — honest, not flattering>"
                }

                Be brutally honest. Base every comment on actual evidence from the transcript.
                SELECTED = overall >= 75. BORDERLINE = 55-74. REJECTED = below 55.
                """.formatted(session.getInterviewType(), session.getCandidateName(), session.getJobRole(),
                fullTranscript, questionScores.isBlank() ? "N/A" : questionScores,
                avgConf, avgClarity, avgRel);

        String response = callLlm(prompt, null);
        return parseReport(response, avgConf, avgClarity, avgRel);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Should wrap up
    // ─────────────────────────────────────────────────────────────────────────

    public boolean shouldWrapUp(InterviewSession session, long elapsedMinutes) {
        if (elapsedMinutes < 10) return false;
        if (elapsedMinutes >= 15) return true;
        int exchangeCount = (int) session.getExchanges().stream().filter(e -> e.getAnswer() != null).count();
        if (exchangeCount < 5) return false;
        String summary = session.getExchanges().stream().filter(e -> e.getAnswer() != null)
                .map(e -> "Q: " + e.getQuestion() + "\nA: " + e.getAnswer())
                .collect(Collectors.joining("\n\n"));
        String prompt = """
                You are conducting a %s interview. %d minutes elapsed. %d questions answered.
                Transcript: %s
                Enough to evaluate candidate for %s? Reply only: YES or NO
                """.formatted(session.getInterviewType(), elapsedMinutes, exchangeCount,
                summary, session.getJobRole());
        String answer = callLlm(prompt, elapsedMinutes >= 13 ? "YES" : "NO");
        return "YES".equalsIgnoreCase(answer == null ? "" : answer.trim());
    }

    public String determineInterviewerEmotion(AnswerAnalysisDto analysis) {
        if (analysis.getDetectedEmotion() == null) return "attentive";
        return switch (analysis.getDetectedEmotion().toLowerCase()) {
            case "nervous", "uncertain" -> "encouraging";
            case "confident", "enthusiastic" -> "impressed";
            default -> "attentive";
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private String difficultyInstruction(DifficultyLevel difficulty) {
        if (difficulty == null) return "";
        return switch (difficulty) {
            case EASY   -> "Difficulty: EASY. Broad, confidence-building questions.";
            case MEDIUM -> "Difficulty: MEDIUM. Expect specific examples and depth.";
            case HARD   -> "Difficulty: HARD. Probe, challenge, demand justification.";
        };
    }

    private String resumeContext(InterviewSession session) {
        if (session.getResume() == null) return "";
        var r = session.getResume();
        return "Resume — Summary: %s | Skills: %s | Experience: %s".formatted(
                nullToEmpty(r.getSummary()), nullToEmpty(r.getSkills()), nullToEmpty(r.getYearsOfExperience()));
    }

    private String nullToEmpty(String s) { return s == null || s.isBlank() ? "(not specified)" : s; }

    private String buildSequenceInstruction(InterviewSession session, int qn) {
        if (session.getInterviewType() == InterviewType.HR) {
            return switch (qn) {
                case 1 -> "Ask: Tell me about yourself.";
                case 2 -> "Ask: Why this role and company?";
                case 3 -> "Ask: Greatest strength with a real example.";
                case 4 -> "Ask: Biggest weakness and how you're improving it.";
                case 5 -> "Ask: A challenging situation — STAR format.";
                case 6 -> "Ask: Where do you see yourself in 3-5 years?";
                case 7 -> "Ask: How do you handle pressure or multiple deadlines?";
                case 8 -> "Ask: Salary expectations or notice period.";
                default -> "Ask a relevant closing HR question not yet covered.";
            };
        } else if (session.getInterviewType() == InterviewType.TECHNICAL) {
            return switch (qn) {
                case 1 -> "Ask about a recent technical project and their specific role.";
                case 2 -> "Ask a core concept for " + session.getJobRole() + ".";
                case 3 -> "Go deeper — implementation details or edge cases.";
                case 4 -> "Ask a real-world problem-solving challenge.";
                case 5 -> "Ask about debugging, testing, or code quality.";
                case 6 -> "Ask about system design or scalability.";
                default -> "Advanced question targeting gaps from prior answers.";
            };
        } else {
            return switch (qn) {
                case 1 -> "Tell me about a time you worked under pressure in a team.";
                case 2 -> "Describe a conflict with a teammate and how you resolved it.";
                case 3 -> "Give an example of leadership or taking initiative.";
                case 4 -> "Tell me about a failure and what you learned.";
                default -> "STAR-format behavioral question not yet covered.";
            };
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LLM call
    // ─────────────────────────────────────────────────────────────────────────

    private String callLlm(String prompt, String fallback) {
        if (appProperties.getOpenaiApiKey() == null || appProperties.getOpenaiApiKey().isBlank()) {
            return fallback != null ? fallback : "";
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(appProperties.getOpenaiApiKey());
            Map<String, Object> body = new HashMap<>();
            body.put("model", appProperties.getModel());
            body.put("messages", List.of(
                    Map.of("role", "system", "content",
                            "You are TalkPilot AI — a strict senior interviewer. Be direct, honest, evidence-based. Never inflate scores or give generic feedback."),
                    Map.of("role", "user", "content", prompt)
            ));
            body.put("temperature", 0.7);
            body.put("max_tokens", 1500);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    appProperties.getOpenaiBaseUrl() + "/chat/completions",
                    HttpMethod.POST, entity, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("choices").path(0).path("message").path("content").asText().trim();
        } catch (Exception e) {
            log.warn("LLM call failed: {}", e.getMessage());
            return fallback != null ? fallback : "";
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Parsers
    // ─────────────────────────────────────────────────────────────────────────

    private AnswerAnalysisDto parseAnalysis(String response, String answer) {
        try {
            String json = response;
            if (json != null && json.contains("{"))
                json = json.substring(json.indexOf('{'), json.lastIndexOf('}') + 1);
            JsonNode n = objectMapper.readTree(json);
            int overall10 = n.path("overall").asInt(0);
            return AnswerAnalysisDto.builder()
                    // Legacy fields (mapped from new scores for backward compat)
                    .confidenceScore(n.path("confidence").asInt(7) * 10)
                    .clarityScore(n.path("communication").asInt(7) * 10)
                    .relevanceScore(n.path("relevance").asInt(7))
                    .detectedEmotion(n.path("detectedEmotion").asText("calm"))
                    .feedback(n.path("feedback").asText(""))
                    .communicationInsight(n.path("communicationInsight").asText(""))
                    // TalkPilot 10-dimension
                    .technicalAccuracy(n.path("technicalAccuracy").asInt(7))
                    .completeness(n.path("completeness").asInt(7))
                    .communication(n.path("communication").asInt(7))
                    .confidence(n.path("confidence").asInt(7))
                    .grammar(n.path("grammar").asInt(7))
                    .vocabulary(n.path("vocabulary").asInt(7))
                    .fluency(n.path("fluency").asInt(7))
                    .relevance10(n.path("relevance").asInt(7))
                    .problemSolving(n.path("problemSolving").asInt(7))
                    .overall10(overall10)
                    .answerQuality(n.path("answerQuality").asText("ACCEPTABLE"))
                    .strengths(n.path("strengths").asText(""))
                    .weaknesses(n.path("weaknesses").asText(""))
                    .missingConcepts(n.path("missingConcepts").asText(""))
                    .sampleAnswer(n.path("sampleAnswer").asText(""))
                    .improvementTips(n.path("improvementTips").asText(""))
                    .build();
        } catch (Exception e) {
            return heuristicAnalysis(answer);
        }
    }

    private InterviewReportDto parseReport(String response, int avgConf, int avgClarity, int avgRel) {
        try {
            String json = response;
            if (json != null && json.contains("{"))
                json = json.substring(json.indexOf('{'), json.lastIndexOf('}') + 1);
            JsonNode n = objectMapper.readTree(json);
            int overall = n.path("overallScore").asInt(fallbackOverall(avgConf, avgClarity, avgRel));
            String rec = n.path("hiringRecommendation").asText(
                    overall >= 75 ? "SELECTED" : overall >= 55 ? "BORDERLINE" : "REJECTED");
            return InterviewReportDto.builder()
                    .overallScore(overall)
                    .communicationScore(n.path("communicationScore").asInt(avgClarity))
                    .confidenceScore(n.path("confidenceScore").asInt(avgConf))
                    .technicalScore(n.path("technicalScore").asInt(avgRel * 10))
                    .readinessPercentage(n.path("readinessPercentage").asInt(65))
                    .hiringRecommendation(rec)
                    .technicalAnalysis(n.path("technicalAnalysis").asText(""))
                    .communicationAnalysis(n.path("communicationAnalysis").asText(""))
                    .confidenceAnalysis(n.path("confidenceAnalysis").asText(""))
                    .grammarVocabularyAnalysis(n.path("grammarVocabularyAnalysis").asText(""))
                    .strengths(n.path("strengths").asText(""))
                    .weaknesses(n.path("weaknesses").asText(""))
                    .commonMistakes(n.path("commonMistakes").asText(""))
                    .recommendations(n.path("recommendations").asText(""))
                    .personalizedStudyPlan(n.path("personalizedStudyPlan").asText(""))
                    .topicsForNextPractice(n.path("topicsForNextPractice").asText(""))
                    .closingStatement(n.path("closingStatement").asText(
                            "Thank you for your time. I'll review your responses and get back to you."))
                    .build();
        } catch (Exception e) {
            log.warn("Failed to parse report: {}", e.getMessage());
            return fallbackReport(avgConf, avgClarity, avgRel);
        }
    }

    private AnswerAnalysisDto heuristicAnalysis(String answer) {
        int words = answer.trim().split("\\s+").length;
        int conf  = Math.min(9, 4 + words / 10);
        int rel   = words > 10 ? 6 : 3;
        String emotion = words < 8 ? "uncertain" : words > 40 ? "confident" : "calm";
        String quality = words < 10 ? "POOR" : words < 25 ? "ACCEPTABLE" : "GOOD";
        return AnswerAnalysisDto.builder()
                .confidenceScore(conf * 10).clarityScore(conf * 10).relevanceScore(rel)
                .detectedEmotion(emotion).answerQuality(quality)
                .technicalAccuracy(rel).completeness(rel).communication(conf)
                .confidence(conf).grammar(7).vocabulary(6).fluency(conf)
                .relevance10(rel).problemSolving(rel).overall10((conf + rel) / 2)
                .feedback("Add specific examples and structure your answer using STAR method.")
                .strengths(words > 25 ? "Good elaboration" : "Attempted the question")
                .weaknesses(words < 20 ? "Answer too brief, lacks depth and examples" : "Could be more structured")
                .missingConcepts("Specific examples, structured response, technical depth")
                .sampleAnswer("A strong answer would open with context, describe your specific actions, and close with the result/outcome.")
                .improvementTips("1. Use STAR method. 2. Add specific examples. 3. Quantify results where possible.")
                .communicationInsight(words > 25 ? "Good flow" : "Expand using STAR method")
                .build();
    }

    private InterviewReportDto fallbackReport(int conf, int clarity, int rel) {
        int overall = fallbackOverall(conf, clarity, rel);
        String rec = overall >= 75 ? "SELECTED" : overall >= 55 ? "BORDERLINE" : "REJECTED";
        return InterviewReportDto.builder()
                .overallScore(overall).communicationScore(clarity).confidenceScore(conf)
                .technicalScore(rel * 10).readinessPercentage((int)(overall * 0.9))
                .hiringRecommendation(rec)
                .strengths("Attempted all questions").weaknesses("Lacks depth and specific examples")
                .commonMistakes("Vague answers, missing STAR structure, insufficient technical depth")
                .recommendations("Practice STAR method. Build portfolio projects. Study role-specific concepts.")
                .personalizedStudyPlan("Week 1: STAR method practice + 3 mock interviews. Week 2: Role-specific technical concepts + 2 full simulations.")
                .topicsForNextPractice("STAR method, role-specific technical concepts, system design basics, behavioral questions, communication structure")
                .closingStatement("Thank you for your time. Focus on the feedback provided to improve before your next attempt.")
                .build();
    }

    private int fallbackOverall(int conf, int clarity, int rel) {
        return (int)((conf * 0.35) + (clarity * 0.35) + (rel * 10 * 0.30));
    }

    private int averageScore(List<InterviewExchange> exchanges,
                              java.util.function.Function<InterviewExchange, Integer> getter) {
        return (int) exchanges.stream().map(getter).filter(v -> v != null)
                .mapToInt(Integer::intValue).average().orElse(70);
    }

    private String fallbackOpening(InterviewSession session) {
        if (session.getInterviewType() == InterviewType.HR)
            return "Could you tell me about yourself — your background, what you've been working on, and why you're interested in the %s role?".formatted(session.getJobRole());
        return "Walk me through a recent technical project you're proud of — what you built and your specific contribution.";
    }

    private String fallbackFollowUp(InterviewSession session, int count) {
        if (session.getInterviewType() == InterviewType.TECHNICAL) {
            return switch (count % 6) {
                case 1 -> "What core data structures do you use most and when would you choose each?";
                case 2 -> "How do you debug a production issue with no logs available?";
                case 3 -> "How do you ensure code quality in a fast-moving team?";
                case 4 -> "How would you design a scalable REST API for a high-traffic system?";
                case 5 -> "Tell me about a technical decision you'd make differently today.";
                default -> "Walk me through your approach to testing — unit, integration, and beyond.";
            };
        }
        return switch (count % 6) {
            case 1 -> "Why are you specifically interested in this role?";
            case 2 -> "What's your greatest professional strength? Give a specific example.";
            case 3 -> "What's an area you're actively working to improve?";
            case 4 -> "Describe a challenging situation and how you handled it.";
            case 5 -> "Where do you see yourself in 3-5 years?";
            default -> "How do you manage work under multiple tight deadlines?";
        };
    }
}
