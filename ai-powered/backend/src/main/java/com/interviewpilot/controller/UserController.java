package com.interviewpilot.controller;

import com.interviewpilot.dto.LoginRequest;
import com.interviewpilot.dto.UserStatusDto;
import com.interviewpilot.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** Called on app load / whenever the user enters their email. Creates the account on first use. */
    @PostMapping("/login")
    public ResponseEntity<UserStatusDto> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.loginOrRegister(request.getEmail()));
    }
}
