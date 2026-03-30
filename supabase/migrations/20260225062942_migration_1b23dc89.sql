-- Ajouter politique RLS pour que les admins puissent lire toutes les transactions
CREATE POLICY "Admins can view all transactions"
ON credit_transactions
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);