"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

interface NavbarProps {
  userEmail?: string | null;
  isAdmin?: boolean;
}

export default function Navbar({ userEmail, isAdmin }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg text-gray-900">
        CustomTee
      </Link>

      <div className="flex items-center gap-4">
        {userEmail ? (
          <>
            <Link href="/design" className="text-sm text-gray-700 hover:text-gray-900">
              Design
            </Link>
            <Link href="/orders" className="text-sm text-gray-700 hover:text-gray-900">
              My Orders
            </Link>
            {isAdmin && (
              <Link href="/admin/orders" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                Admin
              </Link>
            )}
            <span className="text-sm text-gray-500">{userEmail}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm text-gray-700 hover:text-gray-900">
              Login
            </Link>
            <Link
              href="/register"
              className="text-sm bg-gray-900 text-white px-3 py-1 rounded hover:bg-gray-700"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
