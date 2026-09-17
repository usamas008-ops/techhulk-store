import Link from "next/link";

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  return (
    <div className="container-page py-20 text-center">
      <p className="eyebrow text-leaf">Order confirmed</p>

      <h1 className="mx-auto mt-3 max-w-xl font-display text-[30px] font-bold leading-tight text-night sm:text-[38px]">
        Thank you{searchParams.order ? `, order #${searchParams.order}` : ""}
      </h1>

      <p className="mx-auto mt-4 max-w-md text-[13px] leading-relaxed text-slate">
        We will call you shortly to confirm your delivery details. Keep the cash
        ready and pay the courier when your parcel arrives.
      </p>

      <div className="mx-auto mt-8 grid max-w-lg gap-3 text-left sm:grid-cols-3">
        <div className="rounded-[18px] bg-white p-4">
          <p className="eyebrow text-slate">Step 1</p>
          <p className="mt-1 text-[12px] text-night">We call to confirm</p>
        </div>
        <div className="rounded-[18px] bg-white p-4">
          <p className="eyebrow text-slate">Step 2</p>
          <p className="mt-1 text-[12px] text-night">Parcel is dispatched</p>
        </div>
        <div className="rounded-[18px] bg-white p-4">
          <p className="eyebrow text-slate">Step 3</p>
          <p className="mt-1 text-[12px] text-night">Pay cash at the door</p>
        </div>
      </div>

      <Link
        href="/"
        className="mt-9 btn-buy btn-buy-lg"
      >
        Continue shopping
      </Link>
    </div>
  );
}
