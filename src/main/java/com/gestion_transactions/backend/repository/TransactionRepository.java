package com.gestion_transactions.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.gestion_transactions.backend.model.Transaction;

@Repository 
public interface TransactionRepository extends JpaRepository<Transaction, Long> {}