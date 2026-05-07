package com.gestion_transactions.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.gestion_transactions.backend.model.User;
import com.gestion_transactions.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    public void testCreateUser() {
        User user = new User();
        user.setName("John Doe");

        // Quand on sauvegarde, on renvoie l'utilisateur
        when(userRepository.save(any(User.class))).thenReturn(user);

        User createdUser = userService.createUser(user);

        assertNotNull(createdUser);
        assertEquals("John Doe", createdUser.getName());
    }

    @Test
    public void testDeleteUser() {
        // On demande au service de supprimer l'ID 1
        userService.deleteUser(1L);

        // On vérifie que la méthode deleteById du repository a bien été appelée une fois avec l'ID 1
        verify(userRepository, times(1)).deleteById(1L);
    }
}