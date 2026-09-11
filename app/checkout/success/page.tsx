import Link from "next/link";

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  return (
    <div className="container-page py-20 text-center">
      <p className="text-signal">Order confirmed</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-paper">
        Thank you! {searchParams.order && `Order #${searchParams.order}`}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        We'll call you to confirm delivery details. Pay in cash when your
        order arrives.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-sm bg-signal px-6 py-3 font-semibold text-ink"
      >
        Continue shopping
      </Link>
    </div>
  );
}
