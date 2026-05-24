import Sidebar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <Sidebar />
      {/* Desktop: offset for 240px sidebar; Mobile: offset for 56px top bar */}
      <main className="lg:ml-60 pt-14 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
