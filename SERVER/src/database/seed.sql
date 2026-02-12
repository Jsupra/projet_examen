
DELETE FROM refresh_tokens;
DELETE FROM tasks;
DELETE FROM projects;
DELETE FROM users;

-- 2. Utilisateurs (Le mot de passe pour les deux est : password123)
INSERT INTO users (username, name_display, email, role, password_hash)
VALUES 
('admin_jean', 'Jean Administrateur', 'admin@test.com', 'Administrateur', '$2b$10$EPf9XpPyX.YIuLz0lT3tOeLp0O6kH2/iJIs3D.vL5rV.p8R1PzS9i'),
('sophie_dev', 'Sophie Développeuse', 'sophie@test.com', 'Membre', '$2b$10$EPf9XpPyX.YIuLz0lT3tOeLp0O6kH2/iJIs3D.vL5rV.p8R1PzS9i');


INSERT INTO projects (title, description, owner_id)
VALUES 
(
    'Système de Gestion', 
    'Développement du backend avec PostgreSQL', 
    (SELECT id FROM users WHERE username = 'admin_jean')
);

INSERT INTO tasks (project_id, title, description, statut, assigned_to, echeance)
VALUES 
(
    (SELECT id FROM projects WHERE title = 'Système de Gestion'),
    'Création du schéma SQL',
    'Définir les types ENUM et les tables',
    'Termine',
    (SELECT id FROM users WHERE username = 'admin_jean'),
    NOW() + INTERVAL '2 days'
),
(
    (SELECT id FROM projects WHERE title = 'Système de Gestion'),
    'Développement des API',
    'Créer les routes Express pour les tâches',
    'En cours',
    (SELECT id FROM users WHERE username = 'sophie_dev'),
    NOW() + INTERVAL '7 days'
);