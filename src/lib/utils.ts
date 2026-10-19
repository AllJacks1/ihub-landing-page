import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Senior Citizen & PWD discount (equal-share estimate).
 *  20% discount on each eligible guest's share; if VAT is included in the bill,
 *  VAT is stripped from that share before applying the 20%.
 */
export function computeScPwdDiscount(params: {
  totalBill: number;
  seniors: number;
  pwds: number;
  otherGuests: number;
  vatIncluded: boolean;
}) {
  const { totalBill, seniors, pwds, otherGuests, vatIncluded } = params;
  const totalGuests = seniors + pwds + otherGuests;
  const eligibleGuests = seniors + pwds;

  if (
    !Number.isFinite(totalBill) ||
    totalBill < 0 ||
    totalGuests <= 0 ||
    ![seniors, pwds, otherGuests].every((n) => Number.isInteger(n) && n >= 0)
  ) {
    return {
      valid: false,
      totalGuests: 0,
      eligibleGuests: 0,
      sharePerGuest: 0,
      totalSavings: 0,
      amountDue: totalBill,
    };
  }

  const sharePerGuest = totalBill / totalGuests;
  const discountedShare = vatIncluded
    ? (sharePerGuest / 1.12) * 0.8
    : sharePerGuest * 0.8;
  const totalSavings = eligibleGuests * (sharePerGuest - discountedShare);
  const amountDue = Math.max(0, Math.round(totalBill - totalSavings));

  return {
    valid: true,
    totalGuests,
    eligibleGuests,
    sharePerGuest: Math.round(sharePerGuest),
    totalSavings: Math.round(totalSavings),
    amountDue,
  };
}
