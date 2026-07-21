import { Redirect, useLocalSearchParams } from 'expo-router';

// Redirect /job/[id] to the fully-built job detail screen.
// This route exists because the [id] directory holds receipt.tsx;
// the actual job detail UI lives at /job-detail.

export default function JobRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/job-detail?job_id=${id}` as any} />;
}
