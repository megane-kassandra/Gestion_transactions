package com.gestion_transactions.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.gestion_transactions.backend.model.Bank;
import com.gestion_transactions.backend.repository.BankRepository;

@Service
public class BankService {

    @Autowired
    private BankRepository bankRepository;

    public Bank addBank(Bank bank) {
        if (bankRepository.existsByCode(bank.getCode())) {
            throw new RuntimeException("Une banque avec le code '" + bank.getCode() + "' existe déjà.");
        }
        if (bank.getDepositFee() == null) {
            bank.setDepositFee(0.0);
        }
        if (bank.getWithdrawalFee() == null) {
            bank.setWithdrawalFee(0.0);
        }
        if (bank.getDailyWithdrawalLimit() == null) {
            bank.setDailyWithdrawalLimit(10000.0);
        }
        bank.setActive(true);
        return bankRepository.save(bank);
    }

    // Désactivation douce : l'historique est conservé
    public void removeBank(Long id) {
        Bank bank = bankRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banque introuvable avec l'ID: " + id));
        bank.setActive(false);
        bankRepository.save(bank);
    }

    public Bank updateBank(Long id, Bank details) {
        Bank bank = bankRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banque introuvable avec l'ID: " + id));
        bank.setName(details.getName());
        bank.setCode(details.getCode());
        bank.setDepositFee(details.getDepositFee() != null ? details.getDepositFee() : 0.0);
        bank.setWithdrawalFee(details.getWithdrawalFee() != null ? details.getWithdrawalFee() : 0.0);
        bank.setDailyWithdrawalLimit(details.getDailyWithdrawalLimit() != null ? details.getDailyWithdrawalLimit() : 10000.0);
        return bankRepository.save(bank);
    }

    public List<Bank> getActiveBanks() {
        return bankRepository.findByActiveTrue();
    }

    public List<Bank> getAllBanks() {
        return bankRepository.findAll();
    }

    public Bank getBankById(Long id) {
        return bankRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banque introuvable avec l'ID: " + id));
    }

    public List<Bank> createMultipleBanks(List<Bank> banks) {
        for (Bank bank : banks) {
            if (bankRepository.existsByCode(bank.getCode())) {
                throw new RuntimeException("Une banque avec le code '" + bank.getCode() + "' existe déjà.");
            }
            if (bank.getDepositFee() == null) {
                bank.setDepositFee(0.0);
            }
            if (bank.getWithdrawalFee() == null) {
                bank.setWithdrawalFee(0.0);
            }
            if (bank.getDailyWithdrawalLimit() == null) {
                bank.setDailyWithdrawalLimit(10000.0);
            }
            bank.setActive(true);
        }
        return bankRepository.saveAll(banks);
    }
}