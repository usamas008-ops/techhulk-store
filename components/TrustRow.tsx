import type { ReactNode } from "react";
import { CashIcon, DeviceIcon, PhoneIcon, TruckIcon } from "@/components/icons";
import { deliveryHeadline } from "@/lib/delivery";

// Only promises the store actually keeps: see checkout and the success page.
// The delivery line follows the store's own charge, so it never says free
// while the shop is charging for it.
export default function TrustRow({ defaultDeliveryFee = 0 }: { defaultDeliveryFee?: number }) {
  const delivery = deliveryHeadline(defaultDeliveryFee);
  const items: { icon: ReactNode; top: string; bottom: string }[] = [
    { icon: <TruckIcon size={34} />, top: delivery.top, bottom: delivery.bottom },
    { icon: <CashIcon size={34} />, top: "Cash on", bottom: "Delivery" },
    { icon: <PhoneIcon size={32} />, top: "Confirmation Call", bottom: "Before Dispatch" },
    { icon: <DeviceIcon size={32} />, top: "Easy Ordering", bottom: "No Account Needed" },
  ];

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="grid items-center gap-8 lg:grid-cols-[300px_1fr]">
        <p className="text-[21px] font-bold leading-tight text-charcoal sm:text-[25px]">
          Shopping Made
          <br className="hidden lg:block" /> Simple
        </p>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {items.map((item) => (
            <div key={item.top} className="flex flex-col items-center text-center">
              <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#f3f2f2] text-charcoal shadow-[5px_5px_12px_rgba(0,0,0,0.08),-5px_-5px_12px_rgba(255,255,255,0.95)]">
                {item.icon}
              </span>
              <p className="mt-3 text-[13px] font-semibold leading-tight text-charcoal">
                {item.top}
                <br />
                <span className="font-normal text-charcoal/75">{item.bottom}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
