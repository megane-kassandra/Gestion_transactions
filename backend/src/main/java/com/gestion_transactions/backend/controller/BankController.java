package com.gestion_transactions.backend.controller;

import com.gestion_transactions.backend.model.Bank;
import com.gestion_transactions.backend.service.BankService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/banks")
public class BankController {

    @Autowired
    private BankService bankService;

    @GetMapping
    public List<Bank> listActiveBanks() {
        return bankService.getActiveBanks();
    }

    @GetMapping("/all")
    public List<Bank> listAllBanks() {
        return bankService.getAllBanks();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBank(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(bankService.getBankById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}