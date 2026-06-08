import { prisma } from "@/lib/prisma";
import AdminOrdersTable from "@/components/admin/AdminOrdersTable";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { auth } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const { status: statusFilter } = await searchParams;
  const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
  const resolvedStatus =
    statusFilter && validStatuses.includes(statusFilter)
      ? (statusFilter as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED")
      : undefined;

  const orders = await prisma.order.findMany({
    where: resolvedStatus ? { status: resolvedStatus } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  const serialized = orders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    canvasState: o.canvasState as object,
  }));

  const statuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

  return (
    <div>
      <Navbar userEmail={session?.user?.email} isAdmin />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">All Orders</h1>
            <div className="flex gap-2">
              <a
                href="/admin/orders"
                className={`px-3 py-1 rounded text-sm border ${!resolvedStatus ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 hover:bg-gray-50"}`}
              >
                All
              </a>
              {statuses.map((s) => (
                <a
                  key={s}
                  href={`/admin/orders?status=${s}`}
                  className={`px-3 py-1 rounded text-sm border ${resolvedStatus === s ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 hover:bg-gray-50"}`}
                >
                  {s.replace("_", " ")}
                </a>
              ))}
            </div>
          </div>

          <AdminOrdersTable orders={serialized} />
        </main>
      </div>
    </div>
  );
}
