import { useLocation } from "@remix-run/react";
import { GenericErrorBoundary } from "~/components/misc/error-boundary";

export async function loader() {
  throw new Response("Not found", { status: 404 });
}

export default function NotFound() {
  // Due to the loader, this component will never be rendered,
  // but as a good practice, ErrorBoundary will be returned.
  return <ErrorBoundary />;
}

export function ErrorBoundary() {
  const location = useLocation();

  return (
    <div className='mx-auto flex h-screen w-screen max-w-7xl flex-col px-6'>
      {/* Background. */}
      <div className='blobs !top-[50%] !-z-20 !translate-x-[-50%] !translate-y-[-50%] !opacity-20' />

      {/* Content */}
      <div className='flex h-full w-full flex-col items-center justify-center'>
        <GenericErrorBoundary
          statusHandlers={{
            404: () => (
              <div className='flex flex-col items-center justify-center gap-4'>
                <h1 className='text-6xl font-bold'>Nothing here.</h1>
                <p className='text-base font-medium'>{location.pathname} not found.</p>
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
}
