import React from "react";
import { User } from "firebase/auth";
import { Clock, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { BRANDNAME } from "../utils/constants";

const Navbar = ({
  user,
  onLogout,
}: {
  user: User | null;
  onLogout: () => void;
}) => (
  <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
    <Link to="/" className="flex items-center gap-2">
      <div className="bg-indigo-600 p-2 rounded-lg">
        <Clock className="text-white w-5 h-5" />
      </div>
      <span className="font-bold text-xl tracking-tight text-gray-900">
        {BRANDNAME}
      </span>
    </Link>
    {user && (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 hidden sm:inline">
          {user.email}
        </span>
        <button
          onClick={onLogout}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    )}
  </nav>
);

export default Navbar;
