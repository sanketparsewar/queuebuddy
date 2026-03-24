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
import {
  LayoutDashboard,
  Clock,
  ArrowRight,
  UserPlus,
  Smartphone,
  Users,
  BarChart3,
  Zap,
  CheckCircle2,
  Heart,
  Instagram,
  Twitter,
  Facebook,
} from "lucide-react";
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

    const features = [
      {
        icon: <Smartphone className="w-6 h-6 text-indigo-600" />,
        title: "No App Required",
        description:
          "Customers join the queue by simply scanning a QR code. No downloads, no friction.",
      },
      {
        icon: <Zap className="w-6 h-6 text-indigo-600" />,
        title: "Instant Queue Entry",
        description:
          "Automate your waitlist entry. No more writing names on paper or shouting in the crowd.",
      },
      {
        icon: <Users className="w-6 h-6 text-indigo-600" />,
        title: "Staff Efficiency",
        description:
          "Reduce front-of-house chaos and let your staff focus on providing great service.",
      },
      {
        icon: <BarChart3 className="w-6 h-6 text-indigo-600" />,
        title: "Crowd Management",
        description:
          "Easily manage waiting crowds with a digital dashboard that keeps everyone organized.",
      },
    ];

    const benefits = [
      "Lessen manual work by automating queue entry",
      "Easy to manage waiting crowds during peak hours",
      "Improve table turnover with better queue visibility",
      "Enhance customer satisfaction with a modern experience",
    ];

    return (
      <div className="flex flex-col min-h-screen">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto mt-10 sm:mt-20 px-4 sm:px-6 text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-indigo-600 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-xl shadow-indigo-200">
              <Clock className="text-white w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h1 className="text-4xl sm:text-7xl font-black text-gray-900 mb-4 sm:mb-6 tracking-tight leading-tight">
              Manage your queue <br />
              <span className="text-indigo-600">effortlessly.</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 mb-8 sm:mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
              The modern way to handle customer waitlists. Lessen manual work
              and manage waiting crowds with ease.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={login}
                className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 group"
              >
                <LayoutDashboard className="w-5 h-5" /> Get Started Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-2 text-gray-400 font-medium px-6 py-4">
                <CheckCircle2 className="w-5 h-5 text-green-500" /> No apps, no
                setup, no hassle
              </div>
            </div>
          </motion.div>
        </div>

        {/* Product Showcase - Mock Screenshots */}
        <div className="bg-gray-100 py-24 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                See it in action
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                A simple interface for you, a seamless experience for your
                guests.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Dashboard Mockup */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-indigo-600/10 rounded-[2.5rem] blur-2xl"></div>
                <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="mx-auto text-xs font-bold text-gray-400 tracking-widest uppercase">
                      Restaurant Dashboard
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center mb-6">
                      <div className="h-8 w-32 bg-gray-100 rounded-lg"></div>
                      <div className="h-10 w-10 bg-indigo-600 rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-20 bg-gray-50 rounded-2xl border border-gray-100 p-3"
                        >
                          <div className="h-3 w-12 bg-gray-200 rounded mb-2"></div>
                          <div className="h-6 w-8 bg-indigo-100 rounded"></div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center font-bold text-indigo-600">
                              #{i}
                            </div>
                            <div>
                              <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                              <div className="h-3 w-16 bg-gray-100 rounded"></div>
                            </div>
                          </div>
                          <div className="h-8 w-20 bg-indigo-600 rounded-xl"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 hidden sm:block">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase">
                        Status
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        Queue Active
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Customer Token Mockup */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex justify-center lg:justify-start"
              >
                <div className="relative w-72 h-[580px] bg-indigo-600 rounded-[3rem] p-3 shadow-2xl border-[8px] border-gray-900">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-20"></div>
                  <div className="relative h-full w-full bg-white rounded-[2.2rem] overflow-hidden flex flex-col p-6">
                    {/* Icon Header */}
                    <div className="flex justify-center mt-8 mb-6">
                      <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center">
                        <Clock className="text-indigo-600 w-10 h-10" />
                      </div>
                    </div>

                    {/* Status Text */}
                    <div className="text-center mb-8">
                      <h4 className="text-2xl font-black text-gray-900 mb-1">
                        You're in the queue!
                      </h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        The Gourmet Kitchen
                      </p>
                    </div>

                    {/* Token Box */}
                    <div className="bg-gray-50 rounded-[2rem] p-8 text-center mb-8">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Token Number
                      </div>
                      <div className="text-7xl font-black text-indigo-600">
                        9
                      </div>
                    </div>

                    {/* Waiting Status */}
                    <div className="bg-indigo-50 rounded-2xl py-4 px-6 flex items-center justify-center gap-2 mb-6">
                      <Clock className="w-5 h-5 text-indigo-600" />
                      <span className="font-bold text-indigo-600 text-sm">
                        Waiting for your turn...
                      </span>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-auto text-center">
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        Keep this page open. We'll notify you here when it's
                        your turn.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="bg-white py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Powerful Simplicity
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Everything you need to manage your restaurant's waitlist like a
                pro.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-8 rounded-3xl bg-gray-50 hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100 group"
                >
                  <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Business Value Section */}
        <div className="py-24 bg-indigo-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-800 rounded-full -mr-48 -mt-48 blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-800 rounded-full -ml-48 -mb-48 blur-3xl opacity-50"></div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-5xl font-black mb-8 leading-tight">
                  Transform your daily <br />
                  <span className="text-indigo-400">business operations.</span>
                </h2>
                <p className="text-indigo-100 text-lg mb-10 leading-relaxed">
                  Stop losing customers to long, unmanaged lines. Our platform
                  gives you the tools to automate your front-of-house and keep
                  guests happy.
                </p>
                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="bg-indigo-500/30 p-1 rounded-full">
                        <CheckCircle2 className="w-5 h-5 text-indigo-300" />
                      </div>
                      <span className="font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl">Live Metrics</span>
                  </div>
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold">
                    +24% Efficiency
                  </span>
                </div>
                <div className="space-y-6">
                  {[
                    { label: "Customer Satisfaction", value: 98 },
                    { label: "Queue Management", value: 85 },
                    { label: "Staff Productivity", value: 92 },
                  ].map((stat, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-2">
                        <span className="text-indigo-200 font-medium">
                          {stat.label}
                        </span>
                        <span className="font-bold">{stat.value}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${stat.value}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.5)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Unique Footer */}
        <footer className="bg-gray-50 pt-24 pb-12 mt-auto border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                  <div className="bg-indigo-600 p-2 rounded-lg">
                    <Clock className="text-white w-5 h-5" />
                  </div>
                  <span className="text-2xl font-black tracking-tighter text-gray-900">
                    QueueMaster
                  </span>
                </div>
                <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
                  Empowering restaurants with modern queue management solutions.
                  Built for speed, reliability, and customer satisfaction.
                </p>
                <div className="flex gap-4">
                  {[Instagram, Twitter, Facebook].map((Icon, i) => (
                    <motion.a
                      key={i}
                      href="#"
                      whileHover={{ y: -3, scale: 1.1 }}
                      className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:shadow-lg transition-all border border-gray-100"
                    >
                      <Icon className="w-5 h-5" />
                    </motion.a>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-6">Product</h4>
                <ul className="space-y-4 text-gray-500 font-medium">
                  <li>
                    <a
                      href="#"
                      className="hover:text-indigo-600 transition-colors"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-indigo-600 transition-colors"
                    >
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-indigo-600 transition-colors"
                    >
                      Business API
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-indigo-600 transition-colors"
                    >
                      Integrations
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-6">Company</h4>
                <ul className="space-y-4 text-gray-500 font-medium">
                  <li>
                    <a
                      href="#"
                      className="hover:text-indigo-600 transition-colors"
                    >
                      About Us
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-indigo-600 transition-colors"
                    >
                      Careers
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-indigo-600 transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-indigo-600 transition-colors"
                    >
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="pt-12 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-6">
              <p className="text-gray-400 font-medium text-sm">
                © 2026 QueueMaster Inc. All rights reserved.
              </p>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-2 text-gray-400 font-medium text-sm"
              >
                Made with{" "}
                <Heart className="w-4 h-4 text-red-400 fill-red-400" /> for
                restaurants
              </motion.div>
            </div>
          </div>
        </footer>
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
