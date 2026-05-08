package com.gestion_transactions.backend.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestion_transactions.backend.model.Bank;
import com.gestion_transactions.backend.model.Transaction;
import com.gestion_transactions.backend.service.BankService;
import com.gestion_transactions.backend.service.TransactionService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    @Autowired
    private TransactionService transactionService;

    @Autowired
    private BankService bankService;

    @GetMapping("/logs")
    public List<Transaction> getHistory() {
        return transactionService.getAllTransactions();
    }

    @GetMapping("/banks")
    public List<Bank> listBanks() {
        return bankService.getAllBanks();
    }

    @PostMapping("/banks")
    public ResponseEntity<?> addBank(@RequestBody String requestBody) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode request = objectMapper.readTree(requestBody);
            if (request.isArray()) {
                List<Bank> banks = objectMapper.convertValue(request, new TypeReference<List<Bank>>() {});
                List<Bank> createdBanks = bankService.createMultipleBanks(banks);
                return ResponseEntity.ok(createdBanks);
            } else {
                Bank bank = objectMapper.convertValue(request, Bank.class);
                return ResponseEntity.ok(bankService.addBank(bank));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/banks/{id}")
    public ResponseEntity<?> removeBank(@PathVariable Long id) {
        try {
            bankService.removeBank(id);
            return ResponseEntity.ok("Banque désactivée avec succès.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/banks/{id}")
    public ResponseEntity<?> updateBank(@PathVariable Long id, @RequestBody Bank details) {
        try {
            return ResponseEntity.ok(bankService.updateBank(id, details));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}