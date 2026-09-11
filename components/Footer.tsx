export default function Footer() {
  return (
    <footer className="border-t border-line py-10 text-sm text-muted">
      <div className="container-page flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p>© {new Date().getFullYear()} TechHulk. Cash on Delivery across Pakistan.</p>
        <p>Built with Next.js &amp; Supabase.</p>
      </div>
    </footer>
  );
}
