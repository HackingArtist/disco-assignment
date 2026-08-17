import { notFound } from "next/navigation";

const demos = {
  "1": {
    src: "/demo/1.html",
    title: "Harvest order confirmation",
  },
  "2": {
    src: "/demo/2.html",
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

  const isZoomedOut = id === "2";

  return (
    <iframe
      src={demo.src}
      title={demo.title}
      style={{
        position: "fixed",
        inset: 0,
        width: isZoomedOut ? "111.111%" : "100%",
        height: isZoomedOut ? "111.111%" : "100%",
        border: 0,
        background: "white",
        transform: isZoomedOut ? "scale(0.9)" : undefined,
        transformOrigin: "top left",
      }}
    />
  );
}
