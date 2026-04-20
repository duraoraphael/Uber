import { useState, useRef, useEffect } from 'react';
import { Sparkles, RefreshCw, Brain, AlertCircle, Key, MessageSquare, Send, Bot, User } from 'lucide-react';
import type { MonthlySummary, GoalConfig, Earning, Expense } from '../types';
import { Card, CardTitle } from './ui/Card';
import { sendChatMessage, type ChatMessage } from '../lib/groqChat';

interface Props {
  content: string | null;
  loading: boolean;
  error: string | null;
  onGenerate: (forceRefresh?: boolean) => void;
  // Chat context props
  summary: MonthlySummary;
  goals: GoalConfig;
  earnings: Earning[];
  expenses: Expense[];
}

const QUICK_QUESTIONS = [
  'Quanto preciso ganhar hoje para bater a meta?',
  'Qual meu melhor dia da semana?',
  'Estou sendo eficiente em R$/hora?',
  'Como posso reduzir meus gastos?',
];

type PanelTab = 'insights' | 'chat';

function MarkdownRenderer({ markdown }: { markdown: string }) {
  const html = markdownToHtml(markdown);
  return (
    <div
      className="prose-gemini text-sm leading-relaxed text-slate-700 dark:text-slate-200"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function markdownToHtml(md: string): string {
  let safe = md.replace(/<[^>]*>/g, '');
  let html = safe
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-slate-800 dark:text-white mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-slate-800 dark:text-white mt-5 mb-2">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-white">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-slate-600 dark:text-slate-300 mb-1">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-slate-600 dark:text-slate-300 mb-1">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
  html = html.replace(/((?:<li[^>]*>.*?<\/li>(?:<br\/>)?)+)/g, '<ul class="my-2 space-y-0.5">$1</ul>');
  html = html.replace(/<ul([^>]*)>(.*?)<\/ul>/gs, (match) => match.replace(/<br\/>/g, ''));
  return html;
}

export function InsightsPanel({ content, loading, error, onGenerate, summary, goals, earnings, expenses }: Props) {
  const hasApiKey = !!import.meta.env.VITE_GROQ_API_KEY;
  const [activeTab, setActiveTab] = useState<PanelTab>('insights');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  async function handleSendMessage(text?: string) {
    const message = (text ?? chatInput).trim();
    if (!message || chatLoading) return;
    setChatInput('');
    setChatError('');

    const userMsg: ChatMessage = { role: 'user', content: message };
    setChatHistory((h) => [...h, userMsg]);
    setChatLoading(true);

    try {
      const reply = await sendChatMessage(
        chatHistory,
        message,
        summary,
        goals,
        earnings,
        expenses,
      );
      setChatHistory((h) => [...h, { role: 'assistant', content: reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setChatError(msg);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="animate-page space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Tab bar */}
      <div className="flex rounded-2xl border border-gray-200 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-800/50 p-1 gap-1">
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'insights'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
          }`}
        >
          <Sparkles className="h-4 w-4" /> Insights IA
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
          }`}
        >
          <MessageSquare className="h-4 w-4" /> Assistente
          {chatHistory.length > 0 && (
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {/* ── INSIGHTS TAB ── */}
      {activeTab === 'insights' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle className="!mb-0">
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                Insights IA
              </span>
            </CardTitle>
            <button
              onClick={() => onGenerate(true)}
              disabled={loading || !hasApiKey}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600/20 border border-purple-500/20 px-3.5 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 transition-all hover:bg-purple-600/30 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Analisando...' : 'Gerar Insight'}
            </button>
          </div>

          {!hasApiKey && <ApiKeyWarning />}

          {loading && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-purple-200 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/5 p-4">
              <Brain className="h-8 w-8 text-purple-500 dark:text-purple-400 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">IA está analisando seus dados...</p>
                <p className="text-xs text-purple-500/70 dark:text-purple-400/60">Isso pode levar alguns segundos</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-4">
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Erro ao gerar insight</p>
                <p className="text-xs text-red-500/80 dark:text-red-400/70 mt-1">{error}</p>
                <button onClick={() => onGenerate(true)} className="mt-2 text-xs text-red-600 dark:text-red-300 underline hover:text-red-800 cursor-pointer">
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {content && !loading && (
            <div className="rounded-2xl border border-purple-200/50 dark:border-purple-500/15 bg-purple-50/50 dark:bg-purple-500/5 p-4 sm:p-5">
              <MarkdownRenderer markdown={content} />
            </div>
          )}

          {!content && !loading && !error && hasApiKey && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <Brain className="h-8 w-8 text-gray-300 dark:text-slate-600" />
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-500">Nenhum insight gerado ainda</p>
              <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">
                Clique em "Gerar Insight" para a IA analisar seus dados
              </p>
              <button
                onClick={() => onGenerate(false)}
                className="mt-4 flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-purple-500 cursor-pointer active:scale-95"
              >
                <Sparkles className="h-4 w-4" /> Gerar Primeiro Insight
              </button>
            </div>
          )}
        </Card>
      )}

      {/* ── CHAT TAB ── */}
      {activeTab === 'chat' && (
        <Card className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Assistente Financeiro</h3>
            <span className="ml-auto text-xs text-gray-400 dark:text-slate-500">
              Contexto do mês {summary.month}
            </span>
          </div>

          {!hasApiKey && <ApiKeyWarning />}

          {/* Chat messages */}
          <div className="min-h-48 max-h-80 overflow-y-auto space-y-3 mb-4 pr-1">
            {chatHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Bot className="h-10 w-10 text-gray-200 dark:text-slate-700 mb-2" />
                <p className="text-sm font-medium text-gray-500 dark:text-slate-500">
                  Pergunte sobre seus dados financeiros
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">
                  Tenho acesso a todos os seus ganhos e metas
                </p>
              </div>
            )}

            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${
                  msg.role === 'user'
                    ? 'bg-emerald-600'
                    : 'bg-purple-600 dark:bg-purple-700'
                }`}>
                  {msg.role === 'user'
                    ? <User className="h-3.5 w-3.5" />
                    : <Bot className="h-3.5 w-3.5" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-600">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-3.5 py-3">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-slate-500 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}

            {chatError && (
              <p className="text-xs text-red-600 dark:text-red-400 text-center">{chatError}</p>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick questions */}
          {chatHistory.length === 0 && hasApiKey && (
            <div className="flex flex-wrap gap-2 mb-3">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSendMessage(q)}
                  disabled={chatLoading}
                  className="rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-gray-600 dark:text-slate-400 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder={hasApiKey ? 'Pergunte algo sobre seus dados...' : 'Configure a API key para usar o chat'}
              disabled={!hasApiKey || chatLoading}
              className="flex-1 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-600 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 transition-all disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!chatInput.trim() || !hasApiKey || chatLoading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition-all hover:bg-emerald-500 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      <p className="text-center text-[10px] text-gray-400 dark:text-slate-600">
        Powered by Groq · Llama 3.3 70B • Resultados em cache por sessão
      </p>
    </div>
  );
}

function ApiKeyWarning() {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-4">
      <Key className="h-6 w-6 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">Chave da API não configurada</p>
        <p className="text-xs text-amber-600/80 dark:text-amber-400/70 leading-relaxed">
          Crie um arquivo{' '}
          <code className="bg-amber-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-amber-700 dark:text-amber-300">.env</code>{' '}
          na raiz do projeto com:
        </p>
        <pre className="mt-2 text-xs bg-gray-100 dark:bg-slate-800/80 rounded-lg p-2.5 text-emerald-600 dark:text-emerald-400 overflow-x-auto">
          VITE_GROQ_API_KEY=sua_chave_aqui
        </pre>
        <p className="text-xs text-amber-500/70 dark:text-amber-400/60 mt-2">
          Obtenha grátis em{' '}
          <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
            className="underline text-amber-600 dark:text-amber-300 hover:text-amber-800">
            console.groq.com/keys
          </a>
        </p>
      </div>
    </div>
  );
}
