// @ts-ignore
import pdfSource from "pdf-parse-fork";

export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    // Handle both ES module default import and CommonJS require interop
    const pdf = typeof pdfSource === "function" ? pdfSource : (pdfSource as any).default || pdfSource;
    
    if (typeof pdf !== "function") {
      throw new Error("pdf-parse-fork is not a function.");
    }

    const data = await pdf(buffer);
    return data.text || "";
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to parse PDF document.");
  }
}
