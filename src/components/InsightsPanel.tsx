import { Sparkles, RefreshCw, Brain, AlertCircle, Key } from 'lucide-react';
import { Card, CardTitle } from './ui/Card';

interface Props {
  content: string | null;
  loading: boolean;
  error: string | null;
  onGenerate: (forceRefresh?: boolean) => void;
}

function MarkdownRenderer({ markdown }: { markdown: string }) {
  const html = markdownToHtml(markdown);
  return (
    <div
      className="prose-gemini text-sm text-slate-200 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function markdownToHtml(md: string): string {
  // Sanitize: strip HTML tags from source to prevent XSS
  let safe = md.replace(/<[^>]*>/g, '');

  let html = safe
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-white mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-white mt-5 mb-2">$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-slate-300 mb-1">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-slate-300 mb-1">$1</li>')
    // Line breaks  
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li[^>]*>.*?<\/li>(?:<br\/>)?)+)/g, '<ul class="my-2 space-y-0.5">$1</ul>');
  // Remove stray <br/> inside <ul>
  html = html.replace(/<ul([^>]*)>(.*?)<\/ul>/gs, (match) =>
    match.replace(/<br\/>/g, ''),
  );

  return html;
}

export function InsightsPanel({ content, loading, error, onGenerate }: Props) {
  const hasApiKey = !!import.meta.env.VITE_GROQ_API_KEY;

  return (
    <div className="animate-page space-y-4 sm:space-y-5 lg:space-y-6">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle className="!mb-0">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Insights IA
            </span>
          </CardTitle>
          <button
            onClick={() => onGenerate(true)}
            disabled={loading || !hasApiKey}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600/20 border border-purple-500/20 px-3.5 py-2 text-xs font-semibold text-purple-300 transition-all hover:bg-purple-600/30 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analisando...' : 'Gerar Insight'}
          </button>
        </div>

        {/* API Key missing */}
        {!hasApiKey && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <Key className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300 mb-1">Chave da API não configurada</p>
              <p className="text-xs text-amber-400/70 leading-relaxed">
                Crie um arquivo <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">.env</code> na raiz do projeto com:
              </p>
              <pre className="mt-2 text-xs bg-slate-800/80 rounded-lg p-2.5 text-emerald-400 overflow-x-auto">
                VITE_GROQ_API_KEY=sua_chave_aqui
              </pre>
              <p className="text-xs text-amber-400/60 mt-2">
                Obtenha grátis em{' '}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-amber-300 hover:text-amber-200"
                >
                  console.groq.com/keys
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 animate-page">
            <Brain className="h-8 w-8 text-purple-400 animate-pulse" />
            <div>
              <p className="text-sm font-medium text-purple-300">IA está analisando seus dados...</p>
              <p className="text-xs text-purple-400/60">Isso pode levar alguns segundos</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-300">Erro ao gerar insight</p>
              <p className="text-xs text-red-400/70 mt-1">{error}</p>
              <button
                onClick={() => onGenerate(true)}
                className="mt-2 text-xs text-red-300 underline hover:text-red-200 cursor-pointer"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {content && !loading && (
          <div className="rounded-2xl border border-purple-500/15 bg-purple-500/3 p-4 sm:p-5">
            <MarkdownRenderer markdown={content} />
          </div>
        )}

        {/* Empty state */}
        {!content && !loading && !error && hasApiKey && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700">
              <Brain className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-sm text-slate-500">Nenhum insight gerado ainda</p>
            <p className="text-xs text-slate-600 mt-1">
              Clique em "Gerar Insight" para a IA analisar seus dados
            </p>
            <button
              onClick={() => onGenerate(false)}
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-purple-500 cursor-pointer active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              Gerar Primeiro Insight
            </button>
          </div>
        )}
      </Card>

      <p className="text-center text-[10px] text-slate-600">
        Powered by Groq · Llama 3.3 70B • Resultados em cache por sessão
      </p>
    </div>
  );
}
