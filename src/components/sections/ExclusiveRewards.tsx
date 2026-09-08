"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Cookies from "js-cookie";
import Confetti from "react-confetti";
import {
  fetchExclusiveRewards,
  redeemExclusiveReward,
} from "@/app/actions/member";

interface ExclusiveReward {
  voucherGroupId: string;
  name: string;
  description: string;
  image: string;
  voucherCode?: string;
}

interface ExclusiveRewardsProps {
  onClose: () => void;
}

export default function ExclusiveRewards({ onClose }: ExclusiveRewardsProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [exclusiveRewards, setExclusiveRewards] = useState<ExclusiveReward[]>(
    [],
  );
  const [redeemedVoucherId, setRedeemedVoucherId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [celebrationReward, setCelebrationReward] =
    useState<ExclusiveReward | null>(null);

  // ─── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = Cookies.get("userId");
    if (!id) {
      alert("Please login first.");
      onClose();
      return;
    }
    setUserId(id);
  }, [onClose]);

  // ─── Load exclusive rewards ────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchExclusiveRewards(userId);

        if (!result.success) {
          console.error(result.error);
          return;
        }

        setExclusiveRewards(result.exclusiveRewards ?? []);
        setRedeemedVoucherId(result.redeemedVoucherId ?? null);
      } catch (err) {
        console.error("Error fetching exclusive rewards:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  // ─── Redeem handler ────────────────────────────────────────────────────────
  const handleRedeem = async (reward: ExclusiveReward) => {
    if (!userId) return;

    if (redeemedVoucherId) {
      alert("You already redeemed an exclusive reward.");
      return;
    }

    setRedeeming(true);
    try {
      const result = await redeemExclusiveReward({
        userId,
        reward: {
          voucherGroupId: reward.voucherGroupId,
          name: reward.name,
          voucherCode: reward.voucherCode,
        },
      });

      if (!result.success) {
        alert(result.error || "Failed to redeem reward");
        return;
      }

      setRedeemedVoucherId(reward.voucherGroupId);
      setCelebrationReward(reward);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert("Failed to redeem reward: " + message);
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <>
      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {!celebrationReward && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="relative w-full max-w-5xl overflow-auto rounded-2xl bg-white p-6">
            <h2 className="mb-4 text-2xl font-bold text-orange-500">
              Exclusive Rewards
            </h2>

            <p className="mb-6 text-sm leading-relaxed text-gray-700 sm:text-base">
              Each member can redeem{" "}
              <strong className="text-red-600">only one</strong> exclusive
              reward. Once redeemed, the other exclusive rewards will no longer
              be available.
            </p>

            <button
              className="absolute right-6 top-4 text-xl font-bold text-gray-600 hover:text-gray-800"
              onClick={onClose}
              aria-label="Close"
            >
              &times;
            </button>

            {loading ? (
              <div className="mt-10 flex justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
              </div>
            ) : exclusiveRewards.length === 0 ? (
              <p className="mt-10 text-center text-gray-600">
                No exclusive rewards available at the moment.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                {exclusiveRewards.map((reward) => {
                  const disabled = !!redeemedVoucherId || redeeming;

                  return (
                    <div
                      key={reward.voucherGroupId}
                      className="relative flex h-96 w-full flex-col overflow-hidden rounded-xl bg-white shadow-md"
                    >
                      <Image
                        src={reward.image}
                        alt={reward.name}
                        width={400}
                        height={160}
                        className="h-40 w-full object-cover"
                      />

                      <div className="flex flex-1 flex-col justify-between p-4">
                        <div className="overflow-hidden">
                          <h3 className="text-lg font-bold text-orange-500">
                            {reward.name}
                          </h3>
                          <p className="mt-2 line-clamp-3 text-sm text-gray-700">
                            {reward.description}
                          </p>
                        </div>

                        <button
                          disabled={disabled}
                          onClick={() => handleRedeem(reward)}
                          className={`mt-4 rounded-lg py-2 font-semibold text-white ${
                            disabled
                              ? "cursor-not-allowed bg-gray-400"
                              : "bg-orange-500 hover:bg-orange-600"
                          }`}
                        >
                          {redeemedVoucherId
                            ? "Already Redeemed"
                            : redeeming
                              ? "Redeeming..."
                              : "Redeem"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Celebration Overlay ───────────────────────────────────────────── */}
      {celebrationReward && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 p-4">
          <Confetti width={window.innerWidth} height={window.innerHeight} />
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center">
            <h2 className="mb-4 text-2xl font-bold text-orange-500">
              🎉 Congratulations! 🎉
            </h2>
            <p className="mb-6 text-lg text-gray-700">
              You successfully redeemed{" "}
              <strong>{celebrationReward.name}</strong>
            </p>
            <button
              onClick={onClose}
              className="rounded-lg bg-orange-500 px-6 py-2 text-white transition hover:bg-orange-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
