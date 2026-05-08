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

    @PostMapping
    public ResponseEntity<?> addBank(@RequestBody Object request) {
        try {
            if (request instanceof List) {
                @SuppressWarnings("unchecked")
                List<Bank> banks = (List<Bank>) request;
                List<Bank> createdBanks = bankService.createMultipleBanks(banks);
                return ResponseEntity.ok(createdBanks);
            } else {
                Bank bank = (Bank) request;
                return ResponseEntity.ok(bankService.addBank(bank));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBank(@PathVariable Long id, @RequestBody Bank details) {
        try {
            return ResponseEntity.ok(bankService.updateBank(id, details));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deactivateBank(@PathVariable Long id) {
        try {
            bankService.removeBank(id);
            return ResponseEntity.ok("Banque désactivée avec succès.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}