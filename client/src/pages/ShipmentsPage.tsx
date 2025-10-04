import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrdersTable from "@/components/OrdersTable";

export default function ShipmentsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <OrdersTable />
        </div>
      </main>
      <Footer />
    </div>
  );
}
