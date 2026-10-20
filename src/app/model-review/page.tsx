import type { Metadata } from "next";
import { ModelReview } from "@/components/ModelReview";

export const metadata: Metadata = {
  title: "Офис — проверка новой 3D-сцены",
  robots: { index: false, follow: false },
};

export default function ReviewPage() {
  return <ModelReview />;
}
