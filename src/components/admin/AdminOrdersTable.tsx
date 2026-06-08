import Link from "next/link";

type OrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

interface Order {
  id: string;
  tshirtColor: string;
  status: OrderStatus;
  createdAt: string;
  user: { name: string | null; email: string };
}

interface AdminOrdersTableProps {
  orders: Order[];
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function AdminOrdersTable({ orders }: AdminOrdersTableProps) {
  if (orders.length === 0) {
    return <p className="text-gray-500 text-sm">No orders found.</p>;
  }

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b text-left text-gray-600">
          <th className="pb-2 pr-4">Order ID</th>
          <th className="pb-2 pr-4">Customer</th>
          <th className="pb-2 pr-4">Color</th>
          <th className="pb-2 pr-4">Status</th>
          <th className="pb-2 pr-4">Date</th>
          <th className="pb-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id} className="border-b hover:bg-gray-50">
            <td className="py-2 pr-4 font-mono text-xs">{order.id.slice(0, 8)}…</td>
            <td className="py-2 pr-4">{order.user.name ?? order.user.email}</td>
            <td className="py-2 pr-4 capitalize">{order.tshirtColor}</td>
            <td className="py-2 pr-4">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                {order.status.replace("_", " ")}
              </span>
            </td>
            <td className="py-2 pr-4 text-gray-500">
              {new Date(order.createdAt).toLocaleDateString()}
            </td>
            <td className="py-2">
              <Link
                href={`/admin/orders/${order.id}`}
                className="text-blue-600 hover:underline"
              >
                View
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
