import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TrackingForm from "@/components/TrackingForm";

export default function TrackingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <TrackingForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
