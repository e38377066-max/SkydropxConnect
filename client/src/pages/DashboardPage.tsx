import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, MapPin, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: balanceData } = useQuery<{ data: { balance: string } }>({
    queryKey: ["/api/wallet/balance"],
    enabled: !!user,
  });

  const { data: shipmentsData } = useQuery<{ data: any[] }>({
    queryKey: ["/api/shipments"],
    enabled: !!user,
  });

  const balance = balanceData?.data?.balance ?? "0";
  const shipments = shipmentsData?.data ?? [];

  const stats = [
    {
      title: "Saldo de Billetera",
      value: `$${parseFloat(balance).toFixed(2)} MXN`,
      description: "Balance disponible",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      link: "/billetera",
    },
    {
      title: "Envíos Totales",
      value: shipments.length.toString(),
      description: "Guías creadas",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      link: "/envios",
    },
    {
      title: "Direcciones Guardadas",
      value: "0",
      description: "Direcciones frecuentes",
      icon: MapPin,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      link: "/configuracion/direcciones",
    },
    {
      title: "Ahorro Total",
      value: "$0.00 MXN",
      description: "Vs. precio al público",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ];

  return (
    <div className="space-y-6" data-testid="page-dashboard">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-dashboard-title">
          Bienvenido, {user?.firstName}
        </h1>
        <p className="text-muted-foreground mt-2">
          Administra tus envíos y configuración desde tu panel de control
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover-elevate" data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`text-stat-value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
              {stat.link && (
                <Link href={stat.link}>
                  <Button variant="ghost" className="p-0 h-auto mt-2" data-testid={`link-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    Ver detalles →
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="card-quick-actions">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Accede a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/cotizar">
              <Button className="w-full justify-start" variant="outline" data-testid="button-quick-quote">
                <Package className="mr-2 h-4 w-4" />
                Cotizar Envío
              </Button>
            </Link>
            <Link href="/crear-guia">
              <Button className="w-full justify-start" variant="outline" data-testid="button-quick-create">
                <Package className="mr-2 h-4 w-4" />
                Crear Envío
              </Button>
            </Link>
            <Link href="/rastrear">
              <Button className="w-full justify-start" variant="outline" data-testid="button-quick-track">
                <MapPin className="mr-2 h-4 w-4" />
                Rastrear Paquete
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Tus últimos envíos y transacciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            {shipments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No tienes envíos aún</p>
                <p className="text-sm mt-1">Crea tu primera guía para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shipments.slice(0, 3).map((shipment: any) => (
                  <div key={shipment.id} className="flex items-center justify-between p-3 border rounded-md hover-elevate" data-testid={`shipment-${shipment.id}`}>
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{shipment.carrier}</p>
                        <p className="text-xs text-muted-foreground">
                          {shipment.trackingNumber || 'Procesando...'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${shipment.cost}</p>
                      <p className="text-xs text-muted-foreground">{shipment.status}</p>
                    </div>
                  </div>
                ))}
                {shipments.length > 3 && (
                  <Link href="/envios">
                    <Button variant="ghost" className="w-full" data-testid="link-view-all-shipments">
                      Ver todos los envíos →
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {parseFloat(balance) < 100 && (
        <Card className="border-orange-200 dark:border-orange-900" data-testid="card-low-balance-warning">
          <CardHeader>
            <CardTitle className="text-orange-600 dark:text-orange-400">
              Saldo Bajo
            </CardTitle>
            <CardDescription>
              Tu saldo está por debajo de $100 MXN
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Recarga tu billetera para poder crear envíos sin interrupciones.
            </p>
            <Link href="/billetera">
              <Button data-testid="button-recharge-wallet">
                <DollarSign className="mr-2 h-4 w-4" />
                Recargar Saldo
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
