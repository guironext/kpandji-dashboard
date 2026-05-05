/** Download commercial documentation (same-origin API with Content-Disposition: attachment). */

function downloadApiPath(documentId: string, fileName: string): string {
	const q = new URLSearchParams({
		name: fileName.trim() || "document",
	});
	return `/api/commercial-documentation/${encodeURIComponent(documentId)}?${q.toString()}`;
}

/**
 * In-app browsers (LINE, Facebook, Instagram, WeChat, etc.) often block
 * fetch → Blob → programmatic <a download>. Opening the API URL directly works better.
 */
function shouldUseNavigationDownload(): boolean {
	if (typeof navigator === "undefined") return false;
	const ua = navigator.userAgent;
	return (
		/\bLine\//i.test(ua) ||
		/\bLIFF\b/i.test(ua) ||
		/FBAN|FBAV|FB_IAB/i.test(ua) ||
		/Instagram/i.test(ua) ||
		/MicroMessenger/i.test(ua) ||
		/KAKAOTALK/i.test(ua)
	);
}

/** Open download URL; LINE often blocks popups, so fall back to same-tab navigation. */
function navigateToAttachmentDownload(absoluteUrl: string): void {
	const w = window.open(absoluteUrl, "_blank", "noopener,noreferrer");
	if (!w || w.closed) {
		window.location.assign(absoluteUrl);
	}
}

export async function downloadCommercialDocumentationFile(
	documentId: string,
	fileName: string
): Promise<void> {
	const path = downloadApiPath(documentId, fileName);
	const absoluteUrl = `${window.location.origin}${path}`;

	if (shouldUseNavigationDownload()) {
		navigateToAttachmentDownload(absoluteUrl);
		return;
	}

	let res: Response;
	try {
		res = await fetch(path, { credentials: "include" });
	} catch {
		navigateToAttachmentDownload(absoluteUrl);
		return;
	}

	if (!res.ok) {
		navigateToAttachmentDownload(absoluteUrl);
		return;
	}

	try {
		const blob = await res.blob();
		const objectUrl = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = objectUrl;
		a.download = fileName.trim() || "document";
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(objectUrl);
	} catch {
		navigateToAttachmentDownload(absoluteUrl);
	}
}
