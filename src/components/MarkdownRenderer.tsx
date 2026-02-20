import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownRenderer({ content }: { content: string }) {
	return (
		<div className="max-w-3xl space-y-6 text-fg-secondary text-base leading-loose tracking-wide [&_h1]:text-3xl [&_h1]:font-black [&_h1]:text-fg-primary [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:tracking-tight [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-fg-primary [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:tracking-tight [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-fg-primary [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:tracking-tight [&_p]:text-fg-secondary [&_p]:font-medium [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_li]:text-fg-secondary [&_li]:font-medium [&_strong]:text-fg-primary [&_strong]:font-bold [&_a]:text-accent-lime [&_a:hover]:text-accent-lime-strong [&_a]:font-semibold [&_code]:bg-bg-panel [&_code]:px-2 [&_code]:py-1 [&_code]:text-sm [&_code]:text-fg-primary [&_code]:font-mono [&_pre]:bg-bg-panel [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-stroke-strong [&_blockquote]:border-l-4 [&_blockquote]:border-accent-lime [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-fg-muted">
			<ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
		</div>
	);
}
