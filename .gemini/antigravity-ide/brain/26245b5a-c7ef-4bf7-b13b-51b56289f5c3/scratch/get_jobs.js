async function getJobs() {
  const runId = "26354516323";
  try {
    const res = await fetch(`https://api.github.com/repos/ilyas-571/ilyas-store/actions/runs/${runId}/jobs`);
    if (!res.ok) {
      console.error(`Failed to fetch jobs: ${res.status}`);
      return;
    }
    const data = await res.json();
    console.log(`Jobs for Run #${runId}:`);
    data.jobs.forEach((job) => {
      console.log(`Job Name: ${job.name}, status=${job.status}, conclusion=${job.conclusion}`);
      console.log("Steps:");
      job.steps.forEach((step) => {
        console.log(`  - ${step.name}: status=${step.status}, conclusion=${step.conclusion}`);
      });
    });
  } catch (err) {
    console.error("Error getting jobs:", err);
  }
}

getJobs();
