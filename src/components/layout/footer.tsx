import { Link } from "react-router-dom";
import { Github, Mail, Twitter } from "lucide-react";
import chickenIcon from "@/assets/chicken-icon.png";

export function Footer() {
  return (
    <footer className="border-t bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img src={chickenIcon} alt="ChickTrack" className="h-6 w-6" />
              <span className="font-semibold text-primary">ChickTrack</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Data-driven tools for modern chicken farms.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              <li><Link to="/batches" className="hover:text-foreground transition-colors">Batches</Link></li>
              <li><Link to="/logs" className="hover:text-foreground transition-colors">Daily Logs</Link></li>
              <li><Link to="/reports" className="hover:text-foreground transition-colors">Reports</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#about" className="hover:text-foreground transition-colors">About</a></li>
              <li><a href="#careers" className="hover:text-foreground transition-colors">Careers</a></li>
              <li><a href="#blog" className="hover:text-foreground transition-colors">Blog</a></li>
              <li><Link to="/settings" className="hover:text-foreground transition-colors">Settings</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Contact</h4>
            <div className="flex items-center gap-3 text-muted-foreground">
              <a aria-label="Twitter" href="#" className="hover:text-foreground"><Twitter className="h-4 w-4" /></a>
              <a aria-label="GitHub" href="#" className="hover:text-foreground"><Github className="h-4 w-4" /></a>
              <a aria-label="Email" href="mailto:support@chicktrack.app" className="hover:text-foreground"><Mail className="h-4 w-4" /></a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} ChickTrack. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="#privacy" className="hover:text-foreground">Privacy</a>
            <a href="#terms" className="hover:text-foreground">Terms</a>
            <a href="#cookies" className="hover:text-foreground">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
