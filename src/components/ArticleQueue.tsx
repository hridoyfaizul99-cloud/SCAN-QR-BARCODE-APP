import React, { useState } from 'react';
import { Article } from '../types';
import { SAMPLE_ARTICLES } from '../data/sampleArticles';
import { Plus, Link as LinkIcon, FileText, Trash2, ArrowUpRight, Sparkles, Loader2, Star } from 'lucide-react';

interface ArticleQueueProps {
  articles: Article[];
  onAddArticle: (article: Article) => void;
  onRemoveArticle: (id: string) => void;
  onTogglePriority: (id: string) => void;
  onClearQueue: () => void;
  targetDurationMinutes: number;
}

export const ArticleQueue: React.FC<ArticleQueueProps> = ({
  articles,
  onAddArticle,
  onRemoveArticle,
  onTogglePriority,
  onClearQueue,
  targetDurationMinutes,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'text' | 'sample'>('sample');
  const [urlInput, setUrlInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Manual text input state
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [customCategory, setCustomCategory] = useState('Tech & Business');

  // Estimate listening time based on queued articles (~140 wpm)
  const totalWords = articles.reduce((sum, a) => sum + (a.content ? a.content.split(/\s+/).length : 0), 0);
  const estimatedQueueListenMinutes = Math.max(1, Math.round(totalWords / 140));

  const handleFetchUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsFetchingUrl(true);
    setUrlError(null);

    try {
      const res = await fetch('/api/extract-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract article from URL');
      }

      onAddArticle({
        id: 'url-' + Date.now(),
        title: data.title || 'Untitled Article',
        content: data.content || '',
        sourceUrl: urlInput.trim(),
        priority: 'normal',
        category: 'Web Article',
        estimatedReadTimeMinutes: Math.max(1, Math.round(data.content.split(/\s+/).length / 200)),
        addedAt: new Date().toISOString(),
      });

      setUrlInput('');
      setActiveTab('sample');
    } catch (err: any) {
      setUrlError(err.message || 'Error extracting URL. You can paste the article text manually.');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleAddCustomText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customContent.trim()) return;

    onAddArticle({
      id: 'text-' + Date.now(),
      title: customTitle.trim(),
      content: customContent.trim(),
      priority: 'normal',
      category: customCategory,
      estimatedReadTimeMinutes: Math.max(1, Math.round(customContent.split(/\s+/).length / 200)),
      addedAt: new Date().toISOString(),
    });

    setCustomTitle('');
    setCustomContent('');
    setActiveTab('sample');
  };

  const isArticleInQueue = (sampleId: string) => articles.some((a) => a.id === sampleId);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-800">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Today's Story Queue</h2>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
            <span>{articles.length} {articles.length === 1 ? 'story' : 'stories'} selected</span>
            <span aria-hidden="true">·</span>
            <span>Target commute: {targetDurationMinutes} min</span>
            <span aria-hidden="true">·</span>
            <span>Source depth: ~{totalWords} words</span>
          </div>
        </div>

        {articles.length > 0 && (
          <button
            onClick={onClearQueue}
            className="text-xs text-zinc-400 hover:text-red-400 transition-colors self-start sm:self-auto"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Story List in Queue */}
      {articles.length === 0 ? (
        <div className="py-8 text-center border-b border-zinc-800/80">
          <p className="text-sm text-zinc-300 font-medium">Your commute queue is currently empty</p>
          <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
            Add an article link, paste custom news, or tap one of our pre-curated trending news stories below to craft your commute broadcast.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/80 mb-6">
          {articles.map((article, index) => (
            <div key={article.id} className="py-3.5 flex items-start justify-between gap-4 group">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-xs font-mono text-zinc-400 w-5 pt-0.5">{String(index + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-zinc-200 truncate">{article.title}</h3>
                    {article.priority === 'high' && (
                      <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                        Lead
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                    <span>{article.category || 'News'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{article.content ? Math.round(article.content.split(/\s+/).length) : 0} words</span>
                    {article.sourceUrl && (
                      <>
                        <span aria-hidden="true">·</span>
                        <a
                          href={article.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-zinc-300 inline-flex items-center gap-0.5"
                        >
                          Source <ArrowUpRight className="w-2.5 h-2.5" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onTogglePriority(article.id)}
                  title={article.priority === 'high' ? 'Set as regular story' : 'Promote to lead story'}
                  className={`p-1.5 rounded-md text-xs transition-colors ${
                    article.priority === 'high'
                      ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${article.priority === 'high' ? 'fill-amber-400' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveArticle(article.id)}
                  title="Remove from queue"
                  className="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Articles Section */}
      <div className="mt-5">
        {/* Interactive Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('sample')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'sample' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Trending Stories</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'url' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Article Link</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'text' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Text</span>
          </button>
        </div>

        {/* Tab 1: Trending / Pre-curated sample stories */}
        {activeTab === 'sample' && (
          <div className="space-y-2.5">
            <p className="text-xs text-zinc-400">
              Select verified articles from today's technology, transit, and science developments:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {SAMPLE_ARTICLES.map((sample) => {
                const inQueue = isArticleInQueue(sample.id);
                return (
                  <div
                    key={sample.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      inQueue
                        ? 'bg-amber-500/5 border-amber-500/20 text-zinc-300'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-zinc-100 leading-snug truncate">
                        {sample.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
                        <span>{sample.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{sample.estimatedReadTimeMinutes} min source read</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => (inQueue ? onRemoveArticle(sample.id) : onAddArticle(sample))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                        inQueue
                          ? 'bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-700'
                          : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold'
                      }`}
                    >
                      {inQueue ? 'Queued ✓' : '+ Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: URL Input */}
        {activeTab === 'url' && (
          <form onSubmit={handleFetchUrl} className="space-y-3">
            <div>
              <label htmlFor="article-url" className="block text-xs font-medium text-zinc-300 mb-1.5">
                Paste Article or Newsletter URL
              </label>
              <div className="flex gap-2">
                <input
                  id="article-url"
                  type="url"
                  placeholder="https://example.com/news/article"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={isFetchingUrl || !urlInput.trim()}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 disabled:opacity-50 flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {isFetchingUrl ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Fetch</span>
                    </>
                  )}
                </button>
              </div>
              {urlError && <p className="text-xs text-red-400 mt-2">{urlError}</p>}
            </div>
            <p className="text-[11px] text-zinc-400">
              Our server extracts the main story content, stripping ads and sidebars.
            </p>
          </form>
        )}

        {/* Tab 3: Paste Custom Text */}
        {activeTab === 'text' && (
          <form onSubmit={handleAddCustomText} className="space-y-3">
            <div>
              <label htmlFor="custom-title" className="block text-xs font-medium text-zinc-300 mb-1">
                Headline / Title
              </label>
              <input
                id="custom-title"
                type="text"
                placeholder="e.g. Major Renewable Energy Grid Expansion Announced"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label htmlFor="custom-content" className="block text-xs font-medium text-zinc-300 mb-1">
                Article Body / Summary Text
              </label>
              <textarea
                id="custom-content"
                rows={4}
                placeholder="Paste the paragraphs of the article or newsletter you want summarized..."
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
                required
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Category:</span>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
                >
                  <option value="Tech & AI">Tech & AI</option>
                  <option value="Finance & Markets">Finance & Markets</option>
                  <option value="Clean Energy">Clean Energy</option>
                  <option value="Policy & Society">Policy & Society</option>
                  <option value="General News">General News</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!customTitle.trim() || !customContent.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 disabled:opacity-50 transition-colors"
              >
                Add Story
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
