package com.gestion_transactions.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.gestion_transactions.backend.model.Transaction;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByAccountUserId(Long userId);
    List<Transaction> findByAccountId(Long accountId);
    List<Transaction> findByBankId(Long bankId);
    List<Transaction> findByType(String type);

    @Query("SELECT COALESCE(SUM(t.amount), 0.0) FROM Transaction t WHERE t.account.user.id = :userId AND t.bank.id = :bankId AND t.type = 'RETRAIT' AND DATE(t.date) = DATE(:today)")
    Double getTotalWithdrawalsToday(@Param("userId") Long userId, @Param("bankId") Long bankId, @Param("today") LocalDateTime today);
}