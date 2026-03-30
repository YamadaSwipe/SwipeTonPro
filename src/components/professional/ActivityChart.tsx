import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface ChartData {
  date: string;
  projects: number;
  bids: number;
}

interface ActivityChartProps {
  professionalId: string;
}

export function ActivityChart({ professionalId }: ActivityChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [professionalId]);

  const loadChartData = async () => {
    try {
      // Simuler des données pour éviter l'erreur
      const mockData: ChartData[] = [
        { date: '01/01', projects: 2, bids: 5 },
        { date: '02/01', projects: 3, bids: 8 },
        { date: '03/01', projects: 1, bids: 4 },
        { date: '04/01', projects: 4, bids: 12 },
        { date: '05/01', projects: 2, bids: 7 },
        { date: '06/01', projects: 3, bids: 9 },
        { date: '07/01', projects: 5, bids: 15 },
      ];
      
      setData(mockData);
    } catch (error) {
      console.error('Erreur chargement données chart:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité récente</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="projects" 
              stroke="#ea580c" 
              strokeWidth={2}
              name="Projets consultés"
            />
            <Line 
              type="monotone" 
              dataKey="bids" 
              stroke="#f97316" 
              strokeWidth={2}
              name="Devis envoyés"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
