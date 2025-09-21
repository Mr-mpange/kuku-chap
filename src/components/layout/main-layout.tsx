import { Sidebar } from "./sidebar";
import { Footer } from "./footer";

interface MainLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export function MainLayout({ children, showFooter = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-72">
        <main className="min-h-screen">
          {children}
        </main>
        {showFooter && <Footer />}
      </div>
    </div>
  );
}