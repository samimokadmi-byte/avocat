import { ArrowRight, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { blogPosts } from '../data/blogPosts'

export default function BlogSection() {
  const latest = blogPosts.slice(0, 3)

  return (
    <section id="blog" className="bg-paper-2">
      <div className="px-8 py-16 md:py-section max-w-content mx-auto">

        {/* ── Section header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-10 md:mb-16">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-text2">[07]</span>
          <span className="w-8 h-px bg-hairline-strong flex-none" />
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-text2">Blog</span>
        </div>

        <div className="flex items-end justify-between mb-10 md:mb-16 gap-4 flex-wrap">
          <h2 className="font-display text-heading text-ink font-normal max-w-xl text-pretty">
            Analyses &{' '}
            <span className="italic text-accent">perspectives stratégiques.</span>
          </h2>
          <Link
            to="/blog"
            className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-text2 hover:text-ink border border-hairline-strong rounded-full px-4 py-2 hover:-translate-y-0.5 transition-all duration-200 flex-none"
          >
            Tous les articles <ArrowRight size={11} strokeWidth={1.5} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {latest.map(post => (
            <Link
              key={post.slug}
              to="/blog"
              className="bg-paper border border-hairline-strong p-6 md:p-8 flex flex-col gap-4 group hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200"
            >
              <span className="inline-flex items-center gap-1.5 border border-hairline rounded-full px-3 py-0.5 font-mono text-[11px] uppercase tracking-[0.06em] text-text2 self-start">
                <span className="w-1.5 h-1.5 rounded-full bg-accent flex-none" />
                {post.category}
              </span>
              <h3 className="font-display text-lg font-normal text-ink leading-snug group-hover:text-accent transition-colors duration-200">
                {post.title}
              </h3>
              <p className="text-small text-text2 leading-relaxed flex-1">{post.excerpt}</p>
              <div className="flex items-center justify-between mt-2 pt-4 border-t border-hairline">
                <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-text2">
                  <Calendar size={10} strokeWidth={1.5} />
                  {post.date}
                </div>
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text2 group-hover:text-accent transition-colors flex items-center gap-1">
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
