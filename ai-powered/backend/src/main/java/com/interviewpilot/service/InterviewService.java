package com.interviewpilot.service;

import com.interviewpilot.dto.*;
import com.interviewpilot.model.AppUser;
import com.interviewpilot.model.DifficultyLevel;
import com.interviewpilot.model.InterviewExchange;
import com.interviewpilot.model.InterviewSession;
import com.interviewpilot.model.Resume;
import com.interviewpilot.model.SessionMode;
import com.interviewpilot.model.SessionStatus;
import com.interviewpilot.model.UserType;
import com.interviewpilot.repository.AppUserRepository;
import com.interviewpilot.repository.InterviewSessionRepository;
import com.interviewpilot.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InterviewService {

    private static final long MIN_DURATION_MINUTES = 10;
    private static final long MAX_DURATION_MINUTES = 15;

    // How many times we allow re-asking the same question before moving on.
    // PRACTICE is forgiving (helps learning); REAL is strict, just like an actual interview —
    // no do-overs, which is the whole point of "real experience".
    private static final int MAX_REATTEMPTS_PRACTICE = 2;
    private static final int MAX_REATTEMPTS_REAL = 0;

    private final InterviewSessionRepository sessionRepository;
    private final AiInterviewService aiInterviewService;
    private final AppUserRepository appUserRepository;
    private final ResumeRepository resumeRepository;
    private final UserService userService;
    private final DifficultyPlanner difficultyPlanner;

    @Transactional
    public InterviewSessionDto startInterview(StartInterviewRequest request) {
        AppUser user = null;
        Resume resume = null;

        if (request.getUserId() != null) {
            user = appUserRepository.findById(request.getUserId()).orElse(null);
        }
        if (request.getResumeId() != null) {
            resume = resumeRepository.findById(request.getResumeId()).orElse(null);
        }

        DifficultyLevel difficulty = DifficultyLevel.EASY;
        if (user != null) {
            // Compute the difficulty BEFORE bumping counters, so "Day 1" really means
            // this is their first practice session, not their second.
            UserStatusDto statusBeforeThisSession = userService.buildStatus(user);
            int dayNumberForThisSession = request.getMode() == SessionMode.PRACTICE
                    ? statusBeforeThisSession.getPracticeDayNumber()
                    : 1;
            UserType userType = statusBeforeThisSession.getUserType();
            difficulty = difficultyPlanner.plan(request.getMode(), dayNumberForThisSession, userType);

            user.setLastSessionAt(Instant.now());
            user.setTotalSessionCount(user.getTotalSessionCount() + 1);
            if (request.getMode() == SessionMode.REAL) {
                user.setRealSessionCount(user.getRealSessionCount() + 1);
            } else {
                user.setPracticeSessionCount(user.getPracticeSessionCount() + 1);
            }
            appUserRepository.save(user);
        } else if (request.getMode() == SessionMode.REAL) {
            difficulty = DifficultyLevel.HARD;
        }

        InterviewSession session = InterviewSession.builder()
                .user(user)
                .resume(resume)
                .candidateName(request.getCandidateName())
                .jobRole(request.getJobRole())
                .interviewType(request.getInterviewType())
                .interviewerGender(request.getInterviewerGender())
                .speakingSpeed(request.getSpeakingSpeed())
                .mode(request.getMode())
                .difficulty(difficulty)
                .status(SessionStatus.IN_PROGRESS)
                .startedAt(Instant.now())
                .build();

        String openingQuestion = aiInterviewService.generateOpeningQuestion(session);
        InterviewExchange exchange = InterviewExchange.builder()
                .session(session)
                .sequenceNumber(1)
                .question(openingQuestion)
                .askedAt(Instant.now())
                .reattemptCount(0)   // ✅ track reattempts
                .build();

        session.getExchanges().add(exchange);
        session = sessionRepository.save(session);

        return toDto(session, openingQuestion, "welcoming", false, false);
    }

    @Transactional
    public InterviewSessionDto submitAnswer(Long sessionId, SubmitAnswerRequest request) {
        InterviewSession session = findSession(sessionId);
        List<InterviewExchange> exchanges = session.getExchanges();

        if (exchanges.isEmpty()) {
            throw new IllegalStateException("No active question for this session");
        }

        InterviewExchange current = exchanges.get(exchanges.size() - 1);
        if (current.getAnswer() != null) {
            throw new IllegalStateException("Current question already answered");
        }

        // ── Analyze the answer ──────────────────────────────────────────────
        AnswerAnalysisDto analysis = aiInterviewService.analyzeAnswer(
                session, current.getQuestion(), request.getAnswer());

        current.setAnswer(request.getAnswer());
        current.setAnsweredAt(Instant.now());
        current.setAiFeedback(analysis.getFeedback());
        current.setAnswerConfidence(analysis.getConfidenceScore());
        current.setClarityScore(analysis.getClarityScore());
        current.setRelevanceScore(analysis.getRelevanceScore());
        current.setDetectedEmotion(analysis.getDetectedEmotion());
        // TalkPilot 10-dimension scores
        current.setTechnicalAccuracy(analysis.getTechnicalAccuracy());
        current.setCompleteness(analysis.getCompleteness());
        current.setCommunication(analysis.getCommunication());
        current.setGrammar(analysis.getGrammar());
        current.setVocabulary(analysis.getVocabulary());
        current.setFluency(analysis.getFluency());
        current.setProblemSolving(analysis.getProblemSolving());
        current.setOverall10(analysis.getOverall10());
        current.setStrengths(analysis.getStrengths());
        current.setWeaknesses(analysis.getWeaknesses());
        current.setMissingConcepts(analysis.getMissingConcepts());
        current.setSampleAnswer(analysis.getSampleAnswer());
        current.setImprovementTips(analysis.getImprovementTips());
        current.setAnswerQuality(analysis.getAnswerQuality());

        long elapsedMinutes = ChronoUnit.MINUTES.between(session.getStartedAt(), Instant.now());
        String emotion = aiInterviewService.determineInterviewerEmotion(analysis);

        // ── Check if interview should end ───────────────────────────────────
        boolean shouldComplete = elapsedMinutes >= MAX_DURATION_MINUTES
                || aiInterviewService.shouldWrapUp(session, elapsedMinutes);

        if (shouldComplete) {
            return concludeInterview(session, emotion);
        }

        boolean shouldWrapUp = elapsedMinutes >= 12;

        // ── ✅ POOR ANSWER HANDLING — re-ask same question (up to MAX_REATTEMPTS) ──
        boolean answerIsPoor = analysis.getRelevanceScore() != null
                && analysis.getRelevanceScore() < 4.0;  // relevance out of 10

        int reattempts = current.getReattemptCount() != null ? current.getReattemptCount() : 0;
        int maxReattempts = session.getMode() == SessionMode.REAL
                ? MAX_REATTEMPTS_REAL
                : MAX_REATTEMPTS_PRACTICE;

        if (answerIsPoor && reattempts < maxReattempts) {
            // Generate a rephrased version of the same question with a hint
            String rephrasedQuestion = aiInterviewService.rephraseQuestion(
                    session, current.getQuestion(), request.getAnswer(), analysis.getFeedback());

            InterviewExchange reattempt = InterviewExchange.builder()
                    .session(session)
                    .sequenceNumber(exchanges.size() + 1)
                    .question(rephrasedQuestion)
                    .askedAt(Instant.now())
                    .reattemptCount(reattempts + 1)
                    .parentQuestionId(current.getId())  // links back to original question
                    .build();

            session.getExchanges().add(reattempt);
            sessionRepository.save(session);

            // Use a gentle "clarifying" emotion so avatar looks understanding
            return toDto(session, rephrasedQuestion, "attentive", false, shouldWrapUp);
        }

        // ── ✅ GOOD ANSWER — generate context-aware next question ────────────
        String nextQuestion = aiInterviewService.generateFollowUpQuestion(
                session, request.getAnswer(), elapsedMinutes);

        InterviewExchange next = InterviewExchange.builder()
                .session(session)
                .sequenceNumber(exchanges.size() + 1)
                .question(nextQuestion)
                .askedAt(Instant.now())
                .reattemptCount(0)
                .build();

        session.getExchanges().add(next);
        sessionRepository.save(session);

        return toDto(session, nextQuestion, emotion, false, shouldWrapUp);
    }

    @Transactional
    public InterviewSessionDto concludeInterview(Long sessionId) {
        InterviewSession session = findSession(sessionId);
        if (session.getStatus() == SessionStatus.COMPLETED) {
            return toDto(session, null, "closing", true, false);
        }
        return concludeInterview(session, "closing");
    }

    @Transactional(readOnly = true)
    public InterviewSessionDto getSession(Long sessionId) {
        InterviewSession session = findSession(sessionId);
        String currentQuestion = null;
        if (session.getStatus() == SessionStatus.IN_PROGRESS && !session.getExchanges().isEmpty()) {
            InterviewExchange last = session.getExchanges().get(session.getExchanges().size() - 1);
            if (last.getAnswer() == null) currentQuestion = last.getQuestion();
        }
        return toDto(session, currentQuestion, "attentive",
                session.getStatus() == SessionStatus.COMPLETED, false);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private InterviewSessionDto concludeInterview(InterviewSession session, String emotion) {
        InterviewReportDto report = aiInterviewService.generateFullReport(session);

        session.setStatus(SessionStatus.COMPLETED);
        session.setCompletedAt(Instant.now());
        session.setOverallScore(report.getOverallScore());
        session.setConfidenceScore(report.getConfidenceScore());
        session.setCommunicationScore(report.getCommunicationScore());
        session.setTechnicalScore(report.getTechnicalScore());
        session.setReadinessPercentage(report.getReadinessPercentage());
        session.setStrengths(report.getStrengths());
        session.setWeaknesses(report.getWeaknesses());
        session.setRecommendations(report.getRecommendations());
        session.setOverallFeedback(report.getClosingStatement());
        // TalkPilot report fields
        session.setHiringRecommendation(report.getHiringRecommendation());
        session.setTechnicalAnalysis(report.getTechnicalAnalysis());
        session.setCommunicationAnalysis(report.getCommunicationAnalysis());
        session.setConfidenceAnalysis(report.getConfidenceAnalysis());
        session.setGrammarVocabularyAnalysis(report.getGrammarVocabularyAnalysis());
        session.setCommonMistakes(report.getCommonMistakes());
        session.setPersonalizedStudyPlan(report.getPersonalizedStudyPlan());
        session.setTopicsForNextPractice(report.getTopicsForNextPractice());

        sessionRepository.save(session);
        return toDto(session, null, "closing", true, false);
    }

    private InterviewSession findSession(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));
    }

    private InterviewSessionDto toDto(InterviewSession session, String currentQuestion,
                                       String emotion, boolean complete, boolean shouldWrapUp) {
        List<ExchangeDto> exchangeDtos = session.getExchanges().stream()
                .map(e -> ExchangeDto.builder()
                        .id(e.getId())
                        .sequenceNumber(e.getSequenceNumber())
                        .question(e.getQuestion())
                        .answer(e.getAnswer())
                        .aiFeedback(e.getAiFeedback())
                        .answerConfidence(e.getAnswerConfidence())
                        .clarityScore(e.getClarityScore())
                        .relevanceScore(e.getRelevanceScore())
                        .detectedEmotion(e.getDetectedEmotion())
                        .technicalAccuracy(e.getTechnicalAccuracy())
                        .completeness(e.getCompleteness())
                        .communication(e.getCommunication())
                        .grammar(e.getGrammar())
                        .vocabulary(e.getVocabulary())
                        .fluency(e.getFluency())
                        .problemSolving(e.getProblemSolving())
                        .overall10(e.getOverall10())
                        .strengths(e.getStrengths())
                        .weaknesses(e.getWeaknesses())
                        .missingConcepts(e.getMissingConcepts())
                        .sampleAnswer(e.getSampleAnswer())
                        .improvementTips(e.getImprovementTips())
                        .answerQuality(e.getAnswerQuality())
                        .build())
                .toList();

        return InterviewSessionDto.builder()
                .id(session.getId())
                .candidateName(session.getCandidateName())
                .jobRole(session.getJobRole())
                .interviewType(session.getInterviewType())
                .interviewerGender(session.getInterviewerGender())
                .speakingSpeed(session.getSpeakingSpeed())
                .mode(session.getMode())
                .difficulty(session.getDifficulty())
                .status(session.getStatus())
                .overallScore(session.getOverallScore())
                .confidenceScore(session.getConfidenceScore())
                .communicationScore(session.getCommunicationScore())
                .technicalScore(session.getTechnicalScore())
                .readinessPercentage(session.getReadinessPercentage())
                .strengths(session.getStrengths())
                .weaknesses(session.getWeaknesses())
                .recommendations(session.getRecommendations())
                .overallFeedback(session.getOverallFeedback())
                .hiringRecommendation(session.getHiringRecommendation())
                .technicalAnalysis(session.getTechnicalAnalysis())
                .communicationAnalysis(session.getCommunicationAnalysis())
                .confidenceAnalysis(session.getConfidenceAnalysis())
                .grammarVocabularyAnalysis(session.getGrammarVocabularyAnalysis())
                .commonMistakes(session.getCommonMistakes())
                .personalizedStudyPlan(session.getPersonalizedStudyPlan())
                .topicsForNextPractice(session.getTopicsForNextPractice())
                .startedAt(session.getStartedAt())
                .completedAt(session.getCompletedAt())
                .exchanges(exchangeDtos)
                .currentQuestion(currentQuestion)
                .interviewerEmotion(emotion)
                .interviewComplete(complete)
                .shouldWrapUp(shouldWrapUp)
                .build();
    }
}
