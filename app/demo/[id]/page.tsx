import { notFound } from "next/navigation";
import { DemoTwoOffer } from "@/components/demo-two-offer";

const demos = {
  "1": {
    src: "/demo/1.html",
    title: "Harvest order confirmation",
  },
  "2": {
    src: "/demo/2-source.html",
    title: "H34W order confirmation",
  },
} as const;

type DemoId = keyof typeof demos;

export default async function DemoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const demo = demos[id as DemoId];

  if (!demo) {
    notFound();
  }

  if (id === "2") {
    return <DemoTwoOffer />;
  }

  return (
    <iframe
      src={demo.src}
      title={demo.title}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        border: 0,
        background: "white",
        transform: undefined,
        transformOrigin: "top left",
      }}
    />
  );
}
