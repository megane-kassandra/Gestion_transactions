package com.gestion_transactions.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.gestion_transactions.backend.model.Bank;

@Repository
public interface BankRepository extends JpaRepository<Bank, Long> {
    List<Bank> findByActiveTrue();
    boolean existsByCode(String code);
}