import dynamic from "next/dynamic";
import { Suspense } from "react";

const TiptapEditor = dynamic(() => import("./TiptapEditor"), {
  ssr: false,
  loading: () => (
    <div className="border border-slate-200 rounded-lg bg-slate-50 min-h-[280px] flex items-center justify-center">
      <span className="text-slate-400 text-sm">Loading editor...</span>
    </div>
  ),
});

interface LazyTiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function LazyTiptapEditor(props: LazyTiptapEditorProps) {
  return (
    <Suspense
      fallback={
        <div className="border border-slate-200 rounded-lg bg-slate-50 min-h-[280px] flex items-center justify-center">
          <span className="text-slate-400 text-sm">Loading editor...</span>
        </div>
      }
    >
      <TiptapEditor {...props} />
    </Suspense>
  );
}
