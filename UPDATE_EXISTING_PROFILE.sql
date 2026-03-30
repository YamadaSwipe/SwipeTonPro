-- VÉRIFICATION DU PROFIL EXISTANT
-- On regarde ce qui existe déjà pour cet ID

SELECT id, email, full_name, role, created_at, updated_at
FROM profiles 
WHERE id = '29a2361d-6568-4d5f-99c6-557b971778cc';

-- Si le profil existe déjà, mettons juste à jour le rôle
UPDATE profiles 
SET role = 'super_admin', 
    full_name = 'Super Admin',
    updated_at = NOW()
WHERE id = '29a2361d-6568-4d5f-99c6-557b971778cc';

-- Vérification finale
SELECT id, email, full_name, role, created_at, updated_at
FROM profiles 
WHERE id = '29a2361d-6568-4d5f-99c6-557b971778cc';
