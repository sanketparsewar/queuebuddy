import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Navigate,
  useLocation,
} from "react-router-dom";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from "firebase/auth";
import { db, auth } from "./firebase";
import { LayoutDashboard, Clock, ArrowRight, UserPlus } from "lucide-react";
import { motion } from "motion/react";

// Components
import Navbar from "./components/Navbar";

// Pages
import RestaurantRegistration from "./pages/RestaurantRegistration";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import CustomerJoin from "./pages/CustomerJoin";

const Home = ({ user }: { user: User | null }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const checkRestaurant = async () => {
      const q = query(
        collection(db, "restaurants"),
        where("ownerUid", "==", user.uid),
        limit(1),
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const id = querySnapshot.docs[0].id;
        navigate(`/dashboard/${id}`, { replace: true });
      } else {
        navigate("/register", { replace: true });
      }
      setLoading(false);
    };

    checkRestaurant();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    const login = () => {
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider);
    };

    return (
      <div className="max-w-4xl mx-auto mt-10 sm:mt-20 px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-indigo-600 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-xl shadow-indigo-200">
            <Clock className="text-white w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-4 sm:mb-6 tracking-tight">
            Manage your queue <br />
            <span className="text-indigo-600">effortlessly.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 mb-8 sm:mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            The modern way to handle customer waitlists. Join thousands of
            restaurants providing a seamless waiting experience.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={login}
              className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3"
            >
              <LayoutDashboard className="w-5 h-5" /> Owner Login
            </button>
            <div className="flex items-center gap-2 text-gray-400 font-medium px-6 py-4">
              <UserPlus className="w-5 h-5" /> No hardware required
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
};

const AppContent = ({
  user,
  handleLogout,
}: {
  user: User | null;
  handleLogout: () => void;
}) => {
  const location = useLocation();
  const isJoinPage = location.pathname === "/join";

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {!isJoinPage && <Navbar user={user} onLogout={handleLogout} />}
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route
          path="/register"
          element={
            user ? <RestaurantRegistration /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/dashboard/:restaurantId"
          element={user ? <RestaurantDashboard /> : <Navigate to="/" replace />}
        />
        <Route path="/join" element={<CustomerJoin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <AppContent user={user} handleLogout={handleLogout} />
    </Router>
  );
};

export default App;
