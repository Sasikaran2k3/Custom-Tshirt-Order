import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import StatusUpdateDropdown from "@/components/admin/StatusUpdateDropdown";
import OrderCanvasReplay from "@/app/(customer)/orders/[id]/OrderCanvasReplay";
import Link from "next/link";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!order) notFound();

  return (
    <div>
      <Navbar userEmail={session?.user?.email} isAdmin />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/admin/orders" className="text-blue-600 hover:underline text-sm">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold">Order Detail</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="font-semibold mb-3">Preview</h2>
              <OrderCanvasReplay
                color={order.tshirtColor as "white" | "black" | "navy" | "red" | "grey"}
                imageUrl={order.imageUrl}
                canvasState={order.canvasState as object}
              />
              <a
                href={order.imageUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
              >
                Download Design PNG
              </a>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded border">
                <h2 className="font-semibold mb-3">Customer Info</h2>
                <p className="text-sm"><span className="font-medium">Name:</span> {order.user.name ?? "—"}</p>
                <p className="text-sm"><span className="font-medium">Email:</span> {order.user.email}</p>
                <p className="text-sm"><span className="font-medium">Color:</span> <span className="capitalize">{order.tshirtColor}</span></p>
                <p className="text-sm"><span className="font-medium">Order ID:</span> <span className="font-mono text-xs">{order.id}</span></p>
                <p className="text-sm"><span className="font-medium">Placed:</span> {order.createdAt.toLocaleString()}</p>
                {order.notes && (
                  <p className="text-sm"><span className="font-medium">Customer Notes:</span> {order.notes}</p>
                )}
              </div>

              <div className="bg-white p-4 rounded border">
                <h2 className="font-semibold mb-3">Update Order</h2>
                <StatusUpdateDropdown
                  orderId={order.id}
                  currentStatus={order.status}
                  adminNotes={order.adminNotes}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
