import SecurityAnalyzer from "@/app/components/SecurityAnalyzer";
import Footer from "@/app/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1">
        <SecurityAnalyzer />
      </div>
      <Footer />
    </main>
  );
}