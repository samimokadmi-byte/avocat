import { ArrowRight, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { blogPosts } from '../data/blogPosts'

export default function BlogSection() {
  const latest = blogPosts.slice(0, 3)

  return (
    <section id="blog" className="bg-dark-surface">
      <div className="px-6 py-section max-w-content mx-auto">
        <div className="flex items-end justify-between mb-16 gap-4 flex-wrap">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold/60 mb-4">Blog</p>
            <h2 className="font-serif text-heading text-light max-w-xl">
              Analyses & perspectives stratégiques.
            </h2>
          </div>
          <Link
            to="/blog"
            className="flex items-center gap-2 text-xs font-medium text-gold/50 hover:text-gold transition-colors flex-none border border-gold/15 px-4 py-2 hover:border-gold/30"
          >
            Tous les articles <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gold/10">
          {latest.map(post => (
            <Link
              key={post.slug}
              to="/blog"
              className="bg-dark-card p-8 flex flex-col gap-4 group hover:bg-dark-card/80 transition-colors duration-200 block"
            >
              <span className="text-xs font-medium text-gold/50 border border-gold/15 px-2 py-0.5 self-start">
                {post.category}
              </span>
              <h3 className="font-serif text-base font-semibold text-light leading-snug group-hover:text-gold transition-colors duration-200">
                {post.title}
              </h3>
              <p className="text-sm text-light/40 leading-relaxed flex-1">{post.excerpt}</p>
              <div className="flex items-center justify-between mt-2 pt-4 border-t border-gold/10">
                <div className="flex items-center gap-1.5 text-xs text-light/25">
                  <Calendar size={10} strokeWidth={1.5} />
                  {post.date}
                </div>
                <span className="text-xs text-gold/40 group-hover:text-gold transition-colors flex items-center gap-1">
                  Lire <ArrowRight size={10} strokeWidth={1.5} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
