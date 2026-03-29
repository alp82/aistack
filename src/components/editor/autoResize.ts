export function autoResize(el: HTMLTextAreaElement): void {
	el.style.height = "auto";
	el.style.height = `${el.scrollHeight}px`;
}
