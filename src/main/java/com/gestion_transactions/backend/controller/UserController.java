package com.gestion_transactions.backend.controller;

import com.gestion_transactions.backend.model.Bank;
import com.gestion_transactions.backend.model.User;
import com.gestion_transactions.backend.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<?> addUser(@io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Objet User ou tableau de Users",
            content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = User.class)),
                    @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = User.class)))
            }
    ) @RequestBody String requestBody) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode request = objectMapper.readTree(requestBody);
            if (request.isArray()) {
                List<User> users = objectMapper.convertValue(request, new TypeReference<List<User>>() {});
                List<User> createdUsers = userService.createMultipleUsers(users);
                return ResponseEntity.ok(createdUsers);
            } else {
                User user = objectMapper.convertValue(request, User.class);
                user = userService.createUser(user);
                return ResponseEntity.ok(user);
            }
        } catch (Exception e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    @GetMapping
    public List<User> listUsers() {
        return userService.getAllUsers();
    }

    @PostMapping("/{userId}/banks/{bankId}")
    public ResponseEntity<?> addBankToUser(@PathVariable Long userId, @PathVariable Long bankId) {
        try {
            return ResponseEntity.ok(userService.addBankToUser(userId, bankId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{userId}/banks/{bankId}")
    public ResponseEntity<?> removeBankFromUser(@PathVariable Long userId, @PathVariable Long bankId) {
        try {
            return ResponseEntity.ok(userService.removeBankFromUser(userId, bankId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{userId}/banks")
    public ResponseEntity<Set<Bank>> getBanksForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getBanksForUser(userId));
    }

}