import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { blogPosts, BlogPost } from '../data/blogPosts'

const categories = ['Tous', ...Array.from(new Set(blogPosts.map(p => p.category)))]

function renderContent(content: string) {
  return content.split('\n\n').map((block, i) => {
    if (block.startsWith('**') && block.endsWith('**') && !block.includes('\n') && block.split('**').length === 3) {
      return (
        <h3 key={i} className="font-serif text-base font-semibold text-light mt-6 mb-2">
          {block.replace(/\*\*/g, '')}
        </h3>
      )
    }
    const parts = block.split(/(\*\*[^*]+\*\*)/)
    return (
      <p key={i} className="text-sm text-light/50 leading-relaxed">
        {parts.map((part, j) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={j} className="text-light/75 font-semibold">{part.slice(2, -2)}</strong>
            : part
        )}
      </p>
    )
  })
}

function PostCard({ post }: { post: BlogPost }) {
  const [open, setOpen] = useState(false)

  return (
    <article className="border border-gold/10 bg-dark-surface">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left p-8 flex items-start gap-6 hover:bg-dark-card/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="text-xs font-medium text-gold/50 border border-gold/15 px-2 py-0.5">
              {post.category}
            </span>
            <span className="text-xs text-light/25">{post.date}</span>
          </div>
          <h2 className="font-serif text-xl font-semibold text-light leading-snug mb-3">
            {post.title}
          </h2>
          <p className="text-sm text-light/45 leading-relaxed">{post.excerpt}</p>
        </div>
        <div className="flex-none mt-1 text-gold/35">
          {open
            ? <ChevronUp size={16} strokeWidth={1.5} />
            : <ChevronDown size={16} strokeWidth={1.5} />
          }
        </div>
      </button>

      {open && (
        <div className="px-8 pb-10 border-t border-gold/10">
          <div className="pt-8 space-y-4 max-w-2xl">
            {renderContent(post.content)}
          </div>
        </div>
      )}
    </article>
  )
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('Tous')

  const filtered = activeCategory === 'Tous'
    ? blogPosts
    : blogPosts.filter(p => p.category === activeCategory)

  return (
    <div className="min-h-screen bg-dark-bg text-light font-sans">
      {/* Header */}
      <header className="border-b border-gold/10 sticky top-0 z-40 bg-dark-bg/95 backdrop-blur-sm">
        <div className="px-6 h-16 flex items-center justify-between max-w-content mx-auto">
          <Link to="/" className="flex flex-col">
            <span className="font-serif text-lg font-semibold text-light leading-tight">
              Maître Mokadmi Sami
            </span>
            <span className="text-[10px] text-gold/60 tracking-[0.15em] uppercase">L'Architecte Juridique</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-xs text-light/35 hover:text-gold transition-colors"
          >
            <ArrowLeft size={12} strokeWidth={1.5} /> Retour au site
          </Link>
        </div>
      </header>

      <main className="px-6 py-section max-w-content mx-auto">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold/60 mb-4">Blog</p>
        <h1 className="font-serif text-heading text-light mb-4">
          Analyses & perspectives stratégiques.
        </h1>
        <p className="text-sm text-light/40 mb-12 max-w-prose-luxury leading-relaxed">
          Droit des affaires, fiscalité, intelligence artificielle — les sujets qui transforment
          l'environnement juridique des entrepreneurs.
        </p>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-12">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs font-medium px-3 py-1.5 border transition-colors ${
                activeCategory === cat
                  ? 'bg-gold text-dark-bg border-gold'
                  : 'text-light/40 border-gold/15 hover:text-gold hover:border-gold/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-px bg-gold/10">
          {filtered.map(post => <PostCard key={post.slug} post={post} />)}
        </div>

        <div className="mt-16 pt-8 border-t border-gold/10 text-center">
          <p className="text-xs text-light/20">
            © 2025 Maître Mokadmi Sami — Avocat · office@mokadmi.lawyer
          </p>
        </div>
      </main>
    </div>
  )
}
