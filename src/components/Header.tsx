import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header className="p-4 flex items-center justify-center bg-slate-950 text-white shadow-lg">
      <Link to="/" className="flex items-center gap-1 text-2xl font-semibold">
        <img
          src="/aistack-logo.png"
          alt="AI Stack Logo"
          className="mr-2 h-10"
        />
        <span className="text-gray-300">AI</span>{' '}
        <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Stack
        </span>
      </Link>
    </header>
  )
}
