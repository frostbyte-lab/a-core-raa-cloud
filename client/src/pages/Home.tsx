import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Database, Download, FileJson, LockKeyhole, Network, Play, Radar, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

const MAX_BYTES = 256 * 1024;
const exampleEvidence = {
  manifest: { files: ["index.html", "assets/game.js", "assets/atlas.png"] },
  integrity: true,
  errors: ["G1006: origin unavailable"],
  missingAssets: ["assets/font.woff2"],
  api: ["wss://realtime.example.test"],
  security: { protectedResources: [] },
  totalFiles: 3,
};

type Report = {
  score: number; level: string; facts: string[]; findings: Array<{ id: string; severity: string; title: string; detail: string; evidence: string; action: string }>;
  priorities: Array<{ priority: number; findingId: string; action: string }>;
  dataset?: { version: string; caseCount: number; matched: Array<{ id: string; category: string; title: string; confidence: number; action: string }> };
};

function levelTone(level?: string) {
  if (level === "STRONG") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (level === "CONDITIONAL") return "text-amber-700 bg-amber-50 border-amber-200";
  if (level === "BLOCKED") return "text-rose-700 bg-rose-50 border-rose-200";
  return "text-slate-700 bg-slate-100 border-slate-200";
}

export default function Home() {
  const [json, setJson] = useState(JSON.stringify(exampleEvidence, null, 2));
  const [editorError, setEditorError] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const { isAuthenticated } = useAuth();
  const savePrivate = trpc.araa.saveMetadata.useMutation();
  const analyze = trpc.araa.analyze.useMutation({
    onSuccess: (data) => { setReport(data as Report); setEditorError(""); },
    onError: (error) => setEditorError(error.message || "Evidence tidak dapat dianalisis."),
  });
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of report?.dataset?.matched || []) counts[item.category] = (counts[item.category] || 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [report]);

  function submit() {
    try {
      const bytes = new TextEncoder().encode(json).length;
      if (bytes > MAX_BYTES) throw new Error("Input terlalu besar. Maksimum 256 KB.");
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Evidence harus berupa object JSON.");
      analyze.mutate({ evidence: parsed });
    } catch (error) { setEditorError(error instanceof Error ? error.message : "Format JSON tidak valid."); }
  }

  function loadFile(file?: File) {
    if (!file) return;
    if (file.size > MAX_BYTES) { setEditorError("Berkas melebihi batas 256 KB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setJson(String(reader.result || "")); setEditorError(""); };
    reader.onerror = () => setEditorError("Berkas tidak dapat dibaca.");
    reader.readAsText(file);
  }

  async function savePrivateReport() {
    if (!report) return;
    if (!isAuthenticated) { startLogin(); return; }
    await savePrivate.mutateAsync({ score: report.score, level: report.level, datasetVersion: report.dataset?.version || "unknown", matchedCount: report.dataset?.matched.length || 0, findingCount: report.findings.length, reportMetadata: JSON.stringify({ facts: report.facts, matched: report.dataset?.matched.map((item) => ({ id: item.id, title: item.title, confidence: item.confidence })), findings: report.findings.map((item) => ({ id: item.id, severity: item.severity, title: item.title })), priorities: report.priorities }) });
  }

  function downloadReport() {
    if (!report) return;
    const metadata = { product: "A Core Raa Cloud", downloadedAt: new Date().toISOString(), evidenceStored: false, report };
    const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `araa-report-${Date.now()}.json`; anchor.click(); URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8fbfc] text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-0 opacity-60 [background-image:linear-gradient(#dceef0_1px,transparent_1px),linear-gradient(90deg,#dceef0_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="pointer-events-none fixed -right-28 top-24 h-72 w-72 rotate-12 rounded-[4rem] bg-teal-300/20 blur-2xl" />
      <div className="pointer-events-none fixed -left-24 bottom-10 h-80 w-80 -rotate-12 rounded-[5rem] bg-coral-300/15 blur-2xl" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <nav className="mb-12 flex items-center justify-between rounded-2xl border border-white/80 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-teal-300 shadow-lg"><Radar size={21} /></div><div><p className="text-sm font-black tracking-tight">A CORE RAA</p><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Evidence intelligence cloud</p></div></div>
          <div className="flex items-center gap-2"><Badge variant="outline" className="hidden border-emerald-200 bg-emerald-50 text-emerald-700 sm:inline-flex"><span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />Standalone engine online</Badge><Button variant="ghost" size="sm" onClick={() => document.getElementById("analyzer")?.scrollIntoView({ behavior: "smooth" })}>Open analyzer <ArrowUpRight size={15} /></Button></div>
        </nav>

        <section className="grid items-center gap-10 pb-14 lg:grid-cols-[1.1fr_.9fr]">
          <div><Badge className="mb-5 border-0 bg-teal-100 text-teal-800 hover:bg-teal-100"><Sparkles size={14} className="mr-1.5" /> Deterministic / evidence-bound</Badge><h1 className="max-w-3xl text-4xl font-black leading-[1.04] tracking-[-0.04em] sm:text-6xl">Lihat struktur masalah game web dengan <span className="text-teal-600">lebih jernih.</span></h1><p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">A Core Raa mengubah evidence menjadi skor readiness, sinyal risiko, dan rekomendasi yang dapat diaudit—tanpa mengeksekusi URL dan tanpa mengirim evidence ke model AI eksternal.</p><div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => document.getElementById("analyzer")?.scrollIntoView({ behavior: "smooth" })} className="bg-slate-950 text-white hover:bg-slate-800"><Play size={16} className="mr-2" /> Mulai analisis</Button><Button variant="outline" onClick={() => setJson(JSON.stringify(exampleEvidence, null, 2))}><FileJson size={16} className="mr-2" /> Muat contoh</Button></div></div>
          <div className="relative mx-auto w-full max-w-md"><div className="absolute -left-5 top-14 h-40 w-40 -rotate-12 rounded-3xl border border-teal-300/50 bg-teal-200/35 shadow-xl backdrop-blur-md" /><div className="absolute -right-4 bottom-5 h-44 w-44 rotate-12 rounded-[2.5rem] border border-coral-300/50 bg-coral-200/30 shadow-xl backdrop-blur-md" /><Card className="relative border-white/80 bg-white/80 shadow-2xl backdrop-blur-xl"><CardContent className="p-6"><div className="mb-7 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Readiness pulse</p><p className="mt-1 text-2xl font-black">Evidence map</p></div><ShieldCheck className="text-teal-600" /></div><div className="grid grid-cols-3 gap-3"><div className="rounded-2xl bg-slate-950 p-4 text-white"><p className="text-[10px] uppercase text-slate-400">Rules</p><p className="mt-2 text-2xl font-black">08</p></div><div className="rounded-2xl bg-teal-50 p-4 text-teal-900"><p className="text-[10px] uppercase text-teal-600">Cases</p><p className="mt-2 text-2xl font-black">20</p></div><div className="rounded-2xl bg-coral-50 p-4 text-coral-900"><p className="text-[10px] uppercase text-coral-600">Raw save</p><p className="mt-2 text-2xl font-black">OFF</p></div></div><div className="mt-5 space-y-3"><div className="h-2 rounded-full bg-slate-100"><div className="h-2 w-[78%] rounded-full bg-gradient-to-r from-teal-500 to-blue-500" /></div><div className="flex justify-between text-xs text-slate-500"><span>Observe</span><span>Verify</span><span>Explain</span></div></div></CardContent></Card></div>
        </section>

        <section id="analyzer" className="grid scroll-mt-5 gap-6 lg:grid-cols-[.92fr_1.08fr]"><Card className="border-white/80 bg-white/85 shadow-xl backdrop-blur-xl"><CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2 text-xl"><FileJson className="text-teal-600" /> Evidence input</CardTitle><p className="mt-1 text-sm text-slate-500">Tempel JSON atau unggah file. Tidak ada URL yang dipanggil otomatis.</p></div><Badge variant="outline">maks. 256 KB</Badge></div></CardHeader><CardContent><Textarea value={json} onChange={(e) => { setJson(e.target.value); setEditorError(""); }} className="min-h-[360px] resize-y rounded-2xl border-slate-200 bg-slate-950 font-mono text-xs leading-6 text-teal-100 shadow-inner focus-visible:ring-teal-500" spellCheck={false} aria-label="JSON evidence editor" /><div className="mt-3 flex flex-wrap gap-2"><label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold transition hover:border-teal-300"><Upload size={14} className="mr-2 text-teal-600" /> Unggah JSON<input type="file" accept="application/json,.json" className="hidden" onChange={(e) => loadFile(e.target.files?.[0])} /></label><Button variant="outline" size="sm" onClick={() => setJson(JSON.stringify(exampleEvidence, null, 2))}>Contoh evidence</Button><Button size="sm" className="ml-auto bg-teal-600 hover:bg-teal-700" onClick={submit} disabled={analyze.isPending}><Play size={14} className="mr-2" />{analyze.isPending ? "Menganalisis…" : "Analisis sekarang"}</Button></div>{editorError && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertTriangle size={15} className="mr-2 inline" />{editorError}</div>}<div className="mt-5 grid gap-3 text-xs text-slate-500 sm:grid-cols-3"><div className="flex gap-2"><LockKeyhole size={15} className="shrink-0 text-teal-600" />Redaction sensitif</div><div className="flex gap-2"><Database size={15} className="shrink-0 text-blue-600" />No raw evidence save</div><div className="flex gap-2"><Network size={15} className="shrink-0 text-coral-600" />No auto-fetch</div></div></CardContent></Card>

          <Card className="border-white/80 bg-white/85 shadow-xl backdrop-blur-xl"><CardHeader><div className="flex items-center justify-between"><div><CardTitle className="text-xl">Analysis report</CardTitle><p className="mt-1 text-sm text-slate-500">Temuan terstruktur dengan alasan dan tindakan aman.</p></div>{report && <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={downloadReport}><Download size={14} className="mr-2" />Unduh metadata</Button><Button variant="outline" size="sm" onClick={savePrivateReport} disabled={savePrivate.isPending}><LockKeyhole size={14} className="mr-2" />{savePrivate.isPending ? "Menyimpan…" : "Simpan privat"}</Button></div>}</div></CardHeader><CardContent>{!report ? <div className="grid min-h-[460px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center"><div><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-100 text-teal-700"><Radar /></div><h3 className="mt-4 font-bold">Belum ada laporan</h3><p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">Gunakan contoh evidence atau masukkan hasil audit Anda untuk memulai.</p></div></div> : <div className="space-y-5"><div className="flex flex-wrap items-center gap-5 rounded-2xl bg-slate-950 p-5 text-white"><div className="relative grid h-28 w-28 place-items-center rounded-full" style={{ background: `conic-gradient(#2dd4bf ${report.score * 3.6}deg, #263244 0deg)` }}><div className="grid h-20 w-20 place-items-center rounded-full bg-slate-950"><span className="text-3xl font-black">{report.score}</span></div></div><div><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Readiness score</p><p className="mt-1 text-2xl font-black">{report.level}</p><p className="mt-1 text-xs text-slate-400">Dataset v{report.dataset?.version} · {report.dataset?.caseCount} kasus</p></div></div><div className="grid gap-3 sm:grid-cols-2">{categoryCounts.map(([category, count]) => <div key={category} className="rounded-xl border border-slate-100 bg-white p-3"><div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500"><span>{category}</span><span>{count} signal</span></div><div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-gradient-to-r from-teal-400 to-blue-500" style={{ width: `${Math.min(100, count * 24)}%` }} /></div></div>)}</div><div className="flex flex-wrap gap-2">{report.dataset?.matched.map((item) => <Badge key={item.id} variant="outline" className="border-teal-200 bg-teal-50 text-teal-800">{item.title} · {Math.round(item.confidence * 100)}%</Badge>)}</div><div className="space-y-3">{report.findings.map((item) => <div key={item.id} className={`rounded-xl border p-4 ${levelTone(item.severity === "blocked" ? "BLOCKED" : "WEAK")}`}><div className="flex gap-3"><AlertTriangle size={17} className="mt-0.5 shrink-0" /><div><p className="font-bold">{item.title}</p><p className="mt-1 text-sm opacity-90">{item.detail}</p><p className="mt-2 text-xs"><b>Bukti:</b> {item.evidence || "Tidak ada detail tambahan"}</p><p className="mt-1 text-xs"><b>Tindakan:</b> {item.action}</p></div></div></div>)}</div>{report.findings.length === 0 && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={18} /> Tidak ada temuan aktif pada evidence ini.</div>}</div>}</CardContent></Card></section>

        <section className="mt-14 grid gap-4 pb-8 sm:grid-cols-3"><div className="rounded-2xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur"><p className="text-sm font-black">01 · Observe</p><p className="mt-2 text-sm leading-6 text-slate-500">Baca evidence yang Anda berikan, tanpa mengambil resource atau menjalankan URL.</p></div><div className="rounded-2xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur"><p className="text-sm font-black">02 · Correlate</p><p className="mt-2 text-sm leading-6 text-slate-500">Cocokkan sinyal dengan dataset lokal dan aturan deterministic yang dapat diaudit.</p></div><div className="rounded-2xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur"><p className="text-sm font-black">03 · Explain</p><p className="mt-2 text-sm leading-6 text-slate-500">Tampilkan confidence, bukti pendukung, risiko, dan rekomendasi aman.</p></div></section>
        <footer className="flex flex-col justify-between gap-3 border-t border-slate-200/80 py-6 text-xs text-slate-500 sm:flex-row"><span>A Core Raa Cloud · standalone evidence intelligence</span><span>Evidence mentah tidak disimpan secara default · engine bukan model AI eksternal</span></footer>
      </div>
    </main>
  );
}
