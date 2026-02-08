import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownRenderer({ content }: { content: string }) {
	return (
		<div className="max-w-3xl space-y-4 text-gray-300 leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-5 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1 [&_strong]:text-white [&_strong]:font-semibold [&_a]:text-cyan-400 [&_a:hover]:text-cyan-300 [&_code]:bg-slate-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:text-gray-200 [&_pre]:bg-slate-800 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_blockquote]:border-l-2 [&_blockquote]:border-gray-600 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-400">
			<ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
		</div>
	);
}
