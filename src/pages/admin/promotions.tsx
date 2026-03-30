import { SEO } from "@/components/SEO";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminPromotions() {
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const handleCreatePromotion = () => {
    // Logic to create a promotion
    console.log("Promotion created:", { promoCode, discount });
  };

  return (
    <AdminLayout title="Promotions">
      <SEO title="Promotions" />
      <Card>
        <CardHeader>
          <CardTitle>Créer une promotion</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>Code promotion</Label>
          <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
          <Label>Réduction (%)</Label>
          <Input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
          />
          <Button onClick={handleCreatePromotion}>Créer</Button>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}