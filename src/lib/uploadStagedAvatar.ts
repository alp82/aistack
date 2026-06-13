/**
 * Deferred upload of a staged guest avatar.
 *
 * Signed-out users stage their avatar as a compact JPEG data URL inside the
 * localStorage draft (the DB never stores a data URL). After sign-up, the
 * authed save converts that data URL back to a Blob and pushes it through the
 * same Convex storage upload sequence the signed-in AvatarEditor uses, then
 * returns the canonical storage URL.
 */

type UploadStagedAvatarDeps = {
	generateUploadUrl: () => Promise<string>;
	getFileUrl: (args: { storageId: string }) => Promise<string | null>;
	fetch?: typeof fetch;
};

export function isDataUrl(s: string): boolean {
	return s.startsWith("data:");
}

function dataUrlToBlob(dataUrl: string): Blob {
	const [header, data] = dataUrl.split(",", 2);
	const mimeMatch = header.match(/^data:([^;]+)/);
	const mimeType = mimeMatch?.[1] ?? "application/octet-stream";
	const binary = atob(data ?? "");
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return new Blob([bytes], { type: mimeType });
}

export async function uploadStagedAvatar(
	dataUrl: string,
	deps: UploadStagedAvatarDeps,
): Promise<string> {
	const doFetch = deps.fetch ?? fetch;

	const blob = dataUrlToBlob(dataUrl);

	const uploadUrl = await deps.generateUploadUrl();
	const response = await doFetch(uploadUrl, {
		method: "POST",
		headers: { "Content-Type": blob.type },
		body: blob,
	});

	if (!response.ok) {
		throw new Error("Failed to upload staged avatar");
	}

	const { storageId } = await response.json();
	const url = await deps.getFileUrl({ storageId });

	if (!url) {
		throw new Error("Failed to resolve uploaded avatar URL");
	}

	return url;
}
