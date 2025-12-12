import { redirect } from "next/navigation";

/**
 * Docs Page - Redirects to Records
 *
 * The docs listing has been consolidated into the Records page.
 * Individual documents are still accessible at /docs/[docId].
 */
export default function DocsPage() {
  redirect("/records");
}
