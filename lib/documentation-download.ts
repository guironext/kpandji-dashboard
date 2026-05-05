/** Download commercial documentation via same-origin API (avoids browser CORS failures on Vercel Blob). */
export async function downloadCommercialDocumentationFile(
	fileUrl: string,
	fileName: string
): Promise<void> {
	const params = new URLSearchParams({
		url: fileUrl,
		name: fileName.trim() || "document",
	});

	const res = await fetch(`/api/documentation/file?${params.toString()}`, {
		credentials: "include",
	});

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
