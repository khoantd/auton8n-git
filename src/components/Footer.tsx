import { Link } from "react-router-dom";

const footerLinks = [
  { to: "/product", label: "Product" },
  { to: "/use-cases", label: "Use Cases" },
  { to: "/feedback", label: "Feedback" },
];

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-xl mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Discover and share workflow automation templates</p>
          <nav className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-4 pt-4 border-t border-border/50 text-center sm:text-left text-xs text-muted-foreground">
          © {year} n8n workflow templates
        </div>
      </div>
    </footer>
  );
};
