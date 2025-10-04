import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShipmentForm from "@/components/ShipmentForm";

export default function CreateShipmentPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <ShipmentForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
