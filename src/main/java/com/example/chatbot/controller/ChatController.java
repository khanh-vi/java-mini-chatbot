package com.example.chatbot.controller;

import com.example.chatbot.service.AIService;
import com.example.chatbot.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")

public class ChatController
{
    //@Autowired
    private final AIService aiService;

    public ChatController(AIService aiService)
    {
        this.aiService = aiService;
    }

    @PostMapping("/chat")

    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request)
    {
        try {
            if (request.getMessage() == null || request.getMessage().isEmpty()) {
                return ResponseEntity.badRequest().body(new ChatResponse("Tin nhắn không được để trống."));
            }

            String reply = aiService.ask(request.getMessage());
            return ResponseEntity.ok(new ChatResponse(reply));
        } catch (Exception e) {
            e.printStackTrace(); 
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ChatResponse("Lỗi hệ thống: " + e.getMessage()));
        }
    }
}

