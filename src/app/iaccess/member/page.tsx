"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Image from "next/image";
import {
  Home,
  Receipt,
  Sparkles,
  Gift,
  LogOut,
  Settings,
  CheckCircle,
  PlusCircle,
  KeyRound,
  X,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import {
  loadHomeData,
  fetchTransactions,
  fetchRewards,
  fetchAvailableVoucher,
  updateUserPassword,
} from "@/app/actions/member";
import ExclusiveRewards from "@/components/sections/ExclusiveRewards";
import { getCurrentUserId } from "@/app/actions/users";

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab = "home" | "transactions" | "perks" | "rewards" | "settings";
type SettingsView = "menu" | "password";

interface UserInfo {
  user?: {
    firstname?: string;
    surname?: string;
    userId?: string;
    memberSince?: string;
    memberUntil?: string;
  };
}

interface RewardGroup {
  voucherGroupId: string;
  name: string;
  description: string;
  neededPoints: number;
  image: string;
  perCustomer: boolean;
  alreadyRedeemed?: boolean;
}

interface Transaction {
  id: string;
  description: string;
  created_at: string;
  transactionType: "earn" | "redeem";
  points: number;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MemberDashboard() {
  const router = useRouter();

  // Auth
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("home");

  // Home
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loadingHome, setLoadingHome] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showExclusiveModal, setShowExclusiveModal] = useState(false);

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [txLoaded, setTxLoaded] = useState(false);

  // Rewards
  const [rewards, setRewards] = useState<RewardGroup[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [rewardsLoaded, setRewardsLoaded] = useState(false);
  const [selectedReward, setSelectedReward] = useState<RewardGroup | null>(
    null,
  );
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [loadingVoucher, setLoadingVoucher] = useState(false);

  // Settings
  const [settingsView, setSettingsView] = useState<SettingsView>("menu");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ─── Auth check ────────────────────────────────────────────────────────────
  useEffect(() => {
    getCurrentUserId().then((id) => {
      if (!id) {
        router.replace("/");
        return;
      }
      setUserId(id);
      setLoadingAuth(false);
    });
  }, [router]);

  // ─── Load Home (only once) ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoadingHome(true);
      try {
        const result = await loadHomeData(userId);
        if (!result.success) {
          console.error(result.error);
          return;
        }
        setUserInfo({ user: result.user });
        setTotalPoints(result.totalPoints ?? 0);
        setShowExclusiveModal(!!result.showExclusiveModal);
      } catch (err) {
        console.error("Error loading home data:", err);
      } finally {
        setLoadingHome(false);
      }
    };

    load();
  }, [userId]);

  // ─── Load Transactions (lazy + cached) ─────────────────────────────────────
  useEffect(() => {
    if (!userId || txLoaded) return;
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
    if (!isDesktop && activeTab !== "transactions") return;

    const load = async () => {
      setLoadingTx(true);
      try {
        const result = await fetchTransactions(userId);
        if (result.success) {
          setTransactions(result.data ?? []);
          setTxLoaded(true);
        } else {
          console.error(result.error);
        }
      } catch (err) {
        console.error("Error loading transactions:", err);
      } finally {
        setLoadingTx(false);
      }
    };

    load();
  }, [userId, activeTab, txLoaded]);

  // ─── Load Rewards (lazy + cached) ──────────────────────────────────────────
  useEffect(() => {
    if (!userId || rewardsLoaded) return;
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
    if (!isDesktop && activeTab !== "rewards") return;

    const load = async () => {
      setLoadingRewards(true);
      try {
        const result = await fetchRewards(userId);
        if (result.success) {
          setRewards(result.data ?? []);
          setRewardsLoaded(true);
        } else {
          console.error(result.error);
        }
      } catch (err) {
        console.error("Error fetching rewards:", err);
      } finally {
        setLoadingRewards(false);
      }
    };

    load();
  }, [userId, activeTab, rewardsLoaded]);

  // ─── Load voucher when a reward is selected ────────────────────────────────
  useEffect(() => {
    if (!selectedReward) {
      setVoucherCode(null);
      return;
    }

    const loadVoucher = async () => {
      setLoadingVoucher(true);
      setVoucherCode(null);
      try {
        const result = await fetchAvailableVoucher(
          selectedReward.voucherGroupId,
        );
        if (result.success) {
          setVoucherCode(result.voucherCode);
        } else {
          setVoucherCode("Error fetching voucher");
        }
      } catch (err) {
        console.error("Error fetching voucher code:", err);
        setVoucherCode("Error fetching voucher");
      } finally {
        setLoadingVoucher(false);
      }
    };

    loadVoucher();
  }, [selectedReward]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const confirmLogout = useCallback(() => {
    Cookies.remove("userId");
    localStorage.removeItem("user");
    router.replace("/");
  }, [router]);

  const handlePasswordChange = useCallback(
    (key: keyof typeof passwordForm, value: string) => {
      setPasswordForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSavePassword = async () => {
    if (!userId) return;

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      alert("Please fill in all fields.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New password and confirmation do not match!");
      return;
    }

    setSavingPassword(true);
    try {
      const { success, error } = await updateUserPassword({
        userId,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (success) {
        alert("Password updated successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        Cookies.remove("userId");
        localStorage.removeItem("user");
        router.replace("/");
      } else {
        alert("Failed to update password: " + error);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again later.");
    } finally {
      setSavingPassword(false);
    }
  };

  // ─── Static data ───────────────────────────────────────────────────────────
  const perksData = [
    {
      title: "General Benefits",
      perks: [
        "5% discount for every transaction.",
        "Earn 1 iAccess points per 200 pesos spent.",
        "Additional 5% birthday discount.",
        "Redeem points anytime; no minimum points or spend required.",
        "25 iAccess points per referral.",
      ],
    },
  ];

  const navItems: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "transactions", label: "Transactions", icon: Receipt },
    { id: "perks", label: "Perks", icon: Sparkles },
    { id: "rewards", label: "Rewards", icon: Gift },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // ─── Auth loading ──────────────────────────────────────────────────────────
  if (loadingAuth) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a]">
        <div className="absolute top-[-10%] right-[-10%] h-125 w-125 rounded-full bg-[#F36509]/20 blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-5%] left-[-5%] h-112.5 w-112.5 rounded-full bg-stone-800/40 blur-[120px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F36509] border-t-transparent" />
          <p className="mt-4 text-sm tracking-widest text-stone-400 uppercase font-mono">
            Loading
          </p>
        </div>
      </div>
    );
  }

  // ─── Content sections ──────────────────────────────────────────────────────
  const renderHome = () => (
    <div className="flex flex-col items-center">
      {loadingHome ? (
        <div className="mt-20 flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F36509] border-t-transparent" />
          <p className="mt-4 text-sm tracking-widest text-stone-400 uppercase font-mono">
            Loading
          </p>
        </div>
      ) : (
        <>
          <h1 className="mb-6 font-serif text-2xl tracking-tight text-white md:mb-8 md:text-3xl">
            Welcome,{" "}
            <span className="text-[#F36509]">
              {userInfo?.user?.firstname || "User"}
            </span>
          </h1>

          {/* Virtual Card */}
          <div className="mb-8 aspect-[3/2] w-full max-w-md perspective-1000">
            <div
              className={`relative h-full w-full transform transition-transform duration-700 ${
                flipped ? "rotate-y-180" : ""
              }`}
              onClick={() => setFlipped((f) => !f)}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front */}
              <div className="absolute h-full w-full overflow-hidden rounded-xl shadow-2xl shadow-black/40 backface-hidden">
                <Image
                  src="/images/card_front.png"
                  alt="Card Front"
                  fill
                  className="rounded-xl object-cover"
                  priority
                />
              </div>

              {/* Back */}
              <div className="absolute h-full w-full rotate-y-180 overflow-hidden rounded-xl shadow-2xl shadow-black/40 backface-hidden">
                <Image
                  src="/images/card_back.png"
                  alt="Card Back"
                  fill
                  className="rounded-xl object-cover"
                />
                <div className="absolute inset-1 mt-12 flex flex-col justify-between p-4 text-white sm:p-6">
                  <div>
                    <h2 className="text-[clamp(1rem,2.5vw,1.5rem)] font-bold sm:text-[clamp(1.2rem,2.5vw,1.8rem)]">
                      {(
                        (userInfo?.user?.firstname || "") +
                        " " +
                        (userInfo?.user?.surname || "")
                      ).toUpperCase()}
                    </h2>
                    <p className="mt-1 font-mono text-[clamp(0.8rem,2vw,1rem)]">
                      {userInfo?.user?.userId || ""}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1">
                      <div>
                        <h3 className="font-mono text-[clamp(0.65rem,1.5vw,0.75rem)] text-stone-300">
                          MEMBER SINCE:
                        </h3>
                        <p className="font-mono text-[clamp(0.75rem,1.5vw,0.875rem)]">
                          {userInfo?.user?.memberSince || ""}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-mono text-[clamp(0.65rem,1.5vw,0.75rem)] text-stone-300">
                          MEMBER UNTIL:
                        </h3>
                        <p className="font-mono text-[clamp(0.75rem,1.5vw,0.875rem)]">
                          {userInfo?.user?.memberUntil || ""}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-[clamp(0.55rem,1.2vw,0.65rem)] leading-snug text-stone-400">
                      By using this virtual card, you agree to the iHub Access
                      Pass terms of use and privacy policy.
                    </p>
                    <p className="text-[clamp(0.55rem,1.2vw,0.65rem)] leading-snug text-stone-400">
                      Call iHub +639855713768 for more details.
                    </p>
                    <p className="text-[clamp(0.55rem,1.2vw,0.65rem)] leading-snug text-stone-400">
                      This card is non-transferable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Points */}
          <div className="mb-6 text-center">
            <p className="text-xs font-mono uppercase tracking-widest text-stone-400">
              Total iAccess Points
            </p>
            <p className="mt-1 font-serif text-5xl font-bold tracking-tight text-white">
              {Number(totalPoints).toFixed(2)}
            </p>
          </div>

          <button
            onClick={() => setShowQRModal(true)}
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#F36509] px-10 text-base font-semibold text-white shadow-xl shadow-orange-500/25 transition-all hover:bg-[#e05a00] hover:scale-105 active:scale-95"
          >
            Claim Points
          </button>
        </>
      )}
    </div>
  );

  const renderTransactions = () => (
    <div>
      <h2 className="mb-5 font-serif text-xl tracking-tight text-white md:text-2xl">
        Transaction History
      </h2>

      {loadingTx ? (
        <div className="mt-10 flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F36509] border-t-transparent" />
          <p className="mt-3 text-sm tracking-widest text-stone-400 uppercase font-mono">
            Loading
          </p>
        </div>
      ) : transactions.length === 0 ? (
        <p className="mt-6 text-center text-stone-400">
          No transactions found.
        </p>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto pr-1">
          {transactions.map((item) => (
            <div
              key={item.id}
              className="flex w-full items-center justify-between rounded-xl border border-stone-800/80 bg-stone-900/60 p-3.5 backdrop-blur-md"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {item.transactionType === "earn" ? (
                  <PlusCircle
                    size={26}
                    className="flex-shrink-0 text-emerald-400"
                    strokeWidth={2.5}
                  />
                ) : (
                  <Gift size={22} className="flex-shrink-0 text-[#F36509]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-stone-100">
                    {item.description}
                  </p>
                  <p className="truncate text-sm text-stone-500">
                    {item.created_at}
                  </p>
                </div>
              </div>
              <div className="ml-3 flex-shrink-0 text-base font-semibold">
                <span
                  className={
                    item.transactionType === "earn"
                      ? "text-emerald-400"
                      : "text-[#F36509]"
                  }
                >
                  {Number(item.points).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPerks = () => (
    <div>
      <h2 className="mb-5 font-serif text-xl tracking-tight text-white md:text-2xl">
        List of Perks
      </h2>
      <div className="w-full">
        {perksData.map((section) => (
          <div
            key={section.title}
            className="mb-4 w-full rounded-xl border border-stone-800/80 bg-stone-900/60 p-5 backdrop-blur-md"
          >
            <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#F36509]">
              {section.title}
            </h3>
            <div className="flex flex-col gap-2.5">
              {section.perks.map((perk, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle
                    size={17}
                    className="mt-0.5 flex-shrink-0 text-[#F36509]"
                  />
                  <p className="text-sm leading-relaxed text-stone-300">
                    {perk}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRewards = () => (
    <div>
      <h2 className="mb-5 font-serif text-xl tracking-tight text-white md:text-2xl">
        Rewards
      </h2>

      {loadingRewards ? (
        <div className="mt-10 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F36509] border-t-transparent" />
        </div>
      ) : (
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {rewards.map((item) => {
            const isDisabled = item.perCustomer && item.alreadyRedeemed;
            return (
              <div
                key={item.voucherGroupId}
                className="flex w-full flex-col overflow-hidden rounded-xl border border-stone-800/80 bg-stone-900/60 backdrop-blur-md"
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  width={400}
                  height={140}
                  className="h-36 w-full object-cover"
                />
                <div className="flex flex-col gap-1.5 p-4">
                  <h3 className="text-base font-semibold text-[#F36509]">
                    {item.name}
                  </h3>
                  <p className="line-clamp-2 text-xs leading-relaxed text-stone-400">
                    {item.description}
                  </p>
                  <p className="text-sm font-medium text-stone-300">
                    {item.neededPoints} pts
                  </p>
                  <button
                    disabled={isDisabled}
                    className={`mt-2 rounded-full py-2 text-sm font-semibold transition-all ${
                      isDisabled
                        ? "cursor-not-allowed bg-stone-700 text-stone-400"
                        : "bg-[#F36509] text-white shadow-lg shadow-orange-500/20 hover:bg-[#e05a00] hover:scale-[1.02] active:scale-95"
                    }`}
                    onClick={() => setSelectedReward(item)}
                  >
                    {isDisabled ? "Already Redeemed" : "Redeem"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Settings content (used both in mobile tab and desktop modal)
  const renderSettingsContent = () => {
    if (settingsView === "menu") {
      return (
        <div className="flex flex-col gap-4">
          <h2 className="mb-2 text-center font-serif text-2xl tracking-tight text-white">
            Settings
          </h2>

          <button
            onClick={() => setSettingsView("password")}
            className="flex items-center gap-3 rounded-xl border border-stone-800/80 bg-stone-900/60 px-5 py-4 text-left transition hover:border-[#F36509]/40 hover:bg-stone-900"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F36509]/15 text-[#F36509]">
              <KeyRound size={20} />
            </div>
            <div>
              <p className="font-medium text-stone-100">Change Password</p>
              <p className="text-sm text-stone-500">
                Update your account password
              </p>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl border border-stone-800/80 bg-stone-900/60 px-5 py-4 text-left transition hover:border-red-500/30 hover:bg-stone-900"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15 text-red-400">
              <LogOut size={20} />
            </div>
            <div>
              <p className="font-medium text-stone-100">Logout</p>
              <p className="text-sm text-stone-500">Sign out of your account</p>
            </div>
          </button>
        </div>
      );
    }

    // Password form view
    return (
      <div>
        <button
          onClick={() => setSettingsView("menu")}
          className="mb-4 flex items-center gap-1 text-sm text-[#F36509] hover:underline"
        >
          ← Back
        </button>

        <h2 className="mb-6 text-center font-serif text-2xl tracking-tight text-white">
          Change Password
        </h2>

        <div className="space-y-4">
          <input
            type="password"
            placeholder="Current Password"
            className="w-full rounded-xl border border-stone-700 bg-stone-900/80 px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:border-[#F36509] focus:outline-none focus:ring-1 focus:ring-[#F36509]/50"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              handlePasswordChange("currentPassword", e.target.value)
            }
          />
          <input
            type="password"
            placeholder="New Password"
            className="w-full rounded-xl border border-stone-700 bg-stone-900/80 px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:border-[#F36509] focus:outline-none focus:ring-1 focus:ring-[#F36509]/50"
            value={passwordForm.newPassword}
            onChange={(e) =>
              handlePasswordChange("newPassword", e.target.value)
            }
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            className="w-full rounded-xl border border-stone-700 bg-stone-900/80 px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:border-[#F36509] focus:outline-none focus:ring-1 focus:ring-[#F36509]/50"
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              handlePasswordChange("confirmPassword", e.target.value)
            }
          />
        </div>

        <button
          onClick={handleSavePassword}
          disabled={savingPassword}
          className="mt-6 w-full rounded-full bg-[#F36509] py-3.5 font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-[#e05a00] disabled:opacity-60"
        >
          {savingPassword ? "Saving..." : "Save Changes"}
        </button>
      </div>
    );
  };

  // ─── Main Render ───────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Ambient Lighting Orbs */}
      <div className="pointer-events-none absolute top-[-10%] right-[-10%] h-125 w-125 rounded-full bg-[#F36509]/15 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-5%] left-[-5%] h-112.5 w-112.5 rounded-full bg-stone-800/40 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#F36509]/5 blur-[100px]" />

      {/* ═══════════════════════════════════════════════════════════════════════
          MOBILE LAYOUT
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden">
        {/* Mobile Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-800/60 bg-[#0a0a0a]/80 px-4 py-3.5 backdrop-blur-xl">
          <h1 className="font-serif text-lg tracking-tight text-white">
            {navItems.find((i) => i.id === activeTab)?.label}
          </h1>

          <button
            onClick={() => {
              setActiveTab("settings");
              setSettingsView("menu");
            }}
            className={`rounded-full p-2 transition ${
              activeTab === "settings"
                ? "bg-[#F36509] text-white"
                : "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
            }`}
            aria-label="Settings"
          >
            <Settings size={22} />
          </button>
        </header>

        {/* Mobile Content */}
        <main className="relative z-10 px-4 pb-24 pt-5">
          {activeTab === "home" && renderHome()}
          {activeTab === "transactions" && renderTransactions()}
          {activeTab === "perks" && renderPerks()}
          {activeTab === "rewards" && renderRewards()}
          {activeTab === "settings" && (
            <div className="flex justify-center">
              <div className="w-full max-w-md rounded-2xl border border-stone-800/80 bg-stone-900/70 p-6 shadow-2xl backdrop-blur-xl">
                {renderSettingsContent()}
              </div>
            </div>
          )}
        </main>

        {/* Mobile Bottom Tabs */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-stone-800/60 bg-[#0a0a0a]/90 backdrop-blur-xl">
          {navItems
            .filter((item) => item.id !== "settings")
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] transition ${
                    isActive
                      ? "text-[#F36509]"
                      : "text-stone-500 hover:text-stone-300"
                  }`}
                >
                  <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="font-medium tracking-wide">
                    {item.label}
                  </span>
                </button>
              );
            })}
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DESKTOP DASHBOARD LAYOUT
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-800/60 bg-[#0a0a0a]/80 px-8 py-4 backdrop-blur-xl">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#F36509]">
            iHub: iAccess Membership
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-400">
              {userInfo?.user?.firstname} {userInfo?.user?.surname}
            </span>
            <button
              onClick={() => {
                setShowSettingsModal(true);
                setSettingsView("menu");
              }}
              className="flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/60 px-4 py-2 text-sm font-medium text-stone-200 transition hover:border-[#F36509]/50 hover:text-[#F36509]"
            >
              <Settings size={16} />
              Settings
            </button>
          </div>
        </header>

        {/* Dashboard grid */}
        <main className="relative z-10 mx-auto max-w-8xl space-y-8 px-8 py-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:grid-rows-2">
            {/* Column 1 – stacked */}
            <section className="rounded-2xl border border-stone-800/80 bg-stone-900/50 p-6 shadow-xl backdrop-blur-md">
              {renderHome()}
            </section>

            {/* Column 2 – spans both rows */}
            <section className="rounded-2xl border border-stone-800/80 bg-stone-900/50 p-6 shadow-xl backdrop-blur-md lg:row-span-2">
              {renderTransactions()}
            </section>

            {/* Column 3 – spans both rows */}
            <section className="rounded-2xl border border-stone-800/80 bg-stone-900/50 p-6 shadow-xl backdrop-blur-md lg:row-span-2">
              {renderRewards()}
            </section>

            {/* Column 1 – bottom */}
            <section className="rounded-2xl border border-stone-800/80 bg-stone-900/50 p-6 shadow-xl backdrop-blur-md">
              {renderPerks()}
            </section>
          </div>
        </main>
      </div>

      {/* ─── Desktop Settings Modal ─────────────────────────────────────────── */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-stone-800 bg-stone-900/95 p-8 shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-stone-500 transition hover:bg-stone-800 hover:text-stone-200"
            >
              <X size={18} />
            </button>
            {renderSettingsContent()}
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowQRModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-stone-800 bg-stone-900/95 p-6 shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-5 text-center font-mono text-sm tracking-wide text-stone-300">
              Please present your QR Code to the cashier
            </h2>
            <div className="mb-4 flex justify-center rounded-xl bg-white p-4">
              <QRCodeCanvas value={userId || ""} size={150} />
            </div>
            <p className="break-all text-center font-mono text-sm text-stone-400">
              {userId}
            </p>
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute right-3 top-3 rounded-full p-1.5 text-stone-500 transition hover:bg-stone-800 hover:text-stone-200"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Reward Redeem Modal */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex w-11/12 max-w-md flex-col items-center rounded-2xl border border-stone-800 bg-stone-900/95 p-6 shadow-2xl backdrop-blur-xl">
            <h2 className="mb-5 font-serif text-xl tracking-tight text-[#F36509]">
              {selectedReward.name}
            </h2>

            {loadingVoucher ? (
              <div className="my-8 h-10 w-10 animate-spin rounded-full border-4 border-[#F36509] border-t-transparent" />
            ) : (
              <>
                <div className="rounded-xl bg-white p-4">
                  <QRCodeCanvas
                    value={voucherCode || selectedReward.voucherGroupId}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                  />
                </div>
                <p className="mt-4 font-mono text-sm font-medium text-stone-200">
                  CODE: {voucherCode}
                </p>
              </>
            )}

            <p className="mt-2 font-mono text-xs text-stone-500">{userId}</p>
            <button
              className="mt-6 rounded-full bg-[#F36509] px-10 py-2.5 font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#e05a00]"
              onClick={() => {
                setSelectedReward(null);
                setVoucherCode(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Exclusive Rewards Modal */}
      {showExclusiveModal && (
        <ExclusiveRewards onClose={() => setShowExclusiveModal(false)} />
      )}

      {/* Logout Confirm Dialog */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-stone-800 bg-stone-900/95 p-6 shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-center font-serif text-xl tracking-tight text-white">
              Log out?
            </h2>
            <p className="mb-6 text-center text-sm text-stone-400">
              Are you sure you want to sign out of your account?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-full border border-stone-700 bg-stone-800/60 py-2.5 text-sm font-medium text-stone-300 transition hover:bg-stone-800 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
