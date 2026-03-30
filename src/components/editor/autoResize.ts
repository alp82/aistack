export function autoResize(el: HTMLTextAreaElement): void {
	el.style.height = "auto";
	if (el.scrollHeight > 0) {
		el.style.height = `${el.scrollHeight}px`;
	}
}
