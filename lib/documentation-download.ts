/** Download commercial documentation via same-origin API (avoids CORS; uses DB id so Blob URLs are not mangled in the query string). */
export async function downloadCommercialDocumentationFile(
	documentId: string,
	fileName: string
): Promise<void> {
	const q = new URLSearchParams({
		name: fileName.trim() || "document",
	});

	const res = await fetch(
		`/api/commercial-documentation/${encodeURIComponent(documentId)}?${q.toString()}`,
		{
			credentials: "include",
		}
	);

	if (!res.ok) {
		throw new Error(`HTTP ${res.status}`);
	}

	const blob = await res.blob();
	const objectUrl = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = objectUrl;
	a.download = fileName.trim() || "document";
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(objectUrl);
}
