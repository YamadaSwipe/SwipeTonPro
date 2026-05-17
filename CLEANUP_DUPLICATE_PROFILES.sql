-- =====================================================
-- NETTOYAGE DES PROFILS DUPLIQUÉS ADMIN
-- =====================================================
-- Ce script supprime le profil par défaut (UUID 0000...)
-- et garde le profil réel (UUID 29a2...)

-- 1. Vérifier les profils dupliqués
SELECT 
  'PROFILS DUPLIQUÉS' as section,
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at
FROM profiles p
WHERE p.email = 'admin@swipetonpro.fr'
ORDER BY p.created_at;

-- 2. Vérifier si le profil par défaut existe
SELECT 
  'PROFIL À SUPPRIMER' as section,
  p.id,
  p.email,
  p.full_name,
  p.role
FROM profiles p
WHERE p.id = '00000000-0000-0000-0000-000000000001';

-- 3. Vérifier si le profil réel existe
SELECT 
  'PROFIL À GARDER' as section,
  p.id,
  p.email,
  p.full_name,
  p.role
FROM profiles p
WHERE p.id = '29a2361d-6568-4d5f-99c6-557b971778cc';

-- 4. Supprimer le profil par défaut (UUID 0000...)
-- ⚠️ CONFIRMATION REQUISE AVANT D'EXÉCUTER
DELETE FROM profiles
WHERE id = '00000000-0000-0000-0000-000000000001'
AND email = 'admin@swipetonpro.fr';

-- 5. Vérification après suppression
SELECT 
  '✅ NETTOYAGE TERMINÉ' as status,
  COUNT(*) as nombre_profils_restants,
  p.id,
  p.email,
  p.full_name,
  p.role
FROM profiles p
WHERE p.email = 'admin@swipetonpro.fr'
GROUP BY p.id, p.email, p.full_name, p.role;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ NETTOYAGE DES PROFILS DUPLIQUÉS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📧 Email: admin@swipetonpro.fr';
  RAISE NOTICE '🗑️ Profil supprimé: 00000000-0000-0000-0000-000000000001';
  RAISE NOTICE '✅ Profil conservé: 29a2361d-6568-4d5f-99c6-557b971778cc';
  RAISE NOTICE '========================================';
END;
$$;
