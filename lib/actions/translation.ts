"use server";

export async function translateText(
  text: string,
): Promise<{ success: boolean; data?: string; error?: string }> {
  if (!text || text.trim().length === 0) {
    return { success: true, data: "" };
  }

  try {
    // Use MyMemory Translation API (free, no auth required for basic use)
    // Server-side fetch avoids CORS and other client-side network issues
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|fr`,
    );

    if (!response.ok) {
      throw new Error("Translation API error");
    }

    const data = await response.json();

    if (data.responseData && data.responseData.translatedText) {
      return { success: true, data: data.responseData.translatedText };
    }

    return { success: true, data: text }; // Return original if translation fails gracefully
  } catch (error) {
    console.error("Translation error:", error);
    return { success: false, error: "Failed to translate text" };
  }
}
