package com.gestion_transactions.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.gestion_transactions.backend.model.Transaction;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByAccountUserId(Long userId);
    List<Transaction> findByAccountId(Long accountId);
    List<Transaction> findByBankId(Long bankId);
    List<Transaction> findByType(String type);
}