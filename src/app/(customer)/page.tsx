import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center">
      <h1 className="text-4xl font-bold mb-4">Design Your Custom T-Shirt</h1>
      <p className="text-gray-600 mb-8">
        Upload your artwork, pick a shirt color, position your design, and place your order.
        It&apos;s that simple.
      </p>

      {session ? (
        <div className="flex gap-4 justify-center">
          <Link
            href="/design"
            className="bg-gray-900 text-white px-6 py-3 rounded font-medium hover:bg-gray-700"
          >
            Start Designing
          </Link>
          <Link
            href="/orders"
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded font-medium hover:bg-gray-100"
          >
            My Orders
          </Link>
        </div>
      ) : (
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="bg-gray-900 text-white px-6 py-3 rounded font-medium hover:bg-gray-700"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded font-medium hover:bg-gray-100"
          >
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
