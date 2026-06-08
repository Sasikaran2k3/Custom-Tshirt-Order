import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import OrderCanvasReplay from "./OrderCanvasReplay";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, userId: session!.user.id },
  });

  if (!order) notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Order Detail</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status]}`}>
          {order.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <OrderCanvasReplay
            color={order.tshirtColor as "white" | "black" | "navy" | "red" | "grey"}
            imageUrl={order.imageUrl}
            canvasState={order.canvasState as object}
          />
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Order ID</p>
            <p className="font-mono text-xs text-gray-500">{order.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Shirt Color</p>
            <p className="capitalize">{order.tshirtColor}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Placed</p>
            <p>{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          {order.notes && (
            <div>
              <p className="text-sm font-medium text-gray-700">Your Notes</p>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
