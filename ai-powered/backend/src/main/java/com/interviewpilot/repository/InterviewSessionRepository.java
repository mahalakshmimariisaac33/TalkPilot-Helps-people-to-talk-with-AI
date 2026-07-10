package com.interviewpilot.repository;

import com.interviewpilot.model.InterviewSession;
import com.interviewpilot.model.SessionMode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    List<InterviewSession> findByUserIdOrderByStartedAtDesc(Long userId);
    List<InterviewSession> findByUserIdAndModeOrderByStartedAtDesc(Long userId, SessionMode mode);
}
